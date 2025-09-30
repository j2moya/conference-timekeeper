import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ConferencePlan } from '../types';
import { MediaType } from '../types';
import { PlayIcon, PauseIcon, MuteIcon, UnmuteIcon, NextIcon, PrevIcon, LinkIcon, PrintIcon, StopIcon } from './icons';
import YouTubePlayer from './YouTubePlayer';
import MediaPlayer from './MediaPlayer';

interface PlayerProps {
  plan: ConferencePlan;
  onEndSession: () => void;
  onGoToPrint: () => void;
}

const getMediaType = (url: string): MediaType => {
    if (!url) return MediaType.None;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return MediaType.YouTube;
    if (url.endsWith('.mp4')) return MediaType.Video;
    if (url.endsWith('.mp3')) return MediaType.Audio;
    return MediaType.None;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const Player: React.FC<PlayerProps> = ({ plan, onEndSession, onGoToPrint }) => {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  const segmentDurationSeconds = useMemo(() => plan.segments.length > 0 ? (plan.totalDurationMinutes * 60) / plan.segments.length : 0, [plan]);
  const totalDurationSeconds = useMemo(() => plan.totalDurationMinutes * 60, [plan]);

  const [segmentTimeLeft, setSegmentTimeLeft] = useState(segmentDurationSeconds);
  const [totalTimeLeft, setTotalTimeLeft] = useState(totalDurationSeconds);

  const playerRef = useRef<{ play: () => void; pause: () => void; mute: () => void; unmute: () => void }>(null);

  const currentSegment = plan.segments[currentSegmentIndex];
  const mediaType = getMediaType(currentSegment.mediaUrl);
  
  const goToSegment = useCallback((index: number) => {
    if (index >= 0 && index < plan.segments.length) {
        setCurrentSegmentIndex(index);
        setSegmentTimeLeft(segmentDurationSeconds);
        const newTotalTimeLeft = totalDurationSeconds - (index * segmentDurationSeconds);
        setTotalTimeLeft(newTotalTimeLeft > 0 ? newTotalTimeLeft : 0);
        setIsPlaying(false);
    }
  }, [plan.segments.length, segmentDurationSeconds, totalDurationSeconds]);

  const nextSegment = useCallback(() => {
    if (currentSegmentIndex < plan.segments.length - 1) {
      goToSegment(currentSegmentIndex + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentSegmentIndex, plan.segments.length, goToSegment]);

  const nextSegmentRef = useRef(nextSegment);
  useEffect(() => {
    nextSegmentRef.current = nextSegment;
  });
  
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSegmentTimeLeft(prev => {
        if (prev <= 1) {
          nextSegmentRef.current();
          return segmentDurationSeconds;
        }
        return prev - 1;
      });
      setTotalTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, segmentDurationSeconds]);
  
  const handleTogglePlay = () => setIsPlaying(p => !p);
  const handleToggleMute = () => setIsMuted(p => !p);

  useEffect(() => {
    if (playerRef.current) {
        if (isPlaying) playerRef.current.play();
        else playerRef.current.pause();

        if (isMuted) playerRef.current.mute();
        else playerRef.current.unmute();
    }
  }, [isPlaying, isMuted]);

  const segmentProgress = segmentDurationSeconds > 0 ? (segmentDurationSeconds - segmentTimeLeft) / segmentDurationSeconds * 100 : 0;
  const totalProgress = totalDurationSeconds > 0 ? (totalDurationSeconds - totalTimeLeft) / totalDurationSeconds * 100 : 0;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-700 flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-indigo-300">{plan.title}</h2>
        <p className="text-gray-400">Total time remaining: {formatTime(totalTimeLeft)}</p>
      </div>
      
      {/* Player and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 aspect-video bg-black rounded-lg overflow-hidden shadow-lg flex items-center justify-center relative">
          {mediaType === MediaType.YouTube && <YouTubePlayer key={currentSegment.id} ref={playerRef} url={currentSegment.mediaUrl} isPlaying={isPlaying} isMuted={isMuted} />}
          {mediaType === MediaType.Video && <MediaPlayer key={currentSegment.id} ref={playerRef} url={currentSegment.mediaUrl} type="video" isPlaying={isPlaying} isMuted={isMuted} />}
          {mediaType === MediaType.Audio && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
                <p className="text-2xl font-bold">{currentSegment.title}</p>
                <p className="text-lg text-gray-300">{currentSegment.subtitle}</p>
                <MediaPlayer key={currentSegment.id} ref={playerRef} url={currentSegment.mediaUrl} type="audio" isPlaying={isPlaying} isMuted={isMuted} />
            </div>
          )}
          {mediaType === MediaType.None && <div className="text-gray-500">No media for this segment.</div>}
        </div>

        <div className="bg-gray-900/40 p-4 rounded-lg flex flex-col justify-between">
          <div>
            <span className="text-sm font-semibold text-indigo-400">SEGMENT {currentSegmentIndex + 1} / {plan.segments.length}</span>
            <h3 className="text-2xl font-bold mt-1">{currentSegment.title}</h3>
            <p className="text-gray-400 mt-2">{currentSegment.subtitle}</p>
          </div>
          <div className="mt-4">
             <div className="text-gray-400 text-sm">Segment time left: {formatTime(segmentTimeLeft)}</div>
          </div>
        </div>
      </div>
      
      {/* Progress Bars */}
      <div className="space-y-3">
        <div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${segmentProgress}%` }}></div>
            </div>
            <div className="text-xs text-gray-400 text-right mt-1">Segment Progress</div>
        </div>
        <div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${totalProgress}%` }}></div>
            </div>
            <div className="text-xs text-gray-400 text-right mt-1">Total Progress</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900/40 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <button onClick={onEndSession} className="p-2 rounded-full bg-red-800/50 hover:bg-red-700/70 transition-colors" title="End Session"><StopIcon /></button>
            <button onClick={onGoToPrint} className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/70 transition-colors" title="Print/Save Summary"><PrintIcon /></button>
        </div>

        <div className="flex items-center gap-4">
            <button onClick={() => goToSegment(currentSegmentIndex - 1)} disabled={currentSegmentIndex === 0} className="p-3 rounded-full bg-gray-700/50 hover:bg-gray-600/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><PrevIcon /></button>
            <button onClick={handleTogglePlay} className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors text-white shadow-lg">
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button onClick={() => goToSegment(currentSegmentIndex + 1)} disabled={currentSegmentIndex === plan.segments.length - 1} className="p-3 rounded-full bg-gray-700/50 hover:bg-gray-600/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><NextIcon /></button>
        </div>

        <div className="flex items-center gap-2">
            <button onClick={handleToggleMute} className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/70 transition-colors" title={isMuted ? "Unmute" : "Mute"}>{isMuted ? <MuteIcon /> : <UnmuteIcon />}</button>
            {currentSegment.relatedLink && (
                <button onClick={() => setShowLinkModal(true)} className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/70 transition-colors" title="Show Related Link"><LinkIcon /></button>
            )}
        </div>
      </div>
      
      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowLinkModal(false)}>
            <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h4 className="text-xl font-bold mb-4">Related Link</h4>
                <a href={currentSegment.relatedLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline break-all">{currentSegment.relatedLink}</a>
                <button onClick={() => setShowLinkModal(false)} className="mt-6 w-full py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">Close</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Player;
