/**
 * Book Analysis Service - AI-powered book parsing
 * Handles: character extraction, scene breakdown, chapter splitting
 * No content filtering - processes all content as-is from user's book
 */

import { Book, Chapter, Scene, Character, AIAnalysisResult, ContentRating } from '../types';

// ─────────────────────────────────────────────
// TEXT UTILITIES
// ─────────────────────────────────────────────

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimatePageCount(wordCount: number): number {
  // Standard ~250 words per book page
  return Math.round(wordCount / 250);
}

export function estimateReadingTime(wordCount: number): number {
  // Average reading speed ~250 wpm
  return Math.round(wordCount / 250);
}

export function estimateScreenTime(wordCount: number): number {
  // ~1 min of screen time per 1,000 words (adaptation compression)
  return Math.max(60, Math.round(wordCount / 1000));
}

// ─────────────────────────────────────────────
// CHAPTER SPLITTING
// ─────────────────────────────────────────────

export function splitIntoChapters(rawText: string): Chapter[] {
  // Detect chapter patterns: "Chapter 1", "CHAPTER ONE", "1.", "Part I", etc.
  const chapterPatterns = [
    /^(chapter\s+[\divxlcIVXLC]+[\s\S]*?)$/im,
    /^(part\s+[\divxlcIVXLC]+[\s\S]*?)$/im,
    /^(prologue|epilogue|introduction|preface)$/im,
    /^(\d+\.\s+\w+.*)$/m,
    /^(#{1,2}\s+.+)$/m, // Markdown headers
  ];

  let chapters: Chapter[] = [];
  let hasChapterMarkers = false;

  // Try to find chapter breaks
  for (const pattern of chapterPatterns) {
    const matches = rawText.match(new RegExp(pattern.source, 'gim'));
    if (matches && matches.length > 2) {
      hasChapterMarkers = true;
      break;
    }
  }

  if (hasChapterMarkers) {
    // Split by chapter markers
    const parts = rawText.split(/^(chapter\s+[\w\s]+|part\s+[\w\s]+|\d+\.\s+\w[^\n]*|#{1,2}\s+.+)$/im);
    let chapterNum = 1;

    for (let i = 0; i < parts.length; i += 2) {
      const title = parts[i + 1] || `Chapter ${chapterNum}`;
      const content = (parts[i + 2] || parts[i] || '').trim();
      if (content.length < 100) continue;

      const wc = countWords(content);
      chapters.push({
        id: `ch_${chapterNum}`,
        number: chapterNum,
        title: title.trim().replace(/^#{1,2}\s+/, ''),
        content,
        wordCount: wc,
        scenes: [],
        estimatedDuration: Math.max(5, Math.round(wc / 1000)),
        processed: false,
      });
      chapterNum++;
    }
  }

  // Fallback: split every ~5,000 words (≈20 pages)
  if (chapters.length === 0) {
    const words = rawText.split(/\s+/);
    const chunkSize = 5000;
    let chapterNum = 1;

    for (let i = 0; i < words.length; i += chunkSize) {
      const content = words.slice(i, i + chunkSize).join(' ');
      const wc = countWords(content);
      chapters.push({
        id: `ch_${chapterNum}`,
        number: chapterNum,
        title: `Chapter ${chapterNum}`,
        content,
        wordCount: wc,
        scenes: [],
        estimatedDuration: Math.max(5, Math.round(wc / 1000)),
        processed: false,
      });
      chapterNum++;
    }
  }

  return chapters;
}

// ─────────────────────────────────────────────
// AI ANALYSIS (MOCKED - connects to OnSpace AI when backend ready)
// ─────────────────────────────────────────────

/**
 * Analyze book content and extract structured data
 * No content restrictions — processes all user-provided book content
 */
export async function analyzeBookContent(
  rawText: string,
  title: string,
  onProgress?: (step: string, pct: number) => void
): Promise<AIAnalysisResult> {

  onProgress?.('Splitting chapters...', 5);
  await delay(400);

  const wordCount = countWords(rawText);
  const chapters = splitIntoChapters(rawText);

  onProgress?.('Extracting characters...', 20);
  await delay(800);

  // Mock character extraction — real version sends chapters to OnSpace AI
  const characters = extractCharactersMock(rawText, title);

  onProgress?.('Breaking down scenes...', 50);
  await delay(1000);

  const scenes = generateScenesMock(chapters, characters);

  onProgress?.('Generating synopsis...', 75);
  await delay(600);

  const synopsis = generateSynopsisMock(title, wordCount, characters);

  onProgress?.('Estimating runtime...', 90);
  await delay(300);

  const estimatedDuration = estimateScreenTime(wordCount);

  onProgress?.('Analysis complete', 100);
  await delay(200);

  return {
    characters,
    scenes,
    synopsis,
    themes: ['Drama', 'Character Study', 'Narrative'],
    estimatedDuration,
    chapterCount: chapters.length,
  };
}

// ─────────────────────────────────────────────
// MOCK HELPERS
// ─────────────────────────────────────────────

function extractCharactersMock(text: string, bookTitle: string): Partial<Character>[] {
  // Look for capitalized names that appear frequently (simple heuristic)
  const namePattern = /\b([A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?)\b/g;
  const names: Record<string, number> = {};

  let match;
  while ((match = namePattern.exec(text.slice(0, 50000))) !== null) {
    const name = match[1];
    // Skip common words
    const skip = ['The', 'She', 'Her', 'His', 'Him', 'They', 'Their', 'This', 'That',
      'With', 'From', 'Have', 'Been', 'Will', 'Would', 'Could', 'Should'];
    if (!skip.includes(name)) {
      names[name] = (names[name] || 0) + 1;
    }
  }

  // Take top recurring names (likely characters)
  const sorted = Object.entries(names)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  return sorted.map(([name], i) => ({
    id: `char_${i}`,
    name,
    role: i === 0 ? 'Protagonist' : i === 1 ? 'Deuteragonist' : 'Supporting',
    description: `A key character in ${bookTitle}`,
    appearance: 'To be defined from book context',
    personality: 'To be defined from book context',
    aliases: [],
    firstAppearance: 'Chapter 1',
    createdAt: new Date(),
  }));
}

function generateScenesMock(chapters: Chapter[], characters: Partial<Character>[]): Partial<Scene>[] {
  const scenes: Partial<Scene>[] = [];
  let sceneIndex = 0;

  chapters.forEach((chapter) => {
    // Roughly 2-4 scenes per chapter
    const sceneCount = Math.max(2, Math.min(4, Math.floor(chapter.wordCount / 800)));
    const sceneDuration = Math.round((chapter.estimatedDuration * 60) / sceneCount);

    for (let i = 0; i < sceneCount; i++) {
      const charIds = characters
        .slice(0, 3)
        .map(c => c.id)
        .filter(Boolean) as string[];

      scenes.push({
        id: `scene_${sceneIndex}`,
        title: `${chapter.title} - Scene ${i + 1}`,
        description: `Scene from ${chapter.title}: ${chapter.content.slice(i * 300, (i + 1) * 300).trim()}...`,
        duration: sceneDuration,
        characters: charIds,
        setting: 'To be rendered from book description',
        mood: ['tense', 'calm', 'dramatic', 'intimate', 'action'][sceneIndex % 5],
        action: 'Adapting from source text',
        order: sceneIndex,
        chapterId: chapter.id,
        sourceText: chapter.content.slice(i * 500, (i + 1) * 500),
      });
      sceneIndex++;
    }
  });

  return scenes;
}

function generateSynopsisMock(title: string, wordCount: number, characters: Partial<Character>[]): string {
  const mainChars = characters.slice(0, 3).map(c => c.name).join(', ');
  const pages = estimatePageCount(wordCount);
  return `${title} is a ${pages}-page story featuring ${mainChars || 'compelling characters'}. ` +
    `This adaptation spans approximately ${estimateScreenTime(wordCount)} minutes of cinematic content.`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
