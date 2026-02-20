import React, { useState } from 'react';
import { ExerciseData } from '../types';
import { InfoCards } from './InfoCards';

interface TeacherZoneProps {
  data: ExerciseData;
  onClose: () => void;
}

export const TeacherZone: React.FC<TeacherZoneProps> = ({ data, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.toLowerCase().trim() === 'darwin') {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPasswordInput('');
    }
  };

  // Reusing geometry logic for static SVG generation
  const getStaticTreeGeometry = () => {
    const TAXON_W = 100;
    const TAXON_H = 40; // Smaller for print
    const START_X = 50;
    const STEP_X = 150;
    const TAXON_TOP_Y = 20;
    const FOSSIL_OFFSET_Y = 80; // Offset specifically for Teacher Zone fossils
    const TRUNK_BASE_Y = 400;
    const TRUNK_TIP_Y = TAXON_TOP_Y + TAXON_H + 40;
    
    const count = data.evolutionOrder.length;
    const width = Math.max(800, START_X + (count * STEP_X) + 100);
    const height = 450;

    // Trunk Geometry
    const trunkBaseX = START_X + 80;
    const trunkTipX = (START_X + ((count - 1) * STEP_X)) + (TAXON_W / 2);

    const getTrunkPoint = (t: number) => ({
        x: trunkBaseX + (trunkTipX - trunkBaseX) * t,
        y: TRUNK_BASE_Y + (TRUNK_TIP_Y - TRUNK_BASE_Y) * t
    });

    const segments = data.evolutionOrder.map((step, index) => {
        const segmentSize = 1.0 / count;
        const nodeT = (index + 1) * segmentSize;
        const prevNodeT = index * segmentSize;
        const attrT = (index + 0.5) * segmentSize;
        
        const startPos = getTrunkPoint(prevNodeT);
        const endPos = getTrunkPoint(nodeT);
        const attrPos = getTrunkPoint(attrT);
        
        // Determine if this step is a fossil
        const taxon = data.taxons.find(t => t.id === step.branchingTaxonId);
        const isFossil = taxon?.isFossil;

        const taxonTargetX = START_X + (index * STEP_X) + (TAXON_W / 2);
        // Apply offset if fossil
        const taxonTargetY = TAXON_TOP_Y + TAXON_H + (isFossil ? FOSSIL_OFFSET_Y : 0);

        return { startPos, endPos, taxonTargetX, taxonTargetY, attrPos, step, isFossil };
    });

    return { segments, width, height, trunkBaseX };
  };

  const { segments, width, height, trunkBaseX } = getStaticTreeGeometry();

  const RenderTree = ({ filled }: { filled: boolean }) => (
    <div className="border border-slate-400 rounded-lg p-4 bg-white mb-4 w-full overflow-hidden print:border-black">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            {/* Trunk */}
            <line 
                x1={trunkBaseX} y1={400} 
                x2={segments[segments.length-1].endPos.x} y2={segments[segments.length-1].endPos.y}
                stroke="black" strokeWidth="4" strokeLinecap="round"
            />
            {segments.map((seg, i) => (
                <React.Fragment key={i}>
                    {/* Branch */}
                    <line 
                        x1={seg.endPos.x} y1={seg.endPos.y}
                        x2={seg.taxonTargetX} y2={seg.taxonTargetY}
                        stroke="black" strokeWidth="3"
                        strokeDasharray={seg.isFossil && !filled ? "5,5" : "none"} // Optional: dashed line for fossils in empty mode as hint? Or solid. Kept solid for consistency, but lowered.
                    />
                    {/* Node */}
                    <circle cx={seg.endPos.x} cy={seg.endPos.y} r="5" fill="black" />
                    
                    {/* Taxon Box */}
                    <foreignObject x={seg.taxonTargetX - 50} y={seg.taxonTargetY - 45} width="100" height="40">
                         <div className={`w-full h-full border-2 border-black flex items-center justify-center text-center text-xs font-bold rounded ${filled ? 'bg-emerald-100 print:bg-gray-100' : 'bg-white'}`}>
                             {filled && data.taxons.find(t => t.id === seg.step.branchingTaxonId)?.name}
                             {filled && seg.isFossil && <span className="text-[8px] ml-1">†</span>}
                         </div>
                    </foreignObject>

                    {/* Attribute Tick */}
                    <line 
                        x1={seg.attrPos.x - 10} y1={seg.attrPos.y}
                        x2={seg.attrPos.x + 10} y2={seg.attrPos.y}
                        stroke="black" strokeWidth="2"
                    />
                    
                    {/* Attribute Box - Shifted further Right (+25) and Down (+5) to sit under the rising trunk */}
                    {seg.step.characterId && (
                        <foreignObject x={seg.attrPos.x + 25} y={seg.attrPos.y + 5} width="120" height="40">
                            <div className={`w-full h-full border border-dashed border-slate-500 flex items-center justify-center text-center text-[10px] bg-white rounded leading-tight px-1 ${filled ? 'border-solid border-indigo-600 bg-indigo-50 font-bold print:border-black print:bg-gray-50' : ''}`}>
                                {filled && data.characters.find(c => c.id === seg.step.characterId)?.name}
                            </div>
                        </foreignObject>
                    )}
                </React.Fragment>
            ))}
        </svg>
    </div>
  );

  // Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full">
           <div className="text-center mb-6">
              <span className="text-4xl">🔒</span>
              <h2 className="text-xl font-bold text-slate-800 mt-2">Accès Enseignant</h2>
              <p className="text-sm text-slate-500">Veuillez entrer le mot de passe.</p>
           </div>
           
           <form onSubmit={handleLogin}>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Mot de passe"
                className={`w-full p-3 border-2 rounded-lg mb-4 text-center text-lg outline-none focus:ring-2 focus:ring-indigo-200 ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                autoFocus
              />
              {error && <p className="text-red-500 text-xs text-center mb-4 font-bold">Mot de passe incorrect</p>}
              
              <div className="flex gap-2">
                 <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition">
                    Valider
                 </button>
                 <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg transition">
                    Annuler
                 </button>
              </div>
           </form>
        </div>
      </div>
    );
  }

  // Authenticated Content
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto print-reset">
      {/* Print Header - Only visible on screen */}
      <div className="bg-slate-800 text-white p-4 flex justify-between items-center print:hidden sticky top-0 z-50 shadow-md">
        <div>
            <h2 className="text-xl font-bold">Espace Professeur</h2>
            <p className="text-sm text-slate-300">Générez des fiches d'exercices et leurs corrigés.</p>
        </div>
        <div className="flex gap-3">
             <button onClick={() => window.print()} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2 rounded-lg font-bold transition">
                🖨️ Imprimer
             </button>
             <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 px-6 py-2 rounded-lg font-bold transition">
                Fermer
             </button>
        </div>
      </div>

      <div className="p-8 max-w-[210mm] mx-auto bg-white print:p-0 print:max-w-none">
        
        {/* --- PAGE 1: STUDENT WORKSHEET --- */}
        <div className="print:block mb-8">
            <div className="border-b-2 border-slate-800 mb-6 pb-2 flex justify-between items-end">
                <h1 className="text-3xl font-bold uppercase tracking-widest">Activité Phylogénie</h1>
                <div className="text-right">
                    <p className="font-bold">Nom : ...............................</p>
                    <p className="text-sm text-slate-500">Thème : {data.title}</p>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-bold text-lg mb-2 border-b border-slate-300">1. Matériel : Fiches d'Identité</h3>
                <InfoCards taxons={data.taxons} />
            </div>

            <div className="mb-8 break-inside-avoid">
                <h3 className="font-bold text-lg mb-2 border-b border-slate-300">2. Matrice de Caractères</h3>
                <p className="mb-2 text-sm italic">Cochez les cases correspondant aux caractères possédés par chaque animal.</p>
                <table className="w-full border-collapse border-2 border-black">
                    <thead>
                        <tr>
                            <th className="border border-black p-2 bg-slate-100 print:bg-gray-100"></th>
                            {data.characters.map(c => (
                                <th key={c.id} className="border border-black p-2 bg-slate-50 text-sm rotate-0 h-24 align-bottom print:bg-white">
                                    <span className="block w-full">{c.name}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.taxons.map(t => (
                            <tr key={t.id}>
                                <th className="border border-black p-2 text-left bg-slate-50 print:bg-white">{t.name}</th>
                                {data.characters.map(c => (
                                    <td key={c.id} className="border border-black p-2 h-10 w-10"></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="break-inside-avoid page-break-after-always">
                <h3 className="font-bold text-lg mb-2 border-b border-slate-300">3. Construction de l'Arbre</h3>
                <p className="mb-2 text-sm italic">Placez les animaux au bout des branches et les innovations évolutives sur le tronc.</p>
                <RenderTree filled={false} />
            </div>
        </div>

        {/* --- PAGE 2: TEACHER CORRECTION --- */}
        <div className="print:break-before-page border-t-4 border-dashed border-slate-300 pt-8 mt-8">
             <div className="bg-slate-100 p-4 mb-6 border-l-4 border-slate-800 print:bg-gray-100">
                <h1 className="text-2xl font-bold text-slate-800">CORRIGÉ ENSEIGNANT</h1>
                <p className="text-sm text-slate-600">Document confidentiel - Ne pas distribuer</p>
             </div>

             <div className="mb-8">
                <h3 className="font-bold text-lg mb-2">Matrice Corrigée</h3>
                <table className="w-full border-collapse border-2 border-black">
                    <thead>
                        <tr>
                            <th className="border border-black p-2 bg-slate-200 print:bg-gray-300"></th>
                            {data.characters.map(c => (
                                <th key={c.id} className="border border-black p-2 bg-slate-100 text-sm print:bg-gray-200">{c.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.taxons.map(t => (
                            <tr key={t.id}>
                                <th className="border border-black p-2 text-left bg-slate-100 print:bg-gray-100">{t.name}</th>
                                {data.characters.map(c => {
                                    const isPresent = data.correctMatrix[t.id]?.includes(c.id);
                                    return (
                                        <td key={c.id} className="border border-black p-2 text-center">
                                            {isPresent ? 'X' : ''}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>

             <div className="mb-8">
                <h3 className="font-bold text-lg mb-2">Arbre Corrigé</h3>
                <RenderTree filled={true} />
             </div>
        </div>
      </div>
    </div>
  );
};