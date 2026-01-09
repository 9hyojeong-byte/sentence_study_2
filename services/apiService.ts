
import { Sentence } from '../types';

// 사용자가 제공한 실제 구글 앱스 스크립트 Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbyEsAWKJ4S4gsPiZPWqnpTqovAn6KR_yXcCnkQ_5UgZEqKR-yQB0w2T3jQkWBaVMiX3/exec";

export const apiService = {
  /**
   * 전체 문장 데이터를 조회합니다.
   */
  async fetchSentences(): Promise<Sentence[]> {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        redirect: 'follow'
      });
      if (!response.ok) throw new Error("데이터를 불러오는데 실패했습니다.");
      return await response.json();
    } catch (err) {
      console.error("API Fetch Error:", err);
      // 에러 발생 시에만 폴백으로 빈 배열 혹은 예시 데이터를 반환할 수 있습니다.
      return []; 
    }
  },

  /**
   * 문장을 추가하거나 수정(Upsert)합니다.
   */
  async upsertSentence(sentence: Partial<Sentence>): Promise<any> {
    return this.post({ action: 'upsert', data: sentence });
  },

  /**
   * ID를 기준으로 문장을 삭제합니다.
   */
  async deleteSentence(id: string): Promise<any> {
    return this.post({ action: 'delete', id });
  },

  /**
   * 북마크 상태를 반전시킵니다.
   */
  async toggleBookmark(id: string): Promise<any> {
    return this.post({ action: 'toggleBookmark', id });
  },

  /**
   * 구글 앱스 스크립트 POST 통신을 위한 공통 메서드입니다.
   */
  async post(body: any): Promise<any> {
    try {
      // GAS Web App은 보안 정책상 no-cors 모드에서 본문 전송 시 
      // Content-Type을 text/plain으로 설정해야 데이터가 정상적으로 전달됩니다.
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(body),
      });
      // no-cors 모드에서는 응답 본문을 읽을 수 없으나, 요청 성공으로 간주합니다.
      return { success: true };
    } catch (err) {
      console.error("API POST Error:", err);
      throw err;
    }
  },

  /**
   * 개발/테스트용 예시 데이터입니다.
   */
  getMockData(): Sentence[] {
    return [
      {
        id: 'mock-1',
        date: new Date().toISOString().split('T')[0],
        sentence: 'The journey of a thousand miles begins with a single step.',
        meaning: '천 리 길도 한 걸음부터.',
        hint: 'Starts with "The journey"',
        referenceUrl: 'https://example.com',
        bookmark: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'mock-2',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        sentence: 'Practice makes perfect.',
        meaning: '연습이 완벽을 만든다.',
        hint: 'Consistency is key',
        referenceUrl: '',
        bookmark: false,
        createdAt: new Date().toISOString()
      }
    ];
  }
};
