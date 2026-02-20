import { GoogleGenAI, Type } from "@google/genai";
import { ExerciseData, Taxon, Character } from "../types";

const SYSTEM_INSTRUCTION = `
Tu es un professeur de SVT (Biologie) expert pour le niveau collège en France. 
Tu dois générer des exercices de classification phylogénétique (Cladistique).

OBJECTIF PÉDAGOGIQUE :
L'élève doit comprendre la notion de "groupes emboîtés" ou d'évolution cumulative.

RÈGLES DE GÉNÉRATION :
1. **Structure** : Arbre "en peigne" (une ligne directrice avec des branches successives).
   - Le premier taxon a le moins de caractères dérivés.
   - Le dernier taxon a le plus de caractères dérivés.

2. **Matrice** : Doit refléter cette accumulation (diagonale remplie si triée, mais l'ordre de sortie JSON peut être brut).

3. **Taxons** : Donne des descriptions PRÉCISES et RICHES. 
   - Inclure : Milieu de vie, régime alimentaire, et surtout les attributs physiques visibles (squelette, membres, peau, etc.).
   - Le champ 'scientificName' est encouragé (ex: Canis lupus).
   - Fournir un lien Wikipédia valide (fr.wikipedia.org) pour chaque taxon.
   - Indiquer explicitement via le champ 'isFossil' si l'espèce est éteinte.

4. **Evolution Order** : C'est CRUCIAL. Tu dois lister les paires (Innovation, Taxon) dans l'ordre croissant de complexité (du plus ancien au plus récent).

Format de réponse JSON strict selon le schéma fourni.
`;

// Helper interface for the raw API response structure
interface RawExerciseResponse {
  title: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  taxons: Taxon[];
  characters: Character[];
  // API returns an array of objects for the matrix to avoid dynamic key issues in schema
  matrixList: {
    taxonId: string;
    presentCharacterIds: string[];
  }[];
  evolutionOrder: {
    characterId: string | null;
    branchingTaxonId: string | null;
  }[];
}

export const generateExercise = async (topic: string, difficulty: 'Facile' | 'Moyen' | 'Difficile', includeFossils: boolean): Promise<ExerciseData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let difficultyPrompt = "";
  if (difficulty === 'Facile') {
    difficultyPrompt = "Niveau FACILE : Génère exactement 4 taxons très distincts avec des caractères évidents.";
  } else if (difficulty === 'Moyen') {
    difficultyPrompt = "Niveau MOYEN : Génère 5 taxons.";
  } else {
    difficultyPrompt = "Niveau DIFFICILE : Génère 6 taxons, avec des caractères plus subtils.";
  }

  let fossilPrompt = "";
  if (includeFossils) {
    fossilPrompt = "IMPORTANT: Tu DOIS inclure au moins 1 ou 2 taxons FOSSILES (disparus) pertinents (ex: Archaeopteryx, Ammonite, Trilobite, Mammouth, T-Rex) pour montrer l'évolution dans le temps.";
  } else {
    fossilPrompt = "Utilise principalement des espèces actuelles.";
  }

  const prompt = `Génère un exercice de classification phylogénétique sur le thème : "${topic}".
  Si le thème est vide, choisis un thème classique (ex: Vertébrés, Arthropodes, Végétaux).
  ${difficultyPrompt}
  ${fossilPrompt}
  Trie les taxons du moins dérivé au plus dérivé DANS LA STRUCTURE EVOLUTION_ORDER uniquement.
  Assure-toi que les descriptions des taxons permettent à un élève de déduire les attributs (ex: mentionner 'os' pour vertèbres).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ['Facile', 'Moyen', 'Difficile'] },
          taxons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                scientificName: { type: Type.STRING },
                description: { type: Type.STRING, description: "Description complète incluant physique et mode de vie." },
                wikipediaUrl: { type: Type.STRING, description: "URL complète vers la page Wikipédia française du taxon." },
                emoji: { type: Type.STRING, description: "Un seul emoji représentant l'animal" },
                isFossil: { type: Type.BOOLEAN, description: "Vrai si c'est une espèce fossile/éteinte" }
              },
              required: ['id', 'name', 'description', 'emoji']
            }
          },
          characters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['id', 'name', 'description']
            }
          },
          matrixList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                taxonId: { type: Type.STRING },
                presentCharacterIds: {
                    type: Type.ARRAY, 
                    items: { type: Type.STRING }
                }
              },
              required: ['taxonId', 'presentCharacterIds']
            }
          },
          evolutionOrder: {
            type: Type.ARRAY,
            description: "Ordre strict : Innovation -> Taxon correspondant.",
            items: {
              type: Type.OBJECT,
              properties: {
                characterId: { type: Type.STRING },
                branchingTaxonId: { type: Type.STRING }
              },
              required: ['characterId', 'branchingTaxonId']
            }
          }
        },
        required: ['title', 'taxons', 'characters', 'matrixList', 'evolutionOrder']
      }
    }
  });

  if (response.text) {
    const rawData = JSON.parse(response.text) as RawExerciseResponse;
    
    // Convert matrixList (Array) to correctMatrix (Record)
    const correctMatrix: Record<string, string[]> = {};
    if (rawData.matrixList) {
      rawData.matrixList.forEach(item => {
        correctMatrix[item.taxonId] = item.presentCharacterIds || [];
      });
    }

    return {
      title: rawData.title,
      difficulty: difficulty, // Ensure we keep the user selected difficulty
      taxons: rawData.taxons,
      characters: rawData.characters,
      correctMatrix: correctMatrix,
      evolutionOrder: rawData.evolutionOrder
    };
  }
  
  throw new Error("Impossible de générer l'exercice");
};