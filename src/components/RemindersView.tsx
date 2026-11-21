import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Circle,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { ReminderItem, SubjectUnit } from '../types/study';
import {
  getReminderUrgency,
  getTodayIsoDate,
  sortAndFilterReminders,
  type ReminderFilter,
} from '../utils/reminders';
import {
  BLUEPRINT_LIMITS,
  validateReminderInput,
  type ReminderKind,
  type ScopeSubjectId,
} from '../utils/validation';

interface RemindersViewProps {
  subjects: SubjectUnit[];
  reminders: ReminderItem[];
  onSaveReminder: (item: ReminderItem) => Promise<void>;
  onToggleComplete: (id: string) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}

const KIND_LABELS: Record<ReminderKind, string> = {
  exam: 'Exam',
  assignment: 'Assignment',
  quiz: 'Quiz / Surprise Test',
  revision: 'Revision',
};

export const RemindersView: React.FC<RemindersViewProps> = ({
  subjects,
  reminders,
  onSaveReminder,
  onToggleComplete,
  onDeleteReminder,
}) => {
  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const [filter, setFilter] = useState<ReminderFilter>('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<ScopeSubjectId>('all');
  const [kind, setKind] = useState<ReminderKind>('exam');
  const [dueDate, setDueDate] = useState(todayIso);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  const visibleReminders = useMemo(
    () => sortAndFilterReminders(reminders, filter),
    [reminders, filter]
  );

  const nextUpcoming = useMemo(
    () => sortAndFilterReminders(reminders, 'upcoming')[0] ?? null,
    [reminders]
  );

  const openCreateForm = () => {
    setEditingId(null);
    setTitle('');
    setSubjectId('unit-3');
    setKind('exam');
    setDueDate(todayIso);
    setNotes('');
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (item: ReminderItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSubjectId(item.subjectId);
    setKind(item.kind);
    setDueDate(item.dueDate);
    setNotes(item.notes);
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateReminderInput({ title, subjectId, kind, dueDate, notes });
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const id = editingId ?? `rem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const existing = reminders.find((r) => r.id === editingId);
      await onSaveReminder({
        id,
        title: title.trim(),
        subjectId,
        kind,
        dueDate,
        notes: notes.trim(),
        completed: existing ? existing.completed : false,
        updatedAtMs: Date.now(),
      });
      setShowForm(false);
      setEditingId(null);
    } catch (saveErr) {
      setFormError(saveErr instanceof Error ? saveErr.message : 'Could not save reminder.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnableAlerts = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationStatus('Browser notifications are not supported on this device.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationStatus('Deadline alerts enabled for this browser.');
      } else {
        setNotificationStatus('Notification permission was declined; in-app countdowns stay active.');
      }
    } catch {
      setNotificationStatus('Unable to request notification permission in this frame.');
    }
  };

  const subjectLabel = (id: ScopeSubjectId) => {
    if (id === 'all') return 'All Units';
    return subjects.find((s) => s.id === id)?.code ?? id;
  };

  return (
    <div className="space-y-6">
      {/* Top Countdown Summary */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent-text)]">
            <CalendarClock className="w-4 h-4" />
            <span>Exam & Assignment Schedule</span>
          </div>
          {nextUpcoming ? (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Next Up: {nextUpcoming.title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">
                {subjectLabel(nextUpcoming.subjectId)} · {KIND_LABELS[nextUpcoming.kind]} · Due{' '}
                {nextUpcoming.dueDate} ·{' '}
                {getReminderUrgency(nextUpcoming, todayIso).label}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                All Deadlines Cleared
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                Add upcoming quiz dates, assignments, or semester exam milestones below.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleEnableAlerts()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5" />
            Browser Alerts
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Reminder
          </button>
        </div>
      </div>

      {notificationStatus && (
        <p className="text-xs text-zinc-600 dark:text-zinc-300 px-1" role="status">
          {notificationStatus}
        </p>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {editingId ? 'Edit Study Reminder' : 'New Exam or Assignment Reminder'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label
                htmlFor="reminder-title"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Title
              </label>
              <input
                id="reminder-title"
                type="text"
                maxLength={BLUEPRINT_LIMITS.reminderTitleMaxLength}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CIE-2 Unit IV Cache Mapping Quiz"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="reminder-subject"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Subject Scope
              </label>
              <select
                id="reminder-subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value as ScopeSubjectId)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              >
                <option value="all">All Units (Full Syllabus)</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} — {sub.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="reminder-kind"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Category
              </label>
              <select
                id="reminder-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as ReminderKind)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              >
                {Object.entries(KIND_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="reminder-date"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Due / Exam Date
              </label>
              <input
                id="reminder-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label
                htmlFor="reminder-notes"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Study Notes (optional)
              </label>
              <input
                id="reminder-notes"
                type="text"
                maxLength={BLUEPRINT_LIMITS.reminderNotesMaxLength}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Syllabus topics, room, or submission instructions..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              {submitting ? 'Saving...' : editingId ? 'Update Reminder' : 'Save Reminder'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div
          role="group"
          aria-label="Filter reminders"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1"
        >
          {(
            [
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'completed', label: 'Completed' },
              { id: 'all', label: 'All' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
          {visibleReminders.length} {visibleReminders.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {visibleReminders.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No {filter === 'all' ? '' : filter} reminders to show.
          </div>
        ) : (
          visibleReminders.map((item) => {
            const urgency = getReminderUrgency(item, todayIso);
            const urgencyClass =
              urgency.level === 'overdue'
                ? 'text-red-700 dark:text-red-400'
                : urgency.level === 'urgent'
                ? 'text-amber-700 dark:text-amber-400'
                : urgency.level === 'soon'
                ? 'text-[var(--accent-text)]'
                : urgency.level === 'done'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-zinc-600 dark:text-zinc-400';

            return (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    aria-label={
                      item.completed
                        ? `Mark '${item.title}' incomplete`
                        : `Mark '${item.title}' complete`
                    }
                    onClick={() => void onToggleComplete(item.id)}
                    className="mt-0.5 shrink-0 text-zinc-400 hover:text-[var(--accent-text)] transition-colors"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{subjectLabel(item.subjectId)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{KIND_LABELS[item.kind]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{item.dueDate}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`inline-flex items-center gap-1 font-medium ${urgencyClass}`}>
                        {(urgency.level === 'overdue' || urgency.level === 'urgent') && (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {urgency.label}
                      </span>
                    </div>

                    <h3
                      className={`text-sm sm:text-base font-semibold ${
                        item.completed
                          ? 'line-through text-zinc-500 dark:text-zinc-400'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {item.title}
                    </h3>

                    {item.notes && (
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label={`Edit '${item.title}'`}
                    onClick={() => openEditForm(item)}
                    className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete '${item.title}'`}
                    onClick={() => void onDeleteReminder(item.id)}
                    className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
