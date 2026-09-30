import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useDashboardStore } from "../../../stores/useDashboardStore";
import { useTrendsStore } from "../../../stores/useTrendsStore";
import { useAuthStore } from "../../../stores/useAuthStore";
import { renderStatIcon } from "../../../lib/stat-icons";
import {
  cleanTrendTitle,
  cleanTrendText,
  resolveVideoConcept,
  resolveVideoConceptBadge,
} from "../../../lib/cleanTrendTitle";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { StatCard } from "../../../components/ui/StatCard";
import { AIScannerLoader } from "../../../components/ui/AIScannerLoader";
import { MiniBarChart } from "../../../components/ui/MiniBarChart";
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
  Zap,
  BarChart2,
  ChevronRight,
  Film,
  Mic,
  Lightbulb,
} from "lucide-react";

type ForecastPeriod = '28d' | '90d' | 'ALL';

interface ForecastData {
  bars: number[];
  projectedGrowth: string;
  comparisonLabel: string;
  highlightIndex: number;
}

const FORECAST_PERIOD_DATA: Record<ForecastPeriod, ForecastData> = {
  '28d': {
    bars: [42, 56, 68, 72, 85, 94, 108],
    projectedGrowth: '+12.4%',
    comparisonLabel: 'vs last period',
    highlightIndex: 5,
  },
  '90d': {
    bars: [120, 135, 150, 142, 168, 190, 215],
    projectedGrowth: '+18.7%',
    comparisonLabel: 'vs last period',
    highlightIndex: 5,
  },
  'ALL': {
    bars: [310, 380, 420, 490, 560, 640, 750],
    projectedGrowth: '+34.2%',
    comparisonLabel: 'all-time projected',
    highlightIndex: 6,
  },
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { stats, insights = [], fetchDashboard } = useDashboardStore();
  const [forecastPeriod, setForecastPeriod] = useState<ForecastPeriod>('28d');
  const {
    trends,
    isLoading: isTrendsLoading,
    fetchTrends,
  } = useTrendsStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchDashboard();
    fetchTrends();
  }, [fetchDashboard, fetchTrends]);

  const [chatQuery, setChatQuery] = useState("");

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;
    navigate("/app/strategy", {
      state: { prompt: chatQuery },
    });
  };

  const handleQuickPrompt = (promptText: string) => {
    navigate("/app/strategy", {
      state: { prompt: promptText },
    });
  };

  const topTrends = trends.slice(0, 3);
  const currentForecast =
    FORECAST_PERIOD_DATA[forecastPeriod] ?? FORECAST_PERIOD_DATA['28d'];

  const displayName = user?.full_name?.trim() || user?.email?.split("@")[0] || "Creator";

  // Typewriter phrases
  const TYPEWRITER_PHRASES = [
    "What do you want to build or create today?",
    "Need a high-retention 3-second hook for your next Short?",
    "Looking for breakout viral topics in your niche?",
    "Want a full high-CTR video script outline?",
    "Analyze momentum signals & velocity across YouTube trends?",
  ];

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (displayedText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
        }, 50);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(currentPhrase.slice(0, displayedText.length - 1));
        }, 25);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, phraseIndex]);

  return (
    <div className="space-y-8 pb-12">
      {/* ChatGPT/Gemini Center Hero Greeting with Typewriter */}
      <div className="pt-8 pb-3 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-[11px] font-medium text-indigo-400">
          <Sparkles className="h-3 w-3 animate-pulse" />
          <span>CreatorIQ AI Strategy Engine &bull; GPT-4o &amp; Qdrant Vector Intelligence</span>
        </div>

        <h1 className="font-sora text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
          How can I help,{" "}
          <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
            {displayName}
          </span>
          ?
        </h1>

        {/* Dynamic Typewriter Subtitle */}
        <div
          onClick={() => {
            setChatQuery(TYPEWRITER_PHRASES[phraseIndex]);
          }}
          className="h-8 flex items-center justify-center gap-1 cursor-pointer group"
          title="Click to use this prompt"
        >
          <span className="text-sm sm:text-base text-neutral-400 group-hover:text-indigo-300 transition-colors font-medium">
            {displayedText}
          </span>
          <span className="inline-block w-0.5 h-4 bg-indigo-400 animate-pulse ml-0.5" />
        </div>
      </div>

      {/* ChatGPT-Style Capsule Input Bar */}
      <div className="mx-auto w-full max-w-2xl">
        <form
          onSubmit={handleChatSubmit}
          className="relative flex items-center rounded-3xl border border-[#2e2e2e] bg-[#212121] px-4 py-3 shadow-xl shadow-black/40 focus-within:border-[#404040] focus-within:ring-1 focus-within:ring-[#404040] transition-all"
        >
          {/* Left Plus Attachment Action */}
          <button
            type="button"
            className="mr-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-[#2c2c2c] hover:text-white transition-colors cursor-pointer"
            title="Attach signal context"
            onClick={() => handleQuickPrompt("Analyze my channel niche velocity and growth gaps")}
          >
            <span className="text-xl font-light leading-none">+</span>
          </button>

          {/* Central Input */}
          <input
            type="text"
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            placeholder="Ask anything about video ideas, viral hooks, script breakdowns..."
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none border-0"
          />

          {/* Right Action Icons (Think chip, Mic, Audio/Send) */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => handleQuickPrompt(chatQuery ? `Deep research: ${chatQuery}` : "Deep research rising trending concepts in India")}
              className="flex items-center gap-1.5 rounded-full border border-[#333333] bg-[#181818] px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-[#444444] hover:text-white transition-colors cursor-pointer"
            >
              <Lightbulb className="h-3.5 w-3.5 text-neutral-400" />
              <span>Think</span>
            </button>

            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-[#2a2a2a] hover:text-white transition-colors cursor-pointer"
              title="Voice dictation"
              onClick={() => handleQuickPrompt("Brainstorm 5 high-CTR video concepts for my niche")}
            >
              <Mic className="h-4 w-4" />
            </button>

            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-pure-white text-black hover:bg-neutral-200 transition-colors cursor-pointer shadow-sm"
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
              title="Send prompt to AI"
            >
              <ArrowRight className="h-4 w-4" style={{ color: '#000000' }} />
            </button>
          </div>
        </form>

        {/* ChatGPT Prompt Suggestion Pills */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          {[
            { label: "🚀 5 Viral Short Ideas for my Niche", prompt: "Give me 5 viral short video ideas tailored to my channel niche with high novelty.", icon: Sparkles },
            { label: "🪝 3-Second Retention Hook Architect", prompt: "Design 3 irresistible first 3-second hook variations (Visual + Audio script) for my next video.", icon: Zap },
            { label: "📈 Breakout Content Angles in India", prompt: "What are the biggest rising trend opportunities and audience demand gaps in India right now?", icon: TrendingUp },
            { label: "🗓️ 7-Day Growth Content Plan", prompt: "Create a strategic 7-day YouTube posting calendar balancing viral shorts and high-retention concepts.", icon: Film },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickPrompt(item.prompt)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#161616] px-3.5 py-1.5 text-xs text-neutral-300 hover:border-[#3a3a3a] hover:bg-[#1f1f1f] hover:text-white transition-colors cursor-pointer shadow-xs"
            >
              <item.icon className="h-3 w-3 text-neutral-400" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>


      {/* Channel Metric Stat Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 pt-4">
        {stats.map((stat, i) => (
          <StatCard
            key={i}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            icon={renderStatIcon(stat.icon)}
          />
        ))}
      </div>

      {/* Top Predicted Trend Cards Grid (Directly matching wireframe) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
              Top Predicted Opportunities
            </h2>
            <p className="text-xs text-neutral-500">
              Click any concept card to inspect trajectory forecast, audience demand and evidence.
            </p>
          </div>
          <Link
            to="/app/trends"
            className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            Explore all trends
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isTrendsLoading && topTrends.length === 0 ? (
          <AIScannerLoader message="Analyzing signals and vector-matching concepts..." />
        ) : topTrends.length === 0 ? (
          <Card className="py-12 text-center" variant="elevated">
            <TrendingUp className="mx-auto h-7 w-7 text-neutral-600" />
            <h3 className="mt-2 text-sm font-semibold text-neutral-300">
              No trend predictions yet
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Run trend collector or complete onboarding to populate your feed.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {topTrends.map((trend: any) => (
              <Card
                key={trend.id}
                variant="elevated"
                hover
                className="group flex cursor-pointer flex-col justify-between gap-3.5 p-5 border-[#222222] hover:border-[#3a3a3a] transition-all duration-150"
                onClick={() => navigate(`/app/trends/detail/${trend.id}`)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {trend.niches?.slice(0, 1).map((tag: string) => (
                        <Badge key={tag} variant="neutral" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                      <Badge variant="brand" className="text-[10px] capitalize">
                        {trend.archetype}
                      </Badge>
                    </div>
                    {trend.opportunity_score != null && (
                      <span className="shrink-0 rounded bg-[#1f1f1f] border border-[#2c2c2c] px-2 py-0.5 text-[10px] font-bold text-white">
                        {Math.round(trend.opportunity_score ?? trend.tvs_score)} Fit
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {cleanTrendTitle(trend.topic)}
                  </h3>

                  {/* Video Concept Highlight */}
                  <div className="rounded-lg border border-[#282828] bg-[#141414] p-3 transition-colors group-hover:border-[#383838]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-400" />
                        Video Concept
                      </span>
                      <span className="text-[9px] font-medium text-neutral-500 flex items-center gap-1">
                        <Film className="h-2.5 w-2.5" />
                        {resolveVideoConceptBadge(trend)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-neutral-200 leading-snug line-clamp-2">
                      &ldquo;{resolveVideoConcept(trend)}&rdquo;
                    </p>
                  </div>

                  {trend.why_predicted && (
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      <span className="font-semibold text-neutral-300">Why Predicted: </span>
                      {cleanTrendText(trend.why_predicted)}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-3">
                  <div className="flex items-center gap-1 text-xs font-medium text-neutral-400 group-hover:text-white transition-colors">
                    <span>View Concept Graph</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/trends/detail/${trend.id}`);
                    }}
                    className="text-xs px-2.5 py-1 h-7 border-[#2a2a2a] bg-[#161616] hover:bg-[#202020] text-neutral-200"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    View Trend
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Performance Forecast Chart & Priority Insights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card variant="elevated" className="lg:col-span-8 p-5 border-[#222222]">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Performance Forecast
              </h2>
              <p className="text-xs text-neutral-500">Projected view velocity over time</p>
            </div>
            <div className="flex gap-1 rounded-lg border border-[#242424] bg-[#121212] p-1">
              {(['28d', '90d', 'ALL'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setForecastPeriod(tab)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    forecastPeriod === tab
                      ? 'bg-[#222222] text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <MiniBarChart
            data={currentForecast.bars}
            highlightIndex={currentForecast.highlightIndex}
            formatValue={(v) => `${v}K views`}
          />
          <div className="mt-4 flex items-center justify-between rounded-lg border border-[#222222] bg-[#141414] px-3.5 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <BarChart2 className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold text-white">{currentForecast.projectedGrowth} projected</span>
              <span className="text-neutral-500">{currentForecast.comparisonLabel}</span>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="lg:col-span-4 p-5 border-[#222222]">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#181818] text-neutral-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                AI Priority Insights
              </h2>
              <p className="text-[11px] text-neutral-500">{insights.length} actions available</p>
            </div>
          </div>
          {insights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs font-medium text-neutral-400">No pending insights</p>
              <p className="mt-1 text-[11px] text-neutral-600">Your channel strategy is running smoothly.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {insights.map((item, j) => (
                <div
                  key={j}
                  className="group rounded-lg border border-[#222222] bg-[#141414] p-3 transition-colors hover:border-[#333333]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="neutral" className="text-[9px]">
                      Priority {j + 1}
                    </Badge>
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-neutral-200">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">{item.impact}</p>
                </div>
              ))}
            </div>
          )}
          <Link to="/app/trends">
            <Button variant="secondary" className="mt-4 w-full text-xs">
              Explore All Trends
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};
