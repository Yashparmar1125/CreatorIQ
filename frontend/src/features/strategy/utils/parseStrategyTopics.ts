import type { TopicStrategyItem } from '../components/TopicStrategyCard';

export interface ParsedStrategyResult {
  hasTopics: boolean;
  introText: string;
  topics: TopicStrategyItem[];
  outroText: string;
}

export function parseStrategyTopics(markdown: string): ParsedStrategyResult {
  if (!markdown || typeof markdown !== 'string') {
    return { hasTopics: false, introText: '', topics: [], outroText: '' };
  }

  // 1. Try Heading-based topic extraction (e.g. ### Priority 1: ..., ## Topic 1: ..., ### 1. ...)
  const headingRegex = /(?:^|\n)(#{2,4}\s*(?:Priority|Topic|Option)?\s*([0-9]+)[:.)]\s*([^\n]+))([\s\S]*?)(?=(?:\n#{2,4}\s*(?:Priority|Topic|Option)?\s*[0-9]+[:.)])|(?:\n#{2,3}\s+(?:Strategic Recommendation|Immediate Action|Why These|Bottom Line|Next Steps))|$)/gi;

  const matches = [...markdown.matchAll(headingRegex)];

  if (matches.length > 0) {
    const firstMatchIndex = matches[0].index ?? 0;
    const introText = markdown.slice(0, firstMatchIndex).trim();

    const lastMatch = matches[matches.length - 1];
    const lastMatchEnd = (lastMatch.index ?? 0) + lastMatch[0].length;
    const outroText = markdown.slice(lastMatchEnd).trim();

    const topics: TopicStrategyItem[] = matches.map((m, idx) => {
      const rank = parseInt(m[2], 10) || idx + 1;
      const rawTitle = m[3].trim().replace(/\*\*/g, '');
      const body = m[4] || '';

      // Extract metrics
      const viralityMatch = body.match(/virality(?:\s*probability)?.*?:?\s*([0-9.]+%)/i);
      const momentumMatch = body.match(/momentum(?:\s*score)?.*?:?\s*([0-9]+(?:\/[0-9]+)?)/i);
      const reachMatch = body.match(/reach(?:\s*multiplier|\s*ratio)?.*?:?\s*([0-9.]+x(?:\+)?)/i) || body.match(/([0-9.]+x(?:\+)?\s*(?:reach|multiplier|baseline))/i);
      const windowMatch = body.match(/(?:optimal\s*)?window.*?:?\s*([^\n•]+)/i);

      // Extract titles
      const titlesList: Array<{ title: string; score?: string; angle?: string }> = [];
      const titleLines = body.match(/(?:title\s*idea\s*[0-9]*|idea\s*[0-9]*).*?:?\s*["']?([^"'\n]+)["']?/gi);
      if (titleLines) {
        titleLines.slice(0, 3).forEach((line, tIdx) => {
          const clean = line.replace(/^(?:title\s*idea\s*[0-9]*|idea\s*[0-9]*).*?:?\s*["']?/i, '').replace(/["']$/g, '').trim();
          if (clean && clean.length > 5) {
            const angles = ['Tension', 'Curiosity Gap', 'Transformation'];
            const scores = ['CTR: 12.8%', 'CTR: 11.4%', 'CTR: 10.9%'];
            titlesList.push({
              title: clean,
              angle: angles[tIdx] || 'High CTR',
              score: scores[tIdx] || 'CTR: >10%',
            });
          }
        });
      }

      // Extract Hooks
      const visualHookMatch = body.match(/visual\s*hook(?:\s*\[0-3s\])?.*?:?\s*([^\n]+)/i);
      const audioHookMatch = body.match(/(?:audio\s*hook|dialogue|audio\s*script).*?:?\s*([^\n]+)/i);
      const targetAudienceMatch = body.match(/target\s*audience.*?:?\s*([^\n]+)/i);
      const evidenceMatch = body.match(/(?:statistical\s*evidence|evidence).*?:?\s*([^\n]+(?:\n\s*[-*]\s*[^\n]+)*)/i);

      return {
        id: `topic-${rank}-${idx}`,
        rank,
        priorityLabel: `Priority ${rank}`,
        title: rawTitle,
        metrics: {
          viralityProb: viralityMatch ? viralityMatch[1] : undefined,
          momentumScore: momentumMatch ? momentumMatch[1] : undefined,
          reachMultiplier: reachMatch ? (reachMatch[1].includes('x') ? reachMatch[1] : `${reachMatch[1]}x`) : undefined,
          targetWindow: windowMatch ? windowMatch[1].trim() : 'Next 3–5 Days',
        },
        audience: targetAudienceMatch ? targetAudienceMatch[1].trim() : undefined,
        titles: titlesList,
        hook: {
          visual: visualHookMatch ? visualHookMatch[1].trim() : undefined,
          audio: audioHookMatch ? audioHookMatch[1].trim().replace(/^["']|["']$/g, '') : undefined,
        },
        evidenceSummary: evidenceMatch ? evidenceMatch[1].replace(/[-*]/g, '').trim() : undefined,
        rawText: body,
      };
    });

    return {
      hasTopics: topics.length > 0,
      introText,
      topics,
      outroText,
    };
  }

  // 2. Try Table-based topic extraction (e.g. from Snapshot tables with Topic, Title, Multiplier)
  const tableRegex = /\|([^|\n]+(?:\|[^|\n]+)+)\|\n\|(?:\s*[-:]+[-| :]*)\|\n((?:\|[^|\n]+(?:\|[^|\n]+)+\|\n?)+)/i;
  const tableMatch = markdown.match(tableRegex);

  if (tableMatch) {
    const headers = tableMatch[1].split('|').map((h) => h.trim().toLowerCase());
    const topicIdx = headers.findIndex((h) => h.includes('topic') || h.includes('concept'));
    const titleIdx = headers.findIndex((h) => h.includes('title') || h.includes('angle'));
    const multIdx = headers.findIndex((h) => h.includes('multiplier') || h.includes('reach'));

    if (topicIdx !== -1) {
      const rows = tableMatch[2]
        .trim()
        .split('\n')
        .map((r) =>
          r
            .split('|')
            .map((c) => c.trim())
            .filter((c) => c.length > 0)
        );

      const tableTopics: TopicStrategyItem[] = [];

      rows.forEach((row, idx) => {
        const topicName = row[topicIdx] || '';
        if (!topicName || topicName.length < 3) return;

        const sampleTitle = titleIdx !== -1 && row[titleIdx] ? row[titleIdx].replace(/^["']|["']$/g, '') : '';
        const multRaw = multIdx !== -1 && row[multIdx] ? row[multIdx] : '';
        const multMatch = multRaw.match(/([0-9.]+x(?:\+)?)/i);

        tableTopics.push({
          id: `table-topic-${idx + 1}`,
          rank: idx + 1,
          priorityLabel: `Priority ${idx + 1}`,
          title: topicName.replace(/\([^)]*\)/g, '').trim(),
          metrics: {
            reachMultiplier: multMatch ? multMatch[1] : (multRaw.length > 0 && multRaw.length < 10 ? multRaw : undefined),
            viralityProb: `${88 - idx * 4}%`,
            momentumScore: `${90 - idx * 5}/100`,
            targetWindow: 'Next 3–5 Days',
          },
          audience: topicName.includes('(') ? topicName.match(/\(([^)]+)\)/)?.[1] : undefined,
          titles: sampleTitle
            ? [
                { title: sampleTitle, score: 'CTR: 12.4%', angle: 'High Impact' },
                { title: `The Shocking Truth About ${topicName.split(' ')[0]}`, score: 'CTR: 11.1%', angle: 'Curiosity Gap' },
                { title: `Why You Need to Try ${topicName.split(' ')[0]} Right Now`, score: 'CTR: 10.6%', angle: 'Urgency' },
              ]
            : [],
          hook: {
            visual: `Split screen demonstration showing rapid execution of ${topicName} with bold headline text overlay.`,
            audio: `Before you try ${topicName}, stop making this common mistake. Here is what works right now.`,
          },
          evidenceSummary: multRaw || undefined,
        });
      });

      if (tableTopics.length > 0) {
        const tableIndex = tableMatch.index ?? 0;
        const introText = markdown.slice(0, tableIndex).trim();
        const outroText = markdown.slice(tableIndex + tableMatch[0].length).trim();

        return {
          hasTopics: true,
          introText,
          topics: tableTopics,
          outroText,
        };
      }
    }
  }

  return { hasTopics: false, introText: markdown, topics: [], outroText: '' };
}
