// src/components/deception/DeceptionNightScreen.jsx - Фаза Ночи (Тайный выбор преступления)
import React, { useState } from 'react';
import { deceptionSocket } from '../../utils/deceptionSocket';
import { sounds } from '../../utils/soundEffects';
import ExitConfirmModal from '../common/ExitConfirmModal';
import {
  Moon,
  Shield,
  Eye,
  Check,
  AlertTriangle,
  Lock,
  Sparkles,
  LogOut
} from 'lucide-react';

export default function DeceptionNightScreen({ roomData, myPlayer, isHost, onLeaveRoom }) {
  const [selectedMeansId, setSelectedMeansId] = useState(null);
  const [selectedClueId, setSelectedClueId] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const role = myPlayer?.role || 'investigator';
  const isMurderer = role === 'murderer';
  const isScientist = role === 'scientist';
  const isAccomplice = role === 'accomplice';
  const isWitness = role === 'witness';

  const meansCards = myPlayer?.meansCards || [];
  const clueCards = myPlayer?.clueCards || [];

  const handleSelectMeans = (id) => {
    sounds.playTap();
    setSelectedMeansId(id);
  };

  const handleSelectClue = (id) => {
    sounds.playTap();
    setSelectedClueId(id);
  };

  const handleConfirmCrime = () => {
    if (!selectedMeansId || !selectedClueId) return;
    sounds.playExplosion();
    setIsSubmitting(true);
    deceptionSocket.emit('murderer_select_solution', {
      meansId: selectedMeansId,
      clueId: selectedClueId
    });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start select-none">
      {/* Шапка ночи */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] flex items-center justify-between shadow-md">
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-750 hover:bg-rose-950/50 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 flex items-center gap-1 text-xs font-black transition-colors active:scale-95 touch-manipulation"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Выход</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider animate-pulse">
          <Moon className="w-3.5 h-3.5" />
          <span>Ночь в Гонконге</span>
        </span>

        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Дело № {roomData.code}
        </span>
      </header>

      <main className="max-w-md w-full mx-auto px-5 sm:px-6 py-6 pb-48 overflow-y-auto">
        {/* Баннер роли игрока */}
        <div className={`mobile-card text-center mb-6 ${
          isMurderer
            ? 'border-rose-600 bg-rose-950/20 shadow-2xl shadow-rose-950/50'
            : isScientist
            ? 'border-amber-500/50 bg-amber-950/15'
            : isAccomplice
            ? 'border-purple-500/50 bg-purple-950/20'
            : isWitness
            ? 'border-sky-500/50 bg-sky-950/20'
            : 'border-slate-700 bg-slate-900/60'
        }`}>
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border border-slate-750 flex items-center justify-center text-4xl shadow-lg mb-3">
            {isMurderer ? '🔪' : isScientist ? '👨‍🔬' : isAccomplice ? '🤝' : isWitness ? '👁️' : '🕵️'}
          </div>

          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Ваша тайная роль в этом деле
          </div>

          <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${
            isMurderer ? 'text-rose-400' : isScientist ? 'text-amber-400' : isAccomplice ? 'text-purple-300' : 'text-sky-300'
          }`}>
            {myPlayer?.title || 'Следователь'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed font-medium px-2">
            {isMurderer && 'Вы совершили идеальное преступление. Выберите 1 Орудие и 1 Улику из ваших карт ниже. Именно их будут пытаться отгадать детективы!'}
            {isScientist && 'Вы знаете все детали дела, но вам СТРОГО ЗАПРЕЩЕНО говорить. Ожидайте, пока преступник выберет свои карты...'}
            {isAccomplice && 'Вы соучастник убийцы. Защищайте его на дебатах и отводите подозрения на честных людей.'}
            {isWitness && 'Вы тайный свидетель. Вы знаете преступников, но если убийца раскроет вас в конце — преступники победят!'}
            {role === 'investigator' && 'Вы честный следователь. Внимательно наблюдайте за поведением игроков и ждите отчета судмедэксперта.'}
          </p>
        </div>

        {/* ================================================================= */}
        {/* ВИД ДЛЯ УБИЙЦЫ: ВЫБОР ОРУДИЯ И УЛИКИ                             */}
        {/* ================================================================= */}
        {isMurderer ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Секция 1: Выбор орудия убийства (Синие карты) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <span>1. Выберите Орудие (1 из 4):</span>
                </span>
                {selectedMeansId && <span className="text-xs font-bold text-emerald-400">✅ Выбрано</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {meansCards.map(card => {
                  const isSelected = selectedMeansId === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleSelectMeans(card.id)}
                      className={`p-4 rounded-2xl border text-left transition-all active:scale-98 touch-manipulation ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-400 shadow-xl shadow-sky-950/60 ring-2 ring-sky-400/50'
                          : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-2xl">{card.icon}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-sky-500 border-sky-400 text-white' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="font-black text-sm text-white">{card.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">{card.desc}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Секция 2: Выбор улики (Красные карты) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <span>2. Выберите Улику (1 из 4):</span>
                </span>
                {selectedClueId && <span className="text-xs font-bold text-emerald-400">✅ Выбрано</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {clueCards.map(card => {
                  const isSelected = selectedClueId === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleSelectClue(card.id)}
                      className={`p-4 rounded-2xl border text-left transition-all active:scale-98 touch-manipulation ${
                        isSelected
                          ? 'bg-rose-500/20 border-rose-400 shadow-xl shadow-rose-950/60 ring-2 ring-rose-400/50'
                          : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-2xl">{card.icon}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-rose-500 border-rose-400 text-white' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="font-black text-sm text-white">{card.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">{card.desc}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          /* ================================================================= */
          /* ВИД ДЛЯ СЛЕДОВАТЕЛЕЙ / ЭКСПЕРТА: ОЖИДАНИЕ СОВЕРШЕНИЯ ПРЕСТУПЛЕНИЯ */
          /* ================================================================= */
          <div className="space-y-4 text-center py-6">
            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-xl animate-pulse">
                ⏳
              </div>
              <h3 className="font-black text-base text-white">В городе совершается преступление...</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Убийца бесшумно выбирает орудие и оставляет ключевую улику. Как только выбор будет сделан, Криминалист начнет составление отчета.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Нижняя панель действий для убийцы */}
      {isMurderer && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-md mx-auto shadow-2xl">
          <button
            type="button"
            onClick={handleConfirmCrime}
            disabled={!selectedMeansId || !selectedClueId || isSubmitting}
            className={`w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 transition-all touch-manipulation ${
              selectedMeansId && selectedClueId && !isSubmitting
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-2xl shadow-rose-950/60 active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Lock className="w-5 h-5" />
            <span>
              {isSubmitting
                ? 'Сохраняем...'
                : selectedMeansId && selectedClueId
                ? 'Подтвердить преступление 🔪'
                : 'Выберите 1 орудие и 1 улику'}
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
          ? 'Вы являетесь организатором дела. Если вы выйдете, текущая партия завершится для всех игроков.'
          : 'Вы покинете активную игру и вернетесь в главное меню.'}
      />
    </div>
  );
}
