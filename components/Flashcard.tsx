
import React from 'react';
import { ExternalLink, HelpCircle } from 'lucide-react';
import { Sentence } from '../types';

interface FlashcardProps {
  sentence: Sentence;
  isFlipped: boolean;
  onFlip: () => void;
  onToggleBookmark: () => void;
}

const Flashcard: React.FC = () => {
  // 실제 구현은 StudyView에서 Props를 받아 사용하므로 인터페이스에 맞게 작성
};

const FlashcardComponent: React.FC<FlashcardProps> = ({ sentence, isFlipped, onFlip, onToggleBookmark }) => {
  return (
    <div className="w-full aspect-square perspective-1000 cursor-pointer" onClick={onFlip}>
      <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        <div className="absolute inset-0 backface-hidden bg-white border-2 border-indigo-50 rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 text-center overflow-hidden">
          <div className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
            MEANING
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 leading-snug mb-4">
            {sentence.meaning}
          </h2>
          
          {sentence.hint && (
            <div className="mt-2 flex flex-col items-center text-slate-400 bg-slate-50 p-3 rounded-2xl w-full">
              <div className="flex items-center gap-1.5 mb-0.5 opacity-60">
                <HelpCircle className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Hint</span>
              </div>
              <p className="text-xs italic font-medium">{sentence.hint}</p>
            </div>
          )}
          
          <div className="mt-auto pt-4 text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em] animate-pulse">
            Tap to reveal English
          </div>
        </div>

        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 border-2 border-indigo-700 rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="bg-white/10 text-white/80 text-[10px] font-bold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
            ENGLISH
          </div>
          
          <h2 className="text-xl font-bold leading-relaxed mb-6 drop-shadow-sm">
            {sentence.sentence}
          </h2>

          {sentence.referenceUrl && (
            <a 
              href={sentence.referenceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all text-[10px] font-bold border border-white/10"
            >
              <ExternalLink className="w-3 h-3" />
              REFERENCE LINK
            </a>
          )}

          <div className="mt-auto pt-4 text-[9px] text-indigo-200 font-bold uppercase tracking-[0.2em]">
            Tap to see meaning
          </div>
        </div>

      </div>
    </div>
  );
};

export default FlashcardComponent;
