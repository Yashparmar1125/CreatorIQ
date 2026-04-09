import React from 'react';
import { motion } from 'framer-motion';
import { Youtube, Check } from 'lucide-react';

interface ConnectStepProps {
  isLoading: boolean;
  isYoutubeConnected: boolean;
  onConnect: () => void;
  onNext: () => void;
  onBack: () => void;
  connectedChannel?: {
    name?: string | null;
    handle?: string | null;
    thumbnail?: string | null;
    subscriber_count?: number | null;
    video_count?: number | null;
  };
}

export const ConnectStep: React.FC<ConnectStepProps> = ({ 
  isLoading, 
  isYoutubeConnected, 
  onConnect, 
  onNext, 
  onBack,
  connectedChannel 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-8 max-w-md mx-auto"
    >
      <div className="space-y-3">
        <h2 className="text-3xl font-bold font-sora text-white tracking-tight">Connect YouTube</h2>
        <p className="text-neutral-500 font-medium text-sm">Link your channel to analyze performance.</p>
      </div>
      
      <div className="p-10 bg-white rounded-3xl border border-neutral-100 shadow-xl space-y-6 relative overflow-hidden group">
        <div className="flex justify-center relative z-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-neutral-50 flex items-center justify-center border border-neutral-100 shadow-sm">
              <Youtube className="w-10 h-10 text-[#FF0000]" />
            </div>
            {isYoutubeConnected && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-600 rounded-xl border-4 border-white flex items-center justify-center shadow-lg">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="w-full py-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Syncing Channel...</span>
          </div>
        ) : !isYoutubeConnected ? (
          <button 
            onClick={onConnect}
            className="w-full py-4 bg-neutral-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all border border-white/5 shadow-2 [box-shadow:0_0_20px_rgba(255,255,255,0.05)]"
          >
            Connect YouTube Channel
            <Youtube className="w-4 h-4 text-red-500" />
          </button>
        ) : (
          <div className="space-y-4">
             <div className="flex items-center gap-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-100 transition-all hover:bg-neutral-100/50">
                <div className="w-14 h-14 rounded-xl bg-white overflow-hidden border border-neutral-200 shadow-sm flex-shrink-0">
                  {connectedChannel?.thumbnail ? (
                    <img src={connectedChannel.thumbnail} alt="Channel" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-600/10">
                      <Youtube className="w-7 h-7 text-brand-600" />
                    </div>
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-neutral-900 leading-none truncate">
                      {connectedChannel?.name || 'Your YouTube Channel'}
                    </p>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg border border-green-100">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                       <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest leading-none">Healthy</p>
                    </div>
                  </div>
                  {connectedChannel?.handle && (
                    <p className="text-[11px] font-medium text-neutral-400 mt-1.5">{connectedChannel.handle}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-200/50">
                     <div>
                       <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Subscribers</p>
                       <p className="text-xs font-black text-neutral-900 mt-1">{connectedChannel?.subscriber_count?.toLocaleString() || '0'}</p>
                     </div>
                     <div className="w-px h-6 bg-neutral-200" />
                     <div>
                       <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Videos</p>
                       <p className="text-xs font-black text-neutral-900 mt-1">{connectedChannel?.video_count?.toLocaleString() || '0'}</p>
                     </div>
                  </div>
                </div>
             </div>
             <button 
              onClick={onNext}
              className="w-full py-4 bg-white text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-neutral-100 transition-all border border-neutral-100"
            >
              Continue Onboarding
            </button>
          </div>
        )}
      </div>
      
      <button onClick={onBack} className="text-neutral-600 text-[10px] font-bold uppercase tracking-wider hover:text-white transition-colors">Go Back</button>
    </motion.div>
  );
};
