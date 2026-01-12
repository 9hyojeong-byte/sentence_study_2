
import React from 'react';
// Fix: Use namespace import for react-router-dom
import * as ReactRouterDOM from 'react-router-dom';
import { useApp } from '../App';
import { Header, EmptyState } from '../components/Layout';
import { Edit2, PlayCircle, Star, Calendar, Play, ExternalLink } from 'lucide-react';
import { Sentence } from '../types';

const { useParams, useNavigate } = ReactRouterDOM;

const ListView: React.FC = () => {
  const { type, value } = useParams<{ type: string; value: string }>();
  const { state, updateBookmarkOptimistically } = useApp();
  const navigate = useNavigate();

  // 날짜 문자열을 YYYY-MM-DD 형식으로 안전하게 변환하는 함수
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '날짜 없음';
    return dateStr.substring(0, 10);
  };

  const filteredSentences = state.sentences.filter(s => {
    if (type === 'all') return true;
    if (type === 'date') return formatDateString(s.date) === value;
    if (type === 'bookmark') return s.bookmark === true;
    if (type === 'streak') return true; 
    return true;
  });

  const getTitle = () => {
    if (type === 'date') return value || '날짜별 목록';
    if (type === 'bookmark') return '북마크 리스트';
    if (type === 'streak') return '학습 기록';
    return '전체 문장 목록';
  };

  const handleStartStudy = (targetSentences: Sentence[] = filteredSentences, customTitle?: string) => {
    if (targetSentences.length === 0) return;
    const shuffled = [...targetSentences].sort(() => 0.5 - Math.random());
    navigate('/study', { state: { sentences: shuffled, title: customTitle || getTitle() } });
  };

  const handleCardClick = (clickedSentence: Sentence) => {
    // 현재 필터링된 전체 리스트에서 클릭된 문장을 제외한 나머지를 추출
    const others = filteredSentences.filter(s => s.id !== clickedSentence.id);
    // 나머지 문장들을 랜덤하게 섞음
    const shuffledOthers = [...others].sort(() => 0.5 - Math.random());
    // 클릭된 문장을 맨 앞에 두고 학습 리스트 구성
    const orderedList = [clickedSentence, ...shuffledOthers];
    
    navigate('/study', { 
      state: { 
        sentences: orderedList, 
        title: getTitle() 
      } 
    });
  };

  // 그룹화 및 정렬
  const groupedByDate = filteredSentences.reduce((acc, sentence) => {
    const date = formatDateString(sentence.date);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(sentence);
    return acc;
  }, {} as Record<string, Sentence[]>);

  // 날짜 내림차순 정렬 (최신순)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const renderSentenceCard = (s: Sentence) => (
    <div 
      key={s.id} 
      onClick={() => handleCardClick(s)}
      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-start gap-4 hover:border-indigo-100 transition-colors cursor-pointer group/card"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-tight">
            {formatDateString(s.date)}
          </span>
          {s.bookmark && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
        </div>
        <p className="text-gray-900 font-semibold mb-1 leading-tight group-hover/card:text-indigo-600 transition-colors">{s.sentence}</p>
        <p className="text-gray-500 text-sm">{s.meaning}</p>
      </div>
      <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
        {s.referenceUrl && (
          <a 
            href={s.referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="p-2 bg-indigo-50 rounded-full text-indigo-500 hover:bg-indigo-100 transition-colors flex items-center justify-center"
            title="참고 링크 열기"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <button 
          onClick={() => navigate(`/edit/${s.id}`)}
          className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
          title="수정"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => updateBookmarkOptimistically(s.id)}
          className={`p-2 rounded-full transition-colors ${s.bookmark ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 bg-gray-50'}`}
          title="북마크"
        >
          <Star className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="pb-10 min-h-screen">
      <Header title={getTitle()} />
      
      <div className="px-4 pt-4 sticky top-[56px] bg-white/90 backdrop-blur-md z-20 pb-4 shadow-sm border-b border-gray-50">
        <button
          onClick={() => handleStartStudy()}
          disabled={filteredSentences.length === 0}
          className="w-full bg-indigo-600 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95 transition-all"
        >
          <PlayCircle className="w-5 h-5" />
          전체 리스트 학습하기
        </button>
      </div>

      <div className="px-4 mt-6">
        {filteredSentences.length === 0 ? (
          <EmptyState />
        ) : (
          type === 'streak' || type === 'all' ? (
            <div className="space-y-10">
              {sortedDates.map(date => (
                <div key={date} className="space-y-4">
                  <div 
                    className="flex items-center gap-3 px-1 group cursor-pointer"
                    onClick={() => handleStartStudy(groupedByDate[date], `${date} 학습`)}
                  >
                    <div className="bg-slate-800 p-1.5 rounded-lg shadow-sm group-hover:bg-indigo-600 transition-colors">
                      <Calendar className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-base font-black text-slate-800 tracking-tight leading-none mb-1 group-hover:text-indigo-600 transition-colors">{date}</h3>
                      <span className="text-[10px] font-bold text-slate-400">
                        {groupedByDate[date].length} 문장
                      </span>
                    </div>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                    <button
                      className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      학습
                    </button>
                  </div>
                  <div className="space-y-3">
                    {groupedByDate[date].map(s => renderSentenceCard(s))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSentences.map(s => renderSentenceCard(s))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ListView;
