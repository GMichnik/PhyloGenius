import React, { useState, useEffect } from 'react';
import { Character, Taxon } from '../types';
import { InfoCards } from './InfoCards';

interface MatrixExerciseProps {
  taxons: Taxon[];
  characters: Character[];
  correctMatrix: Record<string, string[]>;
  onComplete: () => void;
}

export const MatrixExercise: React.FC<MatrixExerciseProps> = ({
  taxons,
  characters,
  correctMatrix,
  onComplete,
}) => {
  // State: taxonId -> characterId -> boolean (true=present, false=absent, undefined=unset)
  const [userMatrix, setUserMatrix] = useState<Record<string, Record<string, boolean | undefined>>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    // Initialize matrix
    const initial: Record<string, Record<string, boolean | undefined>> = {};
    taxons.forEach(t => {
      initial[t.id] = {};
      characters.forEach(c => {
        initial[t.id][c.id] = undefined;
      });
    });
    setUserMatrix(initial);
  }, [taxons, characters]);

  const toggleCell = (taxonId: string, charId: string) => {
    if (success) return;
    setUserMatrix(prev => {
      const currentVal = prev[taxonId]?.[charId];
      let nextVal: boolean | undefined;
      
      if (currentVal === undefined) nextVal = true; // Click -> Present (Green Check)
      else if (currentVal === true) nextVal = false; // Click again -> Absent (Red Cross)
      else nextVal = undefined; // Click again -> Reset

      return {
        ...prev,
        [taxonId]: {
          ...prev[taxonId],
          [charId]: nextVal
        }
      };
    });
    setShowErrors(false);
  };

  const checkMatrix = () => {
    let hasErrors = false;
    let allFilled = true;

    for (const t of taxons) {
      for (const c of characters) {
        const userVal = userMatrix[t.id]?.[c.id];
        const shouldBePresent = correctMatrix[t.id]?.includes(c.id);
        
        // Check if filled
        if (userVal === undefined) {
          allFilled = false;
        }

        // Check correctness (if filled)
        if (userVal !== undefined) {
             if (userVal !== shouldBePresent) {
               hasErrors = true;
             }
        }
      }
    }

    if (!allFilled) {
      alert("Tu dois remplir toutes les cases de la matrice avant de vérifier !");
      return;
    }

    if (hasErrors) {
      setShowErrors(true);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Remplissage de la Matrice</h2>
          <p className="text-slate-500 text-sm">Clique une fois pour "Présent" (Vert), deux fois pour "Absent" (Rouge).</p>
        </div>
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
        >
          {showInfo ? 'Masquer Fiches' : 'Voir Fiches Aide'}
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Matrix Area */}
        <div className="flex-1 overflow-auto bg-white p-4 rounded-xl shadow border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 bg-slate-50 border border-slate-200 min-w-[120px]"></th>
                  {characters.map(c => (
                    <th key={c.id} className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-900 font-semibold text-sm rotate-0 md:min-w-[100px]">
                      <div className="flex flex-col items-center gap-1 group relative">
                        <span>{c.name}</span>
                        {/* Tooltip for character description */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-slate-800 text-white text-xs p-2 rounded z-10 font-normal">
                          {c.description}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taxons.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <th className="p-3 text-left border border-slate-200 bg-emerald-50 text-emerald-900 font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{t.emoji}</span>
                        <span>{t.name}</span>
                      </div>
                    </th>
                    {characters.map(c => {
                      const val = userMatrix[t.id]?.[c.id];
                      const isCorrect = correctMatrix[t.id]?.includes(c.id) === val;
                      const cellClass = `
                        cursor-pointer border border-slate-200 text-center text-2xl transition-all duration-200
                        ${val === true ? 'bg-green-50' : val === false ? 'bg-red-50' : 'bg-white'}
                        ${showErrors && !isCorrect ? 'ring-2 ring-red-500 ring-inset' : ''}
                      `;

                      return (
                        <td 
                          key={`${t.id}-${c.id}`} 
                          onClick={() => toggleCell(t.id, c.id)}
                          className={cellClass}
                        >
                          {val === true && <span className="text-green-600">✔</span>}
                          {val === false && <span className="text-red-400">✘</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {showErrors && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium animate-pulse">
                Il y a des erreurs dans la matrice (cases entourées en rouge). Relis les descriptions !
              </div>
            )}
            
            {success && (
              <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg text-center font-bold text-lg animate-bounce">
                Bravo ! La matrice est correcte.
              </div>
            )}
        </div>

        {/* Side Info Panel */}
        {showInfo && (
          <div className="w-1/3 bg-slate-50 rounded-xl p-2 border border-slate-200 shadow-inner flex flex-col min-h-0">
             <InfoCards taxons={taxons} compact={true} />
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-center">
        {!success ? (
          <button
            onClick={checkMatrix}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition active:scale-95"
          >
            Vérifier
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105"
          >
            Construire l'Arbre →
          </button>
        )}
      </div>
    </div>
  );
};