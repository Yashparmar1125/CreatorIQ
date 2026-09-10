/**
 * Sanitizes trend titles by removing hashtags (#shorts, #viral, #unboxing),
 * cleaning up raw search artifacts, and formatting clean logical titles.
 */
export function cleanTrendTitle(text?: string | null): string {
  if (!text) return 'Trending Opportunity';

  let cleaned = text
    // Remove hashtags (e.g. #shorts, #unboxing, #m3)
    .replace(/#\w+/gi, '')
    // Remove orphan # symbols
    .replace(/#/g, '')
    // Replace underscores or hyphens used as tag separators with spaces
    .replace(/_/g, ' ')
    // Remove multi-spaces
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'Trending Opportunity';

  // Capitalize first letter of each word if title is all lowercase
  if (cleaned === cleaned.toLowerCase()) {
    cleaned = cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return cleaned;
}

/**
 * Sanitizes description text (Why Predicted, Action Plan, Growth Tips) by stripping hashtags.
 */
export function cleanTrendText(text?: string | null): string {
  if (!text) return '';

  return text
    // Remove hashtags (e.g. #shorts, #unboxing, #m3)
    .replace(/#\w+/gi, '')
    // Remove orphan # symbols
    .replace(/#/g, '')
    // Remove multi-spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves or synthesizes a clean, high-impact video concept for a trend card.
 */
export function resolveVideoConcept(trend: {
  video_concept?: string | null;
  content_angle?: string | null;
  action_plan?: string | null;
  growth_tip?: string | null;
  headline?: string | null;
  topic?: string | null;
  niches?: string[] | null;
  supported_formats?: string[] | null;
}): string {
  if (trend.video_concept && trend.video_concept.trim()) {
    return cleanTrendText(trend.video_concept);
  }
  if (trend.content_angle && trend.content_angle.trim()) {
    return cleanTrendText(trend.content_angle);
  }
  // Check if headline has a distinct concept
  if (trend.headline && trend.headline !== trend.topic && !trend.headline.toLowerCase().startsWith('rising in')) {
    return cleanTrendText(trend.headline);
  }
  const title = cleanTrendTitle(trend.topic);
  const niche = trend.niches?.[0] || 'creators';
  const isShorts = trend.supported_formats?.includes('shorts') || trend.supported_formats?.includes('both');

  if (isShorts) {
    return `Test the viral '${title}' format with an immediate 3-second hook tailored for ${niche} viewers.`;
  }
  return `Deep dive into the '${title}' trend with a unique ${niche} reaction and breakdown.`;
}
