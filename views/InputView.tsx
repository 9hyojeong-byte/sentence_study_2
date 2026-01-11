
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { Header, LoadingOverlay } from '../components/Layout';
import { apiService } from '../services/apiService';
import { Trash2, Save } from 'lucide-react';
import { Sentence } from '../types';

const InputView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state, refreshData } = useApp();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTodayLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<Partial<Sentence>>({
    sentence: '',
    meaning: '',
    hint: '',
    referenceUrl: '',
    date: getTodayLocal(),
    bookmark: false,
  });

  useEffect(() => {
    if (id) {
      const existing = state.sentences.find(s => s.id === id);
      if (existing) {
        const formattedDate = existing.date && typeof existing.date === 'string' 
          ? existing.date.substring(0, 10) 
          : existing.date;
        setFormData({ ...existing, date: formattedDate });
      }
    }
  }, [id, state.sentences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sentence || !formData.meaning) {
      alert("문장과 의미를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.upsertSentence(formData);
      await refreshData();
      navigate(-1);
    } catch (err) {
      alert("저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    setIsSubmitting(true);
    try {
      await apiService.deleteSentence(id);
      await refreshData();
      navigate('/');
    } catch (err) {
      alert("삭제에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-10 min-h-screen">
      <Header title={id ? "문장 수정" : "새 문장 입력"} />
      
      {isSubmitting && <LoadingOverlay />}

      <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">영어 문장</label>
          <textarea
            required
            className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] outline-none transition-all"
            placeholder="영어 문장을 입력하세요"
            value={formData.sentence}
            onChange={e => setFormData({ ...formData, sentence: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">의미 (한국어)</label>
          <input
            required
            type="text"
            className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="의미를 입력하세요"
            value={formData.meaning}
            onChange={e => setFormData({ ...formData, meaning: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">힌트 (선택)</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="학습에 도움이 될 힌트를 적으세요"
            value={formData.hint}
            onChange={e => setFormData({ ...formData, hint: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">참고 URL (선택)</label>
          <input
            type="url"
            className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="https://..."
            value={formData.referenceUrl}
            onChange={e => setFormData({ ...formData, referenceUrl: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">날짜</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        <div className="flex gap-4 pt-6">
          {id && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              삭제
            </button>
          )}
          <button
            type="submit"
            className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <Save className="w-5 h-5" />
            저장하기
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputView;
