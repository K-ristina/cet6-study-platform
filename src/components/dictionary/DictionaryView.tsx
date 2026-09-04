import React, { useState, useEffect, useRef } from 'react';
import {
  BookMarked,
  Search,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Circle,
  Trash2,
  ArrowRight,
  FolderHeart,
  Loader2,
  X,
  Flame,
  Layers,
  GraduationCap
} from 'lucide-react';
import { DictionaryEntry, WordBookItem } from '../../types';
import { lookupEnglishWord, playWordPronunciation, normalizeWord } from '../../services/dictionaryApi';
import { db } from '../../db';

const POPULAR_CET6_WORDS = [
  'comprehensive',
  'sustainable',
  'inevitable',
  'perspective',
  'ambiguous',
  'vulnerable',
  'deteriorate',
  'indispensable',
  'prevalent',
  'substitute',
];

export const DictionaryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'wordbook'>('search');
  const [query, setQuery] = useState<string>('comprehensive');
  const [loading, setLoading] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [isSavedInWordBook, setIsSavedInWordBook] = useState<boolean>(false);

  // Wordbook tab states
  const [wordBookList, setWordBookList] = useState<WordBookItem[]>([]);
  const [wordBookFilter, setWordBookFilter] = useState<'all' | 'unmastered' | 'mastered'>('all');
  const [wordBookSearch, setWordBookSearch] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initial load
  useEffect(() => {
    loadWordBook();
    handleLookup('comprehensive');
  }, []);

  // Check if current word is in wordbook
  useEffect(() => {
    async function checkSaved() {
      if (entry?.word) {
        try {
          const item = await db.wordBook.where('word').equals(entry.word.toLowerCase()).first();
          setIsSavedInWordBook(!!item);
        } catch {
          setIsSavedInWordBook(false);
        }
      } else {
        setIsSavedInWordBook(false);
      }
    }
    checkSaved();
  }, [entry]);

  const loadWordBook = async () => {
    try {
      const items = await db.wordBook.orderBy('addedAt').reverse().toArray();
      setWordBookList(items);
    } catch (e) {
      console.error('Failed to load wordbook:', e);
    }
  };

  const handleLookup = async (targetWord: string) => {
    const word = normalizeWord(targetWord);
    if (!word) return;

    setLoading(true);
    setNotFound(false);
    try {
      const result = await lookupEnglishWord(word);
      if (result) {
        setEntry(result);
        setNotFound(false);
      } else {
        setEntry(null);
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
      setEntry(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleLookup(query.trim());
    }
  };

  const handlePlayAudio = async (url?: string) => {
    if (!entry?.word) return;
    setIsPlayingAudio(true);
    try {
      await playWordPronunciation(entry.word, url);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleToggleWordBook = async () => {
    if (!entry) return;
    const wordKey = entry.word.toLowerCase();

    try {
      const existing = await db.wordBook.where('word').equals(wordKey).first();
      if (existing) {
        await db.wordBook.delete(existing.id);
        setIsSavedInWordBook(false);
      } else {
        const firstDef =
          entry.meanings[0]?.definitions[0]?.definition || 'No definition available';
        const bestAudio = entry.phonetics.find((p) => !!p.audio)?.audio;

        const newItem: WordBookItem = {
          id: `wb_${wordKey}_${Date.now()}`,
          word: entry.word,
          phonetic: entry.phonetic || entry.phonetics.find((p) => !!p.text)?.text || '',
          simpleDef: firstDef,
          fullEntry: entry,
          mastered: false,
          addedAt: Date.now(),
        };
        await db.wordBook.put(newItem);
        setIsSavedInWordBook(true);
      }
      await loadWordBook();
    } catch (err) {
      console.error('Failed to toggle wordbook:', err);
    }
  };

  const handleToggleMastered = async (item: WordBookItem) => {
    try {
      await db.wordBook.update(item.id, { mastered: !item.mastered });
      setWordBookList((prev) =>
        prev.map((w) => (w.id === item.id ? { ...w, mastered: !w.mastered } : w))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await db.wordBook.delete(id);
      setWordBookList((prev) => prev.filter((w) => w.id !== id));
      if (entry && wordBookList.find((w) => w.id === id)?.word.toLowerCase() === entry.word.toLowerCase()) {
        setIsSavedInWordBook(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectWordFromBook = (item: WordBookItem) => {
    setQuery(item.word);
    if (item.fullEntry) {
      setEntry(item.fullEntry);
      setNotFound(false);
      setActiveTab('search');
    } else {
      setActiveTab('search');
      handleLookup(item.word);
    }
  };

  // Best audio and phonetic
  const validAudio = entry?.phonetics.find((p) => !!p.audio)?.audio;
  const bestPhonetic = entry?.phonetic || entry?.phonetics.find((p) => !!p.text)?.text;

  // Filtered wordbook
  const filteredWordBook = wordBookList.filter((item) => {
    const matchSearch =
      wordBookSearch === '' ||
      item.word.toLowerCase().includes(wordBookSearch.toLowerCase()) ||
      item.simpleDef.toLowerCase().includes(wordBookSearch.toLowerCase());
    if (!matchSearch) return false;
    if (wordBookFilter === 'mastered') return item.mastered;
    if (wordBookFilter === 'unmastered') return !item.mastered;
    return true;
  });

  const masteredCount = wordBookList.filter((w) => w.mastered).length;
  const unmasteredCount = wordBookList.length - masteredCount;

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-8 animate-in fade-in duration-300 font-sans">
      
      {/* 1. Header: Starbucks Brand Style Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-[11px] bg-sb-mint border border-sb-mint text-sb-green flex items-center justify-center shadow-sm">
            <BookMarked className="w-5 h-5 text-sb-green" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-sb-green dark:text-sb-mint font-sans">
              英英词典 & 六级生词本
            </h2>
            <p className="text-xs text-sb-text-soft dark:text-slate-400">
              纯正英英释义 · 六级高频同义改写 · 本地生词本强化记忆
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-sb-ceramic dark:bg-white/10 p-1 rounded-full text-xs font-bold self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-1.5 rounded-full transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === 'search'
                ? 'bg-sb-mint text-sb-green font-extrabold shadow-sm border border-sb-mint'
                : 'text-sb-text-soft dark:text-white/80 hover:text-sb-green'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>英英查词</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('wordbook');
              loadWordBook();
            }}
            className={`px-4 py-1.5 rounded-full transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === 'wordbook'
                ? 'bg-sb-mint text-sb-green font-extrabold shadow-sm border border-sb-mint'
                : 'text-sb-text-soft dark:text-white/80 hover:text-sb-green'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span>我的生词本</span>
            {wordBookList.length > 0 && (
              <span className="ml-1 px-2 py-0.2 rounded-full bg-sb-green text-white text-[10px] font-mono">
                {wordBookList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. TAB 1: Search View */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Box Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-black/[0.06] dark:border-white/[0.08] shadow-sb-card space-y-4">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-sb-green absolute left-4 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="输入六级生词查英英释义、同义替换与真人发音 (例如: inevitable, sustainable)..."
                  className="w-full pl-12 pr-10 py-3 bg-sb-cream/40 dark:bg-slate-800/80 border border-sb-mint dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-sb-green dark:text-white placeholder:text-slate-400 transition-all"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3.5 p-1 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-sb-green text-white rounded-xl text-sm font-bold hover:bg-sb-house disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-sm shrink-0 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>查询中...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>查询释义</span>
                  </>
                )}
              </button>
            </form>

            {/* Recommended High-Frequency Words Chips */}
            <div className="flex items-center flex-wrap gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-bold flex items-center mr-1">
                <Sparkles className="w-3.5 h-3.5 text-sb-gold mr-1" />
                六级常考高频词:
              </span>
              {POPULAR_CET6_WORDS.map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    setQuery(w);
                    handleLookup(w);
                  }}
                  className={`px-3 py-1 rounded-lg border font-mono transition-all text-xs ${
                    entry?.word.toLowerCase() === w
                      ? 'bg-sb-mint text-sb-green font-bold border-sb-mint'
                      : 'bg-sb-cream/60 dark:bg-slate-800 text-sb-text dark:text-slate-300 border-black/5 dark:border-white/5 hover:border-sb-mint hover:text-sb-green'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Results Area */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
              <Loader2 className="w-8 h-8 text-sb-green animate-spin" />
              <p className="text-sm font-medium">正在检索英英词典库与同义词库...</p>
            </div>
          )}

          {notFound && !loading && (
            <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8">
              <div className="w-12 h-12 rounded-full bg-sb-mint/40 text-sb-green flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-sb-house dark:text-white">未找到对应单词</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                请检查单词拼写（建议尝试动词原形或名词单数，如 <code className="text-sb-green font-mono">comprehensive</code>）。
              </p>
            </div>
          )}

          {entry && !loading && (
            <div className="space-y-6">
              {/* Word Summary Banner */}
              <div className="bg-gradient-to-r from-sb-mint/40 via-white to-sb-cream/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-6 rounded-2xl border border-sb-mint/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                    <h1 className="text-3xl sm:text-4xl font-black text-sb-house dark:text-white tracking-tight">
                      {entry.word}
                    </h1>
                    {bestPhonetic && (
                      <span className="text-base font-mono text-sb-accent dark:text-sb-mint font-bold px-2.5 py-0.5 rounded-lg bg-sb-mint/40 dark:bg-white/10">
                        {bestPhonetic}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center space-x-2">
                    <button
                      onClick={() => handlePlayAudio(validAudio)}
                      disabled={isPlayingAudio}
                      className="px-3.5 py-1.5 rounded-full bg-sb-mint text-sb-green hover:bg-sb-green hover:text-white transition-all text-xs font-bold flex items-center space-x-2 shadow-sm active:scale-95"
                      title="点击发音"
                    >
                      <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                      <span>{validAudio ? '真人发音' : '智能发音'}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleToggleWordBook}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all shadow-sm active:scale-95 self-start sm:self-auto ${
                    isSavedInWordBook
                      ? 'bg-sb-green text-white border border-sb-green shadow-sb-green/20'
                      : 'bg-white dark:bg-slate-800 text-sb-green border border-sb-mint hover:bg-sb-mint/40'
                  }`}
                >
                  {isSavedInWordBook ? (
                    <>
                      <BookmarkCheck className="w-4 h-4" />
                      <span>已加入生词本</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>加入生词本</span>
                    </>
                  )}
                </button>
              </div>

              {/* Meanings & Definitions Grid */}
              <div className="grid grid-cols-1 gap-5">
                {entry.meanings.map((meaning, mIdx) => (
                  <div
                    key={mIdx}
                    className="bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-sb-card"
                  >
                    {/* Part of speech badge */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-sb-mint text-sb-green border border-sb-mint/80 font-sans">
                        {meaning.partOfSpeech}
                      </span>
                    </div>

                    {/* Definitions */}
                    <ol className="space-y-4 pt-1">
                      {meaning.definitions.map((def, dIdx) => (
                        <li key={dIdx} className="text-sm space-y-2">
                          <div className="flex items-start space-x-3">
                            <span className="font-mono text-xs font-bold text-sb-green bg-sb-mint/40 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                              {dIdx + 1}
                            </span>
                            <p className="text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                              {def.definition}
                            </p>
                          </div>

                          {/* Example */}
                          {def.example && (
                            <div className="ml-8 pl-3.5 border-l-2 border-sb-mint/90 py-1 bg-sb-cream/30 dark:bg-slate-800/40 rounded-r-lg pr-3">
                              <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                "{def.example}"
                              </p>
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>

                    {/* Six-level Synonyms Section (Crucial for CET-6) */}
                    {((meaning.synonyms && meaning.synonyms.length > 0) ||
                      meaning.definitions.some((d) => d.synonyms && d.synonyms.length > 0)) && (
                      <div className="pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
                        <div className="flex items-center space-x-2 mb-2">
                          <Sparkles className="w-4 h-4 text-sb-gold" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            六级常考同义改写 (Synonyms / Paraphrase):
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {Array.from(
                            new Set([
                              ...(meaning.synonyms || []),
                              ...meaning.definitions.flatMap((d) => d.synonyms || []),
                            ])
                          )
                            .slice(0, 10)
                            .map((syn) => (
                              <button
                                key={syn}
                                onClick={() => {
                                  setQuery(syn);
                                  handleLookup(syn);
                                }}
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sb-cream dark:bg-slate-800 text-sb-text dark:text-slate-200 border border-black/5 dark:border-white/5 hover:border-sb-green hover:text-sb-green hover:bg-sb-mint/20 transition flex items-center space-x-1"
                                title="点击查询此同义词"
                              >
                                <span>{syn}</span>
                                <ArrowRight className="w-3 h-3 opacity-40" />
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB 2: WordBook View */}
      {activeTab === 'wordbook' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sb-mint text-sb-green flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">总收录生词</div>
                  <div className="text-xl font-black text-sb-house dark:text-white font-mono">
                    {wordBookList.length} 词
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">待强化复习</div>
                  <div className="text-xl font-black text-amber-600 font-mono">
                    {unmasteredCount} 词
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">已牢记掌握</div>
                  <div className="text-xl font-black text-emerald-600 font-mono">
                    {masteredCount} 词
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
            <div className="flex items-center space-x-1 bg-sb-ceramic dark:bg-white/10 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
              <button
                onClick={() => setWordBookFilter('all')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition ${
                  wordBookFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-sb-green shadow-sm'
                    : 'text-slate-500 hover:text-sb-green'
                }`}
              >
                全部 ({wordBookList.length})
              </button>
              <button
                onClick={() => setWordBookFilter('unmastered')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition ${
                  wordBookFilter === 'unmastered'
                    ? 'bg-white dark:bg-slate-800 text-sb-green shadow-sm'
                    : 'text-slate-500 hover:text-sb-green'
                }`}
              >
                待复习 ({unmasteredCount})
              </button>
              <button
                onClick={() => setWordBookFilter('mastered')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition ${
                  wordBookFilter === 'mastered'
                    ? 'bg-white dark:bg-slate-800 text-sb-green shadow-sm'
                    : 'text-slate-500 hover:text-sb-green'
                }`}
              >
                已掌握 ({masteredCount})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={wordBookSearch}
                onChange={(e) => setWordBookSearch(e.target.value)}
                placeholder="在生词本中过滤单词或释义..."
                className="w-full pl-9 pr-3 py-1.5 bg-sb-cream/40 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-sb-green dark:text-white"
              />
            </div>
          </div>

          {/* Word Cards Grid */}
          {filteredWordBook.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-slate-400">
              <FolderHeart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">生词本中暂无符合条件的单词</p>
              <p className="text-xs text-slate-400">
                切换至「英英查词」页，查词后点击右上角「加入生词本」即可收录。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWordBook.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectWordFromBook(item)}
                  className="group bg-white dark:bg-slate-900 hover:border-sb-green/60 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between space-y-3 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMastered(item);
                        }}
                        className="text-slate-400 hover:text-sb-green transition shrink-0"
                        title={item.mastered ? '标记为待复习' : '标记为已掌握'}
                      >
                        {item.mastered ? (
                          <CheckCircle2 className="w-5 h-5 text-sb-green fill-sb-green/20" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-sb-green" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-black text-base ${
                              item.mastered
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-sb-house dark:text-white'
                            }`}
                          >
                            {item.word}
                          </span>
                          {item.phonetic && (
                            <span className="text-xs font-mono text-slate-400">
                              {item.phonetic}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteWord(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                      title="移出生词本"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {item.simpleDef}
                  </p>

                  <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] font-mono">
                      收录于 {new Date(item.addedAt).toLocaleDateString()}
                    </span>
                    <span className="text-sb-green font-bold flex items-center group-hover:translate-x-1 transition-transform">
                      <span>查阅英英详释</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
