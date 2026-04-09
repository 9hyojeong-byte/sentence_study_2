
import { openDB, IDBPDatabase } from 'idb';
import { GoogleGenAI, Modality } from "@google/genai";

const DB_NAME = 'tts-cache-db';
const STORE_NAME = 'audio-cache';
const DB_VERSION = 1;

interface TTSCache {
  text: string;
  audioData: string; // Base64 string
  timestamp: number;
}

class TTSService {
  private db: Promise<IDBPDatabase>;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.db = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'text' });
        }
      },
    });
  }

  private getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return this.audioCtx;
  }

  async getCachedAudio(text: string): Promise<string | null> {
    const db = await this.db;
    const entry = await db.get(STORE_NAME, text.trim());
    return entry ? entry.audioData : null;
  }

  async saveToCache(text: string, audioData: string) {
    const db = await this.db;
    await db.put(STORE_NAME, {
      text: text.trim(),
      audioData,
      timestamp: Date.now(),
    });
  }

  async generateAudio(text: string): Promise<string> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Gemini API Key is missing");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say naturally and clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Failed to generate audio from Gemini");

    return base64Audio;
  }

  async playAudio(text: string): Promise<void> {
    let base64Audio = await this.getCachedAudio(text);
    
    if (!base64Audio) {
      console.log("Cache miss for:", text);
      base64Audio = await this.generateAudio(text);
      await this.saveToCache(text, base64Audio);
    } else {
      console.log("Cache hit for:", text);
    }

    const ctx = this.getAudioContext();
    const decoded = this.decodeBase64(base64Audio);
    const audioBuffer = await this.decodeAudioData(decoded, ctx, 24000, 1);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    return new Promise((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  }

  // Helper to pre-cache audio without playing
  async precache(text: string): Promise<void> {
    const cached = await this.getCachedAudio(text);
    if (!cached) {
      const audioData = await this.generateAudio(text);
      await this.saveToCache(text, audioData);
    }
  }

  private decodeBase64(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

export const ttsService = new TTSService();
