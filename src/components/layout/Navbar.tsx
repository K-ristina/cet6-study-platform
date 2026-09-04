import React from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  FileText, 
  Sparkles, 
  Moon, 
  Sun, 
  Clock,
  RotateCcw,
  Coffee,
  Flame
} from 'lucide-react';

export type NavTab = 'dashboard' | 'exam' | 'planner' | 'materials';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  streakDays?: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  streakDays = 0,
  darkMode,
  onToggleDarkMode,
  onResetData,
}) => {
  const targetDate = new Date('2026-12-19T09:00:00');
  const now = new Date();
  const diffDays = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: '总览看板', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'exam', label: '真题演练', icon: <FileText className="w-4 h-4" /> },
    { id: 'planner', label: '每日计划', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'materials', label: '素材积累', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-sb-house/90 backdrop-blur-xl shadow-sb-nav transition-colors border-b border-black/[0.04] dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left: Brand Logo (iOS App Icon squircle rounded-[11px]) */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={() => onTabChange('dashboard')}
        >
          <div className="w-10 h-10 rounded-[11px] bg-sb-green flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-sb-green dark:text-sb-mint font-sans">
                CET-6 Studio
              </span>
              <span className="text-[11px] px-2.5 py-0.5 font-bold bg-sb-mint/60 text-sb-green rounded-full border border-sb-green/20">
                无纸化旗舰
              </span>
            </div>
            <p className="text-xs text-sb-text-soft dark:text-sb-text-dark-soft hidden sm:block font-medium">
              沉浸手写 · 考场原声 · 710分闭环
            </p>
          </div>
        </div>

        {/* Center: iOS Segmented Capsule Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-sb-cool/90 dark:bg-white/10 p-1.5 rounded-full border border-black/[0.04] dark:border-white/[0.06]">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.96] ${
                  isActive
                    ? 'bg-sb-accent text-white shadow-sm font-bold'
                    : 'text-sb-text dark:text-white/80 hover:text-sb-accent hover:bg-white/80 dark:hover:bg-white/15'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-sb-mint/60 text-sb-green dark:bg-white/10 dark:text-sb-mint'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Gold Star Streak, Countdown & Actions */}
        <div className="flex items-center space-x-3">
          {/* Gold Flame Streak Badge */}
          <div className="flex items-center space-x-1.5 bg-sb-gold-lightest dark:bg-white/10 border border-sb-gold/40 px-3.5 py-1.5 rounded-full text-xs text-sb-text dark:text-sb-gold">
            <Flame className="w-4 h-4 fill-sb-gold text-sb-gold" />
            <span className="font-bold text-sb-green dark:text-sb-gold">{streakDays} 天连续冲刺</span>
          </div>

          {/* Countdown Capsule */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-sb-ceramic dark:bg-white/10 px-3.5 py-1.5 rounded-full text-xs text-sb-text dark:text-white/90">
            <Clock className="w-3.5 h-3.5 text-sb-accent" />
            <span>距六级 <strong className="font-bold text-sb-green dark:text-sb-mint">{diffDays}</strong> 天</span>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? '切换浅色模式' : '切换深色模式'}
            className="p-2.5 rounded-full text-sb-text-soft hover:text-sb-green dark:text-white/70 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 active:scale-[0.95]"
          >
            {darkMode ? <Sun className="w-4 h-4 text-sb-gold" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={onResetData}
            title="重置预置演示数据"
            className="hidden sm:flex p-2.5 rounded-full text-sb-text-soft hover:text-sb-green dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 active:scale-[0.95]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around border-t border-black/[0.06] dark:border-white/[0.08] bg-sb-cream dark:bg-sb-house py-2 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center py-1 px-3.5 rounded-full text-xs font-semibold transition active:scale-[0.95] ${
              currentTab === item.id
                ? 'text-sb-accent dark:text-sb-mint font-bold'
                : 'text-sb-text-soft dark:text-white/60'
            }`}
          >
            {item.icon}
            <span className="mt-0.5 text-[11px]">{item.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
