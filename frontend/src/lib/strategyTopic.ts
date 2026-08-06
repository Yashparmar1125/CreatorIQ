export interface StrategyBrief {
  topic: string;
  titles: { text: string; hook_type?: string }[];
  strategy_insight: string;
  script_outline: {
    hook: string;
    retention_mid: string;
    cta: string;
  };
  tags: string[];
}

/** Clean YouTube-style titles (hashtags, pipes, emoji noise) for LLM prompts. */
export function sanitizeStrategyTopic(raw: string): string {
  const withoutTags = raw.replace(/#\w+/g, ' ').replace(/\|/g, ' ');
  const cleaned = withoutTags.replace(/\s+/g, ' ').trim();
  return cleaned || raw.trim();
}

export function normalizeStrategyBrief(
  payload: unknown,
  displayTopic: string
): StrategyBrief {
  const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;

  const titlesRaw = (data.titles ?? data.optimized_titles ?? []) as unknown[];
  const titles = titlesRaw
    .map((item) => {
      if (typeof item === 'string' && item.trim()) {
        return { text: item.trim(), hook_type: 'Curiosity' };
      }
      if (item && typeof item === 'object') {
        const row = item as Record<string, unknown>;
        const text = String(row.text ?? row.title ?? '').trim();
        if (!text) return null;
        return {
          text,
          hook_type: String(row.hook_type ?? row.angle ?? 'Custom'),
        };
      }
      return null;
    })
    .filter(Boolean) as StrategyBrief['titles'];

  const outlineRaw = (data.script_outline ?? data.outline ?? {}) as Record<string, unknown> | string;
  let script_outline: StrategyBrief['script_outline'];
  if (typeof outlineRaw === 'string') {
    script_outline = {
      hook: outlineRaw.slice(0, 280),
      retention_mid: 'Deliver the core value with fast cuts and pattern interrupts.',
      cta: 'Ask viewers to subscribe and comment.',
    };
  } else {
    const sections = outlineRaw.sections;
    const retention =
      outlineRaw.retention_mid ??
      outlineRaw.retention ??
      outlineRaw.mid ??
      (Array.isArray(sections) ? sections.slice(0, 3).join('; ') : '');
    script_outline = {
      hook: String(outlineRaw.hook ?? outlineRaw.intro ?? '').trim(),
      retention_mid: String(retention).trim(),
      cta: String(outlineRaw.cta ?? outlineRaw.call_to_action ?? '').trim(),
    };
  }

  const tagsRaw = (data.tags ?? data.seo_tags ?? []) as unknown[];
  const tags = tagsRaw
    .map((t) => String(t).replace(/^#/, '').trim())
    .filter(Boolean)
    .slice(0, 12);

  const strategy_insight = String(
    data.strategy_insight ?? data.insight ?? data.strategy ?? ''
  ).trim();

  return {
    topic: displayTopic.trim() || String(data.source_topic ?? '').trim(),
    titles,
    strategy_insight,
    script_outline,
    tags,
  };
}
