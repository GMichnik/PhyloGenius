export interface Taxon {
  id: string;
  name: string;
  scientificName?: string;
  description: string;
  imageUrl?: string; // We'll use picsum or emoji if not available
  wikipediaUrl?: string; // Link to the wikipedia page
  emoji: string;
  isFossil?: boolean; // True if the species is extinct/fossil
}

export interface Character {
  id: string;
  name: string;
  description: string;
}

// The AI response structure
export interface ExerciseData {
  title: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  taxons: Taxon[];
  characters: Character[];
  // Key: taxonId, Value: Array of characterIds that are PRESENT
  correctMatrix: Record<string, string[]>; 
  // For the tree: An ordered list of "nodes". 
  // In a simplified school context, we often organize by "nesting" or a linear evolution line.
  // We will ask the AI for a "linear" sequence if possible for simplicity, or we handle simple branching.
  // To keep the UI buildable, we will treat the tree as a sequence of innovations (characters) and branching taxons.
  evolutionOrder: {
    characterId: string | null; // The innovation at this node (null for the root start)
    branchingTaxonId: string | null; // The taxon that branches off here (or stays on the main line)
  }[];
}

export type AppState = 'setup' | 'loading' | 'info' | 'matrix' | 'tree' | 'success';

export interface CellState {
  present: boolean | null; // true = present, false = absent, null = unset
}