
import React, { useRef, useEffect, useImperativeHandle, forwardRef, memo } from 'react';

interface MediaPlayerProps {
  url: string;
  type: 'video' | 'audio';
  isPlaying: boolean;
  isMuted: boolean;
}

const MediaPlayer = forwardRef<any, MediaPlayerProps>(({ url, type, isPlaying, isMuted }, ref) => {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  useEffect(() => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.play().catch(error => console.error("Media playback failed:", error));
    } else {
      mediaRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  useEffect(() => {
      if(mediaRef.current) {
          mediaRef.current.src = url;
          mediaRef.current.load();
      }
  }, [url]);

  useImperativeHandle(ref, () => ({
    play: () => mediaRef.current?.play(),
    pause: () => mediaRef.current?.pause(),
    mute: () => { if (mediaRef.current) mediaRef.current.muted = true; },
    unmute: () => { if (mediaRef.current) mediaRef.current.muted = false; },
  }));

  if (type === 'video') {
    return <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={url} className="w-full h-full object-cover" loop playsInline />;
  }

  if (type === 'audio') {
    // Audio is not visible, it's controlled by parent
    return <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={url} loop />;
  }

  return null;
});

export default memo(MediaPlayer);
