
import React from 'react';
// Fix: Use namespace import for react-router-dom
import * as ReactRouterDOM from 'react-router-dom';
import { BookOpen, Star, Calendar } from 'lucide-react';
import { Sentence } from '../types';

const { useNavigate } = ReactRouterDOM;

interface StatsDashboardProps {
  sentences: Sentence[];
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ sentences }) => {
  const navigate = useNavigate();
  
  const totalCount = sentences.length;
  const bookmarkCount = sentences.filter(s => s.bookmark).length;
  const uniqueDays = Array.from(new Set(sentences.map(s => s.date))).length;

  const stats = [
    { 
      label: '전체 문장', 
      value: totalCount, 
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      onClick: () => navigate('/list/all/all'),
      color: 'bg-blue-50'
    },
    { 
      label: '북마크', 
      value: bookmarkCount, 
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      onClick: () => navigate('/list/bookmark/true'),
      color: 'bg-yellow-50'
    },
    { 
      label: '학습 일수', 
      value: uniqueDays, 
      icon: <Calendar className="w-5 h-5 text-green-500" />,
      onClick: () => navigate('/list/streak/all'),
      color: 'bg-green-50'
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 px-4 mb-6">
      {stats.map((stat, idx) => (
        <button
          key={idx}
          onClick={stat.onClick}
          className={`${stat.color} p-4 rounded-2xl flex flex-col items-center justify-center transition-transform active:scale-95 shadow-sm border border-white/50`}
        >
          <div className="mb-2 p-2 bg-white rounded-lg shadow-sm">
            {stat.icon}
          </div>
          <span className="text-xs text-gray-500 mb-0.5">{stat.label}</span>
          <span className="text-lg font-bold text-gray-800">{stat.value}</span>
        </button>
      ))}
    </div>
  );
};

export default StatsDashboard;
