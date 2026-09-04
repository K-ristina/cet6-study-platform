import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  CalendarCheck, 
  ListTodo, 
  FileText, 
  Headphones, 
  PenTool, 
  Languages, 
  ScrollText, 
  BookOpen, 
  ChevronRight, 
  Sparkles 
} from 'lucide-react';
import { TaskPlan } from '../../types';
import { DEFAULT_PAPERS } from '../../data/defaultPapers';
import { Heatmap } from './Heatmap';
import { db } from '../../db';

interface DashboardViewProps {
  onSelectPaper: (paperId: string) => void;
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectPaper,
  onNavigate,
}) => {
  const [tasks, setTasks] = useState<TaskPlan[]>([]);
  const [examCount, setExamCount] = useState<number>(0);
  const [materialCount, setMaterialCount] = useState<number>(0);
  const [predictedScore, setPredictedScore] = useState<string>('--');
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadData() {
      try {
        const list = await db.taskPlans.toArray();
        setTasks(list);

        const exams = await db.examRecords.toArray();
        setExamCount(exams.length);

        const mCount = await db.materials.count();
        setMaterialCount(mCount);
      } catch (err) {
        setTasks([]);
      }
    }
    loadData();
  }, []);

  const todayDayOfWeek = new Date().getDay();
  const todayTasks = tasks.filter((t) => !t.isBuffer && t.dayOfWeek === todayDayOfWeek);
  const completedCount = todayTasks.filter((t) => t.isCompleted).length;

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-8 animate-in fade-in duration-300">
      {/* 1. Starbucks Hero Top Dispatch Banner (Light Green Theme) */}
      <div className="relative overflow-hidden rounded-ios-sheet bg-gradient-to-br from-sb-mint via-[#ddf0e8] to-[#eaf6f0] dark:bg-slate-900 border border-sb-mint/80 dark:border-white/[0.08] text-sb-house p-7 sm:p-9 shadow-sb-card flex flex-col justify-between min-h-[220px]">
        {/* Subtle Siren Gold & Emerald Gradient Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-sb-gold/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-60 h-60 rounded-full bg-sb-accent/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/80 dark:bg-white/10 text-sb-green dark:text-sb-mint text-xs font-bold shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-sb-gold" />
            <span>大学英语六级备考冲刺</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sb-house dark:text-white font-sans">
              今日份专注，沉淀六级高分实力
            </h1>

            <p className="text-sm text-sb-text/85 dark:text-sb-text-dark-soft leading-relaxed max-w-xl font-medium">
              {todayTasks.length > 0 ? (
                <>
                  今日待办已完成 <strong className="font-extrabold text-sb-green dark:text-sb-mint text-base">{completedCount}</strong> / {todayTasks.length} 项。保持备考节奏，稳步跨越及格线，冲刺高分！
                </>
              ) : (
                '今日暂无派发待办。保持专注节奏，可前往制定计划或直接开始全真试卷演练。'
              )}
            </p>

            {/* Inverted White CTA & Outlined Action */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('planner')}
                className="sb-btn-white text-xs sm:text-sm px-6 py-2.5 shadow-sm"
              >
                <CalendarCheck className="w-4 h-4 text-sb-accent" />
                <span>前往每日计划</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('exam')}
                className="sb-btn-white text-xs sm:text-sm px-6 py-2.5 shadow-sm"
              >
                <FileText className="w-4 h-4 text-sb-accent" />
                <span>前往真题演练</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Dual-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Today's Tasks & Study Goals */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-sb-mint text-sb-green border border-sb-mint flex items-center justify-center">
                <ListTodo className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-sb-green dark:text-sb-mint font-sans">
                今日派发待办 ({todayTasks.length} 项)
              </h3>
            </div>

            <button
              onClick={() => onNavigate('planner')}
              className="text-xs font-bold text-sb-accent dark:text-sb-mint hover:underline flex items-center"
            >
              <span>查看全部计划</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todayTasks.length > 0 ? (
              todayTasks.map((task) => {
                const associatedPaper = task.targetPaperId
                  ? DEFAULT_PAPERS.find((p) => p.id === task.targetPaperId)
                  : null;

                return (
                  <div
                    key={task.id}
                    className="sb-card p-4 sm:p-5 flex items-center justify-between gap-4 transition-all duration-200 hover:border-sb-accent/40"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          task.isCompleted
                            ? 'bg-sb-mint text-sb-accent'
                            : 'bg-sb-ceramic dark:bg-white/10 text-sb-text-soft'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>

                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sb-mint text-sb-green flex items-center">
                            {task.category === 'listening' && (
                              <>
                                <Headphones className="w-3 h-3 mr-1 inline" />
                                <span>听力专项</span>
                              </>
                            )}
                            {task.category === 'reading' && (
                              <>
                                <BookOpen className="w-3 h-3 mr-1 inline" />
                                <span>阅读精练</span>
                              </>
                            )}
                            {task.category === 'writing' && (
                              <>
                                <PenTool className="w-3 h-3 mr-1 inline" />
                                <span>短文写作</span>
                              </>
                            )}
                            {task.category === 'translation' && (
                              <>
                                <Languages className="w-3 h-3 mr-1 inline" />
                                <span>段落翻译</span>
                              </>
                            )}
                            {task.category === 'mock' && (
                              <>
                                <ScrollText className="w-3 h-3 mr-1 inline" />
                                <span>综合模考</span>
                              </>
                            )}
                          </span>

                          <span className="text-[11px] font-mono text-sb-text-soft dark:text-sb-text-dark-soft flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-sb-accent" />
                            {task.estimatedMinutes}m
                          </span>
                        </div>

                        <h4
                          className={`text-sm sm:text-base font-bold truncate ${
                            task.isCompleted
                              ? 'line-through text-sb-text-soft dark:text-sb-text-dark-soft'
                              : 'text-sb-text dark:text-white'
                          }`}
                        >
                          {task.taskTitle}
                        </h4>

                        {associatedPaper && (
                          <div className="flex items-center space-x-1 text-[11px] text-sb-accent font-medium">
                            <FileText className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{associatedPaper.title}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => onNavigate('planner')}
                        className="sb-btn-secondary text-xs px-3.5 py-1.5"
                      >
                        <span>查看计划</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="sb-card p-8 text-center space-y-3">
                <CalendarCheck className="w-10 h-10 text-sb-accent/40 mx-auto" />
                <h4 className="text-base font-bold text-sb-green dark:text-sb-mint font-sans">
                  今日暂无待办任务
                </h4>
                <p className="text-xs text-sb-text-soft dark:text-sb-text-dark-soft max-w-sm mx-auto">
                  您可以在「每日计划」中定制专属周排期，或直接前往「真题演练」开始全真模拟。
                </p>
                <div className="flex items-center justify-center space-x-3 pt-2">
                  <button
                    onClick={() => onNavigate('exam')}
                    className="sb-btn-primary text-xs px-5 py-2"
                  >
                    前往真题演练
                  </button>
                  <button
                    onClick={() => onNavigate('planner')}
                    className="sb-btn-secondary text-xs px-5 py-2"
                  >
                    定制每日计划
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Heatmap & Recent Papers */}
        <div className="space-y-6">
          <Heatmap daysCount={49} />

          {/* Quick Real Past Papers */}
          <div className="sb-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-sb-green dark:text-sb-mint flex items-center font-sans">
                <FileText className="w-4 h-4 mr-2 text-sb-accent" />
                最新真题直通
              </h3>
              <button
                onClick={() => onNavigate('exam')}
                className="text-xs font-bold text-sb-accent dark:text-sb-mint hover:underline flex items-center"
              >
                <span>全部 {DEFAULT_PAPERS.length} 套</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {DEFAULT_PAPERS.slice(0, 4).map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => onSelectPaper(paper.id)}
                  className="group p-3 rounded-ios-md border border-black/[0.06] dark:border-white/[0.08] hover:border-sb-accent hover:bg-sb-mint/10 cursor-pointer transition-all duration-200 flex items-center justify-between"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <p className="text-xs font-bold text-sb-text dark:text-white group-hover:text-sb-green transition-colors truncate">
                      {paper.title}
                    </p>
                    <span className="text-[11px] text-sb-text-soft dark:text-sb-text-dark-soft">
                      {paper.sections.length} 个部分 · 130 分钟标准考场
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-sb-text-soft group-hover:text-sb-green group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('exam')}
              className="w-full py-2.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] hover:border-sb-accent text-xs font-bold text-sb-green dark:text-sb-mint hover:bg-sb-mint/10 transition-all flex items-center justify-center space-x-1.5"
            >
              <span>前往真题工坊查看全部试卷</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Starbucks Signature Floating Circular Button (56px) */}
      <button
        onClick={() => onNavigate('planner')}
        title="快捷查看每日计划"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-sb-mint hover:bg-sb-mint/80 text-sb-green border border-sb-mint shadow-sb-frap flex items-center justify-center transition-all duration-200 active:scale-[0.92] group"
      >
        <CalendarCheck className="w-6 h-6 text-sb-green transition-transform group-hover:scale-110" />
      </button>
    </div>
  );
};
