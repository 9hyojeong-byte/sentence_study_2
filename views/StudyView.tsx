
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout.tsx';
import Flashcard from '../components/Flashcard.tsx';
import { ChevronLeft, ChevronRight, RotateCcw, Home } from 'lucide-react';
import { useApp } from '../App.tsx';
import { Sentence } from '../types.ts';

const StudyView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateBookmarkOptimistically } = useApp();
  
  const studyList: Sentence[] = location.state?.sentences || [];
  const title: string = location.state?.title || '스터디';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (studyList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800 mb-4">학습할 문장이 없습니다.</h2>
        <button 
          onClick={() => navigate('/')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const currentSentence = studyList[currentIndex];

  const handleNext = () => {
    if (currentIndex < studyList.length - 1) {
      setIsFlipped(false);
      // 부드러운 전환을 위해 약간의 지연 후 인덱스 변경
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header title={`${title} (${currentIndex + 1}/${studyList.length})`} />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        <Flashcard 
          sentence={currentSentence} 
          isFlipped={isFlipped}
          onFlip={handleFlip}
          onToggleBookmark={() => updateBookmarkOptimistically(currentSentence.id)}
        />

        <div className="mt-10 flex items-center justify-between w-full max-w-[280px]">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:shadow-none active:scale-90 transition-all border border-slate-100"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={handleFlip}
            className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full shadow-inner flex items-center justify-center active:scale-90 transition-transform"
          >
            <RotateCcw className={`w-8 h-8 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === studyList.length - 1}
            className="w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:shadow-none active:scale-90 transition-all border border-slate-100"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      </div>

      <div className="p-6 fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-md border-t border-slate-100">
        <button
          onClick={() => navigate('/')}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-bold active:scale-[0.98] transition-all shadow-lg"
        >
          <Home className="w-5 h-5" />
          홈 화면으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default StudyView;
