// src/components/deception/DeceptionScientistSetup.jsx - Пульт Судмедэксперта для расстановки маркеров
import React, { useState } from 'react';
import { deceptionSocket } from '../../utils/deceptionSocket';
import { sounds } from '../../utils/soundEffects';
import ExitConfirmModal from '../common/ExitConfirmModal';
import {
  FileText,
  Check,
  AlertTriangle,
  Send,
  Eye,
  LogOut,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function DeceptionScientistSetup({ roomData, myPlayer, isHost, onLeaveRoom }) {
  const game = roomData.game || {};
  const solution = game.solution || {};
  const activeTiles = game.activeTiles || [];
  const isScientist = myPlayer?.role === 'scientist';

  // Локальное состояние расставленных маркеров { [tileId]: selectedOptionId }
  const [selectedMarkers, setSelectedMarkers] = useState(() => {
    const initial = {};
    activeTiles.forEach(tile => {
      if (tile.selectedOptionId) {
        initial[tile.id] = tile.selectedOptionId;
      }
    });
    return initial;
  });

  const [showExitModal, setShowExitModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSelectOption = (tileId, optionId) => {
    sounds.playTap();
    setSelectedMarkers(prev => ({
      ...prev,
      [tileId]: optionId
    }));
  };

  const markedCount = Object.keys(selectedMarkers).filter(k => selectedMarkers[k] !== null).length;
  const isAllMarked = activeTiles.length > 0 && markedCount >= activeTiles.length;

  const handlePublish = () => {
    if (!isAllMarked) return;
    sounds.playSuccess();
    setIsPublishing(true);
    deceptionSocket.emit('scientist_set_markers', {
      markers: selectedMarkers
    });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start select-none">
      {/* Шапка */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] flex items-center justify-between shadow-md">
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-750 hover:bg-rose-950/50 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 flex items-center gap-1 text-xs font-black transition-colors active:scale-95 touch-manipulation"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Выход</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider animate-pulse">
          <FileText className="w-3.5 h-3.5" />
          <span>Отчет эксперта</span>
        </span>

        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Дело № {roomData.code}
        </span>
      </header>

      <main className="max-w-md w-full mx-auto px-5 sm:px-6 py-6 pb-48 overflow-y-auto">
        {isScientist ? (
          /* =============================================================== */
          /* ПУЛЬТ КРИМИНАЛИСТА (СУДМЕДЭКСПЕРТА)                             */
          /* =============================================================== */
          <div className="space-y-6">
            {/* Секретный бокс преступления (виден ТОЛЬКО криминалисту) */}
            <section className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/50 shadow-2xl shadow-amber-950/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Секретная истина дела</span>
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  Строго конфиденциально
                </span>
              </div>

              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">Преступник:</span>
                  <span className="text-amber-400 font-black text-sm">{solution.murdererName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">Орудие убийства:</span>
                  <span className="text-sky-400 font-black text-sm">{solution.meansTitle}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">Оставленная улика:</span>
                  <span className="text-rose-400 font-black text-sm">{solution.clueTitle}</span>
                </div>
              </div>

              <p className="text-[11px] text-amber-300/80 leading-relaxed font-medium">
                🤫 <strong>Напоминание:</strong> Вам запрещено говорить или жестикулировать! Выберите на каждом планшете по одному пункту, чтобы направить следствие к этим картам.
              </p>
            </section>

            {/* Прогресс расстановки меток */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Планшеты реконструкции ({markedCount}/{activeTiles.length})
              </h2>
              {isAllMarked && (
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Все метки стоят
                </span>
              )}
            </div>

            {/* Список планшетов для разметки */}
            <div className="space-y-4">
              {activeTiles.map((tile, tIdx) => {
                const selectedOption = selectedMarkers[tile.id];
                return (
                  <section
                    key={tile.id}
                    className={`mobile-card transition-all ${
                      tile.isFixed
                        ? 'border-sky-500/40 bg-sky-950/10'
                        : 'border-slate-750 bg-slate-900/80'
                    }`}
                  >
                    <div className="mobile-card-header">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{tile.icon}</span>
                          <h3 className="font-black text-sm sm:text-base text-white">
                            {tile.title}
                          </h3>
                        </div>
                        {tile.isFixed ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Базовый
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            Сцена #{tIdx - 1}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Сетка вариантов ответа (кнопки) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tile.options.map(opt => {
                        const isChosen = selectedOption === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(tile.id, opt.id)}
                            className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between active:scale-98 touch-manipulation ${
                              isChosen
                                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md shadow-amber-950/50 font-black'
                                : 'bg-slate-950/80 border-slate-800 hover:bg-slate-850 text-slate-300'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isChosen && <Check className="w-4 h-4 stroke-[3] shrink-0 ml-1.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          /* =============================================================== */
          /* ЭКРАН ОЖИДАНИЯ ДЛЯ ОСТАЛЬНЫХ ИГРОКОВ (СЛЕДОВАТЕЛЕЙ И УБИЙЦЫ)     */
          /* =============================================================== */
          <div className="space-y-5 text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border-2 border-sky-500/40 flex items-center justify-center text-4xl shadow-xl shadow-sky-950/40 animate-pulse">
              📋
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Эксперт составляет отчет
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                Судмедэксперт изучает место трагедии и расставляет метки на 6 планшетах реконструкции событий.
              </p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 max-w-sm mx-auto font-medium">
              💡 <strong>Совет:</strong> приготовьтесь внимательно изучить карточки перед собой и карточки соседей за столом!
            </div>
          </div>
        )}
      </main>

      {/* Кнопка отправки отчета для криминалиста */}
      {isScientist && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-md mx-auto shadow-2xl">
          <button
            type="button"
            onClick={handlePublish}
            disabled={!isAllMarked || isPublishing}
            className={`w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 transition-all touch-manipulation ${
              isAllMarked && !isPublishing
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-2xl shadow-amber-950/60 active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
            }`}
          >
            <Send className="w-5 h-5 stroke-[2.5]" />
            <span>
              {isPublishing
                ? 'Публикуем...'
                : isAllMarked
                ? 'Опубликовать отчет следствию 📋'
                : `Расставьте все метки (${markedCount}/${activeTiles.length})`}
            </span>
          </button>
        </footer>
      )}

      {/* Безопасный выход */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => onLeaveRoom?.(isHost)}
        isHost={isHost}
        customTitle={isHost ? 'Закрыть дело для всех?' : 'Покинуть расследование?'}
        customDesc={isHost
          ? 'Вы являетесь организатором дела. Если вы закроете дело, игра завершится для всех игроков.'
          : 'Вы покинете активную игру и вернетесь в главное меню.'}
      />
    </div>
  );
}
