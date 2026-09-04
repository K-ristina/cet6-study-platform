import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Plus, 
  Tag, 
  CheckCircle, 
  Circle, 
  BookOpen, 
  Star,
  Coffee,
  Trash2,
  PenTool,
  Languages,
  BookmarkCheck,
  Edit3
} from 'lucide-react';
import { StudyMaterial } from '../../types';
import { ClozeModal } from './ClozeModal';
import { db } from '../../db';
import { extractSmartClozeKeywords } from '../../utils/cloze';

export const MaterialsView: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('全部');

  const [clozeMaterial, setClozeMaterial] = useState<StudyMaterial | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [newType, setNewType] = useState<'writing' | 'translation'>('writing');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newEng, setNewEng] = useState<string>('');
  const [newCn, setNewCn] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('');
  const [newClozeKeywords, setNewClozeKeywords] = useState<string>('');

  useEffect(() => {
    async function loadMaterials() {
      try {
        const list = await db.materials.toArray();
        setMaterials(list);
      } catch (err) {
        setMaterials([]);
      }
    }
    loadMaterials();
  }, []);

  const dynamicTags = Array.from(
    new Set(materials.flatMap((m) => m.categoryTags || []).filter(Boolean))
  );
  const allTags = ['全部', ...dynamicTags];

  const writingMaterials = materials.filter((m) => m.type === 'writing');
  const translationMaterials = materials.filter((m) => m.type === 'translation');

  const filteredWriting = writingMaterials.filter((m) => {
    const matchTag = selectedTag === '全部' || m.categoryTags.includes(selectedTag);
    const matchSearch =
      searchTerm === '' ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.englishText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.chineseText.includes(searchTerm);
    return matchTag && matchSearch;
  });

  const filteredTranslation = translationMaterials.filter((m) => {
    const matchTag = selectedTag === '全部' || m.categoryTags.includes(selectedTag);
    const matchSearch =
      searchTerm === '' ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.englishText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.chineseText.includes(searchTerm);
    return matchTag && matchSearch;
  });

  const toggleMastered = async (m: StudyMaterial) => {
    const next = !m.mastered;
    try {
      await db.materials.update(m.id, { mastered: next });
      setMaterials((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, mastered: next } : item))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (window.confirm('确定要删除此条素材吗？')) {
      try {
        await db.materials.delete(id);
        setMaterials((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openCreateModal = (type: 'writing' | 'translation' = 'writing') => {
    setEditingMaterial(null);
    setNewType(type);
    setNewTitle('');
    setNewEng('');
    setNewCn('');
    setNewTags('');
    setNewClozeKeywords('');
    setIsNewModalOpen(true);
  };

  const openEditModal = (m: StudyMaterial) => {
    setEditingMaterial(m);
    setNewType(m.type);
    setNewTitle(m.title);
    setNewEng(m.englishText);
    setNewCn(m.chineseText);
    setNewTags((m.categoryTags || []).join(' '));
    setNewClozeKeywords((m.clozeKeywords || []).join(', '));
    setIsNewModalOpen(true);
  };

  const handleSaveMaterial = async () => {
    if (!newEng.trim()) return;
    const tagList = newTags
      .split(/[,， ]+/)
      .filter((t) => t.trim())
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    let keywords: string[] = [];
    if (newClozeKeywords.trim()) {
      keywords = newClozeKeywords
        .split(/[,，\s]+/)
        .map((k) => k.replace(/[^a-zA-Z]/g, '').toLowerCase())
        .filter((k) => k.length > 0);
    } else {
      keywords = extractSmartClozeKeywords(newEng);
    }

    if (editingMaterial) {
      const updated: StudyMaterial = {
        ...editingMaterial,
        type: newType,
        title: newTitle || (newType === 'writing' ? '自定义高分句' : '自定义翻译词条'),
        categoryTags: tagList,
        englishText: newEng,
        chineseText: newCn,
        clozeKeywords: keywords,
      };

      try {
        await db.materials.put(updated);
        setMaterials((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setIsNewModalOpen(false);
        setEditingMaterial(null);
      } catch (err) {
        console.error(err);
      }
    } else {
      const newMat: StudyMaterial = {
        id: `mat_${Date.now()}`,
        type: newType,
        title: newTitle || (newType === 'writing' ? '自定义高分句' : '自定义翻译词条'),
        categoryTags: tagList,
        englishText: newEng,
        chineseText: newCn,
        clozeKeywords: keywords,
        mastered: false,
      };

      try {
        await db.materials.put(newMat);
        setMaterials((prev) => [newMat, ...prev]);
        setIsNewModalOpen(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header: Starbucks Green Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[11px] bg-sb-mint border border-sb-mint text-sb-green flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-sb-green" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-sb-green dark:text-sb-mint font-sans">
                素材积累
              </h2>
            </div>
          </div>
        </div>

        <button
          onClick={() => openCreateModal('writing')}
          className="sb-btn-primary text-xs px-5 py-2.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>新建积累素材</span>
        </button>
      </div>

      {/* 1. Main Writing Materials Card */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-sb-green dark:text-sb-mint flex items-center font-sans">
            <PenTool className="w-4 h-4 text-sb-green mr-2" />
            写作高分句型清单 ({writingMaterials.length} 条)
          </h3>

          {/* Dynamic Tag Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto bg-sb-ceramic dark:bg-white/10 p-1 rounded-full text-xs font-bold py-1">
            {allTags.map((tag) => {
              const isSelected = selectedTag === tag;
              const count = tag === '全部' 
                ? writingMaterials.length 
                : writingMaterials.filter((m) => m.categoryTags.includes(tag)).length;

              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3.5 py-1.5 rounded-full transition-all duration-200 active:scale-[0.96] whitespace-nowrap flex items-center space-x-1 ${
                    isSelected
                      ? 'bg-sb-mint text-sb-green shadow-sm font-bold border border-sb-mint'
                      : 'text-sb-text-soft dark:text-white/80 hover:text-sb-green'
                  }`}
                >
                  <span>{tag}</span>
                  <span className="text-[10px] ml-0.5 opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Writing Cards Grid */}
        {filteredWriting.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-ios-card border border-dashed border-black/[0.08] dark:border-white/[0.1] text-xs text-sb-text-soft font-medium shadow-sb-card">
            暂无写作素材！
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWriting.map((m) => (
              <div
                key={m.id}
                className="sb-card p-6 space-y-4 flex flex-col justify-between transition-all duration-200 hover:border-sb-accent/40"
              >
                <div className="space-y-3">
                  {/* Card top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sb-mint text-sb-green">
                        写作句型
                      </span>
                      {m.categoryTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2.5 py-0.5 rounded-full bg-sb-ceramic dark:bg-white/10 text-sb-text-soft dark:text-sb-text-dark-soft font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleMastered(m)}
                        title={m.mastered ? '已熟练掌握' : '标为已掌握'}
                        className={`p-1.5 rounded-full transition-all duration-200 active:scale-[0.92] ${
                          m.mastered ? 'text-sb-accent bg-sb-mint/60' : 'text-sb-text-soft hover:text-sb-green'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(m)}
                        title="编辑素材与挖空词"
                        className="p-1.5 rounded-full text-sb-text-soft hover:text-sb-green transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(m.id)}
                        title="删除素材"
                        className="p-1.5 rounded-full text-sb-text-soft hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & English Sentence */}
                  <div>
                    <h4 className="text-xs font-bold text-sb-text-soft mb-1 font-sans">{m.title}</h4>
                    <p className="font-serif text-sm text-sb-text dark:text-white leading-relaxed font-semibold">
                      {m.englishText}
                    </p>
                  </div>

                  {/* Chinese Translation */}
                  <p className="text-xs text-sb-text-soft dark:text-sb-text-dark-soft leading-relaxed">
                    {m.chineseText}
                  </p>

                  {/* Keywords Preview */}
                  {m.clozeKeywords && m.clozeKeywords.length > 0 && (
                    <div className="flex items-center space-x-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-sb-text-soft">默写考点:</span>
                      {m.clozeKeywords.map((kw, i) => (
                        <span key={i} className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sb-cream dark:bg-white/5 text-sb-accent">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                  <span className="text-[10px] text-sb-text-soft font-mono">
                    来源: {m.source || '精选素材'}
                  </span>

                  <button
                    onClick={() => setClozeMaterial(m)}
                    className="sb-btn-primary text-xs px-4 py-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sb-gold" />
                    <span>挖空默写</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Translation Vocabulary Section */}
      <div className="p-8 rounded-ios-sheet bg-sb-gold-lightest dark:bg-white/[0.03] border border-sb-gold/40 space-y-4 shadow-sb-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-sb-gold flex items-center justify-center text-sb-house">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-sb-green dark:text-sb-mint font-sans">
                翻译特色考点库
              </h3>
            </div>
          </div>
          <span className="text-xs font-bold text-sb-gold font-mono">
            {translationMaterials.length} 条专有表达
          </span>
        </div>

        {filteredTranslation.length === 0 ? (
          <div className="p-8 text-center bg-white/70 dark:bg-slate-900/60 rounded-ios-card border border-dashed border-sb-gold/40 text-xs text-sb-text-soft font-medium">
            暂无翻译考点词条，点击右上角「新建积累素材」选择翻译考点即可添加！
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredTranslation.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-ios-card bg-white dark:bg-slate-900 border border-sb-gold/30 shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sb-gold-lightest text-sb-green border border-sb-gold/30">
                      翻译考点
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleMastered(m)}
                        title={m.mastered ? '标记为未掌握' : '标记为已掌握'}
                        className={`p-1 rounded-full transition-colors ${m.mastered ? 'text-sb-green bg-sb-mint' : 'text-sb-text-soft hover:text-sb-green'}`}
                      >
                        <BookmarkCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(m)}
                        title="编辑词条"
                        className="p-1 rounded-full text-sb-text-soft hover:text-sb-green transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(m.id)}
                        className="p-1 rounded-full text-sb-text-soft hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-sb-text dark:text-white">{m.title}</h4>
                  <p className="font-serif text-xs font-semibold text-sb-accent dark:text-sb-mint">{m.englishText}</p>
                  <p className="text-[11px] text-sb-text-soft">{m.chineseText}</p>
                </div>

                <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex justify-end">
                  <button
                    onClick={() => setClozeMaterial(m)}
                    className="sb-btn-secondary text-[11px] px-3 py-1"
                  >
                    <span>默写练习</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cloze Recall Modal */}
      {clozeMaterial && (
        <ClozeModal
          material={clozeMaterial}
          isOpen={!!clozeMaterial}
          onClose={() => setClozeMaterial(null)}
          onMasteredChange={(id, mastered) => {
            setMaterials((prev) =>
              prev.map((item) => (item.id === id ? { ...item, mastered } : item))
            );
          }}
          onMaterialUpdate={(updated) => {
            setMaterials((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
            setClozeMaterial(updated);
          }}
        />
      )}

      {/* Create / Edit Material Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="ios-modal w-full max-w-lg p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-sb-green dark:text-sb-mint font-sans">
              {editingMaterial ? '编辑积累素材' : '录入高分句型 / 翻译词条'}
            </h3>

            {/* Type selector */}
            <div className="flex bg-sb-ceramic dark:bg-white/10 p-1 rounded-full text-xs font-bold">
              <button
                type="button"
                onClick={() => setNewType('writing')}
                className={`flex-1 py-1.5 rounded-full transition-all ${
                  newType === 'writing'
                    ? 'bg-sb-mint text-sb-green shadow-sm font-bold border border-sb-mint'
                    : 'text-sb-text-soft dark:text-white/80'
                }`}
              >
                写作高分句型
              </button>
              <button
                type="button"
                onClick={() => setNewType('translation')}
                className={`flex-1 py-1.5 rounded-full transition-all ${
                  newType === 'translation'
                    ? 'bg-sb-mint text-sb-green shadow-sm font-bold border border-sb-mint'
                    : 'text-sb-text-soft dark:text-white/80'
                }`}
              >
                翻译特色考点
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-sb-text dark:text-white mb-1">
                  素材主题标题
                </label>
                <input
                  type="text"
                  placeholder={newType === 'writing' ? '例如：科技与伦理 / 倒装强调句' : '例如：非物质文化遗产 / 绿色低碳'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-ios-md border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-800 text-sb-text dark:text-white focus:ring-2 focus:ring-sb-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sb-text dark:text-white mb-1">
                  英文原句 / 表达
                </label>
                <textarea
                  rows={3}
                  placeholder={newType === 'writing' ? '例如：Only by...' : '例如：intangible cultural heritage'}
                  value={newEng}
                  onChange={(e) => setNewEng(e.target.value)}
                  className="w-full text-xs font-serif p-3.5 rounded-ios-md border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-800 text-sb-text dark:text-white focus:ring-2 focus:ring-sb-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sb-text dark:text-white mb-1">
                  中文对照
                </label>
                <input
                  type="text"
                  placeholder="中文翻译..."
                  value={newCn}
                  onChange={(e) => setNewCn(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-ios-md border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-800 text-sb-text dark:text-white focus:ring-2 focus:ring-sb-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sb-text dark:text-white mb-1">
                  自定义标签（选填，以空格或逗号分隔）
                </label>
                <input
                  type="text"
                  placeholder="例如：#科技AI #环保话题 #让步状语"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-ios-md border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-800 text-sb-text dark:text-white focus:ring-2 focus:ring-sb-accent focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-sb-text dark:text-white">
                    挖空默写关键词（选填）
                  </label>
                  <span className="text-[11px] text-sb-text-soft">留空则智能过滤虚词提取重点词</span>
                </div>
                <input
                  type="text"
                  placeholder="例如：people, family, together（以空格或逗号分隔）"
                  value={newClozeKeywords}
                  onChange={(e) => setNewClozeKeywords(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-ios-md border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-800 text-sb-text dark:text-white focus:ring-2 focus:ring-sb-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditingMaterial(null);
                }}
                className="sb-btn-secondary text-xs px-4 py-2"
              >
                取消
              </button>
              <button
                onClick={handleSaveMaterial}
                className="sb-btn-primary text-xs px-5 py-2 shadow-sm"
              >
                {editingMaterial ? '保存修改' : '保存素材'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
