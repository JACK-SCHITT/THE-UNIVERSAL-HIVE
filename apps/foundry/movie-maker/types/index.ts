/**
 * Type definitions for AI Movie Maker - Book Adaptation
 */

export interface Character {
  id: string;
  name: string;
  description: string;
  appearance: string;
  personality: string;
  role: string;
  imageUrl?: string;
  aliases?: string[];
  firstAppearance?: string; // Chapter/page reference
  relationships?: { characterId: string; relationship: string }[];
  createdAt: Date;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  characters: string[]; // character IDs
  setting: string;
  mood: string;
  action: string;
  order: number;
  chapterId?: string;
  sourceText?: string; // Original book excerpt
  thumbnailUrl?: string;
  videoUrl?: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  scenes: Scene[];
  estimatedDuration: number; // in minutes
  processed: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  pageCount: number;
  wordCount: number;
  chapters: Chapter[];
  characters: Character[];
  rawContent?: string;
  importMethod: BookImportMethod;
  contentRating: ContentRating;
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  scenes: Scene[];
  characters: Character[];
  duration: number; // estimated total duration in minutes
  bookId?: string; // source book if adapted
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'generating' | 'completed';
  videoUrl?: string;
}

export interface MovieGenerationProgress {
  storyId: string;
  currentScene: number;
  totalScenes: number;
  progress: number; // 0-100
  status: 'preparing' | 'analyzing' | 'generating' | 'processing' | 'finalizing' | 'complete';
  estimatedTimeRemaining: number; // in seconds
  currentTask?: string;
}

export interface AIAnalysisResult {
  characters: Partial<Character>[];
  scenes: Partial<Scene>[];
  synopsis: string;
  themes: string[];
  estimatedDuration: number;
  chapterCount: number;
}

export type StoryInputMethod = 'freeText' | 'sceneByScene' | 'template' | 'characterFirst' | 'bookImport';
export type BookImportMethod = 'paste' | 'type' | 'upload';
export type ContentRating = 'PG' | 'PG-13' | 'R' | 'NC-17' | 'Unrated';

export interface StoryTemplate {
  id: string;
  name: string;
  genre: string;
  description: string;
  sceneCount: number;
  estimatedDuration: number;
}
