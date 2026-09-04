import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ExamWorkspace } from './components/exam/ExamWorkspace';
import { PlannerView } from './components/planner/PlannerView';
import { MaterialsView } from './components/materials/MaterialsView';
import { DictionaryView } from './components/dictionary/DictionaryView';
import { db } from './db';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('cet6_theme') === 'dark';
  });

  const [examParams, setExamParams] = useState<{
    paperId: string;
    sectionId?: string;
    audioTime?: number;
  }>({
    paperId: 'cet6_2026_06_set1',
  });

  useEffect(() => {
    async function purgeOldMockRecords() {
      const purged = localStorage.getItem('cet6_mock_purged_final_v1');
      if (!purged) {
        try {
          await db.taskPlans.clear();
          await db.materials.clear();
          localStorage.setItem('cet6_mock_purged_final_v1', 'true');
        } catch (e) {
          console.error(e);
        }
      }
    }
    purgeOldMockRecords();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cet6_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cet6_theme', 'light');
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleSelectPaper = (paperId: string) => {
    setExamParams({ paperId });
    setCurrentTab('exam');
  };

  const handleResetData = async () => {
    if (window.confirm('确定要清空所有备考数据并重置系统吗？')) {
      try {
        await db.taskPlans.clear();
        await db.materials.clear();
        await db.examRecords.clear();
        await db.annotations.clear();
        await db.wordBook.clear();
        window.location.reload();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-sb-cream dark:bg-slate-950 text-sb-text dark:text-slate-100 overflow-hidden transition-colors">
      {/* Left Vertical Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onResetData={handleResetData}
      />

      {/* Right Main Content Viewport */}
      <main className="flex-1 h-full overflow-y-auto flex flex-col">
        {currentTab === 'dashboard' && (
          <DashboardView
            onSelectPaper={handleSelectPaper}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'exam' && (
          <ExamWorkspace
            initialPaperId={examParams.paperId}
            initialSectionId={examParams.sectionId}
            initialAudioTime={examParams.audioTime}
            onJumpToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'planner' && (
          <PlannerView />
        )}

        {currentTab === 'materials' && (
          <MaterialsView />
        )}

        {currentTab === 'dictionary' && (
          <DictionaryView />
        )}
      </main>
    </div>
  );
};

export default App;

