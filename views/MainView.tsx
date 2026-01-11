
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { Plus, Shuffle, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { Header, LoadingOverlay } from '../components/Layout';
import StatsDashboard from '../components/StatsDashboard';

const MainView: React.FC = () => {
  const { state, setLastViewedDate } = useApp();
  const navigate = useNavigate();
  
  // 전역 상태에서 마지막으로 보고 있던 날짜를 가져옵니다.
  const [value, setValue] = useState(state.lastViewedDate);
  const [activeStartDate, setActiveStartDate] = useState<Date | undefined>(state.lastViewedDate);

  const formatDate = (date: Date) => {
    // 한국 시간대 기준 YYYY-MM-DD 보장
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
    setLastViewedDate(date); // 선택한 날짜를 마지막 확인 날짜로 저장
    const dateStr = formatDate(date);
    navigate(`/list/date/${dateStr}`);
  };

  const goToToday = () => {
    const today = new Date();
    setValue(today);
    setActiveStartDate(today);
    setLastViewedDate(today); // 오늘로 상태 업데이트
  };

  const handleRandomStudy = () => {
    if (state.sentences.length === 0) return;
    const shuffled = [...state.sentences].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    navigate('/study', { state: { sentences: selected, title: '랜덤 10개 학습' } });
  };

  // 사용자가 달력에서 월/년을 변경할 때 호출됨
  const handleActiveStartDateChange = ({ activeStartDate: nextDate }: { activeStartDate: Date | null }) => {
    if (nextDate) {
      setActiveStartDate(nextDate);
      setLastViewedDate(nextDate); // 표시 중인 월을 전역 상태에 저장
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-slate-50">
      <Header title="문장 저장고" showBack={false} />
      
      {state.loading && <LoadingOverlay />}

      {/* 학습 시작 버튼을 상단으로 이동 */}
      <div className="px-5 mt-8 mb-4">
        <button
          onClick={handleRandomStudy}
          disabled={state.sentences.length === 0}
          className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 font-extrabold text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.97] transition-all disabled:opacity-50 disabled:shadow-none border-b-4 border-indigo-800"
        >
          <div className="flex items-center gap-3">
            <Shuffle className="w-6 h-6" />
            <span>랜덤 10개 문장 학습하기</span>
          </div>
        </button>
      </div>

      <div className="px-5 mt-8 relative">
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
        className="fixed bottom-8 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-90 z-40"
      >
        <Plus className="w-9 h-9" />
      </button>
    </div>
  );
};

export default MainView;
