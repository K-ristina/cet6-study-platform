import React, { useState } from "react";
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
  Flame,
  Menu,
  X,
  ChevronRight,
  BookMarked,
} from "lucide-react";

export type NavTab = "dashboard" | "exam" | "planner" | "materials" | "dictionary";

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  streakDays?: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onResetData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  streakDays = 0,
  darkMode,
  onToggleDarkMode,
  onResetData,
}) => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const targetDate = new Date("2026-12-19T09:00:00");
  const now = new Date();
  const diffDays = Math.max(
    0,
    Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: "dashboard",
      label: "总览看板",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    { id: "exam", label: "真题演练", icon: <FileText className="w-5 h-5" /> },
    {
      id: "planner",
      label: "每日计划",
      icon: <CalendarCheck className="w-5 h-5" />,
    },
    {
      id: "materials",
      label: "素材积累",
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      id: "dictionary",
      label: "英英词典",
      icon: <BookMarked className="w-5 h-5" />,
    },
  ];

  const handleNavClick = (id: NavTab) => {
    onTabChange(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-sb-house/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-[9px] bg-sb-green flex items-center justify-center text-white">
            <Coffee className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base text-sb-green dark:text-sb-mint font-sans">
            CET-6 Studio
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-full text-sb-text-soft hover:bg-black/5"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Left Vertical Sidebar (Desktop Fixed + Mobile Slide Drawer) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 lg:w-72 bg-white/95 dark:bg-sb-house/95 backdrop-blur-xl border-r border-black/[0.05] dark:border-white/[0.08] flex flex-col justify-between p-5 transition-transform duration-300 ease-in-out shadow-sb-nav ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top: Brand Header */}
        <div className="space-y-6">
          <div
            onClick={() => handleNavClick("dashboard")}
            className="flex items-start space-x-3 cursor-pointer group pt-1"
          >
            <div className="w-11 h-11 rounded-[11px] bg-sb-mint border border-sb-mint text-sb-green flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105 flex-shrink-0">
              <Coffee className="w-5 h-5 text-sb-green" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-xl tracking-tight text-sb-green dark:text-sb-mint font-sans">
                  CET-6 Studio
                </span>
              </div>
            </div>
          </div>

          {/* Center: Vertical Navigation Buttons Stack */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-bold transition-all duration-200 active:scale-[0.96] ${
                    isActive
                      ? "bg-sb-mint text-sb-green shadow-sm font-extrabold border border-sb-mint/80"
                      : "text-sb-text dark:text-white/80 hover:bg-sb-mint/30 dark:hover:bg-white/10 hover:text-sb-green"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={
                        isActive
                          ? "text-sb-green"
                          : "text-sb-accent dark:text-sb-mint"
                      }
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                        isActive
                          ? "bg-white/80 text-sb-green border border-sb-mint/60"
                          : "bg-sb-mint/60 text-sb-green dark:bg-white/10 dark:text-sb-mint"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Streak, Countdown & Settings Actions */}
        <div className="space-y-3 pt-6 border-t border-black/[0.05] dark:border-white/[0.08]">
          {/* Gold Flame Streak Card (iOS Inset Card) */}
          <div className="bg-sb-gold-lightest dark:bg-white/10 border border-sb-gold/40 rounded-ios-card p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 fill-sb-gold text-sb-gold" />
              <span className="text-xs font-bold text-sb-green dark:text-sb-gold font-sans">
                连续备考冲刺
              </span>
            </div>
            <span className="text-xs font-black text-sb-gold font-mono">
              {streakDays} 天
            </span>
          </div>

          {/* Exam Countdown Card */}
          <div className="bg-sb-ceramic dark:bg-white/5 border border-black/[0.04] rounded-ios-card p-3 flex items-center justify-between text-xs text-sb-text dark:text-white">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-sb-accent" />
              <span className="font-medium text-sb-text-soft dark:text-sb-text-dark-soft">
                距六级考试
              </span>
            </div>
            <strong className="text-sb-green dark:text-sb-mint font-black font-mono text-sm">
              {diffDays} 天
            </strong>
          </div>

          {/* Action Row: Dark mode & Reset Demo */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center space-x-1">
              <button
                onClick={onToggleDarkMode}
                title={darkMode ? "切换浅色模式" : "切换深色模式"}
                className="p-2 rounded-full text-sb-text-soft hover:text-sb-green hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 active:scale-[0.92]"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-sb-gold" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={onResetData}
                title="重置演示数据"
                className="p-2 rounded-full text-sb-text-soft hover:text-sb-green hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 active:scale-[0.92]"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
