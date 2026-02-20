import React from 'react';
import { Taxon } from '../types';

interface InfoCardsProps {
  taxons: Taxon[];
  onContinue?: () => void;
  compact?: boolean; // For displaying while in matrix mode
}

export const InfoCards: React.FC<InfoCardsProps> = ({ taxons, onContinue, compact = false }) => {
  return (
    <div className={`flex flex-col h-full overflow-y-auto ${compact ? 'pr-2' : ''}`}>
      {!compact && (
        <div className="mb-6 text-center print:hidden">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Fiches d'Identité des Espèces</h2>
          <p className="text-slate-600">Observe les caractéristiques de chaque être vivant pour remplir ta matrice.</p>
        </div>
      )}

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-2'}`}>
        {taxons.map((taxon) => (
          <div key={taxon.id} className="bg-white rounded-xl overflow-hidden shadow-md border border-slate-200 flex flex-col h-full break-inside-avoid print:shadow-none print:border-black">
            {/* Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-4 print:bg-gray-100 print:border-black">
              <div className="text-4xl bg-white p-2 rounded-full shadow-sm border border-slate-100 print:border-black">
                {taxon.emoji}
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-800 leading-none">{taxon.name}</h3>
                {taxon.scientificName && (
                  <span className="text-xs italic text-slate-500 font-serif">{taxon.scientificName}</span>
                )}
              </div>
            </div>
            
            {/* Body */}
            <div className="p-4 flex-1">
              <div className="space-y-3">
                 <div>
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1 print:text-black">Description & Attributs</h4>
                    <p className="text-sm text-slate-700 leading-relaxed text-justify print:text-black">
                      {taxon.description}
                    </p>
                 </div>
              </div>
            </div>
            
            {/* Footer decoration */}
            <div className="bg-indigo-50 px-4 py-2 border-t border-indigo-100 flex justify-between items-center print:bg-white print:border-black">
               <span className="text-[10px] text-indigo-400 font-mono print:hidden"></span>
               {/* Empty span kept for spacing/layout consistency if needed, but ID is removed */}
               <div className="flex-1 print:hidden"></div>
               
               {/* Wikipedia Link (Three Dots) */}
               <a 
                 href={taxon.wikipediaUrl || `https://fr.wikipedia.org/wiki/${taxon.name}`} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex gap-1 print:hidden cursor-pointer hover:opacity-75 p-1"
                 title="Voir sur Wikipédia"
               >
                  <div className="w-2 h-2 rounded-full bg-indigo-200"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-300"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
               </a>
            </div>
          </div>
        ))}
      </div>

      {!compact && onContinue && (
        <div className="mt-8 flex justify-center pb-8 print:hidden">
          <button
            onClick={onContinue}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105"
          >
            Passer à la Matrice
          </button>
        </div>
      )}
    </div>
  );
};