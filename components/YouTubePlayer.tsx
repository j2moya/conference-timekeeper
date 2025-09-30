import React, { useEffect, useRef, useImperativeHandle, forwardRef, memo } from 'react';

// Fix: Add TypeScript type definitions for the YouTube Iframe Player API.
// This resolves errors related to `window.YT` and the `YT` namespace, which are
// loaded from an external script and are not known to TypeScript by default.
declare global {
  interface Window {
    YT?: {
      Player: new (elementId: string, options: any) => YT.Player;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

declare namespace YT {
  interface Player {
    destroy: () => void;
    playVideo: () => void;
    pauseVideo: () => void;
    mute: () => void;
    unMute: () => void;
    getPlayerState: () => number;
  }
}

interface YouTubePlayerProps {
  url: string;
  isPlaying: boolean;
  isMuted: boolean;
}

const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const loadYouTubeAPI = () => {
  if (window.YT) return;

  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
};

const YouTubePlayer = forwardRef<any, YouTubePlayerProps>(({ url, isPlaying, isMuted }, ref) => {
  const playerRef = useRef<YT.Player | null>(null);
  const videoId = getYouTubeVideoId(url);

  useEffect(() => {
    loadYouTubeAPI();

    const createPlayer = () => {
      if (window.YT && window.YT.Player && videoId) {
        if(playerRef.current) {
            playerRef.current.destroy();
        }
        playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
          videoId: videoId,
          playerVars: { 'autoplay': 0, 'controls': 0, 'rel': 0, 'showinfo': 0, 'modestbranding': 1 },
        });
      }
    };

    if (!window.YT) {
      window.onYouTubeIframeAPIReady = createPlayer;
    } else {
      createPlayer();
    }
    
    return () => {
        if(playerRef.current) {
            playerRef.current.destroy();
        }
    }
  }, [videoId]);
  
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.getPlayerState) return;

    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  useEffect(() => {
     if (!playerRef.current) return;
     if (isMuted) {
         playerRef.current.mute();
     } else {
         playerRef.current.unMute();
     }
  }, [isMuted]);

  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    mute: () => playerRef.current?.mute(),
    unmute: () => playerRef.current?.unMute(),
  }));

  if (!videoId) {
    return <div className="text-red-500">Invalid YouTube URL</div>;
  }

  return <div id={`youtube-player-${videoId}`} className="w-full h-full"></div>;
});

export default memo(YouTubePlayer);