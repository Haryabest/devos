import {
  generateCallCode,
  formatCallCode,
  normalizeCallCode,
  callRoomKeyFromCode,
  buildCallShareUrl,
} from '@/domain/calls/room-code';
import { pushCollabRaw, subscribeCollabRaw, getCollabClientId, joinCollabRoom, leaveCollabRoom } from '@/lib/collab-ws';

export type VoiceSignal =
  | { type: 'join'; roomId: string; userName: string; video?: boolean }
  | { type: 'leave'; roomId: string }
  | { type: 'offer'; roomId: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; roomId: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice'; roomId: string; to: string; candidate: RTCIceCandidateInit };

export interface CallPeer {
  peerId: string;
  userName: string;
  stream: MediaStream | null;
  micLevel: number;
}

export interface CallState {
  active: boolean;
  roomId: string | null;
  localStream: MediaStream | null;
  peers: CallPeer[];
  micEnabled: boolean;
  cameraEnabled: boolean;
  localMicLevel: number;
  error: string | null;
}

let localStream: MediaStream | null = null;
const peers = new Map<string, RTCPeerConnection>();
const peerMeta = new Map<string, { userName: string; stream: MediaStream | null; micLevel: number }>();
let roomId: string | null = null;
let collabRoomId: string | null = null;
let micEnabled = true;
let cameraEnabled = true;
let localMicLevel = 0;
let callError: string | null = null;
const stateListeners = new Set<() => void>();

let audioCtx: AudioContext | null = null;
let levelRaf = 0;

const EMPTY_STATE: CallState = {
  active: false,
  roomId: null,
  localStream: null,
  peers: [],
  micEnabled: true,
  cameraEnabled: true,
  localMicLevel: 0,
  error: null,
};

let cachedSnapshot: CallState = EMPTY_STATE;

function statesEqual(a: CallState, b: CallState): boolean {
  if (
    a.active !== b.active ||
    a.roomId !== b.roomId ||
    a.localStream !== b.localStream ||
    a.micEnabled !== b.micEnabled ||
    a.cameraEnabled !== b.cameraEnabled ||
    a.localMicLevel !== b.localMicLevel ||
    a.error !== b.error ||
    a.peers.length !== b.peers.length
  ) {
    return false;
  }
  for (let i = 0; i < a.peers.length; i += 1) {
    const left = a.peers[i];
    const right = b.peers[i];
    if (
      left.peerId !== right.peerId ||
      left.userName !== right.userName ||
      left.stream !== right.stream ||
      left.micLevel !== right.micLevel
    ) {
      return false;
    }
  }
  return true;
}

function notifyState() {
  const next = getPublicState();
  if (statesEqual(cachedSnapshot, next)) return;
  cachedSnapshot = next;
  stateListeners.forEach((fn) => fn());
}

function getPublicState(): CallState {
  return {
    active: roomId !== null,
    roomId,
    localStream,
    peers: [...peerMeta.entries()].map(([peerId, meta]) => ({
      peerId,
      userName: meta.userName,
      stream: meta.stream,
      micLevel: meta.micLevel,
    })),
    micEnabled,
    cameraEnabled,
    localMicLevel,
    error: callError,
  };
}

export function subscribeCallState(fn: () => void): () => void {
  stateListeners.add(fn);
  return () => stateListeners.delete(fn);
}

export function getCallState(): CallState {
  const next = getPublicState();
  if (statesEqual(cachedSnapshot, next)) return cachedSnapshot;
  cachedSnapshot = next;
  return cachedSnapshot;
}

function ensureSubscribe() {
  if ((ensureSubscribe as { done?: boolean }).done) return;
  (ensureSubscribe as { done?: boolean }).done = true;
  subscribeCollabRaw((event, data) => {
    if (event !== 'voice-signal' || !data || typeof data !== 'object') return;
    void handleSignal(data as VoiceSignal & { from: string });
  });
}

function startLevelMeter(stream: MediaStream, onLevel: (level: number) => void) {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) sum += data[i];
      onLevel(Math.min(1, sum / data.length / 128));
      levelRaf = requestAnimationFrame(tick);
    };
    tick();
    return analyser;
  } catch {
    return null;
  }
}

function stopLevelMeter() {
  if (levelRaf) cancelAnimationFrame(levelRaf);
  levelRaf = 0;
}

async function handleSignal(msg: VoiceSignal & { from: string }) {
  if (!roomId || msg.roomId !== roomId) return;
  const self = getCollabClientId();
  if (msg.from === self) return;

  if (msg.type === 'join') {
    peerMeta.set(msg.from, {
      userName: msg.userName,
      stream: null,
      micLevel: 0,
    });
    notifyState();
    if (localStream) {
      const pc = createPeer(msg.from);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      pushCollabRaw('voice-signal', {
        type: 'offer',
        roomId,
        to: msg.from,
        sdp: offer,
        from: self,
      });
    }
    return;
  }

  if (msg.type === 'leave') {
    peers.get(msg.from)?.close();
    peers.delete(msg.from);
    peerMeta.delete(msg.from);
    notifyState();
    return;
  }

  if (msg.type === 'offer' && msg.to === self) {
    peerMeta.set(msg.from, peerMeta.get(msg.from) ?? { userName: 'Участник', stream: null, micLevel: 0 });
    const pc = createPeer(msg.from);
    await pc.setRemoteDescription(msg.sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    pushCollabRaw('voice-signal', {
      type: 'answer',
      roomId,
      to: msg.from,
      sdp: answer,
      from: self,
    });
    notifyState();
  }
  if (msg.type === 'answer' && msg.to === self) {
    const pc = peers.get(msg.from);
    if (pc) await pc.setRemoteDescription(msg.sdp);
  }
  if (msg.type === 'ice' && msg.to === self) {
    const pc = peers.get(msg.from);
    if (pc && msg.candidate) await pc.addIceCandidate(msg.candidate);
  }
}

function createPeer(peerId: string): RTCPeerConnection {
  const existing = peers.get(peerId);
  if (existing) return existing;

  const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  peers.set(peerId, pc);
  if (localStream) {
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream!));
  }
  pc.ontrack = (e) => {
    const stream = e.streams[0];
    if (!stream) return;
    const meta = peerMeta.get(peerId) ?? { userName: 'Участник', stream: null, micLevel: 0 };
    meta.stream = stream;
    peerMeta.set(peerId, meta);
    startLevelMeter(stream, (level) => {
      const m = peerMeta.get(peerId);
      if (m) {
        m.micLevel = level;
        notifyState();
      }
    });
    notifyState();
  };
  pc.onicecandidate = (e) => {
    if (!e.candidate || !roomId) return;
    pushCollabRaw('voice-signal', {
      type: 'ice',
      roomId,
      to: peerId,
      candidate: e.candidate.toJSON(),
      from: getCollabClientId(),
    });
  };
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
      peers.delete(peerId);
      peerMeta.delete(peerId);
      notifyState();
    }
  };
  return pc;
}

export async function joinCallRoom(
  targetRoomId: string,
  userName: string,
  opts?: { video?: boolean; audio?: boolean },
) {
  ensureSubscribe();
  callError = null;
  const wantVideo = opts?.video ?? true;
  const wantAudio = opts?.audio ?? true;

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: wantAudio,
      video: wantVideo ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });
  } catch {
    callError = 'Нет доступа к камере или микрофону';
    notifyState();
    throw new Error(callError);
  }

  micEnabled = wantAudio;
  cameraEnabled = wantVideo;
  roomId = `${targetRoomId}::call`;
  collabRoomId = roomId;
  joinCollabRoom(collabRoomId, 'host');

  stopLevelMeter();
  startLevelMeter(localStream, (level) => {
    localMicLevel = level;
    notifyState();
  });

  pushCollabRaw('voice-signal', {
    type: 'join',
    roomId,
    userName,
    video: wantVideo,
    from: getCollabClientId(),
  });
  notifyState();
  return localStream;
}

/** Голос без видео (доска) — комната = projectId (уже в collab sync). */
export async function joinVoiceRoom(projectId: string, userName: string) {
  ensureSubscribe();
  callError = null;
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  micEnabled = true;
  cameraEnabled = false;
  roomId = projectId;
  collabRoomId = null;
  joinCollabRoom(projectId, 'host');
  stopLevelMeter();
  startLevelMeter(localStream, (level) => {
    localMicLevel = level;
    notifyState();
  });
  pushCollabRaw('voice-signal', {
    type: 'join',
    roomId: projectId,
    userName,
    video: false,
    from: getCollabClientId(),
  });
  notifyState();
  return localStream;
}

export function leaveCallRoom() {
  peers.forEach((pc) => pc.close());
  peers.clear();
  peerMeta.clear();
  localStream?.getTracks().forEach((t) => t.stop());
  localStream = null;
  stopLevelMeter();
  if (roomId) {
    pushCollabRaw('voice-signal', {
      type: 'leave',
      roomId,
      from: getCollabClientId(),
    });
  }
  if (collabRoomId) {
    leaveCollabRoom(collabRoomId);
    collabRoomId = null;
  }
  roomId = null;
  micEnabled = true;
  cameraEnabled = true;
  localMicLevel = 0;
  notifyState();
}

export function leaveVoiceRoom() {
  leaveCallRoom();
}

export function isInVoiceRoom() {
  return roomId !== null;
}

export function setMicEnabled(enabled: boolean) {
  micEnabled = enabled;
  localStream?.getAudioTracks().forEach((t) => {
    t.enabled = enabled;
  });
  notifyState();
}

export function setCameraEnabled(enabled: boolean) {
  cameraEnabled = enabled;
  localStream?.getVideoTracks().forEach((t) => {
    t.enabled = enabled;
  });
  notifyState();
}

/** @deprecated use subscribeCallState */
export function setVoiceRemoteHandler(fn: (stream: MediaStream, peerId: string) => void) {
  subscribeCallState(() => {
    for (const peer of getPublicState().peers) {
      if (peer.stream) fn(peer.stream, peer.peerId);
    }
  });
}

export function resolveCallRoomId(pathname: string, fallbackUserId?: string | null): string {
  const match = pathname.match(/\/projects\/([^/]+)/);
  if (match) return match[1];
  return fallbackUserId ? `user-${fallbackUserId}` : 'workspace';
}

export interface CreatedCallRoom {
  code: string;
  formatted: string;
  shareUrl: string;
  roomKey: string;
}

export async function createCallRoom(
  userName: string,
  opts?: { video?: boolean; audio?: boolean },
): Promise<CreatedCallRoom> {
  const code = generateCallCode();
  const roomKey = callRoomKeyFromCode(code);
  await joinCallRoom(roomKey, userName, opts);
  return {
    code,
    formatted: formatCallCode(code),
    shareUrl: buildCallShareUrl(code),
    roomKey,
  };
}

export async function joinCallRoomByCode(
  codeInput: string,
  userName: string,
  opts?: { video?: boolean; audio?: boolean },
) {
  const roomKey = callRoomKeyFromCode(codeInput);
  await joinCallRoom(roomKey, userName, opts);
  return {
    code: normalizeCallCode(codeInput),
    formatted: formatCallCode(codeInput),
    roomKey,
  };
}
