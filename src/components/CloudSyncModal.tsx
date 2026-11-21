import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { CheckCircle2, Cloud, CloudOff, LogIn, LogOut, RefreshCw, X } from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAtMs: number | null;
  authError: string | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onManualSync: () => Promise<void>;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  isOnline,
  isSyncing,
  lastSyncedAtMs,
  authError,
  onSignIn,
  onSignOut,
  onManualSync,
}) => {
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await onSignIn();
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await onSignOut();
    } finally {
      setBusy(false);
    }
  };

  const handleSyncNow = async () => {
    setBusy(true);
    try {
      await onManualSync();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-sync-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="cloud-sync-modal-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Cloud Sync & Offline Storage
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Sync lessons, flashcards, reminders, and study groups across your devices.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close cloud sync dialog"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-600 dark:text-zinc-400">Network</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
              {isOnline ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Online
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Offline (Queued locally)
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-600 dark:text-zinc-400">Account</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[220px]">
              {user ? user.displayName || user.email : 'Local device only'}
            </span>
          </div>

          {user && (
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">Cloud State</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isSyncing
                  ? 'Syncing changes...'
                  : lastSyncedAtMs
                  ? `Synced at ${new Date(lastSyncedAtMs).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'Connected'}
              </span>
            </div>
          )}
        </div>

        {authError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3 py-2 text-xs text-red-700 dark:text-red-300"
          >
            {authError}
          </p>
        )}

        <div className="space-y-2.5">
          {!user ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSignIn()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {busy ? 'Connecting Google Account...' : 'Sign in with Google to Sync'}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={busy || isSyncing || !isOnline}
                onClick={() => void handleSyncNow()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${busy || isSyncing ? 'animate-spin' : ''}`} />
                Sync Now
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSignOut()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Your study progress is always saved offline first in browser storage and IndexedDB cache,
            so you can study without internet access and sync automatically once reconnected.
          </p>
        </div>
      </div>
    </div>
  );
};
