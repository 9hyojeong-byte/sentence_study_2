
import React from 'react';
import { ExternalLink, HelpCircle } from 'lucide-react';
import { Sentence } from '../types';

interface FlashcardProps {
  sentence: Sentence;
  isFlipped: boolean;
  onFlip: () => void;
  onToggleBookmark: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ sentence, isFlipped, onFlip }) => {
  return (
    <div className="w-full aspect-[3/4] perspective-1000 cursor-pointer" onClick={onFlip}>
      <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        <div className="absolute inset-0 backface-hidden bg-white border-2 border-indigo-50 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center overflow-hidden">
          <div className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
            MEANING
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 leading-snug mb-8">
            {sentence.meaning}
          </h2>
          
          {sentence.hint && (
            <div className="mt-4 flex flex-col items-center text-slate-400 bg-slate-50 p-4 rounded-2xl w-full">
              <div className="flex items-center gap-1.5 mb-1 opacity-60">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Hint</span>
              </div>
              <p className="text-sm italic font-medium">{sentence.hint}</p>
            </div>
          )}
          
          <div className="mt-auto pt-6 text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] animate-pulse">
            Tap to reveal English
          </div>
        </div>

        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 border-2 border-indigo-700 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center text-white">
          <div className="bg-white/10 text-white/80 text-[10px] font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
            ENGLISH
          </div>
          
          <h2 className="text-2xl font-bold leading-relaxed mb-8 drop-shadow-sm">
            {sentence.sentence}
          </h2>

          {sentence.referenceUrl && (
            <a 
              href={sentence.referenceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-full transition-all text-xs font-bold border border-white/10"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              REFERENCE LINK
            </a>
          )}

          <div className="mt-auto pt-6 text-[10px] text-indigo-200 font-bold uppercase tracking-[0.2em]">
            Tap to see meaning
          </div>
        </div>

      </div>
    </div>
  );
};

export default Flashcard;
