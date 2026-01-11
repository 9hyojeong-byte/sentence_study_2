
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppState } from './types';
import { apiService } from './services/apiService';
import { AlertCircle, RefreshCw } from 'lucide-react';

import MainView from './views/MainView';
import ListView from './views/ListView';
import InputView from './views/InputView';
import StudyView from './views/StudyView';

interface AppContextType {
  state: AppState;
  refreshData: () => Promise<void>;
  updateBookmarkOptimistically: (id: string) => void;
  setLastViewedDate: (date: Date) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    sentences: [],
    loading: true,
    error: null,
    lastViewedDate: new Date(),
  });

  const refreshData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiService.fetchSentences();
      setState(prev => ({ ...prev, sentences: data, loading: false, error: null }));
    } catch (err: any) {
      console.error("Data Load Error:", err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message || "데이터를 불러오지 못했습니다." 
      }));
    }
  };

  const updateBookmarkOptimistically = (id: string) => {
    setState(prev => ({
      ...prev,
      sentences: prev.sentences.map(s => s.id === id ? { ...s, bookmark: !s.bookmark } : s)
    }));
    apiService.toggleBookmark(id).catch(err => {
      console.error("Failed to update bookmark on server", err);
    });
  };

  const setLastViewedDate = (date: Date) => {
    setState(prev => ({ ...prev, lastViewedDate: date }));
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">데이터 로드 중...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-red-100 max-w-sm w-full text-center">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">데이터 연결 오류</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {state.error}<br/>
            <span className="block mt-2 text-xs text-slate-400">
              * 배포 설정에서 '액세스 권한'이 '모든 사용자(Anyone)'인지 확인해주세요.
            </span>
          </p>
          <button 
            onClick={() => refreshData()}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, refreshData, updateBookmarkOptimistically, setLastViewedDate }}>
      <HashRouter>
        <div className="min-h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-x-hidden">
          <Routes>
            <Route path="/" element={<MainView />} />
            <Route path="/list/:type/:value" element={<ListView />} />
            <Route path="/input" element={<InputView />} />
            <Route path="/edit/:id" element={<InputView />} />
            <Route path="/study" element={<StudyView />} />
          </Routes>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
