import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  Video,
  CheckCircle2,
} from 'lucide-react';
import {
  usePlannerStore,
  type PlannerSlot,
  type SlotLifecycleStatus,
} from '../../../stores/usePlannerStore';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_CONFIG: Record<
  SlotLifecycleStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  not_started: {
    label: 'Not Started',
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-200',
    dot: 'bg-neutral-400',
  },
  scripting: {
    label: 'Scripting',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  recording: {
    label: 'Recording',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  editing: {
    label: 'Editing',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  ready: {
    label: 'Ready',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  published: {
    label: 'Published',
    bg: 'bg-brand-50',
    text: 'text-brand-800',
    border: 'border-brand-200',
    dot: 'bg-brand-600',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  scripted: {
    label: 'Scripted',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  skipped: {
    label: 'Skipped',
    bg: 'bg-neutral-100',
    text: 'text-neutral-500',
    border: 'border-neutral-200',
    dot: 'bg-neutral-300',
  },
};

const SELECTABLE_STATUSES: SlotLifecycleStatus[] = [
  'not_started',
  'scripting',
  'recording',
  'editing',
  'ready',
  'published',
];

function toDateTimeLocalString(date: Date): string {
  const safeDate = isNaN(date.getTime()) ? new Date() : date;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const y = safeDate.getFullYear();
  const m = pad(safeDate.getMonth() + 1);
  const d = pad(safeDate.getDate());
  const h = pad(safeDate.getHours());
  const min = pad(safeDate.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

export const PlannerPage: React.FC = () => {
  const {
    slots,
    currentDate,
    isLoading,
    error,
    fetchSlots,
    createSlot,
    updateSlot,
    deleteSlot,
    prevMonth,
    nextMonth,
    setCurrentDate,
    clearError,
  } = usePlannerStore();

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTopic, setCreateTopic] = useState('');
  const [createScheduledAt, setCreateScheduledAt] = useState('');
  const [createStatus, setCreateStatus] = useState<SlotLifecycleStatus>('not_started');
  const [createNotes, setCreateNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit / Details Modal State
  const [selectedSlot, setSelectedSlot] = useState<PlannerSlot | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editStatus, setEditStatus] = useState<SlotLifecycleStatus>('not_started');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial load
  useEffect(() => {
    void fetchSlots();
  }, [fetchSlots]);

  // Compute Calendar Grid Days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Pipeline summary statistics
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      scripting: 0,
      recording: 0,
      editing: 0,
      ready: 0,
      published: 0,
    };
    slots.forEach((s) => {
      if (counts[s.status] !== undefined) {
        counts[s.status]++;
      }
    });
    return counts;
  }, [slots]);

  // Handlers for Opening Modals
  const handleOpenCreateModal = (initialDate?: Date) => {
    const targetDate = initialDate ? new Date(initialDate) : new Date();
    if (initialDate) {
      targetDate.setHours(12, 0, 0, 0);
    }
    setCreateTopic('');
    setCreateScheduledAt(toDateTimeLocalString(targetDate));
    setCreateStatus('not_started');
    setCreateNotes('');
    setIsCreateOpen(true);
  };

  const handleOpenEditModal = (slot: PlannerSlot, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSlot(slot);
    setEditTopic(slot.topic);
    try {
      setEditScheduledAt(toDateTimeLocalString(new Date(slot.scheduled_at)));
    } catch {
      setEditScheduledAt(toDateTimeLocalString(new Date()));
    }
    setEditStatus(slot.status || 'not_started');
    setEditNotes(slot.notes || '');
  };

  // Create Slot Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTopic.trim() || !createScheduledAt) return;

    setIsCreating(true);
    try {
      const scheduledIso = new Date(createScheduledAt).toISOString();
      await createSlot({
        topic: createTopic.trim(),
        scheduled_at: scheduledIso,
        status: createStatus,
        notes: createNotes.trim() || undefined,
      });
      setIsCreateOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  // Update Slot Submission
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !editTopic.trim() || !editScheduledAt) return;

    setIsUpdating(true);
    try {
      const scheduledIso = new Date(editScheduledAt).toISOString();
      await updateSlot(selectedSlot.id, {
        topic: editTopic.trim(),
        scheduled_at: scheduledIso,
        status: editStatus,
        notes: editNotes.trim(),
      });
      setSelectedSlot(null);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Slot Handler
  const handleDeleteSlot = async () => {
    if (!selectedSlot) return;
    if (!window.confirm(`Are you sure you want to remove "${selectedSlot.topic}" from your planner?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSlot(selectedSlot.id);
      setSelectedSlot(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-in">
      <PageHeader
        title="Content Planner"
        description="Schedule, track, and coordinate upcoming video content across lifecycle stages."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Navigator Chevrons */}
            <div className="flex items-center rounded-lg border border-neutral-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={prevMonth}
                title="Previous Month"
                className="p-2 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 transition-colors rounded-l-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[130px] px-3 text-center text-sm font-semibold text-neutral-900 select-none">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                title="Next Month"
                className="p-2 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 transition-colors rounded-r-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Quick jump to Today */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="text-xs"
            >
              Today
            </Button>

            {/* Add Video Slot Button */}
            <Button type="button" onClick={() => handleOpenCreateModal()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Video Slot
            </Button>
          </div>
        }
      />

      {/* Offline/Error Notification Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="text-amber-600 hover:text-amber-900 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Lifecycle Stage Pipeline Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(['scripting', 'recording', 'editing', 'ready', 'published'] as SlotLifecycleStatus[]).map(
          (statusKey) => {
            const config = STATUS_CONFIG[statusKey];
            const count = statusCounts[statusKey] || 0;
            return (
              <div
                key={statusKey}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
                  <span className="text-xs font-medium text-neutral-600">{config.label}</span>
                </div>
                <span className="text-sm font-bold text-neutral-900">{count}</span>
              </div>
            );
          }
        )}
      </div>

      {/* Main Calendar View */}
      <Card padding="none" className="overflow-hidden border border-neutral-200 shadow-sm">
        {/* Loading overlay indicator */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 bg-neutral-50/80 py-2 border-b border-neutral-200 text-xs text-neutral-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />
            <span>Updating planner slots...</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Day of Week Header */}
            <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50/80">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="border-r border-neutral-200/80 py-2.5 text-center text-xs font-semibold text-neutral-500 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 divide-y divide-neutral-200/80 bg-neutral-100/50">
              {calendarDays.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);
                const daySlots = slots.filter((slot) => {
                  try {
                    return isSameDay(parseISO(slot.scheduled_at), day);
                  } catch {
                    return false;
                  }
                });

                return (
                  <div
                    key={idx}
                    onClick={() => handleOpenCreateModal(day)}
                    className={`group relative min-h-[115px] p-2 transition-colors border-r border-neutral-200/80 last:border-r-0 cursor-pointer ${
                      !isCurrentMonth
                        ? 'bg-neutral-50/50 text-neutral-400'
                        : isDayToday
                        ? 'bg-brand-50/25 ring-1 ring-inset ring-brand-500/20'
                        : 'bg-white hover:bg-neutral-50/80'
                    }`}
                  >
                    {/* Header: Date Number & Hover Add Button */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold inline-flex items-center justify-center ${
                          isDayToday
                            ? 'h-6 w-6 rounded-full bg-brand-600 text-white font-bold shadow-xs'
                            : isCurrentMonth
                            ? 'text-neutral-700'
                            : 'text-neutral-300'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCreateModal(day);
                        }}
                        title={`Schedule video on ${format(day, 'MMM d')}`}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Day Slots List */}
                    <div className="mt-1.5 space-y-1">
                      {daySlots.slice(0, 3).map((slot) => {
                        const config = STATUS_CONFIG[slot.status] || STATUS_CONFIG.not_started;
                        return (
                          <div
                            key={slot.id}
                            onClick={(e) => handleOpenEditModal(slot, e)}
                            title={`${slot.topic} (${config.label})`}
                            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium border shadow-2xs truncate transition-transform hover:scale-[1.02] cursor-pointer ${config.bg} ${config.text} ${config.border}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dot}`} />
                            <span className="truncate flex-1 font-medium">{slot.topic}</span>
                          </div>
                        );
                      })}

                      {daySlots.length > 3 && (
                        <div className="text-[11px] font-medium text-neutral-500 pl-1">
                          +{daySlots.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* MODAL 1: Create Video Slot Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-brand-600" />
                <h3 className="text-base font-semibold text-neutral-900">Schedule Video Slot</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Video Topic / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js 15 Full Tutorial & Codebase"
                  value={createTopic}
                  onChange={(e) => setCreateTopic(e.target.value)}
                  className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Scheduled Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createScheduledAt}
                    onChange={(e) => setCreateScheduledAt(e.target.value)}
                    className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2.5 text-xs text-neutral-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value as SlotLifecycleStatus)}
                    className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2.5 text-xs text-neutral-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/10"
                  >
                    {SELECTABLE_STATUSES.map((statusKey) => (
                      <option key={statusKey} value={statusKey}>
                        {STATUS_CONFIG[statusKey].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Notes / Hook / Keywords (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Draft hook, angle, thumbnail ideas, or SEO tags..."
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/10"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isCreating || !createTopic.trim()}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Adding...
                    </>
                  ) : (
                    'Add to Planner'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Slot Details / Edit / Delete Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600" />
                <h3 className="text-base font-semibold text-neutral-900">Slot Details & Status</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Strategy / Trend link indicator */}
            {(selectedSlot.strategy_session_id || selectedSlot.trend_id) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {selectedSlot.strategy_session_id && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 border border-purple-200">
                    <Sparkles className="h-3 w-3" />
                    Linked to Strategy Brief
                  </span>
                )}
                {selectedSlot.trend_id && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Linked to Trend
                  </span>
                )}
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Video Topic / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editScheduledAt}
                    onChange={(e) => setEditScheduledAt(e.target.value)}
                    className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2.5 text-xs text-neutral-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as SlotLifecycleStatus)}
                    className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2.5 text-xs text-neutral-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/10"
                  >
                    {SELECTABLE_STATUSES.map((statusKey) => (
                      <option key={statusKey} value={statusKey}>
                        {STATUS_CONFIG[statusKey].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Notes / Hook / Keywords
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Outline notes, hook ideas, or tags..."
                  className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/10"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleDeleteSlot}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete Slot
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedSlot(null)}
                  >
                    Close
                  </Button>
                  <Button type="submit" size="sm" disabled={isUpdating || !editTopic.trim()}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
