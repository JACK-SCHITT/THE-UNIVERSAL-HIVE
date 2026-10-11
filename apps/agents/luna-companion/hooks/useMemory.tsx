import { useState, useEffect, useCallback } from 'react';
import { memoryService, Memory } from '@/services/memoryService';
import { useCharacter } from './useCharacter';

export function useMemory() {
  const { currentCharacter } = useCharacter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentCharacter) {
      load();
    } else {
      setMemories([]);
    }
  }, [currentCharacter?.id]);

  const load = useCallback(async () => {
    if (!currentCharacter) return;
    setLoading(true);
    const data = await memoryService.loadMemories(currentCharacter.id);
    setMemories(data);
    setLoading(false);
  }, [currentCharacter?.id]);

  const deleteMemory = async (id: string) => {
    const ok = await memoryService.deleteMemory(id);
    if (ok) setMemories(prev => prev.filter(m => m.id !== id));
  };

  const memoryPromptBlock = memoryService.formatMemoriesForPrompt(memories);

  return { memories, loading, deleteMemory, refreshMemories: load, memoryPromptBlock };
}
