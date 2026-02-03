
import React, { useState, useEffect } from 'react';
// Fix: Use namespace import for react-router-dom
import * as ReactRouterDOM from 'react-router-dom';
import { useApp } from '../App';
import { Header, LoadingOverlay } from '../components/Layout';
import { apiService } from '../services/apiService';
import { Trash2, Save, Sparkles, Lock, X, AlertTriangle, Languages } from 'lucide-react';
import { Sentence } from '../types';
// Import Gemini API
import { GoogleGenAI } from "@google/genai";

const { useParams, useNavigate, useLocation } = ReactRouterDOM;

const InputView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state, refreshData } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // 비밀번호 관련 상태
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState<'save' | 'delete' | null>(null);

  const getTodayLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ListView 등에서 전달받은 기본 날짜 확인
  const passedDefaultDate = (location.state as any)?.defaultDate;

  const [formData, setFormData] = useState<Partial<Sentence>>({
    sentence: '',
    meaning: '',
    hint: '',
    referenceUrl: '',
    date: passedDefaultDate || getTodayLocal(),
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

  // AI 추천 문장 생성
  const handleAIGenerate = async () => {
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: '일상생활에서 자주 쓰이는 유용한 영어 학습용 문장 한 개를 골라줘. 문장은 English, 의미는 Korean으로 작성해줘. JSON 형식으로만 응답해줘: { "sentence": "...", "meaning": "...", "hint": "..." }',
        config: { 
          responseMimeType: "application/json"
        }
      });
      
      const text = response.text;
      if (text) {
        const data = JSON.parse(text.trim());
        setFormData(prev => ({
          ...prev,
          sentence: data.sentence || '',
          meaning: data.meaning || '',
          hint: data.hint || ''
        }));
      }
    } catch (err) {
      console.error("AI Generation Error:", err);
      alert("AI 추천 문장을 가져오는데 실패했습니다.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 영어 문장 자동 번역 기능
  const handleTranslate = async () => {
    if (!formData.sentence || formData.sentence.trim() === '') return;
    
    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `다음 영어 문장을 자연스러운 한국어로 번역해줘. 오직 번역된 결과만 텍스트로 반환해줘: "${formData.sentence}"`,
      });
      
      const translatedText = response.text;
      if (translatedText) {
        setFormData(prev => ({
          ...prev,
          meaning: translatedText.trim()
        }));
      }
    } catch (err) {
      console.error("Translation Error:", err);
      alert("번역에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsTranslating(false);
    }
  };

  // 폼 제출(저장) 버튼 클릭 시
  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sentence || !formData.meaning) {
      alert("문장과 의미를 입력해주세요.");
      return;
    }
    setPendingAction('save');
    setPasswordInput('');
    setShowPasswordModal(true);
  };

  // 삭제 버튼 클릭 시
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!id) return;
    setPendingAction('delete');
    setPasswordInput('');
    setShowPasswordModal(true);
  };

  // 실제 동작 실행 (비밀번호 확인 후 실행)
  const handlePasswordConfirm = async () => {
    if (passwordInput !== '1129') {
      alert("비밀번호가 틀렸습니다.");
      setPasswordInput('');
      return;
    }

    setShowPasswordModal(false);
    setIsSubmitting(true);
    
    try {
      if (pendingAction === 'save') {
        await apiService.upsertSentence(formData);
        await refreshData();
        navigate(-1);
      } else if (pendingAction === 'delete' && id) {
        await apiService.deleteSentence(id);
        await refreshData();
        navigate('/');
      }
    } catch (err) {
      console.error("Action Error:", err);
      alert(pendingAction === 'save' ? "저장에 실패했습니다." : "삭제에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="pb-10 min-h-screen">
      <Header title={id ? "문장 수정" : "새 문장 입력"} />
      
      {(isSubmitting || isGeneratingAI || isTranslating) && <LoadingOverlay />}

      <form onSubmit={handleSubmitClick} className="px-6 py-8 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-gray-700">영어 문장</label>
            {!id && (
              <button
                type="button"
                onClick={handleAIGenerate}
                className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI 추천 문장
              </button>
            )}
          </div>
          <textarea
            required
            className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] outline-none transition-all"
            placeholder="영어 문장을 입력하세요"
            value={formData.sentence}
            onChange={e => setFormData({ ...formData, sentence: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-gray-700">의미 (한국어)</label>
            <button
              type="button"
              onClick={handleTranslate}
              disabled={!formData.sentence || isTranslating}
              className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Languages className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
              {isTranslating ? '번역 중...' : '자동 번역'}
            </button>
          </div>
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
              onClick={handleDeleteClick}
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

      {/* 비밀번호 입력 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className={`${pendingAction === 'delete' ? 'bg-red-50' : 'bg-indigo-50'} p-2.5 rounded-xl`}>
                  {pendingAction === 'delete' ? (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  ) : (
                    <Lock className="w-6 h-6 text-indigo-600" />
                  )}
                </div>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">
                {pendingAction === 'delete' ? '정말 삭제할까요?' : '비밀번호 확인'}
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                {pendingAction === 'delete' ? '삭제를 진행하려면 비밀번호를 입력하세요.' : '데이터를 저장하려면 비밀번호를 입력하세요.'}
              </p>
              
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                className={`w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-4 text-center text-2xl font-black tracking-[0.5em] outline-none transition-all mb-6 ${pendingAction === 'delete' ? 'focus:border-red-500' : 'focus:border-indigo-500'}`}
                placeholder="****"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePasswordConfirm();
                }}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handlePasswordConfirm}
                  className={`flex-1 py-4 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all ${pendingAction === 'delete' ? 'bg-red-600 shadow-red-100 hover:bg-red-700' : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'}`}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputView;
