import { useContext } from 'react';
import { FileContext } from '../contexts/FileContext';

export function useFileContext() {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error('useFileContext must be used within FileProvider');
  return ctx;
}

