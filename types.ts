
export interface Sentence {
  id: string;
  date: string; // YYYY-MM-DD
  sentence: string;
  meaning: string;
  hint: string;
  referenceUrl: string;
  bookmark: boolean;
  createdAt: string;
}

export type ViewType = 'all' | 'date' | 'bookmark' | 'streak';

export interface AppState {
  sentences: Sentence[];
  loading: boolean;
  error: string | null;
}
