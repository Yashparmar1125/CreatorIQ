import type { LucideIcon } from 'lucide-react';
import { Eye, Users, Video, Zap, TrendingUp, BarChart2 } from 'lucide-react';

export type StatIconKey = 'eye' | 'users' | 'video' | 'zap' | 'trending' | 'chart';

const STAT_ICONS: Record<StatIconKey, LucideIcon> = {
  eye: Eye,
  users: Users,
  video: Video,
  zap: Zap,
  trending: TrendingUp,
  chart: BarChart2,
};

export function renderStatIcon(key: StatIconKey, className = 'h-4 w-4') {
  const Icon = STAT_ICONS[key];
  return <Icon className={className} />;
}
