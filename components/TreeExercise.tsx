import React, { useState, useEffect } from 'react';
import { Character, Taxon, ExerciseData } from '../types';

interface TreeExerciseProps {
  data: ExerciseData;
  onRestart: () => void;
}

// Slot types
type SlotType = 'attribute' | 'taxon';

interface Slot {
  id: string; // Unique ID for the slot
  type: SlotType;
  x: number;
  y: number;
  expectedId: string | null; // The correct Character ID or Taxon ID
  filledWithId: string | null; // What the user put here
}

export const TreeExercise: React.FC<TreeExerciseProps> = ({ data, onRestart }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<{id: string, type: SlotType} | null>(null);
  const [success, setSuccess] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [showMatrix, setShowMatrix] = useState(false);

  // Layout Constants
  const TAXON_W = 112; // Card width
  const TAXON_H = 112; // Card height
  const ATTR_W = 120;  // Attribute slot width
  const ATTR_H = 40;   // Attribute slot height

  const START_X = 50;  // Left margin for first taxon
  const STEP_X = 200;  // Horizontal spacing between taxons
  const TAXON_TOP_Y = 40; // Fixed Y for all extant taxons
  const FOSSIL_OFFSET_Y = 100; // Extra Y offset for fossil taxons
  
  // Trunk Geometry
  const TRUNK_BASE_Y = 550;
  const TRUNK_TIP_Y = TAXON_TOP_Y + TAXON_H + 40; // Trunk ends just below the last taxon

  // Dynamic container sizing
  const stepCount = data.evolutionOrder.length;
  // Ensure enough width for all steps plus padding
  const containerWidth = Math.max(900, START_X + (stepCount * STEP_X) + 100);

  // Generate the Tree Visualization coordinates
  useEffect(() => {
    // Only re-generate structure if data changes. 
    // visual updates for success (fossil drop) are handled via effects on success state
    const newSlots: Slot[] = [];
    const count = data.evolutionOrder.length;
    
    // Taxon positions (Initially all at top)
    const taxonPositions = data.evolutionOrder.map((_, index) => ({
        x: START_X + (index * STEP_X),
        y: TAXON_TOP_Y
    }));

    // Trunk Vector calculation
    const trunkBaseX = START_X + 100; 
    const trunkTipX = taxonPositions[count - 1].x + (TAXON_W / 2); 

    const getTrunkPoint = (t: number) => ({
        x: trunkBaseX + (trunkTipX - trunkBaseX) * t,
        y: TRUNK_BASE_Y + (TRUNK_TIP_Y - TRUNK_BASE_Y) * t
    });

    data.evolutionOrder.forEach((step, index) => {
        const segmentSize = 1.0 / count;
        const nodeT = (index + 1) * segmentSize;
        const attrT = (index + 0.5) * segmentSize;

        const attrPos = getTrunkPoint(attrT);
        const taxonPos = taxonPositions[index];

        // 1. Attribute Slot (Innovation) on Trunk
        if (step.characterId) {
            newSlots.push({
                id: `attr-${index}`,
                type: 'attribute',
                x: attrPos.x - (ATTR_W / 2),
                y: attrPos.y - (ATTR_H / 2),
                expectedId: step.characterId,
                filledWithId: null
            });
        }

        // 2. Taxon Slot at Top
        if (step.branchingTaxonId) {
            newSlots.push({
                id: `taxon-${index}`,
                type: 'taxon',
                x: taxonPos.x,
                y: taxonPos.y,
                expectedId: step.branchingTaxonId,
                filledWithId: null
            });
        }
    });

    setSlots(newSlots);
    setSuccess(false); // Reset success on data change
    setMistakes(0);
  }, [data]);

  // Effect to move fossil slots down upon success
  useEffect(() => {
    if (success) {
      setSlots(prevSlots => prevSlots.map(slot => {
        if (slot.type === 'taxon' && slot.expectedId) {
          const taxon = data.taxons.find(t => t.id === slot.expectedId);
          if (taxon?.isFossil) {
            return { ...slot, y: TAXON_TOP_Y + FOSSIL_OFFSET_Y };
          }
        }
        return slot;
      }));
    }
  }, [success, data]);

  // Items available to place (filter out ones already placed)
  const getAvailableItems = (type: SlotType) => {
    const placedIds = slots.map(s => s.filledWithId).filter(Boolean);
    if (type === 'taxon') {
      return data.taxons.filter(t => !placedIds.includes(t.id));
    } else {
      return data.characters.filter(c => !placedIds.includes(c.id));
    }
  };

  const handleItemClick = (id: string, type: SlotType) => {
    if (success) return;
    if (selectedItemId?.id === id) {
      setSelectedItemId(null); // Deselect
    } else {
      setSelectedItemId({ id, type });
    }
  };

  const handleSlotClick = (slotId: string) => {
    if (success) return;
    const slotIndex = slots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) return;
    const slot = slots[slotIndex];

    // If slot is filled, remove item
    if (slot.filledWithId) {
      const newSlots = [...slots];
      newSlots[slotIndex].filledWithId = null;
      setSlots(newSlots);
      return;
    }

    // If item selected and types match, place it
    if (selectedItemId && selectedItemId.type === slot.type) {
      const newSlots = [...slots];
      newSlots[slotIndex].filledWithId = selectedItemId.id;
      setSlots(newSlots);
      setSelectedItemId(null);
      checkCompletion(newSlots);
    }
  };

  const checkCompletion = (currentSlots: Slot[]) => {
    const allFilled = currentSlots.every(s => s.filledWithId !== null);
    if (allFilled) {
      const allCorrect = currentSlots.every(s => s.filledWithId === s.expectedId);
      if (allCorrect) {
        setSuccess(true);
      } else {
        setMistakes(m => m + 1);
        setTimeout(() => alert("L'arbre est complet mais incorrect. Vérifie bien l'ordre d'apparition des caractères !"), 300);
      }
    }
  };

  // Helper to re-calc coords for SVG rendering
  const getGeometry = () => {
    const count = data.evolutionOrder.length;
    
    // Must match constants in useEffect
    const trunkBaseX = START_X + 100;
    const trunkTipX = (START_X + ((count - 1) * STEP_X)) + (TAXON_W / 2);
    
    const getTrunkPoint = (t: number) => ({
        x: trunkBaseX + (trunkTipX - trunkBaseX) * t,
        y: TRUNK_BASE_Y + (TRUNK_TIP_Y - TRUNK_BASE_Y) * t
    });

    const segments = data.evolutionOrder.map((step, index) => {
        const segmentSize = 1.0 / count;
        const nodeT = (index + 1) * segmentSize;
        const prevNodeT = index * segmentSize; // Start of this segment
        
        const startPos = getTrunkPoint(prevNodeT);
        const endPos = getTrunkPoint(nodeT);
        
        const taxon = data.taxons.find(t => t.id === step.branchingTaxonId);
        const isFossil = taxon?.isFossil;
        
        // Target for the branch
        // If success and fossil, the branch ends lower
        const currentTargetY = (success && isFossil) 
             ? TAXON_TOP_Y + TAXON_H + FOSSIL_OFFSET_Y 
             : TAXON_TOP_Y + TAXON_H;

        const taxonTargetX = START_X + (index * STEP_X) + (TAXON_W / 2);
        const taxonTargetY = currentTargetY;

        return { startPos, endPos, taxonTargetX, taxonTargetY };
    });
    
    return { segments, trunkBaseX };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
       <div className="flex justify-between items-center mb-2 px-2">
          <div className="flex items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800">Construction du Cladogramme</h2>
                <p className="text-sm text-slate-500">
                    Place les <span className="font-bold text-indigo-600">innovations</span> sur le tronc commun et les <span className="font-bold text-emerald-600">animaux</span> au bout des branches.
                </p>
            </div>
            <button 
                onClick={() => setShowMatrix(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition shadow-sm text-sm font-bold"
            >
                📋 Voir Matrice
            </button>
          </div>
          <div className="text-right">
             {success && <span className="text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full animate-pulse">Arbre Scientifiquement Correct ! 🎉</span>}
          </div>
       </div>

       <div className="flex flex-1 gap-4 overflow-hidden p-2">
          {/* Canvas Area */}
          <div className="flex-1 bg-slate-100 rounded-xl border border-slate-300 relative overflow-auto shadow-inner">
             {/* Dynamic width applied here */}
             <div 
                className="relative p-8 origin-top-left"
                style={{ width: containerWidth, minHeight: '600px' }}
             >
                {(() => {
                   const { segments, trunkBaseX } = getGeometry();
                   return (
                     <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                       <defs>
                           {/* Use a simple dot for nodes */}
                           <circle id="nodePoint" r="6" fill="#64748b" />
                       </defs>
                       
                       {/* Full Trunk Line */}
                       <line 
                           x1={trunkBaseX} 
                           y1={TRUNK_BASE_Y} 
                           x2={segments[segments.length-1].endPos.x} 
                           y2={segments[segments.length-1].endPos.y}
                           stroke="#94a3b8" 
                           strokeWidth="8" 
                           strokeLinecap="round"
                       />

                       {segments.map((seg, i) => (
                           <React.Fragment key={i}>
                               {/* Branch to Taxon */}
                               <line 
                                   x1={seg.endPos.x} 
                                   y1={seg.endPos.y}
                                   x2={seg.taxonTargetX} 
                                   y2={seg.taxonTargetY}
                                   stroke="#94a3b8" 
                                   strokeWidth="5"
                                   strokeLinecap="round"
                               />
                               
                               {/* Node circle at branching point */}
                               <circle cx={seg.endPos.x} cy={seg.endPos.y} r="8" fill="#64748b" />

                               {/* Tick Mark for Attribute (Visual anchor) */}
                               {/* Calculated midpoint of the segment */}
                               <line 
                                   x1={(seg.startPos.x + seg.endPos.x)/2} 
                                   y1={(seg.startPos.y + seg.endPos.y)/2 - 10}
                                   x2={(seg.startPos.x + seg.endPos.x)/2} 
                                   y2={(seg.startPos.y + seg.endPos.y)/2 + 10}
                                   stroke="#cbd5e1"
                                   strokeWidth="2"
                               />
                           </React.Fragment>
                       ))}
                     </svg>
                   );
                })()}

                {slots.map(slot => {
                    const filledItem = slot.filledWithId 
                      ? (slot.type === 'taxon' 
                          ? data.taxons.find(t => t.id === slot.filledWithId) 
                          : data.characters.find(c => c.id === slot.filledWithId))
                      : null;
                    
                    const isAttribute = slot.type === 'attribute';

                    return (
                        <div
                          key={slot.id}
                          onClick={() => handleSlotClick(slot.id)}
                          style={{ left: slot.x, top: slot.y }}
                          className={`
                            absolute transition-all duration-500 ease-in-out cursor-pointer flex items-center justify-center z-10 shadow-sm
                            ${isAttribute 
                                ? 'w-[120px] h-[40px] rounded bg-indigo-50 border-2' 
                                : 'w-[112px] h-[112px] rounded-lg border-2'}
                            ${slot.filledWithId 
                                ? (success ? 'bg-green-100 border-green-500 scale-105' : 'bg-white border-slate-400 hover:border-indigo-400')
                                : 'bg-slate-200/50 border-dashed border-slate-400 hover:bg-white'}
                          `}
                        >
                            {filledItem ? (
                                <div className="text-center p-1 leading-tight w-full overflow-hidden">
                                    {isAttribute ? (
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="text-[10px] font-bold text-white bg-indigo-600 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">+</span>
                                            <span className="text-xs font-bold text-indigo-800 truncate">{filledItem.name}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="text-4xl mb-1 filter drop-shadow-sm">{(filledItem as Taxon).emoji}</div>
                                            <div className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-full w-full truncate">{filledItem.name}</div>
                                            {(filledItem as Taxon).isFossil && success && (
                                                <span className="text-[9px] text-red-500 font-bold uppercase mt-1">Fossile †</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-slate-400 text-[10px] text-center px-1 font-medium select-none">
                                    {selectedItemId && selectedItemId.type === slot.type ? "DÉPOSER" : (isAttribute ? "Caractère ?" : "Animal ?")}
                                </span>
                            )}
                        </div>
                    );
                })}
             </div>
          </div>

          {/* Inventory Sidebar */}
          <div className="w-64 bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-6 overflow-y-auto shadow-lg z-20">
              {/* Attributes */}
              <div>
                  <h3 className="font-bold text-indigo-800 mb-3 text-sm uppercase tracking-wide border-b border-indigo-100 pb-2 flex items-center gap-2">
                    <span className="bg-indigo-100 p-1 rounded">⚡</span> Caractères
                  </h3>
                  <div className="flex flex-col gap-2">
                      {getAvailableItems('attribute').map((c: any) => (
                          <button
                            key={c.id}
                            onClick={() => handleItemClick(c.id, 'attribute')}
                            className={`
                                w-full py-2 px-3 rounded-lg text-xs font-bold text-left transition-all flex items-center gap-2
                                border-2
                                ${selectedItemId?.id === c.id 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg transform scale-105' 
                                    : 'bg-indigo-50 text-indigo-800 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-300'}
                            `}
                          >
                              <span className="text-indigo-400 text-base">+</span> {c.name}
                          </button>
                      ))}
                      {getAvailableItems('attribute').length === 0 && (
                          <div className="text-center p-3 bg-slate-50 rounded-lg text-slate-400 italic text-xs border border-slate-100">
                              Placés
                          </div>
                      )}
                  </div>
              </div>

              {/* Taxons */}
              <div>
                  <h3 className="font-bold text-emerald-800 mb-3 text-sm uppercase tracking-wide border-b border-emerald-100 pb-2 flex items-center gap-2">
                    <span className="bg-emerald-100 p-1 rounded">🐾</span> Taxons
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                      {getAvailableItems('taxon').map((t: any) => (
                          <button
                            key={t.id}
                            onClick={() => handleItemClick(t.id, 'taxon')}
                            className={`
                                p-2 rounded-xl text-center transition-all border-2 flex flex-col items-center justify-center aspect-square
                                ${selectedItemId?.id === t.id 
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg transform scale-105' 
                                    : 'bg-emerald-50 text-emerald-900 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-300'}
                            `}
                          >
                              <div className="text-2xl mb-1">{t.emoji}</div>
                              <div className="text-[10px] font-bold w-full truncate">{t.name}</div>
                          </button>
                      ))}
                  </div>
                   {getAvailableItems('taxon').length === 0 && (
                          <div className="mt-2 text-center p-3 bg-slate-50 rounded-lg text-slate-400 italic text-xs border border-slate-100">
                              Placés
                          </div>
                      )}
              </div>

              {success && (
                <div className="mt-auto pt-4 animate-fade-in-up">
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4 text-xs text-green-800">
                    <strong>Excellent !</strong>
                  </div>
                  <button 
                    onClick={onRestart}
                    className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 shadow-xl transform transition hover:scale-105 flex items-center justify-center gap-2 text-sm"
                  >
                    🔄 Nouveau
                  </button>
                </div>
              )}
          </div>
       </div>

       {/* Matrix Modal */}
       {showMatrix && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
               {/* Modal Header */}
               <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <span>✅</span> Matrice de Caractères Validée
                  </h3>
                  <button 
                    onClick={() => setShowMatrix(false)}
                    className="text-slate-400 hover:text-slate-700 text-2xl font-bold leading-none w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition"
                  >
                    &times;
                  </button>
               </div>
               
               {/* Modal Content */}
               <div className="p-6 overflow-auto">
                   <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 bg-slate-50 border border-slate-200"></th>
                          {data.characters.map(c => (
                            <th key={c.id} className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-900 font-semibold text-xs min-w-[80px]">
                              {c.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.taxons.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <th className="p-3 text-left border border-slate-200 bg-emerald-50 text-emerald-900 font-semibold text-sm">
                              <div className="flex items-center gap-2">
                                <span>{t.emoji}</span>
                                <span>{t.name}</span>
                              </div>
                            </th>
                            {data.characters.map(c => {
                              const isPresent = data.correctMatrix[t.id]?.includes(c.id);
                              return (
                                <td 
                                  key={`${t.id}-${c.id}`} 
                                  className={`
                                    border border-slate-200 text-center text-xl p-2
                                    ${isPresent ? 'bg-green-50' : 'bg-red-50'}
                                  `}
                                >
                                  {isPresent ? <span className="text-green-600">✔</span> : <span className="text-red-300 opacity-50">✘</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                   </table>
               </div>
               
               {/* Modal Footer */}
               <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
                  <button 
                    onClick={() => setShowMatrix(false)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow transition"
                  >
                    Fermer
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};