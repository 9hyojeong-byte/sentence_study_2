
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, Loader2, Shuffle } from 'lucide-react';
import { Sentence } from '../types';
import { ttsService } from '../services/ttsService';

interface AudioPlayerControllerProps {
  sentences: Sentence[];
}

const AudioPlayerController: React.FC<AudioPlayerControllerProps> = ({ sentences }) => {
  const [isShuffle, setIsShuffle] = useState(true);
  const [playlist, setPlaylist] = useState<Sentence[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const isMounted = useRef(true);
  const stopRequested = useRef(false);

  // 초기 플레이리스트 설정 및 셔플 처리
  useEffect(() => {
    let newPlaylist = [...sentences];
    if (isShuffle) {
      newPlaylist.sort(() => Math.random() - 0.5);
    }
    setPlaylist(newPlaylist);
    setCurrentIndex(0);
  }, [sentences]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      ttsService.stopAudio();
    };
  }, []);

  const toggleShuffle = () => {
    const currentSentence = playlist[currentIndex];
    let newPlaylist = [...sentences];
    
    if (!isShuffle) {
      // 셔플 켜기
      newPlaylist.sort(() => Math.random() - 0.5);
    }
    
    // 현재 재생 중인 문장의 새 인덱스 찾기
    const newIndex = newPlaylist.findIndex(s => s.id === currentSentence?.id);
    
    setPlaylist(newPlaylist);
    setCurrentIndex(newIndex !== -1 ? newIndex : 0);
    setIsShuffle(!isShuffle);
  };

  const playNext = async (index: number) => {
    if (!isMounted.current || stopRequested.current) return;
    if (index >= playlist.length) {
      setIsPlaying(false);
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex(index);
    setIsLoading(true);
    try {
      await ttsService.playAudio(playlist[index].sentence);
      if (!stopRequested.current && !isPaused) {
        setIsLoading(false);
        playNext(index + 1);
      }
    } catch (err) {
      console.error("Playback error:", err);
      setIsLoading(false);
      if (!stopRequested.current) {
        playNext(index + 1);
      }
    }
  };

  const handlePlay = async () => {
    if (isPaused) {
      setIsPaused(false);
      setIsPlaying(true);
      await ttsService.resumeAudio();
    } else {
      stopRequested.current = false;
      setIsPlaying(true);
      playNext(currentIndex);
    }
  };

  const handlePause = async () => {
    setIsPaused(true);
    setIsPlaying(false);
    await ttsService.pauseAudio();
  };

  const handleStop = async () => {
    stopRequested.current = true;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
    await ttsService.stopAudio();
  };

  const handleSkipForward = () => {
    if (currentIndex < playlist.length - 1) {
      handleStop();
      setTimeout(() => {
        stopRequested.current = false;
        setIsPlaying(true);
        playNext(currentIndex + 1);
      }, 100);
    }
  };

  const handleSkipBack = () => {
    if (currentIndex > 0) {
      handleStop();
      setTimeout(() => {
        stopRequested.current = false;
        setIsPlaying(true);
        playNext(currentIndex - 1);
      }, 100);
    }
  };

  if (sentences.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-slate-900/90 backdrop-blur-lg rounded-3xl p-4 shadow-2xl z-50 border border-white/10 animate-in slide-in-from-bottom-10 duration-500">
      <div className="flex flex-col gap-3">
        {/* Progress & Current Sentence */}
        <div className="flex flex-col px-2">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                Playing {currentIndex + 1} / {playlist.length}
              </span>
              {isShuffle && (
                <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                  Shuffle On
                </span>
              )}
            </div>
            {isLoading && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />}
          </div>
          <p className="text-white text-xs font-bold truncate">
            {playlist[currentIndex]?.sentence}
          </p>
          <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / playlist.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-2 py-1">
          <button 
            onClick={toggleShuffle}
            className={`p-2 transition-colors ${isShuffle ? 'text-indigo-400' : 'text-white/40 hover:text-white'}`}
            title="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleSkipBack}
              disabled={currentIndex === 0}
              className="p-2 text-white/60 hover:text-white disabled:opacity-20 transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              {isPlaying ? (
                <button 
                  onClick={handlePause}
                  className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-90"
                >
                  <Pause className="w-6 h-6 fill-current" />
                </button>
              ) : (
                <button 
                  onClick={handlePlay}
                  className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-90"
                >
                  <Play className="w-6 h-6 fill-current" />
                </button>
              )}
            </div>

            <button 
              onClick={handleSkipForward}
              disabled={currentIndex === playlist.length - 1}
              className="p-2 text-white/60 hover:text-white disabled:opacity-20 transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="w-9"></div> {/* Spacer to balance shuffle button */}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerController;
