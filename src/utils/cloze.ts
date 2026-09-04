/**
 * Cloze Keyword Extraction and Management Utilities
 */

export const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',
  // Be verbs & auxiliary
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'done', 'doing',
  // Modals
  'can', 'could', 'shall', 'should', 'will', 'would', 'may', 'might', 'must',
  // Pronouns
  'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves',
  'this', 'that', 'these', 'those',
  'who', 'whom', 'whose', 'which', 'what', 'whatever',
  // Prepositions & conjunctions
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down',
  'about', 'into', 'over', 'after', 'before', 'between', 'under', 'through',
  'and', 'but', 'or', 'so', 'because', 'as', 'if', 'than', 'while', 'where',
  'when', 'how', 'why', 'whether', 'though', 'although', 'even',
  // Adverbs & particles
  'not', 'no', 'nor', 'too', 'very', 'also', 'just', 'only', 'there', 'here',
  'now', 'then', 'again', 'ever', 'never', 'well', 'much', 'more', 'most',
  'such', 'some', 'any', 'each', 'all', 'both', 'few', 'other', 'another',
  // Numbers
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'
]);

/**
 * Extracts smart vocabulary keywords from an English sentence for cloze exercises.
 * Filters out common stop words, prioritizes longer CET-6 key vocabulary.
 */
export function extractSmartClozeKeywords(sentence: string, maxCount: number = 3): string[] {
  if (!sentence || !sentence.trim()) return [];

  const words = sentence.trim().split(/\s+/);
  const candidates: { word: string; clean: string; length: number; originalIndex: number }[] = [];
  const seen = new Set<string>();

  words.forEach((w, idx) => {
    const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (clean.length >= 3 && !seen.has(clean)) {
      seen.add(clean);
      candidates.push({
        word: w.replace(/[^a-zA-Z]/g, ''),
        clean,
        length: clean.length,
        originalIndex: idx,
      });
    }
  });

  // Filter out stop words
  const nonStopWords = candidates.filter((c) => !STOP_WORDS.has(c.clean));

  let chosen: typeof candidates = [];

  if (nonStopWords.length > 0) {
    // Sort by length, prioritizing longer words (length >= 5)
    const sorted = [...nonStopWords].sort((a, b) => {
      const aScore = a.length >= 5 ? a.length + 10 : a.length;
      const bScore = b.length >= 5 ? b.length + 10 : b.length;
      return bScore - aScore;
    });
    chosen = sorted.slice(0, maxCount).sort((a, b) => a.originalIndex - b.originalIndex);
  } else if (candidates.length > 0) {
    // If all words are stop words, pick the longest candidates
    const sorted = [...candidates].sort((a, b) => b.length - a.length);
    chosen = sorted.slice(0, Math.min(maxCount, candidates.length)).sort((a, b) => a.originalIndex - b.originalIndex);
  }

  return chosen.map((c) => c.clean);
}
