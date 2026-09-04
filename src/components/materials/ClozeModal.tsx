import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, RotateCcw, SlidersHorizontal, Wand2, Save } from 'lucide-react';
import { StudyMaterial } from '../../types';
import { triggerConfetti } from '../../utils/confetti';
import { db } from '../../db';
import { extractSmartClozeKeywords } from '../../utils/cloze';

interface ClozeModalProps {
  material: StudyMaterial;
  isOpen: boolean;
  onClose: () => void;
  onMasteredChange?: (id: string, mastered: boolean) => void;
  onMaterialUpdate?: (updated: StudyMaterial) => void;
}

export const ClozeModal: React.FC<ClozeModalProps> = ({
  material,
  isOpen,
  onClose,
  onMasteredChange,
  onMaterialUpdate,
}) => {
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<boolean>(false);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [saveTip, setSaveTip] = useState<string>('');

  useEffect(() => {
    if (isOpen && material) {
      let initialKws = material.clozeKeywords && material.clozeKeywords.length > 0
        ? material.clozeKeywords.map((k) => k.toLowerCase())
        : extractSmartClozeKeywords(material.englishText);

      if (initialKws.length === 0) {
        initialKws = extractSmartClozeKeywords(material.englishText);
      }

      setActiveKeywords(initialKws);
      setInputs({});
      setChecked(false);
      setRevealed(false);
      setIsCustomizing(false);
      setSaveTip('');
    }
  }, [isOpen, material]);

  if (!isOpen || !material) return null;

  const words = material.englishText.split(' ');
  const keywordSet = new Set(activeKeywords.map((k) => k.toLowerCase()));

  const handleInputChange = (slotKey: string, val: string) => {
    setInputs((prev) => ({ ...prev, [slotKey]: val }));
  };

  const handleCheck = async () => {
    setChecked(true);
    let allCorrect = true;
    let blankCount = 0;

    words.forEach((word, wIdx) => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (cleanWord && keywordSet.has(cleanWord)) {
        blankCount++;
        const slotKey = `slot_${wIdx}`;
        const userVal = (inputs[slotKey] || '').trim().toLowerCase();
        if (userVal !== cleanWord) {
          allCorrect = false;
        }
      }
    });

    if (blankCount > 0 && allCorrect) {
      triggerConfetti();
      try {
        await db.materials.update(material.id, { mastered: true });
        onMasteredChange?.(material.id, true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReset = () => {
    setInputs({});
    setChecked(false);
    setRevealed(false);
  };

  const toggleKeyword = (cleanWord: string) => {
    const lower = cleanWord.toLowerCase();
    setActiveKeywords((prev) => {
      const set = new Set(prev.map((k) => k.toLowerCase()));
      if (set.has(lower)) {
        set.delete(lower);
      } else {
        set.add(lower);
      }
      return Array.from(set);
    });
    setChecked(false);
  };

  const handleSmartRepick = () => {
    const smartKws = extractSmartClozeKeywords(material.englishText);
    setActiveKeywords(smartKws);
    setChecked(false);
    setSaveTip('已智能挑选核心词');
    setTimeout(() => setSaveTip(''), 2000);
  };

  const handleSaveKeywords = async () => {
    try {
      await db.materials.update(material.id, { clozeKeywords: activeKeywords });
      if (onMaterialUpdate) {
        onMaterialUpdate({ ...material, clozeKeywords: activeKeywords });
      }
      setSaveTip('已保存挖空关键词设置！');
      setTimeout(() => setSaveTip(''), 2500);
      setIsCustomizing(false);
      setInputs({});
      setChecked(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[12px] shadow-2xl border border-black/[0.06] dark:border-white/[0.08] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header: Light Mint Band */}
        <div className="p-6 bg-gradient-to-r from-sb-mint via-[#ddf0e8] to-[#eaf6f0] dark:bg-slate-900 border-b border-sb-mint/60 dark:border-white/10 text-sb-house dark:text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-white/80 border border-sb-mint/80 text-sb-green shadow-sm">
              <Sparkles className="w-5 h-5 text-sb-green" />
            </div>
            <div>
              <h3 className="font-extrabold text-sb-house dark:text-white text-base tracking-tight font-sans">
                挖空默写模式
              </h3>
              <p className="text-xs text-sb-text/80 dark:text-sb-text-dark-soft">
                {material.title}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isCustomizing
                  ? 'bg-sb-mint text-sb-green font-bold shadow-sm border border-sb-mint'
                  : 'bg-white/80 hover:bg-white text-sb-house border border-black/5 shadow-sm'
              }`}
              title="自定义要挖空的单词"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sb-green" />
              <span>{isCustomizing ? '完成调整' : '自定义挖空'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-sb-house/70 dark:text-white/70 hover:text-sb-house hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 bg-sb-cream/30 dark:bg-slate-950 max-h-[75vh] overflow-y-auto">
          {/* Chinese Translation Prompt */}
          <div className="p-4 rounded-[12px] bg-sb-gold-lightest dark:bg-white/5 border border-sb-gold/40 space-y-1">
            <span className="text-xs font-bold text-sb-green dark:text-sb-mint">中文释义与语境提示：</span>
            <p className="text-sm font-medium text-sb-text dark:text-white leading-relaxed">
              {material.chineseText}
            </p>
          </div>

          {/* Customizing Mode Panel */}
          {isCustomizing ? (
            <div className="p-5 rounded-[12px] bg-white dark:bg-slate-800 border-2 border-sb-accent/30 space-y-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div>
                  <h4 className="text-xs font-bold text-sb-green dark:text-sb-mint flex items-center">
                    <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                    点击单词即可切换「挖空 / 正常显示」
                  </h4>
                  <p className="text-[11px] text-sb-text-soft">
                    当前已选 {activeKeywords.length} 个挖空词：{activeKeywords.join(', ') || '暂无'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSmartRepick}
                    type="button"
                    className="sb-btn-secondary text-[11px] px-3 py-1.5 flex items-center space-x-1"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-sb-accent" />
                    <span>智能过滤推荐</span>
                  </button>
                  <button
                    onClick={handleSaveKeywords}
                    type="button"
                    className="sb-btn-primary text-[11px] px-3 py-1.5 flex items-center space-x-1"
                  >
                    <Save className="w-3.5 h-3.5 text-sb-gold" />
                    <span>保存默认</span>
                  </button>
                </div>
              </div>

              {/* Interactive Word Selector */}
              <div className="flex flex-wrap gap-2 items-center leading-relaxed font-serif text-sm">
                {words.map((word, wIdx) => {
                  const cleanWord = word.replace(/[^a-zA-Z]/g, '');
                  if (!cleanWord) {
                    return <span key={wIdx} className="text-sb-text-soft font-sans">{word}</span>;
                  }
                  const isSelected = keywordSet.has(cleanWord.toLowerCase());

                  return (
                    <button
                      key={wIdx}
                      type="button"
                      onClick={() => toggleKeyword(cleanWord)}
                      className={`px-2.5 py-1 rounded-[8px] text-xs font-mono transition-all duration-150 border active:scale-95 ${
                        isSelected
                          ? 'bg-sb-accent text-white font-bold border-sb-accent shadow-sm'
                          : 'bg-sb-ceramic dark:bg-white/10 text-sb-text dark:text-white border-black/[0.06] hover:border-sb-accent/50'
                      }`}
                    >
                      {word}
                      {isSelected && <span className="ml-1 text-[10px] text-sb-gold">★</span>}
                    </button>
                  );
                })}
              </div>

              {saveTip && (
                <div className="text-xs font-bold text-sb-green dark:text-sb-mint bg-sb-mint/40 p-2 rounded text-center">
                  {saveTip}
                </div>
              )}
            </div>
          ) : (
            /* Standard Interactive Cloze Sentence */
            <div className="sb-card p-6 leading-loose font-serif text-sm sm:text-base text-sb-text dark:text-white">
              {words.map((word, wIdx) => {
                const leadingPunc = word.match(/^[^a-zA-Z]+/)?.[0] || '';
                const trailingPunc = word.match(/[^a-zA-Z]+$/)?.[0] || '';
                const cleanWord = word.replace(/[^a-zA-Z]/g, '');
                const isBlank = cleanWord.length > 0 && keywordSet.has(cleanWord.toLowerCase());

                if (isBlank) {
                  const slotKey = `slot_${wIdx}`;
                  const userVal = inputs[slotKey] || '';
                  const isMatch = userVal.trim().toLowerCase() === cleanWord.toLowerCase();

                  return (
                    <span key={wIdx} className="inline-block mx-1 font-mono">
                      {leadingPunc}
                      <input
                        type="text"
                        value={revealed ? cleanWord : userVal}
                        disabled={revealed}
                        placeholder={`[ ${cleanWord.length} 字母 ]`}
                        onChange={(e) => handleInputChange(slotKey, e.target.value)}
                        style={{ width: `${Math.max(cleanWord.length * 11, 75)}px` }}
                        className={`text-center font-mono text-xs sm:text-sm px-2.5 py-1 rounded-[8px] border focus:outline-none transition-all ${
                          checked
                            ? isMatch
                              ? 'bg-sb-mint text-sb-green border-sb-green font-bold'
                              : 'bg-rose-100 text-rose-900 border-rose-500 font-bold'
                            : 'bg-white dark:bg-slate-800 border-sb-accent/40 text-sb-text dark:text-white focus:ring-2 focus:ring-sb-accent'
                        }`}
                      />
                      {trailingPunc}
                    </span>
                  );
                }

                return <span key={wIdx}> {word}</span>;
              })}
            </div>
          )}

          {/* Answer Key if revealed */}
          {revealed && (
            <div className="p-4 rounded-[10px] bg-sb-mint/40 border border-sb-mint text-xs text-sb-green space-y-1 font-mono">
              <span className="font-bold">标准完整英文：</span>
              <p className="font-serif italic text-sm text-sb-house dark:text-sb-mint">{material.englishText}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-sb-house flex items-center justify-between">
          <button
            onClick={() => setRevealed(!revealed)}
            className="text-xs font-bold text-sb-text-soft hover:text-sb-green underline"
          >
            {revealed ? '隐藏参考答案' : '查看参考答案'}
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="p-2 rounded-full text-sb-text-soft hover:bg-black/5 transition-all duration-200 active:scale-95"
              title="重置输入"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleCheck}
              className="sb-btn-primary text-xs px-6 py-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>核对默写结果</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
