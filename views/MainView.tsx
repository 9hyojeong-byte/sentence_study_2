
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { Plus, Shuffle, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { Header, LoadingOverlay } from '../components/Layout';
import StatsDashboard from '../components/StatsDashboard';

const MainView: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  
  const [value, setValue] = useState(new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date | undefined>(undefined);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-CA');
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
    const dateStr = formatDate(date);
    navigate(`/list/date/${dateStr}`);
  };

  const goToToday = () => {
    const today = new Date();
    setValue(today);
    setActiveStartDate(today);
    setTimeout(() => setActiveStartDate(undefined), 100);
  };

  const handleRandomStudy = () => {
    if (state.sentences.length === 0) return;
    const shuffled = [...state.sentences].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    navigate('/study', { state: { sentences: selected, title: '랜덤 10개 학습' } });
  };

  return (
    <div className="pb-24 min-h-screen bg-slate-50">
      <Header title="Study Buddy" showBack={false} />
      
      {state.loading && <LoadingOverlay />}

      <div className="px-5 mt-6 relative">
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" />
            Learning Calendar
          </h2>
          <button
            onClick={goToToday}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors active:scale-95"
          >
            Today
          </button>
        </div>

        <Calendar 
          onChange={handleDateClick as any} 
          value={value}
          activeStartDate={activeStartDate}
          onActiveStartDateChange={({ activeStartDate }) => setActiveStartDate(activeStartDate as Date)}
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

      <div className="px-5 mt-4">
        <button
          onClick={handleRandomStudy}
          disabled={state.sentences.length === 0}
          className="w-full bg-indigo-600 text-white py-4.5 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
        >
          <Shuffle className="w-5 h-5" />
          랜덤 10개 문장 학습하기
        </button>
      </div>

      <button
        onClick={() => navigate('/input')}
        className="fixed bottom-8 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-90 z-40"
      >
        <Plus className="w-9 h-9" />
      </button>
    </div>
  );
};

export default MainView;
