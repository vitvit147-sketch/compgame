// src/components/deception/DeceptionAccusationModal.jsx - Модальное окно официального обвинения
import React, { useState } from 'react';
import { sounds } from '../../utils/soundEffects';
import { Shield, Check, X, AlertTriangle, ArrowRight } from 'lucide-react';

export default function DeceptionAccusationModal({
  isOpen,
  onClose,
  onSubmitAccusation,
  players = [],
  myPlayerId
}) {
  const [selectedSuspectId, setSelectedSuspectId] = useState(null);
  const [selectedMeansId, setSelectedMeansId] = useState(null);
  const [selectedClueId, setSelectedClueId] = useState(null);

  if (!isOpen) return null;

  // Подозреваемые: все игроки, кроме Криминалиста (у него нет карт)
  const suspects = players.filter(p => p.role !== 'scientist');
  const currentSuspect = suspects.find(p => p.id === selectedSuspectId);

  const handleSelectSuspect = (id) => {
    sounds.playTap();
    setSelectedSuspectId(id);
    setSelectedMeansId(null);
    setSelectedClueId(null);
  };

  const handleSelectMeans = (id) => {
    sounds.playTap();
    setSelectedMeansId(id);
  };

  const handleSelectClue = (id) => {
    sounds.playTap();
    setSelectedClueId(id);
  };

  const isFormComplete = selectedSuspectId && selectedMeansId && selectedClueId;

  const handleSubmit = () => {
    if (!isFormComplete) return;
    sounds.playTap();
    onSubmitAccusation({
      suspectId: selectedSuspectId,
      meansId: selectedMeansId,
      clueId: selectedClueId
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-lg max-h-[90dvh] flex flex-col bg-slate-900 border-2 border-amber-500/60 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-amber-950/60 overflow-hidden animate-scaleUp">
        {/* Шапка модалки */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
              Выдвинуть обвинение
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Предупреждение о цене ошибки */}
        <div className="bg-rose-950/30 border-b border-rose-500/20 px-5 py-2.5 flex items-center gap-2.5 text-rose-300 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>У вас всего 1 жетон! В случае ошибки он сгорит навсегда.</span>
        </div>

        {/* Контент формы обвинения */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Шаг 1: Выбор подозреваемого */}
          <section className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
              1. Кого вы обвиняете в убийстве?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {suspects.map(p => {
                const isSelected = selectedSuspectId === p.id;
                const isMe = p.id === myPlayerId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectSuspect(p.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                        : 'bg-slate-950/70 border-slate-750 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl">{p.avatar || '🕵️'}</span>
                      <span className="font-black text-xs sm:text-sm truncate">
                        {p.name} {isMe && '(Вы)'}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Шаг 2 и 3: Если подозреваемый выбран — показываем его карты */}
          {currentSuspect ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Шаг 2: Выбор орудия убийства */}
              <section className="space-y-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-sky-400 block">
                  2. Какое орудие использовал {currentSuspect.name}?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(currentSuspect.meansCards || []).map(m => {
                    const isSelected = selectedMeansId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMeans(m.id)}
                        className={`p-3 rounded-2xl border text-left transition-all active:scale-98 ${
                          isSelected
                            ? 'bg-sky-500/25 border-sky-400 text-white shadow-lg ring-1 ring-sky-400'
                            : 'bg-slate-950/70 border-slate-750 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xl">{m.icon}</span>
                          {isSelected && <Check className="w-4 h-4 text-sky-400 stroke-[3]" />}
                        </div>
                        <div className="font-black text-xs text-white">{m.title}</div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Шаг 3: Выбор оставленной улики */}
              <section className="space-y-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-rose-400 block">
                  3. Какую улику оставил {currentSuspect.name}?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(currentSuspect.clueCards || []).map(c => {
                    const isSelected = selectedClueId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectClue(c.id)}
                        className={`p-3 rounded-2xl border text-left transition-all active:scale-98 ${
                          isSelected
                            ? 'bg-rose-500/25 border-rose-400 text-white shadow-lg ring-1 ring-rose-400'
                            : 'bg-slate-950/70 border-slate-750 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xl">{c.icon}</span>
                          {isSelected && <Check className="w-4 h-4 text-rose-400 stroke-[3]" />}
                        </div>
                        <div className="font-black text-xs text-white">{c.title}</div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-500">
              Сначала выберите подозреваемого игрока выше, чтобы изучить его карты.
            </div>
          )}
        </div>

        {/* Футер модалки с кнопкой выдвижения обвинения */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 min-h-[54px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition-all"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormComplete}
            className={`w-2/3 min-h-[54px] rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 ${
              isFormComplete
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-xl shadow-amber-950/60'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <span>Огласить обвинение ⚖️</span>
          </button>
        </div>
      </div>
    </div>
  );
}
