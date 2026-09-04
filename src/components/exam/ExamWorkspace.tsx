import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  FileText, 
  BookOpenCheck, 
  BookOpen,
  ExternalLink, 
  RotateCcw, 
  ListOrdered,
  Send,
  Lightbulb,
  ArrowRight,
  PenTool,
  Languages,
  Headphones,
  Layers,
  Search,
  FileCheck
} from 'lucide-react';
import { ExamPaper, ExamSection, QuestionItem } from '../../types';
import { DEFAULT_PAPERS } from '../../data/defaultPapers';
import { AudioPlayer } from './AudioPlayer';
import { triggerConfetti } from '../../utils/confetti';
import { db } from '../../db';
import { getAssetUrl } from '../../utils/assets';

interface ExamWorkspaceProps {
  initialPaperId?: string;
  initialSectionId?: string;
  initialAudioTime?: number;
  onJumpToTab?: (tab: any) => void;
}

type FlatQuestion = {
  section: ExamSection;
  q: QuestionItem;
  globalIndex: number;
  label: string;
};

export const ExamWorkspace: React.FC<ExamWorkspaceProps> = ({ initialPaperId = 'cet6_2026_06_set1' }) => {
  const [selectedPaperId, setSelectedPaperId] = useState<string>(initialPaperId);
  const currentPaper: ExamPaper = DEFAULT_PAPERS.find((p) => p.id === selectedPaperId) || DEFAULT_PAPERS[0];
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [showOverview, setShowOverview] = useState<boolean>(false);
  const [pdfViewMode, setPdfViewMode] = useState<'question' | 'answer'>('question');
  const [startTime] = useState<number>(Date.now());
  
  const flatQuestions = useMemo(() => {
    const flats: FlatQuestion[] = [];
    let idx = 0;
    currentPaper.sections.forEach(sec => {
      sec.questions.forEach(q => {
        let label = '第 ' + q.number + ' 题';
        if (sec.type === 'writing') label = '短文写作';
        if (sec.type === 'translation') label = '汉译英翻译';
        flats.push({ section: sec, q: q, globalIndex: idx++, label });
      });
    });
    return flats;
  }, [currentPaper]);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const activeItem = flatQuestions[currentQIndex];

  const groupedQuestions = useMemo(() => {
    const groups: Record<string, FlatQuestion[]> = {};
    flatQuestions.forEach(fq => {
      let groupName = '其他';
      if (fq.section.type === 'writing') groupName = 'Part I: 写作 (Writing)';
      else if (fq.section.type === 'listening') groupName = 'Part II: 听力 (Listening 1-25题)';
      else if (fq.section.type.includes('reading')) groupName = 'Part III: 阅读 (Reading 26-55题)';
      else if (fq.section.type === 'translation') groupName = 'Part IV: 翻译 (Translation)';
      
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(fq);
    });
    return groups;
  }, [flatQuestions]);

  const answeredCount = Object.keys(userAnswers).filter(k => !!userAnswers[k]?.trim()).length;

  const handleAnswerChange = (val: string) => {
    setUserAnswers(prev => ({ ...prev, [activeItem.q.id]: val }));
    if (autoAdvance && !isReviewMode && currentQIndex < flatQuestions.length - 1) {
      if (activeItem.section.type !== 'writing' && activeItem.section.type !== 'translation') {
        setTimeout(() => setCurrentQIndex(prev => prev + 1), 300);
      }
    }
  };

  const handlePrev = () => setCurrentQIndex(p => Math.max(0, p - 1));
  const handleNext = () => setCurrentQIndex(p => Math.min(flatQuestions.length - 1, p + 1));

  const handleSubmit = async () => {
    if (window.confirm('确定要完成作答并核对官方答案与详解吗？')) {
      setIsReviewMode(true);
      setPdfViewMode('answer'); // Automatically switch left PDF to official answer booklet
      setShowOverview(false);
      triggerConfetti();

      // Save exam record to IndexedDB
      try {
        await db.examRecords.put({
          id: `rec_${currentPaper.id}_${Date.now()}`,
          paperId: currentPaper.id,
          startedAt: startTime,
          finishedAt: Date.now(),
          durationSeconds: Math.round((Date.now() - startTime) / 1000),
          userAnswers: userAnswers,
          rawScores: { listening: 0, reading: 0, writingAndTranslation: 0, total: 0 },
          cet6Scores: { listening: 0, reading: 0, writingAndTranslation: 0, total: 0 },
          accuracyRate: 1,
        });
      } catch (err) {
        console.error('Failed to save exam record', err);
      }
    }
  };

  const answerPdfUrl = currentPaper.answerPdfUrl || getAssetUrl(`/answers/${currentPaper.id}_ans.pdf`);
  const questionPdfUrl = getAssetUrl(`/pdfs/${currentPaper.id}.pdf`);
  const activePdfUrl = pdfViewMode === 'question' ? questionPdfUrl : answerPdfUrl;

  return (
    <div className="flex h-full w-full overflow-hidden bg-sb-cream dark:bg-slate-950 font-sans">
      
      {/* Left Area: Dual PDF Viewer with Top Mode Switcher */}
      <div className="flex-1 h-full flex flex-col bg-slate-300 dark:bg-slate-900 relative">
        {/* PDF Top Bar: Switcher between Question Paper and Official Answer Booklet */}
        <div className="h-12 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-black/[0.08] dark:border-white/[0.08] px-4 flex items-center justify-between z-10 shadow-sm flex-none">
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-sb-ceramic dark:bg-white/10 p-0.5 rounded-full text-xs font-bold">
              <button
                onClick={() => setPdfViewMode('question')}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-200 active:scale-[0.96] flex items-center space-x-1.5 ${
                  pdfViewMode === 'question'
                    ? 'bg-sb-mint text-sb-green shadow-sm font-bold border border-sb-mint'
                    : 'text-sb-text-soft dark:text-white/70 hover:text-sb-green'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>试卷原题</span>
              </button>

              <button
                onClick={() => setPdfViewMode('answer')}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-200 active:scale-[0.96] flex items-center space-x-1.5 ${
                  pdfViewMode === 'answer'
                    ? 'bg-sb-mint text-sb-green shadow-sm font-bold border border-sb-mint'
                    : 'text-sb-text-soft dark:text-white/70 hover:text-sb-green'
                }`}
              >
                <BookOpenCheck className="w-3.5 h-3.5" />
                <span>官方答案与详解</span>
              </button>
            </div>

            {isReviewMode && (
              <span className="hidden sm:inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sb-mint text-sb-green border border-sb-mint/60">
                核对模式
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-sb-text-soft dark:text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
              {pdfViewMode === 'question' ? currentPaper.title : `${currentPaper.title} · 答案与解析`}
            </span>
            <a
              href={activePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="在新标签页全屏打开此文档"
              className="p-1.5 rounded-full text-sb-text-soft hover:text-sb-green hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* PDF Frame */}
        <div className="flex-1 w-full h-full relative">
          <iframe 
            src={activePdfUrl} 
            className="w-full h-full border-none" 
            title="PDF Document Viewer" 
          />
        </div>
      </div>

      {/* Right Area: Student Answer Sheet */}
      <div className="w-64 lg:w-72 h-full bg-white dark:bg-slate-900 border-l border-black/10 dark:border-white/10 flex flex-col shadow-2xl z-10 shrink-0">
        
        {/* Paper Selector */}
        <div className="p-3 border-b border-sb-mint/60 dark:border-white/10 bg-gradient-to-r from-sb-mint via-[#ddf0e8] to-[#eaf6f0] dark:bg-slate-900 text-sb-house dark:text-white flex-none">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-[11px] font-bold text-sb-house/80 dark:text-white/80 uppercase tracking-wider">真题试卷库</h2>
            <span className="text-[10px] font-mono text-sb-green dark:text-sb-mint font-bold">{currentPaper.badge}</span>
          </div>
          <select
            value={selectedPaperId}
            onChange={(e) => {
              setSelectedPaperId(e.target.value);
              setCurrentQIndex(0);
              setUserAnswers({});
              setIsReviewMode(false);
              setShowOverview(false);
              setPdfViewMode('question');
            }}
            className="w-full text-xs font-bold bg-white/90 dark:bg-slate-800 border border-sb-mint/80 dark:border-white/20 rounded-lg px-2.5 py-1.5 text-sb-house dark:text-white focus:outline-none focus:ring-2 focus:ring-sb-green truncate"
          >
            {DEFAULT_PAPERS.map((p) => (
              <option key={p.id} value={p.id} className="text-black">
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Audio Player */}
        {currentPaper.audioUrl && (
          <div className="border-b border-black/5 dark:border-white/10 flex-none">
            <AudioPlayer 
              audioUrl={currentPaper.audioUrl} 
              title={currentPaper.title + ' 听力原声'}
              lyrics={currentPaper.lyrics || []}
              seekTime={null}
            />
          </div>
        )}

        {/* Section Header & Question Jump Controls */}
        <div className="p-3 border-b border-black/5 dark:border-white/10 space-y-2.5 flex-none">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sb-text dark:text-white text-sm flex items-center font-sans">
              <FileCheck className="w-4 h-4 mr-1.5 text-sb-green" />
              {isReviewMode ? '答卷核对卡' : '作答记录卡'}
            </h3>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setShowOverview(!showOverview)}
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-all flex items-center space-x-1 ${
                  showOverview 
                    ? 'bg-sb-green text-white shadow-sm' 
                    : 'bg-sb-ceramic dark:bg-white/10 text-sb-text-soft hover:text-sb-green'
                }`}
              >
                <ListOrdered className="w-3 h-3" />
                <span>{showOverview ? '收起' : '总览'}</span>
              </button>

              <span className="text-[11px] font-bold text-sb-accent dark:text-sb-mint font-mono">
                {answeredCount}/{flatQuestions.length}题
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-slate-500 shrink-0 font-medium">题目:</span>
              <select 
                value={currentQIndex}
                onChange={(e) => {
                  setCurrentQIndex(Number(e.target.value));
                  setShowOverview(false);
                }}
                className="w-full text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-sb-green outline-none bg-white dark:bg-slate-800 dark:text-white truncate"
              >
                {Object.entries(groupedQuestions).map(([group, qs]) => (
                  <optgroup key={group} label={group}>
                    {qs.map(q => (
                      <option key={q.globalIndex} value={q.globalIndex}>
                        {q.label} {userAnswers[q.q.id] ? `[已填: ${userAnswers[q.q.id].length > 6 ? '文本' : userAnswers[q.q.id]}]` : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                onClick={handlePrev} 
                disabled={currentQIndex === 0}
                className="py-1.5 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>上一题</span>
              </button>
              <button 
                onClick={handleNext} 
                disabled={currentQIndex === flatQuestions.length - 1}
                className="py-1.5 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center space-x-1"
              >
                <span>下一题</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isReviewMode && (
            <label className="flex items-center space-x-1.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer pt-0.5">
              <input 
                type="checkbox" 
                checked={autoAdvance} 
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="rounded border-slate-300 text-sb-green focus:ring-sb-green"
              />
              <span>选择后自动跳转至下一题</span>
            </label>
          )}
        </div>

        {/* Dynamic Content Area: Overview Grid or Single Question */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900/50">
          {showOverview ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                <h3 className="font-extrabold text-xs text-sb-text dark:text-white font-sans">作答卡总览</h3>
                <span className="text-[11px] text-sb-text-soft">点击可直接定位题目</span>
              </div>

              {Object.entries(groupedQuestions).map(([groupTitle, qs]) => (
                <div key={groupTitle} className="space-y-1.5">
                  <h4 className="text-[11px] font-bold text-sb-text-soft dark:text-slate-400">{groupTitle}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {qs.map((fq) => {
                      const ans = userAnswers[fq.q.id];
                      const hasAns = !!ans?.trim();
                      return (
                        <button
                          key={fq.globalIndex}
                          onClick={() => {
                            setCurrentQIndex(fq.globalIndex);
                            setShowOverview(false);
                          }}
                          title={`${fq.label}${hasAns ? ` (作答: ${ans})` : ' (未作答)'}`}
                          className={`w-7 h-7 rounded-md text-[11px] font-bold flex flex-col items-center justify-center border transition-all hover:scale-105 ${
                            hasAns 
                              ? 'bg-sb-green text-white border-sb-green shadow-sm' 
                              : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-sb-green'
                          }`}
                        >
                          {fq.section.type === 'writing' ? (
                            <PenTool className="w-3 h-3" />
                          ) : fq.section.type === 'translation' ? (
                            <Languages className="w-3 h-3" />
                          ) : (
                            <span>{fq.q.number}</span>
                          )}
                          {hasAns && ans.length <= 2 && (
                            <span className="text-[8px] opacity-90 font-mono -mt-1">{ans}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : activeItem && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-sm space-y-3.5">
              
              <div className="font-bold text-sm border-b border-slate-100 dark:border-slate-700 pb-2 flex justify-between items-center">
                <span className="text-sb-text dark:text-white flex items-center min-w-0 pr-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sb-accent mr-1.5 shrink-0" />
                  <span className="truncate">{activeItem.label}</span>
                  <span className="text-[11px] text-slate-400 font-normal ml-1 truncate">({activeItem.section.title.split(':')[0]})</span>
                </span>
                
                {userAnswers[activeItem.q.id] && (
                  <span className="text-[10px] font-mono font-bold text-sb-green bg-sb-mint px-1.5 py-0.5 rounded-full shrink-0">
                    已填
                  </span>
                )}
              </div>

              {/* Question Input Types */}
              {activeItem.section.type === 'writing' || activeItem.section.type === 'translation' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500">
                    {activeItem.section.type === 'writing' ? '短文写作输入框' : '汉译英翻译输入框'}
                  </label>
                  <textarea
                    value={userAnswers[activeItem.q.id] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="在此输入您的作答内容..."
                    className="w-full h-48 p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sb-green outline-none resize-none bg-white dark:bg-slate-900 dark:text-white text-xs leading-relaxed font-serif"
                  />
                </div>
              ) : activeItem.section.type === 'reading_cloze' ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500">选词填空：请选择单词代号 (A-O)</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleAnswerChange(opt)}
                        className={`h-9 flex items-center justify-center rounded-lg border-2 font-bold text-sm transition-all active:scale-95 ${
                          userAnswers[activeItem.q.id] === opt
                            ? 'bg-sb-green text-white border-sb-green shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-sb-green dark:bg-slate-800 dark:border-slate-600 dark:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : activeItem.section.type === 'reading_match' ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500">信息匹配：请输入对应的段落字母</p>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="如 A, B, C"
                    value={userAnswers[activeItem.q.id] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value.toUpperCase())}
                    className="w-full text-center h-12 text-xl font-bold uppercase border-2 border-slate-300 rounded-xl focus:border-sb-green focus:ring-0 outline-none dark:bg-slate-800 dark:text-white dark:border-slate-600 shadow-sm"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500">选择题：请点击选择作答项</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {['A','B','C','D'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleAnswerChange(opt)}
                        className={`h-12 flex items-center justify-center rounded-xl border-2 font-bold text-xl transition-all active:scale-95 ${
                          userAnswers[activeItem.q.id] === opt
                            ? 'bg-sb-green text-white border-sb-green shadow-md scale-[0.98]'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-sb-green hover:text-sb-green hover:bg-sb-mint/20 dark:bg-slate-800 dark:border-slate-600 dark:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Guidance Tip */}
              {isReviewMode && (
                <div className="mt-3 p-3 rounded-xl bg-sb-gold-lightest dark:bg-white/5 border border-sb-gold/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sb-green dark:text-sb-mint">
                      您的作答：{userAnswers[activeItem.q.id] ? `[ ${userAnswers[activeItem.q.id]} ]` : '未作答'}
                    </span>
                    <button
                      onClick={() => setPdfViewMode('answer')}
                      className="text-xs font-bold text-sb-accent hover:underline flex items-center space-x-1"
                    >
                      <span>定位解析</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-start space-x-1 text-[10px] text-sb-text-soft dark:text-slate-400 leading-relaxed">
                    <Lightbulb className="w-3.5 h-3.5 text-sb-gold shrink-0 mt-0.5" />
                    <span>请对照左侧《官方答案与详解》核对官方标准答案、听力原文译文及高分解析。</span>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-3 border-t border-black/5 dark:border-white/10 bg-white dark:bg-slate-900 flex-none space-y-2">
          {!isReviewMode ? (
            <button
              onClick={handleSubmit}
              className="w-full py-2.5 bg-sb-accent hover:bg-sb-accent-hover text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-1.5 text-xs sm:text-sm"
            >
              <Send className="w-4 h-4" />
              <span>完成作答并核对答案</span>
            </button>
          ) : (
            <div className="space-y-1.5">
              <button
                onClick={() => setPdfViewMode(pdfViewMode === 'answer' ? 'question' : 'answer')}
                className="w-full py-2 bg-sb-mint hover:bg-sb-mint/80 border border-sb-mint text-sb-green font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center space-x-1.5 text-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{pdfViewMode === 'answer' ? '切换查看试卷原题' : '切换查看答案详解'}</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('重新作答会清空当前作答卡记录，确定吗？')) {
                    setIsReviewMode(false);
                    setUserAnswers({});
                    setCurrentQIndex(0);
                    setPdfViewMode('question');
                  }
                }}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all text-xs flex items-center justify-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>清空重做</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

