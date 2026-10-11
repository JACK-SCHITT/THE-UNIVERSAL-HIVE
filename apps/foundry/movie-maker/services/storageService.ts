/**
 * Local Storage Service - Book, Story & Character Data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story, Character, Book } from '../types';

const STORIES_KEY = '@movie_maker_stories';
const CHARACTERS_KEY = '@movie_maker_characters';
const BOOKS_KEY = '@movie_maker_books';

export const storageService = {
  // === BOOKS ===
  async getBooks(): Promise<Book[]> {
    try {
      const data = await AsyncStorage.getItem(BOOKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveBook(book: Book): Promise<void> {
    try {
      const books = await this.getBooks();
      const index = books.findIndex(b => b.id === book.id);
      if (index >= 0) books[index] = book;
      else books.push(book);
      await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    } catch (error) {
      throw error;
    }
  },

  async getBook(bookId: string): Promise<Book | null> {
    try {
      const books = await this.getBooks();
      return books.find(b => b.id === bookId) || null;
    } catch {
      return null;
    }
  },

  async deleteBook(bookId: string): Promise<void> {
    try {
      const books = await this.getBooks();
      await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books.filter(b => b.id !== bookId)));
    } catch (error) {
      throw error;
    }
  },

  // === STORIES ===
  async getStories(): Promise<Story[]> {
    try {
      const data = await AsyncStorage.getItem(STORIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveStory(story: Story): Promise<void> {
    try {
      const stories = await this.getStories();
      const index = stories.findIndex(s => s.id === story.id);
      if (index >= 0) stories[index] = story;
      else stories.push(story);
      await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(stories));
    } catch (error) {
      throw error;
    }
  },

  async getStory(storyId: string): Promise<Story | null> {
    try {
      const stories = await this.getStories();
      return stories.find(s => s.id === storyId) || null;
    } catch {
      return null;
    }
  },

  async deleteStory(storyId: string): Promise<void> {
    try {
      const stories = await this.getStories();
      await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(stories.filter(s => s.id !== storyId)));
    } catch (error) {
      throw error;
    }
  },

  // === CHARACTERS ===
  async getCharacters(): Promise<Character[]> {
    try {
      const data = await AsyncStorage.getItem(CHARACTERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveCharacter(character: Character): Promise<void> {
    try {
      const characters = await this.getCharacters();
      const index = characters.findIndex(c => c.id === character.id);
      if (index >= 0) characters[index] = character;
      else characters.push(character);
      await AsyncStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
    } catch (error) {
      throw error;
    }
  },

  async deleteCharacter(characterId: string): Promise<void> {
    try {
      const characters = await this.getCharacters();
      await AsyncStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters.filter(c => c.id !== characterId)));
    } catch (error) {
      throw error;
    }
  },
};
