import { useContext } from 'react';
import { CharacterContext } from '@/contexts/CharacterContext';

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (!context) throw new Error('useCharacter must be used within CharacterProvider');
  return context;
}
