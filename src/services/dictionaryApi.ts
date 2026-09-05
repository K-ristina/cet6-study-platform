import { DictionaryEntry, WordMeaning, WordDefinition } from '../types';
import { CET6_CORE_DICTIONARY } from '../data/cet6Dictionary';

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
 * Tag to part of speech mapping for Datamuse definitions
 */
const POS_MAP: Record<string, string> = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  prep: 'preposition',
  pron: 'pronoun',
  conj: 'conjunction',
  interj: 'interjection',
};

/**
 * Fetch with a strict timeout using AbortController
 */
async function fetchWithTimeout(url: string, timeoutMs = 2500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parse Collins Cobuild dictionary data from Youdao API response
 */
function parseCollinsFromYoudao(data: any, word: string): DictionaryEntry | null {
  const collins = data?.collins;
  if (!collins?.collins_entries || collins.collins_entries.length === 0) {
    return null;
  }

  const mainEntry = collins.collins_entries[0];
  const headword = mainEntry.headword || word;
  const phonetic = mainEntry.phonetic ? `/${mainEntry.phonetic}/` : undefined;
  const star = typeof mainEntry.star === 'string' ? parseInt(mainEntry.star, 10) : Number(mainEntry.star || 0);

  const rawEntries = mainEntry.entries?.entry || [];
  if (rawEntries.length === 0) return null;

  const meaningsMap = new Map<string, WordMeaning>();

  for (const item of rawEntries) {
    const tranEntry = item.tran_entry?.[0];
    if (!tranEntry) continue;

    const rawPos = tranEntry.pos_entry?.pos || 'OTHER';
    const posTips = tranEntry.pos_entry?.pos_tips || '';
    const rawTran = tranEntry.tran || '';
    if (!rawTran) continue;

    const cleanTran = rawTran.replace(/<[^>]*>/g, '').trim();

    // Extract Collins authentic example sentences
    const sents = tranEntry.exam_sents?.sent || [];
    const firstSent = sents[0];
    const example = firstSent?.eng_sent?.replace(/<[^>]*>/g, '').trim() || undefined;
    const exampleTranslation = firstSent?.chn_sent?.replace(/<[^>]*>/g, '').trim() || undefined;

    let partOfSpeech = rawPos.toUpperCase();
    if (rawPos.startsWith('V')) partOfSpeech = 'VERB';
    else if (rawPos.startsWith('N')) partOfSpeech = 'NOUN';
    else if (rawPos.startsWith('ADJ')) partOfSpeech = 'ADJECTIVE';
    else if (rawPos.startsWith('ADV')) partOfSpeech = 'ADVERB';
    else if (rawPos.startsWith('PREP')) partOfSpeech = 'PREPOSITION';
    else if (rawPos.startsWith('PRON')) partOfSpeech = 'PRONOUN';
    else if (rawPos.startsWith('CONJ')) partOfSpeech = 'CONJUNCTION';

    if (!meaningsMap.has(partOfSpeech)) {
      meaningsMap.set(partOfSpeech, {
        partOfSpeech,
        partOfSpeechTips: posTips,
        definitions: [],
        synonyms: [],
      });
    }

    meaningsMap.get(partOfSpeech)!.definitions.push({
      definition: cleanTran,
      example,
      exampleTranslation,
    });
  }

  const meanings = Array.from(meaningsMap.values());
  if (meanings.length === 0) return null;

  // Synonyms from syno
  const synList: string[] = [];
  if (data.syno?.synos) {
    for (const s of data.syno.synos) {
      if (s.syno?.ws) {
        for (const w of s.syno.ws) {
          if (w.w) synList.push(w.w);
        }
      }
    }
  }

  if (synList.length > 0 && meanings[0]) {
    meanings[0].synonyms = Array.from(new Set(synList)).slice(0, 8);
  }

  return {
    word: headword,
    phonetic,
    phonetics: [
      {
        text: phonetic,
        audio: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`,
      },
    ],
    meanings,
    sourceName: 'Collins 柯林斯高阶英英双解词典',
    stars: !isNaN(star) && star > 0 ? star : undefined,
    sourceUrls: [`https://www.collinsdictionary.com/zh/dictionary/english/${encodeURIComponent(word)}`],
  };
}

/**
 * Query English-English dictionary definition with multi-tier fallback:
 * Tier 1: In-memory session cache
 * Tier 2: Collins Cobuild Dictionary (via local Vite proxy /api/dict/jsonapi)
 *         - Full sentence Collins definitions
 *         - Authentic Collins example sentences with Chinese translations
 *         - Frequency star ratings
 * Tier 3: Built-in CET-6 core offline dictionary (0ms, 100% reliable)
 * Tier 4: Datamuse API (fast, CORS-friendly, global CDN) + NetEase Audio
 * Tier 5: Free Dictionary API (with strict 2s timeout)
 */
export async function lookupEnglishWord(rawWord: string): Promise<DictionaryEntry | null> {
  const word = normalizeWord(rawWord);
  if (!word) return null;

  // 1. Tier 1: Check memory cache
  if (memoryCache.has(word)) {
    return memoryCache.get(word)!;
  }

  const encoded = encodeURIComponent(word);

  // 2. Tier 2: Collins Cobuild Dictionary via local proxy
  try {
    const res = await fetchWithTimeout(`/api/dict/jsonapi?q=${encoded}`, 3000);
    if (res.ok) {
      const data = await res.json();
      const collinsEntry = parseCollinsFromYoudao(data, word);
      if (collinsEntry) {
        memoryCache.set(word, collinsEntry);
        return collinsEntry;
      }
    }
  } catch (err) {
    console.warn(`Collins lookup via local proxy skipped for "${word}":`, err);
  }

  // 3. Tier 3: Check offline built-in CET-6 dictionary
  if (CET6_CORE_DICTIONARY[word]) {
    const localEntry = JSON.parse(JSON.stringify(CET6_CORE_DICTIONARY[word])) as DictionaryEntry;
    localEntry.sourceName = '六级真题核心词典';
    memoryCache.set(word, localEntry);
    return localEntry;
  }

  // 4. Tier 4: Datamuse API (CORS enabled, fast response)
  try {
    const [wordRes, synRes] = await Promise.all([
      fetchWithTimeout(`https://api.datamuse.com/words?sp=${encoded}&md=dpr&max=1`, 2500)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetchWithTimeout(`https://api.datamuse.com/words?rel_syn=${encoded}&max=8`, 1800)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ]);

    if (Array.isArray(wordRes) && wordRes.length > 0 && Array.isArray(wordRes[0].defs) && wordRes[0].defs.length > 0) {
      const item = wordRes[0];
      const meaningsMap = new Map<string, WordDefinition[]>();
      const synonymsList: string[] = Array.isArray(synRes)
        ? synRes.map((s: { word?: string }) => s.word || '').filter(Boolean)
        : [];

      for (const rawDef of item.defs as string[]) {
        const parts = rawDef.split('\t');
        const rawTag = parts[0]?.trim() || '';
        const defText = parts[1]?.trim() || '';
        if (!defText) continue;

        const pos = POS_MAP[rawTag] || rawTag || 'definition';
        if (!meaningsMap.has(pos)) {
          meaningsMap.set(pos, []);
        }
        meaningsMap.get(pos)!.push({
          definition: defText,
          synonyms: [],
        });
      }

      if (meaningsMap.size > 0) {
        const meanings: WordMeaning[] = [];
        let isFirst = true;

        for (const [pos, defs] of meaningsMap.entries()) {
          meanings.push({
            partOfSpeech: pos,
            definitions: defs.slice(0, 5),
            synonyms: isFirst ? synonymsList : [],
          });
          isFirst = false;
        }

        const entry: DictionaryEntry = {
          word: item.word || word,
          phonetic: '',
          phonetics: [
            {
              text: '',
              audio: `https://dict.youdao.com/dictvoice?audio=${encoded}&type=2`,
            },
          ],
          meanings,
          sourceUrls: ['https://www.datamuse.com/api/'],
        };

        memoryCache.set(word, entry);
        return entry;
      }
    }
  } catch (err) {
    console.warn(`Datamuse lookup skipped for "${word}":`, err);
  }

  // 5. Tier 5: Free Dictionary API with strict 2000ms timeout
  try {
    const res = await fetchWithTimeout(`https://api.dictionaryapi.dev/api/v2/entries/en/${encoded}`, 2000);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry: DictionaryEntry = data[0];
        if (entry.phonetics && entry.phonetics.length > 0) {
          entry.phonetics = entry.phonetics.map((p) => ({
            ...p,
            audio: p.audio?.startsWith('//') ? `https:${p.audio}` : (p.audio || `https://dict.youdao.com/dictvoice?audio=${encoded}&type=2`),
          }));
        } else {
          entry.phonetics = [
            {
              audio: `https://dict.youdao.com/dictvoice?audio=${encoded}&type=2`,
            },
          ];
        }
        memoryCache.set(word, entry);
        return entry;
      }
    }
  } catch (err) {
    console.warn(`DictionaryAPI lookup failed/timed out for "${word}":`, err);
  }

  return null;
}

/**
 * Play pronunciation audio with high reliability:
 * 1. Try provided audio URL (NetEase Youdao high-speed CDN or original audio)
 * 2. If it fails or is absent, try NetEase Youdao direct audio endpoint
 * 3. Gracefully fallback to Web Speech API (speechSynthesis)
 */
export function playWordPronunciation(word: string, audioUrl?: string): Promise<void> {
  return new Promise((resolve) => {
    const primaryUrl = audioUrl && audioUrl.trim()
      ? audioUrl
      : `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`;

    try {
      const audio = new Audio(primaryUrl);
      let settled = false;

      const finish = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };

      audio.onended = finish;
      audio.onerror = () => {
        fallbackSpeechSynthesis(word, finish);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          fallbackSpeechSynthesis(word, finish);
        });
      }

      // Safety timeout: in case audio neither ends nor errors in 3 seconds
      setTimeout(finish, 3000);
    } catch {
      fallbackSpeechSynthesis(word, resolve);
    }
  });
}

function fallbackSpeechSynthesis(word: string, onEnd?: () => void) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();
      window.speechSynthesis.speak(utterance);
      return;
    } catch {
      onEnd?.();
    }
  } else {
    onEnd?.();
  }
}
