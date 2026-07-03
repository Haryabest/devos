import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { formatCallCode, normalizeCallCode } from '@/domain/calls/room-code';
import { subscribeCollabWsStatus, isCollabWsConnected } from '@/lib/collab-ws';
import {
  getCallState,
  leaveCallRoom,
  setCameraEnabled,
  setMicEnabled,
  subscribeCallState,
  createCallRoom,
  joinCallRoomByCode,
  joinCallRoom,
} from '@/lib/collab-voice';
import { CallVideoTile, LevelBar } from '@/features/calls/components/call-ui';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectsStore } from '@/stores/projects-store';

const WORKSPACE_ROOM = 'workspace';

export function CallsPage() {
  const user = useAuthStore((s) => s.user);
  const projects = useProjectsStore((s) => s.projects);
  const callState = useSyncExternalStore(subscribeCallState, getCallState, getCallState);
  const [searchParams, setSearchParams] = useSearchParams();

  const [roomKey, setRoomKey] = useState(WORKSPACE_ROOM);
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [prefVideo, setPrefVideo] = useState(true);
  const [prefAudio, setPrefAudio] = useState(true);
  const [wsConnected, setWsConnected] = useState(isCollabWsConnected);
  const [codeInput, setCodeInput] = useState(searchParams.get('code') ?? '');
  const [createdCall, setCreatedCall] = useState<{
    formatted: string;
    shareUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => subscribeCollabWsStatus(setWsConnected), []);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) setCodeInput(code);
  }, [searchParams]);

  const roomLabel = useMemo(() => {
    if (roomKey === WORKSPACE_ROOM) return 'Общая комната';
    return projects.find((p) => p.id === roomKey)?.name ?? roomKey;
  }, [projects, roomKey]);

  const activeRoomLabel = useMemo(() => {
    if (!callState.active || !callState.roomId) return null;
    const id = callState.roomId.replace(/::call$/, '');
    if (id.startsWith('call-')) return formatCallCode(id.replace(/^call-/, ''));
    if (id === WORKSPACE_ROOM || id.startsWith('user-')) return 'Общая комната';
    return projects.find((p) => p.id === id)?.name ?? id;
  }, [callState.active, callState.roomId, projects]);

  async function handleCreateCall() {
    setCreating(true);
    try {
      const room = await createCallRoom(user?.name ?? 'Guest', {
        video: prefVideo,
        audio: prefAudio,
      });
      setCreatedCall({ formatted: room.formatted, shareUrl: room.shareUrl });
      setSearchParams({ code: room.code });
    } catch {
      /* error in callState */
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinByCode() {
    const code = normalizeCallCode(codeInput);
    if (!code) return;
    setJoining(true);
    try {
      await joinCallRoomByCode(code, user?.name ?? 'Guest', {
        video: prefVideo,
        audio: prefAudio,
      });
      setSearchParams({ code });
    } catch {
      /* error in callState */
    } finally {
      setJoining(false);
    }
  }

  async function handleJoinProject() {
    setJoining(true);
    try {
      await joinCallRoom(roomKey, user?.name ?? 'Guest', {
        video: prefVideo,
        audio: prefAudio,
      });
    } catch {
      /* error in callState */
    } finally {
      setJoining(false);
    }
  }

  function handleLeave() {
    leaveCallRoom();
    setCreatedCall(null);
  }

  async function copyText(text: string, kind: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  const participantCount = callState.peers.length + (callState.active ? 1 : 0);

  return (
    <PageContainer className="flex min-h-[calc(100vh-3.5rem)] flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Созвоны</h1>
          <p className="text-sm text-muted-foreground">
            WebRTC · камера и микрофон · P2P через collab WS
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={wsConnected ? 'secondary' : 'outline'} className="gap-1.5">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                wsConnected ? 'bg-emerald-500' : 'bg-muted-foreground',
              )}
            />
            {wsConnected ? 'Collab online' : 'Collab offline'}
          </Badge>
          {callState.active && (
            <Badge className="gap-1 bg-emerald-600/90 hover:bg-emerald-600/90">
              <Icons.Video className="h-3 w-3" />
              В эфире · {participantCount}
            </Badge>
          )}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Создать созвон</CardTitle>
              <CardDescription>Получите код и ссылку для участников</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!callState.active ? (
                <Button
                  className="w-full gap-2"
                  disabled={creating || !wsConnected}
                  onClick={() => void handleCreateCall()}
                >
                  {creating ? (
                    <Icons.Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.Plus className="h-4 w-4" />
                  )}
                  {creating ? 'Создание…' : 'Новый созвон'}
                </Button>
              ) : null}

              {createdCall && (
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Код созвона</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-background px-2 py-1 text-sm font-semibold tracking-wider">
                      {createdCall.formatted}
                    </code>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      onClick={() => void copyText(createdCall.formatted, 'code')}
                    >
                      {copied === 'code' ? (
                        <Icons.Check className="h-4 w-4" />
                      ) : (
                        <Icons.Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-full gap-2 text-xs"
                    onClick={() => void copyText(createdCall.shareUrl, 'link')}
                  >
                    {copied === 'link' ? (
                      <Icons.Check className="h-3.5 w-3.5" />
                    ) : (
                      <Icons.Link2 className="h-3.5 w-3.5" />
                    )}
                    Скопировать ссылку
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Войти по коду</CardTitle>
              <CardDescription>Например DEV-ABC123 или ссылка с ?code=</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="DEV-ABC123"
                disabled={callState.active}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleJoinByCode();
                }}
              />
              {!callState.active ? (
                <Button
                  className="w-full gap-2"
                  variant="secondary"
                  disabled={joining || !wsConnected || !normalizeCallCode(codeInput)}
                  onClick={() => void handleJoinByCode()}
                >
                  {joining ? (
                    <Icons.Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.LogIn className="h-4 w-4" />
                  )}
                  {joining ? 'Подключение…' : 'Присоединиться'}
                </Button>
              ) : (
                <Button variant="destructive" className="w-full gap-2" onClick={handleLeave}>
                  <Icons.Phone className="h-4 w-4 rotate-[135deg]" />
                  Завершить созвон
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Комната проекта</CardTitle>
              <CardDescription>Общая или привязанная к проекту</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={roomKey}
                onValueChange={setRoomKey}
                disabled={callState.active}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Комната" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WORKSPACE_ROOM}>Общая комната</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-3 rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="pref-video" className="text-sm font-normal">
                    Камера при входе
                  </Label>
                  <Switch
                    id="pref-video"
                    checked={prefVideo}
                    onCheckedChange={setPrefVideo}
                    disabled={callState.active}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="pref-audio" className="text-sm font-normal">
                    Микрофон при входе
                  </Label>
                  <Switch
                    id="pref-audio"
                    checked={prefAudio}
                    onCheckedChange={setPrefAudio}
                    disabled={callState.active}
                  />
                </div>
              </div>

              {callState.error && (
                <p className="text-sm text-destructive">{callState.error}</p>
              )}

              {!callState.active && (
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  disabled={joining || !wsConnected}
                  onClick={() => void handleJoinProject()}
                >
                  {joining ? (
                    <Icons.Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.Video className="h-4 w-4" />
                  )}
                  {joining ? 'Подключение…' : `Войти · ${roomLabel}`}
                </Button>
              )}

              {!wsConnected && (
                <p className="text-xs text-muted-foreground">
                  Collab WS подключается автоматически при открытии приложения.
                </p>
              )}
            </CardContent>
          </Card>

          {callState.active && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Микрофон</CardTitle>
              </CardHeader>
              <CardContent>
                <LevelBar level={callState.localMicLevel} />
                <p className="mt-2 text-xs text-muted-foreground">
                  {callState.micEnabled ? 'Передаётся' : 'Выключен'}
                </p>
              </CardContent>
            </Card>
          )}
        </aside>

        <section className="flex min-h-0 flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              {callState.active
                ? `Эфир · ${activeRoomLabel ?? roomLabel}`
                : 'Предпросмотр'}
            </h2>
            {callState.active && (
              <span className="text-xs text-muted-foreground">
                {participantCount} участник(ов)
              </span>
            )}
          </div>

          {!callState.active ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/20 p-12 text-center">
              <Icons.Video className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm font-medium">Созвон не активен</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Создайте новый созвон и отправьте код участникам, или введите код для входа.
              </p>
            </div>
          ) : (
            <>
              <div className="grid flex-1 auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <CallVideoTile
                  stream={callState.localStream}
                  label={`${user?.name ?? 'Вы'} (вы)`}
                  mirrored
                  micLevel={callState.localMicLevel}
                  muted
                  micOff={!callState.micEnabled}
                  cameraOff={!callState.cameraEnabled}
                />
                {callState.peers.map((peer) => (
                  <CallVideoTile
                    key={peer.peerId}
                    stream={peer.stream}
                    label={peer.userName}
                    micLevel={peer.micLevel}
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/30 p-3">
                <Button
                  type="button"
                  variant={callState.micEnabled ? 'outline' : 'destructive'}
                  size="sm"
                  className="gap-2"
                  onClick={() => setMicEnabled(!callState.micEnabled)}
                >
                  {callState.micEnabled ? (
                    <Icons.Mic className="h-4 w-4" />
                  ) : (
                    <Icons.MicOff className="h-4 w-4" />
                  )}
                  {callState.micEnabled ? 'Микрофон' : 'Включить микрофон'}
                </Button>
                <Button
                  type="button"
                  variant={callState.cameraEnabled ? 'outline' : 'destructive'}
                  size="sm"
                  className="gap-2"
                  onClick={() => setCameraEnabled(!callState.cameraEnabled)}
                >
                  {callState.cameraEnabled ? (
                    <Icons.Video className="h-4 w-4" />
                  ) : (
                    <Icons.VideoOff className="h-4 w-4" />
                  )}
                  {callState.cameraEnabled ? 'Камера' : 'Включить камеру'}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="ml-auto gap-2"
                  onClick={handleLeave}
                >
                  <Icons.Phone className="h-4 w-4 rotate-[135deg]" />
                  Выйти
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
