import React from 'react';
import { usePlannerStore } from '../../../stores/usePlannerStore';
import { Plus, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

export const PlannerPage: React.FC = () => {
  const { events, addEvent } = usePlannerStore();
  const currentMonth = 'March 2026';
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleAddEvent = () => {
    addEvent({ 
      id: Date.now(), 
      day: Math.floor(Math.random() * 28) + 1, 
      title: 'Video Draft', 
      type: 'primary' 
    });
  };
  
  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="space-y-1">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-600/5 text-brand-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-brand-600/10">
             <Layers className="w-3.5 h-3.5" />
             Content Schedule
           </div>
           <h2 className="text-3xl font-bold text-neutral-900 tracking-tight font-sora">
             Production <span className="text-neutral-400">Planner</span>
           </h2>
           <p className="text-neutral-500 text-sm font-medium">
             Schedule and coordinate your upcoming videos.
           </p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex bg-white rounded-xl p-1 border border-neutral-200 shadow-sm overflow-hidden group">
             <button className="p-2 rounded-lg hover:bg-neutral-50 transition-all text-neutral-400">
               <ChevronLeft className="w-4 h-4" />
             </button>
             <div className="px-4 flex items-center font-bold text-[10px] uppercase tracking-wider text-neutral-900 min-w-[120px] justify-center">
               {currentMonth}
             </div>
             <button className="p-2 rounded-lg hover:bg-neutral-50 transition-all text-neutral-400">
               <ChevronRight className="w-4 h-4" />
             </button>
           </div>
           
           <button 
             onClick={handleAddEvent}
             className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-neutral-800 transition-all flex items-center gap-2"
           >
             <Plus className="w-4 h-4" />
             Add Video
           </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden relative">
        <div className="grid grid-cols-7 border-b border-neutral-50 bg-neutral-50/50">
          {days.map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-r border-neutral-50 last:border-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 h-[640px]">
          {Array.from({ length: 28 }).map((_, i) => {
            const dayNum = i + 1;
            const dayEvents = events.filter(e => e.day === dayNum);
            const isToday = dayNum === 22;
            
            return (
              <div 
                key={i} 
                className={`border-r border-b border-neutral-50 last:border-r-0 p-4 transition-all group relative cursor-pointer min-h-[120px] hover:bg-neutral-50/50 ${isToday ? 'bg-brand-50/10' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-bold ${
                    isToday ? 'text-brand-600' : 'text-neutral-300 group-hover:text-neutral-900'
                  }`}>
                    {dayNum < 10 ? `0${dayNum}` : dayNum}
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id} 
                      className={`p-2.5 rounded-xl border transition-all text-[9px] font-bold tracking-tight uppercase ${
                        event.type === 'primary' 
                          ? 'bg-neutral-900 text-white border-neutral-800' 
                          : event.type === 'success' 
                            ? 'bg-brand-600 text-white border-brand-500' 
                            : 'bg-accent-500 text-white border-accent-400'
                      }`}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>

                <button className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-brand-600 transition-all shadow-md">
                   <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
