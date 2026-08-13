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
