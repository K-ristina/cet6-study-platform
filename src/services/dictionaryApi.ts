import { DictionaryEntry } from '../types';

const memoryCache = new Map<string, DictionaryEntry>();

/**
 * Clean and normalize the search word
 */
export function normalizeWord(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z\s-]/g, '');
}

/**
 * Query English-English dictionary definition via Free Dictionary API
 */
export async function lookupEnglishWord(rawWord: string): Promise<DictionaryEntry | null> {
  const word = normalizeWord(rawWord);
  if (!word) return null;

  if (memoryCache.has(word)) {
    return memoryCache.get(word)!;
  }

  try {
    const encoded = encodeURIComponent(word);
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encoded}`);

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error(`Dictionary lookup failed with status: ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const entry: DictionaryEntry = data[0];
      // Normalize audio URLs if needed (e.g. "//ssl..." -> "https://ssl...")
      if (entry.phonetics) {
        entry.phonetics = entry.phonetics.map((p) => ({
          ...p,
          audio: p.audio?.startsWith('//') ? `https:${p.audio}` : p.audio,
        }));
      }
      memoryCache.set(word, entry);
      return entry;
    }
    return null;
  } catch (err) {
    console.error(`Error querying dictionary for "${word}":`, err);
    throw err;
  }
}

/**
 * Play pronunciation audio with automatic Web Speech fallback
 */
export function playWordPronunciation(word: string, audioUrl?: string): Promise<void> {
  return new Promise((resolve) => {
    if (audioUrl && audioUrl.trim()) {
      try {
        const audio = new Audio(audioUrl);
        audio.onended = () => resolve();
        audio.onerror = () => {
          // Fallback to Web Speech API
          fallbackSpeechSynthesis(word, resolve);
        };
        audio.play().catch(() => {
          fallbackSpeechSynthesis(word, resolve);
        });
        return;
      } catch {
        fallbackSpeechSynthesis(word, resolve);
        return;
      }
    }

    fallbackSpeechSynthesis(word, resolve);
  });
}

function fallbackSpeechSynthesis(word: string, onEnd?: () => void) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  } else {
    onEnd?.();
  }
}
