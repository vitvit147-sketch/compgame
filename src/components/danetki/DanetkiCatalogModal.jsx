// src/components/danetki/DanetkiCatalogModal.jsx - Каталог всех загадок с поиском и фильтрами
import React, { useState } from 'react';
import { ALL_DANETKI, DANETKI_CATEGORIES } from '../../data/danetkiData';
import { X, Search, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';

export default function DanetkiCatalogModal({ isOpen, onClose, onSelectDanetka, completedIds = [] }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = ALL_DANETKI.filter(d => {
    const matchesCat = selectedCategory === 'all' || d.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Шапка модала */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📚</span>
            <div>
              <h3 className="text-lg font-black text-white">Каталог данеток</h3>
              <p className="text-xs text-slate-400">
                Всего: {ALL_DANETKI.length} • Отгадано: {completedIds.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Поиск */}
        <div className="p-4 border-b border-slate-800/80 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или тексту..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Фильтры по категориям */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs">
            {DANETKI_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{cat.icon} {cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Список загадок */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Ничего не найдено по вашему запросу
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isDone = completedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectDanetka(item);
                    onClose();
                  }}
                  className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all active:scale-[0.99] flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-slate-950/60 border-slate-800/60 opacity-80'
                      : 'bg-slate-800/70 border-slate-700/70 hover:border-amber-500/50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        #{idx + 1}
                      </span>
                      <h4 className="text-sm font-black text-white truncate">
                        {item.title}
                      </h4>
                      {isDone && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Отгадано</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {item.question}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
