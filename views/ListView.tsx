
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { Header, EmptyState } from '../components/Layout';
import { Edit2, PlayCircle, Star } from 'lucide-react';

const ListView: React.FC = () => {
  const { type, value } = useParams<{ type: string; value: string }>();
  const { state, updateBookmarkOptimistically } = useApp();
  const navigate = useNavigate();

  const filteredSentences = state.sentences.filter(s => {
    if (type === 'all') return true;
    if (type === 'date') return s.date === value;
    if (type === 'bookmark') return s.bookmark === true;
    return true;
  });

  const getTitle = () => {
    if (type === 'date') return value || '날짜별 목록';
    if (type === 'bookmark') return '북마크 리스트';
    if (type === 'streak') return '학습 기록';
    return '전체 문장 목록';
  };

  const handleStartStudy = () => {
    if (filteredSentences.length === 0) return;
    const shuffled = [...filteredSentences].sort(() => 0.5 - Math.random());
    navigate('/study', { state: { sentences: shuffled, title: getTitle() } });
  };

  return (
    <div className="pb-10 min-h-screen">
      <Header title={getTitle()} />
      
      <div className="px-4 pt-4 sticky top-[56px] bg-white z-10 pb-4 shadow-sm border-b border-gray-50">
        <button
          onClick={handleStartStudy}
          disabled={filteredSentences.length === 0}
          className="w-full bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md disabled:opacity-50 active:scale-95 transition-transform"
        >
          <PlayCircle className="w-5 h-5" />
          학습 시작하기
        </button>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {filteredSentences.length === 0 ? (
          <EmptyState />
        ) : (
          filteredSentences.map(s => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                    {s.date}
                  </span>
                  {s.bookmark && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                </div>
                <p className="text-gray-900 font-semibold mb-1 leading-tight">{s.sentence}</p>
                <p className="text-gray-500 text-sm">{s.meaning}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => navigate(`/edit/${s.id}`)}
                  className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => updateBookmarkOptimistically(s.id)}
                  className={`p-2 rounded-full transition-colors ${s.bookmark ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 bg-gray-50'}`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ListView;
