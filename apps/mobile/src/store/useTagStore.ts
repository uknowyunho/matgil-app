import { create } from 'zustand';
import { getItem, setItem } from '../utils/storage';

const STORAGE_KEY = 'expense.tags';
const DEFAULT_TAGS = ['김치찌개', '된장찌개', '제육볶음', '김밥', '라멘'];

function loadTags(): string[] {
  const raw = getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_TAGS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_TAGS;
  } catch {
    return DEFAULT_TAGS;
  }
}

interface TagState {
  tags: string[];
  addTag: (name: string) => void;
  removeTag: (name: string) => void;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: loadTags(),

  addTag: (name) => {
    const trimmed = name.trim();
    if (!trimmed || get().tags.includes(trimmed)) return;
    const next = [...get().tags, trimmed];
    setItem(STORAGE_KEY, JSON.stringify(next));
    set({ tags: next });
  },

  removeTag: (name) => {
    const next = get().tags.filter((t) => t !== name);
    setItem(STORAGE_KEY, JSON.stringify(next));
    set({ tags: next });
  },
}));
