
import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showHome?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = true, showHome = true }) => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-800 truncate max-w-[200px]">{title}</h1>
      </div>
      {showHome && (
        <button onClick={() => navigate('/')} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <Home className="w-6 h-6 text-gray-600" />
        </button>
      )}
    </header>
  );
};

export const LoadingOverlay: React.FC = () => (
  <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[100]">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
  </div>
);

export const EmptyState: React.FC<{ message?: string }> = ({ message = "저장된 문장이 없습니다." }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="bg-gray-100 p-6 rounded-full mb-4">
      <Home className="w-12 h-12 text-gray-400" />
    </div>
    <p className="text-gray-500 font-medium">{message}</p>
  </div>
);
