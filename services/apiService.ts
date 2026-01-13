
import { Sentence } from '../types';

/**
 * [주의] GAS 배포 시 발급받은 URL을 여기에 정확히 입력해야 합니다.
 * URL 끝이 반드시 /exec 로 끝나야 합니다.
 */
const API_URL = "https://script.google.com/macros/s/AKfycbyxyp7Sr2z6wmPWbpYd6kLrqjyIHke_fqB2ZjZV7rLmbX8MJU9NKVch3TtZbeaW45dt/exec";

export const apiService = {
  async fetchSentences(): Promise<Sentence[]> {
    try {
      console.log("Fetching from GAS:", API_URL);
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // GAS는 리다이렉트를 수행하므로 최종 응답의 content-type을 체크합니다.
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") === -1) {
        console.error("Received non-JSON response. This usually means the GAS deployment is not set to 'Anyone'.");
        throw new Error("서버에서 올바른 데이터를 보내지 않았습니다. GAS 배포 설정을 확인해주세요.");
      }

      const data = await response.json();
      console.log("Fetched Data:", data);
      
      return Array.isArray(data) ? data : [];
    } catch (err: any) {
      console.error("API 연동 에러:", err);
      // 구체적인 에러 메시지 전달
      if (err.message.includes("Failed to fetch")) {
        throw new Error("네트워크 연결 실패 (CORS 또는 배포 주소 오류)");
      }
      throw err;
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
      // POST는 리다이렉트 이슈로 인해 mode: 'no-cors'를 주로 사용합니다.
      // 이 경우 응답 내용을 읽을 수는 없지만 서버에 데이터는 전달됩니다.
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(body),
      });
      return { success: true };
    } catch (err) {
      console.error("POST 에러:", err);
      throw err;
    }
  }
};
