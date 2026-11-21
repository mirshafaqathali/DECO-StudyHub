import React from 'react';
import { Cloud, CloudOff } from 'lucide-react';
import type { AppTab } from '../types/study';

interface TopBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  userDisplayName: string | null;
  isSyncing: boolean;
  isOnline: boolean;
  onOpenSyncModal: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'lessons', label: 'Lessons' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'tests', label: 'MCQ Tests' },
  { id: 'progress', label: 'Progress' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'groups', label: 'Study Groups' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  userDisplayName,
  isSyncing,
  isOnline,
  onOpenSyncModal,
}) => {
  const ctaLabel = userDisplayName
    ? isSyncing
      ? 'Syncing...'
      : userDisplayName.split(' ')[0]
    : 'Cloud Sync';

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('lessons')}
          className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-ring)] rounded"
        >
          DECO StudyHub
        </button>

        {/* Zone 2: 6 concise single-line text navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectTab(item.id)}
                className={`py-2 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-ring)] ${
                  isActive
                    ? 'border-[var(--accent-ring)] text-zinc-900 dark:text-zinc-100'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenSyncModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-ring)]"
          >
            {isOnline ? (
              <Cloud className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="max-w-[110px] truncate">{ctaLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const MobileNavStrip: React.FC<{
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}> = ({ activeTab, onSelectTab }) => {
  return (
    <nav
      aria-label="Mobile sections"
      className="md:hidden grid grid-cols-3 gap-1 pb-2.5 mb-4 border-b border-zinc-200 dark:border-zinc-800"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelectTab(item.id)}
            className={`px-2 py-2 text-xs font-medium rounded-lg text-center whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-[var(--accent)] text-white'
                : 'text-zinc-600 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-900 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};
