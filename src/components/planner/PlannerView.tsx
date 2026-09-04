import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  ListTodo,
  Inbox,
  Headphones,
  BookOpen,
  PenTool,
  Languages,
  ScrollText,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  FileText,
} from "lucide-react";
import { TaskPlan } from "../../types";
import { DEFAULT_PAPERS } from "../../data/defaultPapers";
import { db } from "../../db";
import { triggerConfetti } from "../../utils/confetti";

const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
// Monday-first order for Chinese study habit: 1(周一) -> 6(周六) -> 0(周日)
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const PlannerView: React.FC = () => {
  const [tasks, setTasks] = useState<TaskPlan[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Day of week filter: 'all' | 1 | 2 | 3 | 4 | 5 | 6 | 0
  const [selectedDayFilter, setSelectedDayFilter] = useState<"all" | number>(
    "all",
  );

  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskCategory, setNewTaskCategory] = useState<
    "listening" | "reading" | "writing" | "translation" | "mock"
  >("reading");
  const [newTaskDayOfWeek, setNewTaskDayOfWeek] = useState<number>(1); // Default to 周一
  const [newTaskMinutes, setNewTaskMinutes] = useState<number>(25);
  const [newTaskPaperId, setNewTaskPaperId] = useState<string>("cet6_2026_06_set1");

  const currentDayOfWeek = new Date().getDay();

  useEffect(() => {
    async function loadTasks() {
      try {
        const list = await db.taskPlans.toArray();
        setTasks(list);
      } catch (err) {
        setTasks([]);
      }
    }
    loadTasks();
  }, []);

  const toggleTask = async (task: TaskPlan) => {
    const nextCompleted = !task.isCompleted;
    try {
      await db.taskPlans.update(task.id, { isCompleted: nextCompleted });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, isCompleted: nextCompleted } : t,
        ),
      );
      if (nextCompleted) {
        triggerConfetti();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const moveToBuffer = async (task: TaskPlan) => {
    try {
      await db.taskPlans.update(task.id, { isBuffer: true, dayOfWeek: 0 });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, isBuffer: true, dayOfWeek: 0 } : t,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const restoreFromBuffer = async (task: TaskPlan, targetDay: number = 1) => {
    try {
      await db.taskPlans.update(task.id, {
        isBuffer: false,
        dayOfWeek: targetDay,
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, isBuffer: false, dayOfWeek: targetDay }
            : t,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("确定要删除此任务吗？")) {
      try {
        await db.taskPlans.delete(taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateTaskDay = async (taskId: string, dayOfWeek: number) => {
    try {
      await db.taskPlans.update(taskId, { dayOfWeek });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, dayOfWeek } : t)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    const newTask: TaskPlan = {
      id: `task_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      dayOfWeek: newTaskDayOfWeek,
      taskTitle: newTaskTitle,
      category: newTaskCategory,
      targetType: newTaskCategory === "mock" ? "mock_exam" : "paper_section",
      targetPaperId: newTaskPaperId || undefined,
      estimatedMinutes: newTaskMinutes,
      isCompleted: false,
      isBuffer: false,
    };

    try {
      await db.taskPlans.put(newTask);
      setTasks((prev) => [...prev, newTask]);
      setNewTaskTitle("");
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const regularTasks = tasks.filter((t) => !t.isBuffer);
  const bufferTasks = tasks.filter((t) => t.isBuffer);

  const filteredTasks = regularTasks.filter((t) => {
    if (selectedDayFilter === "all") return true;
    return t.dayOfWeek === selectedDayFilter;
  });

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-[11px] bg-sb-mint border border-sb-mint flex items-center justify-center text-sb-green shadow-sm">
            <CalendarCheck className="w-5 h-5 text-sb-green" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-sb-green dark:text-sb-mint font-sans">
              每日计划
            </h2>
          </div>
        </div>

        {/* Add Task Button */}
        <button
          onClick={() => {
            setNewTaskDayOfWeek(currentDayOfWeek);
            setIsAddModalOpen(true);
          }}
          className="sb-btn-primary text-xs px-5 py-2.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>新建备考任务</span>
        </button>
      </div>

      {/* Main Task Area */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <ListTodo className="w-4 h-4 text-sb-accent" />
            <h3 className="text-sm font-bold text-sb-green dark:text-sb-mint font-sans">
              本周完整备考清单 ({regularTasks.length} 项)
            </h3>
          </div>

          {/* Weekday Segmented Filter Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto bg-sb-ceramic dark:bg-white/10 p-1 rounded-full text-xs font-bold py-1">
            <button
              onClick={() => setSelectedDayFilter("all")}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 active:scale-[0.96] whitespace-nowrap ${
                selectedDayFilter === "all"
                  ? "bg-sb-mint text-sb-green shadow-sm font-bold border border-sb-mint"
                  : "text-sb-text-soft dark:text-white/80 hover:text-sb-green"
              }`}
            >
              全部 ({regularTasks.length})
            </button>

            {WEEKDAY_ORDER.map((dayNum) => {
              const count = regularTasks.filter(
                (t) => t.dayOfWeek === dayNum,
              ).length;
              const isSelected = selectedDayFilter === dayNum;
              const isToday = currentDayOfWeek === dayNum;

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDayFilter(dayNum)}
                  className={`px-3 py-1.5 rounded-full transition-all duration-200 active:scale-[0.96] whitespace-nowrap flex items-center space-x-1 ${
                    isSelected
                      ? "bg-sb-mint text-sb-green shadow-sm font-bold border border-sb-mint"
                      : "text-sb-text-soft dark:text-white/80 hover:text-sb-green"
                  }`}
                >
                  <span>{WEEKDAY_NAMES[dayNum]}</span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sb-gold inline-block"></span>
                  )}
                  <span className="text-[10px] ml-0.5 opacity-80">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Task Cards Grid */}
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-ios-card border border-dashed border-black/[0.08] dark:border-white/[0.1] text-xs text-sb-text-soft font-medium shadow-sb-card">
            {selectedDayFilter === "all"
              ? "暂无备考任务，点击右上角「新建备考任务」开始规划！"
              : `${WEEKDAY_NAMES[selectedDayFilter as number]} 暂无安排，给备战留足自律时光！`}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map((task) => {
              const associatedPaper = task.targetPaperId
                ? DEFAULT_PAPERS.find((p) => p.id === task.targetPaperId)
                : null;

              return (
                <div
                  key={task.id}
                  className={`sb-card p-5 space-y-4 flex flex-col justify-between transition-all duration-200 hover:border-sb-accent/40 ${
                    task.isCompleted
                      ? "opacity-60 bg-sb-ceramic/40 dark:bg-white/[0.02]"
                      : ""
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Weekday Tag Dropdown & Category Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <select
                          value={task.dayOfWeek}
                          onChange={(e) =>
                            handleUpdateTaskDay(
                              task.id,
                              parseInt(e.target.value),
                            )
                          }
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sb-ceramic dark:bg-white/10 text-sb-text-soft dark:text-sb-text-dark-soft border-none focus:ring-1 focus:ring-sb-accent cursor-pointer"
                        >
                          {WEEKDAY_ORDER.map((d) => (
                            <option key={d} value={d}>
                              {WEEKDAY_NAMES[d]}
                            </option>
                          ))}
                        </select>

                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sb-mint text-sb-green flex items-center">
                          {task.category === "listening" && (
                            <>
                              <Headphones className="w-3 h-3 mr-1 inline" />
                              <span>听力专项</span>
                            </>
                          )}
                          {task.category === "reading" && (
                            <>
                              <BookOpen className="w-3 h-3 mr-1 inline" />
                              <span>阅读精练</span>
                            </>
                          )}
                          {task.category === "writing" && (
                            <>
                              <PenTool className="w-3 h-3 mr-1 inline" />
                              <span>短文写作</span>
                            </>
                          )}
                          {task.category === "translation" && (
                            <>
                              <Languages className="w-3 h-3 mr-1 inline" />
                              <span>段落翻译</span>
                            </>
                          )}
                          {task.category === "mock" && (
                            <>
                              <ScrollText className="w-3 h-3 mr-1 inline" />
                              <span>综合模考</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <span className="text-[11px] font-mono text-sb-text-soft dark:text-sb-text-dark-soft flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-sb-accent" />
                          {task.estimatedMinutes}m
                        </span>

                        {/* Delete Task Button */}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          title="删除此任务"
                          className="p-1 rounded-full text-sb-text-soft hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Task Title */}
                    <h4
                      className={`text-sm font-bold leading-snug ${
                        task.isCompleted
                          ? "line-through text-sb-text-soft dark:text-sb-text-dark-soft"
                          : "text-sb-text dark:text-white"
                      }`}
                    >
                      {task.taskTitle}
                    </h4>

                    {/* Associated Exam Paper Display */}
                    {associatedPaper && (
                      <div className="flex items-center space-x-1 text-[11px] text-sb-accent font-medium pt-0.5">
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{associatedPaper.title}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                    <button
                      onClick={() => toggleTask(task)}
                      className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 active:scale-[0.92] ${
                        task.isCompleted
                          ? "text-sb-accent bg-sb-mint/50"
                          : "text-sb-text-soft hover:text-sb-green hover:bg-black/5"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{task.isCompleted ? "已完成" : "标为完成"}</span>
                    </button>

                    {!task.isCompleted && (
                      <button
                        onClick={() => moveToBuffer(task)}
                        title="顺延移至周日缓冲池"
                        className="px-3 py-1 text-[11px] font-bold text-sb-gold hover:bg-sb-gold-lightest dark:hover:bg-white/10 rounded-full transition-all duration-200 active:scale-[0.92]"
                      >
                        移至缓冲池
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sunday Buffer Pool: Starbucks Gold Lightest Background */}
      <div className="p-8 rounded-ios-sheet bg-sb-gold-lightest dark:bg-white/[0.03] border border-sb-gold/40 space-y-4 shadow-sb-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-sb-gold flex items-center justify-center text-sb-house">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-sb-green dark:text-sb-mint font-sans">
                周日缓冲池
              </h3>
            </div>
          </div>
          <span className="text-xs font-bold text-sb-gold font-mono">
            {bufferTasks.length} 项待处理
          </span>
        </div>

        {bufferTasks.length === 0 ? (
          <div className="p-8 text-center bg-white/70 dark:bg-slate-900/60 rounded-ios-card border border-dashed border-sb-gold/40 text-xs text-sb-text-soft font-medium">
            暂无未完成的顺延任务，当前复习进度非常棒！
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {bufferTasks.map((bt) => {
              const associatedPaper = bt.targetPaperId
                ? DEFAULT_PAPERS.find((p) => p.id === bt.targetPaperId)
                : null;

              return (
                <div
                  key={bt.id}
                  className="p-4 rounded-ios-card bg-white dark:bg-slate-900 border border-sb-gold/30 shadow-sm flex items-center justify-between gap-2"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-sb-text dark:text-white truncate">
                      {bt.taskTitle}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-sb-text-soft font-mono">
                      <span>用时: {bt.estimatedMinutes} 分钟</span>
                      {associatedPaper && (
                        <span className="truncate text-sb-accent flex items-center">
                          <FileText className="w-2.5 h-2.5 mr-0.5 inline" />
                          {associatedPaper.title}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleDeleteTask(bt.id)}
                      title="删除任务"
                      className="p-1 rounded-full text-sb-text-soft hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => restoreFromBuffer(bt, 1)}
                      className="text-xs font-bold text-sb-text-soft hover:text-sb-green underline"
                    >
                      移回周一
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Task Modal with Weekday & Paper Selector */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="ios-modal w-full max-w-md p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
              <h3 className="text-base font-extrabold text-sb-green dark:text-sb-mint font-sans">
                新建备考任务
              </h3>
              <span className="text-xs text-sb-accent font-bold">
                {WEEKDAY_NAMES[newTaskDayOfWeek]}执行
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-sb-text dark:text-white mb-1">
                  任务名称
                </label>
                <input
                  type="text"
                  placeholder="例如：2026年6月第1套 仔细阅读精练"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-ios-md border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-800 text-sb-text dark:text-white focus:ring-2 focus:ring-sb-accent focus:outline-none"
                />
              </div>

              {/* Weekday Selector */}
              <div>
                <label className="block text-xs font-bold text-sb-text dark:text-white mb-1.5">
                  指定排期（周几）
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAY_ORDER.map((dayNum) => (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => setNewTaskDayOfWeek(dayNum)}
                      className={`py-2 rounded-ios-sm text-xs font-bold transition-all active:scale-[0.92] ${
                        newTaskDayOfWeek === dayNum
                          ? "bg-sb-mint text-sb-green shadow-sm font-extrabold border border-sb-mint"
                          : "bg-sb-ceramic dark:bg-white/10 text-sb-text dark:text-white hover:bg-black/5"
                      }`}
                    >
                      {WEEKDAY_NAMES[dayNum]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Associated Exam Paper Selector */}
              <div>
                <label className="block text-xs font-bold text-sb-text dark:text-white mb-1">
                  关联真题试卷（可选）
                </label>
                <select
                  value={newTaskPaperId}
                  onChange={(e) => setNewTaskPaperId(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-ios-md border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-800 text-sb-text dark:text-white focus:ring-2 focus:ring-sb-accent focus:outline-none"
                >
                  <option value="">-- 不关联特定试卷 --</option>
                  {DEFAULT_PAPERS.map((paper) => (
                    <option key={paper.id} value={paper.id}>
                      {paper.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-sb-text dark:text-white mb-1">
                    分类题型
                  </label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="w-full text-xs p-3.5 rounded-ios-md border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-800 text-sb-text dark:text-white focus:ring-2 focus:ring-sb-accent focus:outline-none"
                  >
                    <option value="listening">听力精听</option>
                    <option value="reading">阅读精练</option>
                    <option value="writing">短文写作</option>
                    <option value="translation">段落翻译</option>
                    <option value="mock">全套模考</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-sb-text dark:text-white mb-1">
                    预计用时 (分钟)
                  </label>
                  <input
                    type="number"
                    value={newTaskMinutes}
                    onChange={(e) =>
                      setNewTaskMinutes(parseInt(e.target.value) || 20)
                    }
                    className="w-full text-xs p-3.5 rounded-ios-md border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-800 text-sb-text dark:text-white focus:ring-2 focus:ring-sb-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="sb-btn-secondary text-xs px-4 py-2"
              >
                取消
              </button>
              <button
                onClick={handleAddTask}
                className="sb-btn-primary text-xs px-5 py-2 shadow-sm"
              >
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
