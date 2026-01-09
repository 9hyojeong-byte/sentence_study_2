
import { Sentence } from '../types';

const API_URL = "https://script.google.com/macros/s/AKfycbyEsAWKJ4S4gsPiZPWqnpTqovAn6KR_yXcCnkQ_5UgZEqKR-yQB0w2T3jQkWBaVMiX3/exec";

export const apiService = {
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
      return []; 
    }
  },

  async upsertSentence(sentence: Partial<Sentence>): Promise<any> {
    return this.post({ action: 'upsert', data: sentence });
  },

  async deleteSentence(id: string): Promise<any> {
    return this.post({ action: 'delete', id });
  },

  async toggleBookmark(id: string): Promise<any> {
    return this.post({ action: 'toggleBookmark', id });
  },

  async post(body: any): Promise<any> {
    try {
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
      return { success: true };
    } catch (err) {
      console.error("API POST Error:", err);
      throw err;
    }
  },

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
      }
    ];
  }
};
