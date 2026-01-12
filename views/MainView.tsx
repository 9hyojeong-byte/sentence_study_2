
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { Plus, Shuffle, CalendarDays, Sparkles } from 'lucide-react';
// Fix: Use namespace import for react-router-dom
import * as ReactRouterDOM from 'react-router-dom';
import { useApp } from '../App';
import { Header, LoadingOverlay } from '../components/Layout';
import StatsDashboard from '../components/StatsDashboard';

const { useNavigate } = ReactRouterDOM;

const MainView: React.FC = () => {
  const { state, setLastViewedDate } = useApp();
  const navigate = useNavigate();
  
  const [value, setValue] = useState(state.lastViewedDate);
  const [activeStartDate, setActiveStartDate] = useState<Date | undefined>(state.lastViewedDate);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaySentences = (date: Date) => {
    const targetDateStr = formatDate(date);
    return state.sentences.filter(s => {
      const sDateStr = s.date && typeof s.date === 'string' ? s.date.substring(0, 10) : '';
      return sDateStr === targetDateStr;
    });
  };

  const tileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const daySentences = getDaySentences(date);
      if (daySentences.length > 0) {
        return <div className="dot-indicator"></div>;
      }
    }
    return null;
  };

  const formatDay = (_locale: string | undefined, date: Date) => {
    return date.getDate().toString();
  };

  const handleDateClick = (date: Date) => {
    setValue(date);
    setLastViewedDate(date);
    const dateStr = formatDate(date);
    navigate(`/list/date/${dateStr}`);
  };

  const goToToday = () => {
    const today = new Date();
    setValue(today);
    setActiveStartDate(today);
    setLastViewedDate(today);
  };

  const handleRandomStudy = () => {
    if (state.sentences.length === 0) return;
    const shuffled = [...state.sentences].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    navigate('/study', { state: { sentences: selected, title: '랜덤 10개 학습' } });
  };

  const handleActiveStartDateChange = ({ activeStartDate: nextDate }: { activeStartDate: Date | null }) => {
    if (nextDate) {
      setActiveStartDate(nextDate);
      setLastViewedDate(nextDate);
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-slate-50">
      <Header title="문장 저장고" showBack={false} />
      
      {state.loading && <LoadingOverlay />}

      {/* 대형 학습 시작 버튼 (상단 배치) */}
      <div className="px-5 mt-6 mb-2">
        <button
          onClick={handleRandomStudy}
          disabled={state.sentences.length === 0}
          className="w-full bg-indigo-600 text-white py-7 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 font-extrabold text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.96] transition-all disabled:opacity-50 disabled:shadow-none border-b-[6px] border-indigo-800 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
          <div className="flex items-center gap-3 z-10">
            <Shuffle className="w-7 h-7 animate-pulse" />
            <span>랜덤 10개 학습하기</span>
            <Sparkles className="w-5 h-5 text-indigo-200" />
          </div>
        </button>
      </div>

      <div className="px-5 mt-8 relative">
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="text-sm font-extrabold text-slate-400 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-400" />
            학습 달력
          </h2>
          <button
            onClick={goToToday}
            className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors active:scale-95 uppercase tracking-wider"
          >
            Today
          </button>
        </div>

        <Calendar 
          onChange={handleDateClick as any} 
          value={value}
          activeStartDate={activeStartDate}
          onActiveStartDateChange={handleActiveStartDateChange}
          tileContent={tileContent}
          formatDay={formatDay}
          className="mb-8"
          next2Label={null}
          prev2Label={null}
        />
      </div>

      <div className="mt-2">
        <StatsDashboard sentences={state.sentences} />
      </div>

      <button
        onClick={() => navigate('/input')}
        className="fixed bottom-8 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-90 z-40 border-4 border-white"
      >
        <Plus className="w-9 h-9" />
      </button>
    </div>
  );
};

export default MainView;
