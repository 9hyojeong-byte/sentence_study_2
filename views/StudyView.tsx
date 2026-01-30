
import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Header } from '../components/Layout';
import Flashcard from '../components/Flashcard';
import { ChevronLeft, ChevronRight, Star, Check, RotateCcw, Mic } from 'lucide-react';
import { useApp } from '../App';
import { Sentence } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";

const { useLocation, useNavigate } = ReactRouterDOM;

// Audio Decoding Helpers
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Web Speech API 타입 정의
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

const StudyView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, updateBookmarkOptimistically } = useApp();
  
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  // 음성 인식 관련 상태
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptBufferRef = useRef<string>(''); 
  const isActiveSessionRef = useRef<boolean>(false); 

  const initialSentenceIds: string[] = useMemo(() => {
    const sentences = (location.state as any)?.sentences || [];
    return sentences.map((s: Sentence) => s.id);
  }, [location.state]);

  const studyList = useMemo(() => {
    return initialSentenceIds
      .map(id => state.sentences.find(s => s.id === id))
      .filter((s): s is Sentence => !!s);
  }, [initialSentenceIds, state.sentences]);

  const title: string = (location.state as any)?.title || '스터디';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // 음성 인식 시작 함수
  const startSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        isActiveSessionRef.current = true;
        transcriptBufferRef.current = '';
        setRecognizedText('');
        setAccuracy(null);
        setShowResult(false);
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.warn("Recognition start failed or already running", e);
      }
    }
  };

  // 음성 인식 중지 함수
  const stopSpeechRecognition = () => {
    isActiveSessionRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsRecording(false);
    }
  };

  // 제출 처리 함수
  const handleSubmit = () => {
    stopSpeechRecognition();
    calculateSimilarity(transcriptBufferRef.current, studyList[currentIndex].sentence);
  };

  // TTS 기능 (Gemini API)
  const playTTS = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say naturally and clearly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is a standard high-quality voice
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const decoded = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(decoded, audioCtx, 24000, 1);
        
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error("TTS Error:", err);
      setIsSpeaking(false);
      // Fallback to browser TTS if Gemini fails
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // 문장 변경 시 초기화
  useEffect(() => {
    setRecognizedText('');
    setAccuracy(null);
    setShowResult(false);
    setIsFlipped(false);
    transcriptBufferRef.current = '';
    isActiveSessionRef.current = false;
    
    // 자동 녹음 타이머 제거됨. 사용자가 수동으로 시작해야 함.

    return () => {
      stopSpeechRecognition();
    };
  }, [currentIndex]);

  // Speech Recognition 초기화
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        transcriptBufferRef.current += (transcriptBufferRef.current ? ' ' : '') + finalTranscript;
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error("Speech recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        // 10초 세션 활성 중에 끊기면 재시작 (모바일 대응)
        if (isActiveSessionRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [currentIndex, studyList]);

  // 자동 제출 타이머 (수동으로 시작했을 때만 작동하도록 변경 가능하나, 일단 수동 시작 후 10초 뒤 제출로 유지)
  useEffect(() => {
    let stopTimer: number;
    if (isRecording) {
      stopTimer = window.setTimeout(() => {
        if (isActiveSessionRef.current) {
          handleSubmit();
        }
      }, 10000);
    }
    return () => clearTimeout(stopTimer);
  }, [isRecording]);

  if (studyList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800 mb-4">학습할 문장이 없습니다.</h2>
        <p className="text-slate-500 text-sm">상단 홈 아이콘을 눌러 돌아가주세요.</p>
      </div>
    );
  }

  const currentSentence = studyList[currentIndex];

  const calculateSimilarity = (spoken: string, target: string) => {
    const clean = (text: string) => text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    const spokenWords = clean(spoken).split(/\s+/).filter(w => w.length > 0);
    const targetWords = clean(target).split(/\s+/).filter(w => w.length > 0);
    
    if (spokenWords.length === 0) {
      setAccuracy(0);
      setRecognizedText("");
      setShowResult(true);
      return;
    }

    let matches = 0;
    targetWords.forEach(word => {
      if (spokenWords.includes(word)) {
        matches++;
      }
    });

    const score = Math.round((matches / targetWords.length) * 100);
    setAccuracy(score);
    setRecognizedText(spoken);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < studyList.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > minSwipeDistance) handleNext();
    else if (distance < -minSwipeDistance) handlePrev();
  };

  const handleMainAction = () => {
    if (showResult) {
      // 다시 시도
      startSpeechRecognition();
    } else if (isRecording) {
      // 제출
      handleSubmit();
    } else {
      // 녹음 시작
      startSpeechRecognition();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 select-none">
      <Header title={`${title} (${currentIndex + 1}/${studyList.length})`} />

      <div 
        className="flex-1 flex flex-col items-center justify-start px-6 pt-6 pb-10 overflow-y-auto"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-full max-w-sm mb-5">
          <Flashcard 
            sentence={currentSentence} 
            isFlipped={isFlipped}
            onFlip={handleFlip}
            onToggleBookmark={() => updateBookmarkOptimistically(currentSentence.id)}
            onSpeak={playTTS}
            isSpeaking={isSpeaking}
          />
        </div>

        <div className="w-full max-w-sm min-h-[110px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 p-5 shadow-sm mb-6 transition-all relative overflow-hidden">
          {isRecording && (
            <div className="absolute top-3 right-4 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Listening</span>
            </div>
          )}

          {showResult ? (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <p className="text-slate-400 text-[9px] font-black uppercase mb-1.5 tracking-widest">Analysis Result</p>
              <p className="text-slate-800 font-bold text-center leading-tight mb-3 italic text-lg px-2">
                "{recognizedText || "(No speech detected)"}"
              </p>
              {accuracy !== null && (
                <div className={`px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2 ${
                  accuracy >= 80 ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {accuracy >= 80 ? 'Excellent!' : 'Try Again!'} {accuracy}%
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-1.5 items-end h-6">
                {[0, 1, 2, 3, 4].map(i => (
                  <div 
                    key={i} 
                    className={`w-1.5 bg-indigo-500 rounded-full ${isRecording ? 'animate-bounce' : 'opacity-20'}`} 
                    style={{animationDelay: `${i * 0.15}s`, height: `${(i+2)*4}px`}}
                  ></div>
                ))}
              </div>
              <div className="text-center">
                <p className={`${isRecording ? 'text-indigo-600' : 'text-slate-400'} text-base font-black transition-colors`}>
                  {isRecording ? '지금 바로 말씀하세요' : '버튼을 눌러 녹음을 시작하세요'}
                </p>
                {isRecording && <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">10초 후 자동 제출됩니다</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
          <div className="flex items-center justify-between w-full max-w-[300px]">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0 || isRecording}
              className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 disabled:opacity-20 active:scale-90 transition-all border border-slate-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="relative">
              {isRecording && (
                <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 scale-125"></div>
              )}
              <button
                onClick={handleMainAction}
                className={`w-20 h-20 rounded-full shadow-xl flex flex-col items-center justify-center active:scale-95 transition-all relative z-10 border-4 border-white ${
                  showResult 
                    ? 'bg-slate-800 text-white' 
                    : isRecording ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border-indigo-50'
                }`}
              >
                {showResult ? (
                  <>
                    <RotateCcw className="w-7 h-7 mb-0.5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Retry</span>
                  </>
                ) : isRecording ? (
                  <>
                    <Check className="w-8 h-8 mb-0.5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Submit</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8 mb-0.5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Record</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === studyList.length - 1 || isRecording}
              className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 disabled:opacity-20 active:scale-90 transition-all border border-slate-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={() => updateBookmarkOptimistically(currentSentence.id)}
              className={`p-3.5 rounded-2xl transition-all border-2 ${
                currentSentence.bookmark 
                  ? 'bg-yellow-50 text-yellow-500 border-yellow-200 shadow-inner' 
                  : 'bg-white text-slate-300 border-slate-100'
              }`}
            >
              <Star className={`w-5 h-5 ${currentSentence.bookmark ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={() => {
                setRecognizedText('');
                setAccuracy(null);
                setShowResult(false);
                stopSpeechRecognition();
              }}
              className="p-3.5 bg-white rounded-2xl text-slate-400 border-2 border-slate-100 hover:text-indigo-500 hover:border-indigo-100 transition-all active:rotate-180 duration-500"
              title="Reset All"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] text-center px-8 leading-relaxed">
          Swipe to turn page • Speak naturally • 10s Recording Window
        </p>
      </div>
    </div>
  );
};

export default StudyView;
