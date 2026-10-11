import React, { createContext, useState, ReactNode, useCallback } from 'react';
import { FileRecord } from '../services/types';
import {
  getSavedFiles,
  saveFileRecord,
  deleteFileRecord,
  togglePinRecord,
} from '../services/fileService';

interface FileContextType {
  activeFile: FileRecord | null;
  setActiveFile: (file: FileRecord | null) => void;

  // Multi-file mode (folder or multiple selected files)
  multiFiles: FileRecord[];
  setMultiFiles: (files: FileRecord[]) => void;
  clearMultiFiles: () => void;

  savedFiles: FileRecord[];
  saveActive: () => void;
  deleteFile: (id: string) => void;
  pinFile: (id: string) => void;
  loadSaved: () => void;

  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
}

export const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [activeFile, setActiveFileState] = useState<FileRecord | null>(null);
  const [multiFiles, setMultiFilesState] = useState<FileRecord[]>([]);
  const [savedFiles, setSavedFiles] = useState<FileRecord[]>(() => getSavedFiles());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setActiveFile = useCallback((file: FileRecord | null) => {
    setActiveFileState(file);
    setError(null);
  }, []);

  const setMultiFiles = useCallback((files: FileRecord[]) => {
    setMultiFilesState(files);
    setActiveFileState(null);
    setError(null);
  }, []);

  const clearMultiFiles = useCallback(() => {
    setMultiFilesState([]);
  }, []);

  const saveActive = useCallback(() => {
    if (!activeFile) return;
    const updated = saveFileRecord({ ...activeFile, savedAt: Date.now() });
    setSavedFiles(updated);
  }, [activeFile]);

  const deleteFile = useCallback((id: string) => {
    const updated = deleteFileRecord(id);
    setSavedFiles(updated);
  }, []);

  const pinFile = useCallback((id: string) => {
    const updated = togglePinRecord(id);
    setSavedFiles(updated);
  }, []);

  const loadSaved = useCallback(() => {
    setSavedFiles(getSavedFiles());
  }, []);

  return (
    <FileContext.Provider
      value={{
        activeFile, setActiveFile,
        multiFiles, setMultiFiles, clearMultiFiles,
        savedFiles, saveActive, deleteFile, pinFile, loadSaved,
        loading, setLoading,
        error, setError,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}
