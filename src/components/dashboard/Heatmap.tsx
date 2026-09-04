import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { db } from '../../db';

interface HeatmapProps {
  daysCount?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({ daysCount = 49 }) => {
  const [activeDates, setActiveDates] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    async function loadActivity() {
      try {
        const counts = new Map<string, number>();

        // 1. Task plans completed
        const tasks = await db.taskPlans.toArray();
        for (const t of tasks) {
          if (t.isCompleted && t.completedAt) {
            const d = new Date(t.completedAt).toISOString().split('T')[0];
            counts.set(d, (counts.get(d) || 0) + 1);
          }
        }

        // 2. Exam records
        const exams = await db.examRecords.toArray();
        for (const e of exams) {
          const d = new Date(e.startedAt).toISOString().split('T')[0];
          counts.set(d, (counts.get(d) || 0) + 2);
        }

        setActiveDates(counts);
      } catch (err) {
        setActiveDates(new Map());
      }
    }
    loadActivity();
  }, []);

  const today = new Date();
  const days: { dateStr: string; intensity: number; label: string }[] = [];
  let activeDaysCount = 0;

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const actCount = activeDates.get(dateStr) || 0;
    const intensity = Math.min(4, actCount);
    if (intensity > 0) activeDaysCount++;

    days.push({
      dateStr,
      intensity,
      label: `${dateStr}: ${actCount > 0 ? `完成 ${actCount * 25} 分钟备考记录` : '暂无打卡记录'}`,
    });
  }

  const ratePercent = daysCount > 0 ? Math.round((activeDaysCount / daysCount) * 100) : 0;

  const getCellColor = (level: number) => {
    switch (level) {
      case 4: return 'bg-sb-green';
      case 3: return 'bg-sb-accent';
      case 2: return 'bg-sb-uplift';
      case 1: return 'bg-sb-mint dark:bg-sb-uplift/60';
      default: return 'bg-sb-ceramic dark:bg-white/10';
    }
  };

  return (
    <div className="sb-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Flame className="w-4 h-4 fill-sb-gold text-sb-gold" />
          <h3 className="font-bold text-sm text-sb-green dark:text-sb-mint font-sans">
            备考活跃度 打卡热力图
          </h3>
        </div>
        <span className="text-xs font-semibold text-sb-text-soft dark:text-sb-text-dark-soft">
          近 {daysCount} 天坚持率 {ratePercent}%
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {days.map((d, idx) => (
          <div
            key={idx}
            title={d.label}
            className={`w-3.5 h-3.5 rounded-[3px] transition-all duration-200 hover:scale-125 cursor-pointer ${getCellColor(d.intensity)}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] text-sb-text-soft dark:text-sb-text-dark-soft pt-1 font-medium">
        <span>起步</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-[2px] bg-sb-ceramic dark:bg-white/10" />
          <span className="w-3 h-3 rounded-[2px] bg-sb-mint" />
          <span className="w-3 h-3 rounded-[2px] bg-sb-uplift" />
          <span className="w-3 h-3 rounded-[2px] bg-sb-accent" />
          <span className="w-3 h-3 rounded-[2px] bg-sb-green" />
        </div>
        <span>冲刺</span>
      </div>
    </div>
  );
};
