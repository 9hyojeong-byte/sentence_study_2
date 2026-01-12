
import React, { useState, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Header } from '../components/Layout';
import Flashcard from '../components/Flashcard';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useApp } from '../App';
import { Sentence } from '../types';

const { useLocation, useNavigate } = ReactRouterDOM;

const StudyView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, updateBookmarkOptimistically } = useApp();
  
  // 내비게이션으로 넘어온 초기 문장 리스트의 ID들만 추출
  const initialSentenceIds: string[] = useMemo(() => {
    const sentences = (location.state as any)?.sentences || [];
    return sentences.map((s: Sentence) => s.id);
  }, [location.state]);

  // 전역 상태(state.sentences)에서 해당 ID를 가진 문장들을 찾아 실시간 데이터 구성
  const studyList = useMemo(() => {
    return initialSentenceIds
      .map(id => state.sentences.find(s => s.id === id))
      .filter((s): s is Sentence => !!s);
  }, [initialSentenceIds, state.sentences]);

  const title: string = (location.state as any)?.title || '스터디';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (studyList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800 mb-4">학습할 문장이 없습니다.</h2>
        {/* 상단 헤더에 홈 버튼이 있으므로 하단 버튼은 제거하고 텍스트만 유지하거나 안내만 합니다 */}
        <p className="text-slate-500 text-sm">상단 홈 아이콘을 눌러 돌아가주세요.</p>
      </div>
    );
  }

  const currentSentence = studyList[currentIndex];

  const handleNext = () => {
    if (currentIndex < studyList.length - 1) {
      setIsFlipped(false);
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

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateBookmarkOptimistically(currentSentence.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header title={`${title} (${currentIndex + 1}/${studyList.length})`} />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
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
            onClick={toggleBookmark}
            className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all border-2 ${
              currentSentence.bookmark 
                ? 'bg-yellow-50 text-yellow-500 border-yellow-200' 
                : 'bg-white text-slate-300 border-slate-100'
            }`}
          >
            <Star className={`w-8 h-8 ${currentSentence.bookmark ? 'fill-current' : ''}`} />
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
    </div>
  );
};

export default StudyView;
