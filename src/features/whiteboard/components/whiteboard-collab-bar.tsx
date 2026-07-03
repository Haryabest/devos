import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import * as Icons from '@/components/ui/icons';
import {
  isFollowingHost,
  startFollowHost,
  stopFollowHost,
  subscribeFollow,
} from '@/lib/collab-follow';
import { useWhiteboardStore } from '@/stores/whiteboard-store';

interface WhiteboardCollabBarProps {
  projectId: string;
  hostUserId?: string;
}

export function WhiteboardCollabBar({ projectId, hostUserId }: WhiteboardCollabBarProps) {
  const setViewport = useWhiteboardStore((s) => s.setViewport);
  const [following, setFollowing] = useState(isFollowingHost());

  useEffect(() => {
    if (!following) return;
    return subscribeFollow((p) => {
      setViewport(projectId, {
        panX: -p.x + window.innerWidth / 2,
        panY: -p.y + window.innerHeight / 2,
      });
    });
  }, [following, projectId, setViewport]);

  function toggleFollow() {
    if (following) {
      stopFollowHost();
      setFollowing(false);
      return;
    }
    if (hostUserId) {
      startFollowHost(projectId, hostUserId);
      setFollowing(true);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-1.5">
      <Button
        type="button"
        size="sm"
        variant={following ? 'secondary' : 'outline'}
        className="h-7 gap-1 text-xs"
        disabled={!hostUserId}
        onClick={toggleFollow}
      >
        <Icons.Users className="h-3 w-3" />
        Follow
      </Button>
    </div>
  );
}
