import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useStrategyStore } from '../../../stores/useStrategyStore';
import { Sparkles, Copy, Check, Lightbulb, Target, Brain, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';
import { sanitizeStrategyTopic } from '../../../lib/strategyTopic';

export const StrategyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const { brief, isLoading, error, generateBrief } = useStrategyStore();
  const handledNavState = useRef(false);

  useEffect(() => {
    const state = location.state as { topic?: string; autoGenerate?: boolean } | null;
    if (!state?.topic || handledNavState.current) return;

    handledNavState.current = true;
    const nextTopic = state.topic.trim();
    setTopic(nextTopic);
    if (state.autoGenerate && nextTopic) {
      void generateBrief(nextTopic);
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate, generateBrief]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 pb-6 animate-in">
      <PageHeader
        title={<span className="text-gradient-brand">Strategy</span>}
        description="Generate a data-backed content brief grounded in your channel profile."
      />

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <Card variant="elevated" className="space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-500">Target topic</label>
              <div className="mt-1.5">
                <Input
                  icon={<Lightbulb className="h-4 w-4" />}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. comedy shorts trends"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500">Primary goal</label>
              <div className="relative mt-1.5">
                <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <select className="h-9 w-full appearance-none rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/10">
                  <option>Max engagement</option>
                  <option>Audience growth</option>
                  <option>Monetization focus</option>
                </select>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                const cleaned = sanitizeStrategyTopic(topic);
                if (cleaned) void generateBrief(cleaned);
              }}
              disabled={isLoading || !sanitizeStrategyTopic(topic)}
            >
              {isLoading ? 'Generating...' : 'Generate strategy'}
            </Button>
          </Card>

          <Card variant="dark">
            <Sparkles className="h-4 w-4 text-brand-300" />
            <h3 className="mt-3 text-sm font-medium">AI advantage</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Strategies use your real niche data and channel context via OpenRouter.
            </p>
          </Card>
        </div>

        <div className="lg:col-span-8">
          {!brief ? (
            <Card variant="elevated" className="flex min-h-[320px] flex-col items-center justify-center border-dashed border-brand-200/50 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 ring-1 ring-brand-200/50 text-brand-600">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-base font-medium text-neutral-900">
                {isLoading ? 'Generating your strategy...' : 'Waiting for input'}
              </h3>
              <p className="mt-2 max-w-xs text-sm text-neutral-500">
                {isLoading
                  ? 'AI is building titles, hooks, and a script outline for your topic.'
                  : 'Enter a topic to generate a data-backed content strategy.'}
              </p>
              {isLoading && <Loader2 className="mt-4 h-6 w-6 animate-spin text-brand-600" />}
            </Card>
          ) : (
            <Card variant="elevated" className="space-y-8">
              <section>
                <p className="text-xs font-medium text-brand-600">Growth strategy</p>
                <h2 className="mt-1 text-xl font-semibold text-neutral-900">{brief.topic}</h2>
                <p className="mt-4 rounded-lg border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
                  <Sparkles className="mb-1 inline h-4 w-4 text-brand-600" /> {brief.strategy_insight}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-medium text-neutral-900">Optimized titles</h3>
                <div className="mt-3 space-y-2">
                  {(brief.titles ?? []).map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{t.text}</p>
                        <p className="text-xs text-neutral-500">{t.hook_type || 'Custom hook'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(t.text, i)}
                        className="rounded p-1.5 text-neutral-400 hover:bg-white hover:text-brand-600"
                      >
                        {copied === i ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-medium text-neutral-900">Script outline</h3>
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg bg-neutral-900 p-4 text-white">
                    <p className="text-xs text-brand-400">Hook</p>
                    <p className="mt-2 text-sm">{brief.script_outline?.hook}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 p-4">
                    <p className="text-xs text-neutral-500">Retention</p>
                    <p className="mt-2 text-sm text-neutral-800">{brief.script_outline?.retention_mid}</p>
                  </div>
                  <div className="rounded-lg bg-brand-600 p-4 text-white">
                    <p className="text-xs text-white/70">CTA</p>
                    <p className="mt-2 text-sm">{brief.script_outline?.cta}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-medium text-neutral-900">SEO tags</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(brief.tags ?? []).map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
