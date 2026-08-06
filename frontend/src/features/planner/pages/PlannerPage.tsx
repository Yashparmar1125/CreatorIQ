import React from 'react';
import { usePlannerStore } from '../../../stores/usePlannerStore';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export const PlannerPage: React.FC = () => {
  const { events, addEvent } = usePlannerStore();
  const currentMonth = 'March 2026';
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleAddEvent = () => {
    addEvent({
      id: Date.now(),
      day: Math.floor(Math.random() * 28) + 1,
      title: 'Video Draft',
      type: 'primary',
    });
  };

  return (
    <div className="space-y-6 pb-6 animate-in">
      <PageHeader
        title="Planner"
        description="Schedule and coordinate your upcoming content."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-neutral-200 bg-white">
              <button type="button" className="p-2 text-neutral-400 hover:text-neutral-700">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[100px] px-2 text-center text-sm font-medium text-neutral-900">
                {currentMonth}
              </span>
              <button type="button" className="p-2 text-neutral-400 hover:text-neutral-700">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={handleAddEvent}>
              <Plus className="h-4 w-4" />
              Add video
            </Button>
          </div>
        }
      />

      <Card padding="none" className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
            {days.map((day) => (
              <div
                key={day}
                className="border-r border-neutral-200 py-2 text-center text-xs font-medium text-neutral-500 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 28 }).map((_, i) => {
              const dayNum = i + 1;
              const dayEvents = events.filter((e) => e.day === dayNum);
              const isToday = dayNum === 22;

              return (
                <div
                  key={i}
                  className={`group relative min-h-[100px] border-b border-r border-neutral-100 p-2 last:border-r-0 sm:min-h-[120px] ${
                    isToday ? 'bg-brand-50/30' : 'hover:bg-neutral-50/50'
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday ? 'text-brand-600' : 'text-neutral-400 group-hover:text-neutral-700'
                    }`}
                  >
                    {dayNum < 10 ? `0${dayNum}` : dayNum}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          event.type === 'primary'
                            ? 'bg-neutral-900 text-white'
                            : event.type === 'success'
                            ? 'bg-brand-600 text-white'
                            : 'bg-accent-500 text-white'
                        }`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};
