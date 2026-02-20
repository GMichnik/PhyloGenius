import React, { useState } from 'react';
import { generateExercise } from './services/geminiService';
import { AppState, ExerciseData } from './types';
import { InfoCards } from './components/InfoCards';
import { MatrixExercise } from './components/MatrixExercise';
import { TreeExercise } from './components/TreeExercise';
import { TeacherZone } from './components/TeacherZone';

// Utility to shuffle arrays (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Default / Fallback data
const DEFAULT_DATA: ExerciseData = {
  title: "Vertébrés Simples",
  difficulty: "Facile",
  taxons: [
    { id: "t1", name: "Sardine", scientificName: "Sardina pilchardus", description: "Vit dans l'eau. Corps recouvert d'écailles non soudées. Possède des nageoires rayonnées. Squelette osseux interne.", wikipediaUrl: "https://fr.wikipedia.org/wiki/Sardina_pilchardus", emoji: "🐟" },
    { id: "t2", name: "Grenouille", scientificName: "Pelophylax sp.", description: "Vit près de l'eau. Peau nue et humide. Possède 4 membres (tétrapode) et un squelette osseux.", wikipediaUrl: "https://fr.wikipedia.org/wiki/Grenouille", emoji: "🐸" },
    { id: "t3", name: "Chat", scientificName: "Felis catus", description: "Vit sur terre. Corps recouvert de poils. Possède des oreilles avec pavillon externe, 4 membres et des vertèbres.", wikipediaUrl: "https://fr.wikipedia.org/wiki/Chat_domestique", emoji: "🐱" },
    { id: "t4", name: "Pigeon", scientificName: "Columba livia", description: "Vit sur terre et dans les airs. Corps recouvert de plumes. Possède un gésier pour broyer les graines, 4 membres (dont 2 ailes) et des vertèbres.", wikipediaUrl: "https://fr.wikipedia.org/wiki/Pigeon_biset", emoji: "🐦" }
  ],
  characters: [
    { id: "c1", name: "Vertèbres", description: "Squelette osseux interne" },
    { id: "c2", name: "4 membres", description: "Pattes ou ailes (Tétrapode)" },
    { id: "c3", name: "Poils", description: "Phanères spécifiques aux mammifères" },
    { id: "c4", name: "Plumes", description: "Phanères spécifiques aux oiseaux" }
  ],
  correctMatrix: {
    "t1": ["c1"],
    "t2": ["c1", "c2"],
    "t3": ["c1", "c2", "c3"],
    "t4": ["c1", "c2", "c4"]
  },
  evolutionOrder: [
    { characterId: "c1", branchingTaxonId: "t1" },
    { characterId: "c2", branchingTaxonId: "t2" },
    { characterId: "c3", branchingTaxonId: "t3" },
    { characterId: "c4", branchingTaxonId: "t4" }
  ]
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('setup');
  const [exerciseData, setExerciseData] = useState<ExerciseData | null>(null);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Facile' | 'Moyen' | 'Difficile'>('Facile');
  const [includeFossils, setIncludeFossils] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTeacherZone, setShowTeacherZone] = useState(false);

  const startExercise = async (useAI: boolean) => {
    if (!useAI) {
      // Shuffle default data too for consistency
      const shuffledDefault = {
        ...DEFAULT_DATA,
        taxons: shuffleArray(DEFAULT_DATA.taxons),
        characters: shuffleArray(DEFAULT_DATA.characters)
      };
      setExerciseData(shuffledDefault);
      setState('info');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await generateExercise(topic, difficulty, includeFossils);
      
      // SHUFFLE DATA: Important so the matrix isn't pre-sorted visually
      const shuffledData = {
        ...data,
        taxons: shuffleArray(data.taxons),
        characters: shuffleArray(data.characters)
      };

      setExerciseData(shuffledData);
      setState('info');
    } catch (e) {
      console.error(e);
      setError("Erreur lors de la génération. Veuillez vérifier votre clé API ou réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'setup':
        return (
          <div className="flex-1 overflow-y-auto w-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 max-w-2xl mx-auto">
              <h1 className="text-5xl font-bold text-indigo-700 mb-6 font-fredoka">PhyloGenius 🧬</h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Générateur d'exercices de classification pour le collège. 
                Choisis un thème et laisse l'IA créer une enquête scientifique pour toi !
              </p>
              
              <div className="w-full bg-white p-8 rounded-2xl shadow-xl border border-indigo-100">
                
                {/* Difficulty Selection */}
                <div className="mb-6">
                  <label className="block text-left text-sm font-bold text-slate-700 mb-2">Niveau de difficulté</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                      {(['Facile', 'Moyen', 'Difficile'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                            difficulty === level 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Topic Input */}
                <div className="mb-4">
                  <label className="block text-left text-sm font-bold text-slate-700 mb-2">Thème de l'exercice (optionnel)</label>
                  <input 
                      type="text" 
                      placeholder="Ex: Les Arthropodes, Les Primates, La savane..." 
                      className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none text-lg transition-all"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                {/* Fossil Checkbox */}
                <div className="mb-8 flex items-center gap-3 bg-amber-50 p-3 rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-100 transition" onClick={() => setIncludeFossils(!includeFossils)}>
                  <input 
                      type="checkbox" 
                      id="fossils"
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                      checked={includeFossils}
                      onChange={(e) => setIncludeFossils(e.target.checked)}
                  />
                  <label htmlFor="fossils" className="text-amber-900 font-bold text-sm cursor-pointer select-none">
                      Inclure des espèces fossiles 🦴 (Dinosaures, etc.)
                  </label>
                </div>
                
                <div className="flex gap-4 flex-col sm:flex-row">
                  <button 
                    onClick={() => startExercise(true)}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  >
                    {loading ? 'Génération en cours...' : '✨ Générer avec IA'}
                  </button>
                  <button 
                    onClick={() => startExercise(false)}
                    disabled={loading}
                    className="sm:w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 rounded-xl shadow transition"
                  >
                    Démo
                  </button>
                </div>
                {error && <p className="text-red-500 mt-4 font-medium bg-red-50 p-3 rounded">{error}</p>}
              </div>
            </div>
          </div>
        );

      case 'info':
        return exerciseData && (
          <InfoCards 
            taxons={exerciseData.taxons} 
            onContinue={() => setState('matrix')} 
          />
        );

      case 'matrix':
        return exerciseData && (
          <MatrixExercise 
            taxons={exerciseData.taxons}
            characters={exerciseData.characters}
            correctMatrix={exerciseData.correctMatrix}
            onComplete={() => setState('tree')}
          />
        );

      case 'tree':
        return exerciseData && (
          <TreeExercise 
            data={exerciseData} 
            onRestart={() => {
              setTopic('');
              setState('setup');
            }}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 flex justify-between items-center shadow-sm shrink-0 z-50 print:hidden">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setState('setup')}>
          <span className="text-2xl">🧬</span>
          <span className="font-bold text-xl text-slate-800 tracking-tight">PhyloGenius</span>
        </div>
        
        {exerciseData && state !== 'setup' && (
             <button 
                onClick={() => setShowTeacherZone(true)}
                className="bg-slate-800 text-white px-3 py-1 rounded text-sm font-bold hover:bg-slate-900 transition flex items-center gap-2"
             >
                <span>🖨️</span> Espace Prof
             </button>
        )}

        <div className="flex gap-2">
          {['info', 'matrix', 'tree'].map((step, idx) => (
             <div key={step} className={`
                h-2 w-8 rounded-full transition-all duration-300
                ${
                  (step === state) ? 'bg-indigo-600 w-12' : 
                  (['info', 'matrix', 'tree'].indexOf(state) > idx) ? 'bg-green-400' : 'bg-slate-200'
                }
             `} />
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 overflow-hidden flex flex-col relative print:hidden">
         {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 shrink-0 print:hidden text-center z-40">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-xs md:text-sm text-slate-600">
             <p className="flex-1 text-center md:text-left">
                <span className="font-bold text-indigo-600">Note :</span> Ce logiciel est gratuit, mais l'IA a un coût. 
                Soutenez le projet pour qu'il perdure ! ❤️
             </p>
             <div className="flex items-center gap-3">
                 <a 
                    href="https://www.leetchi.com/fr/c/logiciels-pedagogiques-1842723?utm_source=copylink&utm_medium=social_sharing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-4 rounded-full shadow-sm transition transform hover:scale-105"
                 >
                    <span>☕</span> Faire un don
                 </a>
                 <a 
                    href="mailto:gregory.michnik@ac-lille.fr"
                    className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 hover:bg-indigo-50 py-1.5 px-3 rounded-full transition"
                 >
                    <span>📧</span> Contact
                 </a>
             </div>
        </div>
      </footer>

      {/* Teacher Zone Overlay */}
      {showTeacherZone && exerciseData && (
          <TeacherZone data={exerciseData} onClose={() => setShowTeacherZone(false)} />
      )}
    </div>
  );
};

export default App;