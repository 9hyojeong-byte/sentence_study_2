
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Sentence, AppState } from './types.ts';
import { apiService } from './services/apiService.ts';

import MainView from './views/MainView.tsx';
import ListView from './views/ListView.tsx';
import InputView from './views/InputView.tsx';
import StudyView from './views/StudyView.tsx';

interface AppContextType {
  state: AppState;
  refreshData: () => Promise<void>;
  updateBookmarkOptimistically: (id: string) => void;
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
  });

  const refreshData = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const data = await apiService.fetchSentences();
      setState({ sentences: data, loading: false, error: null });
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: "Failed to load data" }));
    }
  };

  const updateBookmarkOptimistically = (id: string) => {
    setState(prev => ({
      ...prev,
      sentences: prev.sentences.map(s => s.id === id ? { ...s, bookmark: !s.bookmark } : s)
    }));
    apiService.toggleBookmark(id).catch(() => {
      console.error("Failed to update bookmark on server");
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <AppContext.Provider value={{ state, refreshData, updateBookmarkOptimistically }}>
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
