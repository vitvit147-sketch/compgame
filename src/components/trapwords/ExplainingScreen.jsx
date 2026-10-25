// src/components/trapwords/ExplainingScreen.jsx
import React, { useState, useEffect } from 'react';
import { socket } from '../../utils/socket';
import { sounds } from '../../utils/soundEffects';
import ExitConfirmModal from '../common/ExitConfirmModal';
import { Clock, Bomb, CheckCircle2, Flag, Mic, Volume2, AlertTriangle, LogOut } from 'lucide-react';

export default function ExplainingScreen({ roomData, myPlayer, isHost, onLeaveRoom }) {
  const [showExitModal, setShowExitModal] = useState(false);
  const game = roomData.game || {};
  const isSpeaker = game.isMyTurnToExplain;
  const isMyTeamExplaining = game.isMyTeamExplaining;
  const isMyTeamTrapping = game.isMyTeamTrapping;

  const explainingTeamName = game.explainingTeam === 'blue' ? 'Синяя' : 'Красная';

  // Звуковой тик на последних 5 секундах
  useEffect(() => {
    if (game.timer <= 5 && game.timer > 0) {
      sounds.playTick();
    }
  }, [game.timer]);

  const handleTriggerTrap = (trapIndex) => {
    sounds.playExplosion();
    socket.emit('trigger_trap', { trapIndex });
  };

  const handleGuessSuccess = () => {
    sounds.playSuccess();
    socket.emit('guess_success');
  };

  const handleGiveUp = () => {
    sounds.playTap();
    socket.emit('give_up');
  };

  const timerColor =
    game.timer <= 10
      ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
      : game.timer <= 20
      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
      : 'bg-slate-800 border-slate-700 text-sky-300';

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto px-4 pt-safe pb-safe space-y-4 select-none">
      {/* Шапка раунда и счет с кнопкой выхода */}
      <header className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-rose-950/50 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 flex items-center gap-1 text-xs font-black transition-colors active:scale-95 touch-manipulation shrink-0"
            title="Покинуть игру"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xs:inline">Выход</span>
          </button>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Раунд {game.round} • Объяснение
            </div>
            <div className="flex items-center gap-2 mt-0.5 font-black text-sm">
              <span className="text-rose-400">🔴 {game.scores.red}</span>
              <span className="text-slate-600">:</span>
              <span className="text-sky-400">🔵 {game.scores.blue}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                (до {game.targetScore})
              </span>
            </div>
          </div>
        </div>

        {/* Таймер */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm border shrink-0 ${timerColor}`}
        >
          <Clock className="w-4 h-4" />
          <span>{game.timer}с</span>
        </div>
      </header>

      {/* Основной контент */}
      <div className="space-y-4">
        {/* ======================================================== */}
        {/* ВАРИАНТ 1: ВЫ СПИКЕР (Объясняете секретное слово команде) */}
        {/* ======================================================== */}
        {isSpeaker && (
          <div className="space-y-4">
            {/* Карточка со словом */}
            <div className="bg-gradient-to-br from-sky-950/90 via-slate-900 to-slate-900 border-2 border-sky-500/60 rounded-3xl p-6 text-center shadow-2xl shadow-sky-950/50">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
                <Mic className="w-4 h-4 animate-bounce" />
                <span>Вы объясняете слово:</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black tracking-wide text-white uppercase py-2 drop-shadow-lg">
                {game.word}
              </div>
              <div className="text-xs text-rose-300 font-semibold bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-2xl mt-3 leading-snug">
                ⚠️ Соперники расставили {game.trapCount} мин! Не называйте очевидных слов!
              </div>
            </div>

            {/* Кнопка "УГАДАНО!" */}
            <button
              onClick={handleGuessSuccess}
              className="w-full py-5 px-6 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-xl shadow-emerald-950/50 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>Команда угадала!</span>
            </button>

            {/* Кнопка "Сдаться" */}
            <button
              onClick={handleGiveUp}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 flex items-center justify-center gap-1.5 active:scale-98 transition-all"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Сдаться в этом раунде</span>
            </button>
          </div>
        )}

        {/* =============================================================== */}
        {/* ВАРИАНТ 2: ВЫ В ОТГАДЫВАЮЩЕЙ КОМАНДЕ (Слушаете спикера и гадаете) */}
        {/* =============================================================== */}
        {isMyTeamExplaining && !isSpeaker && (
          <div className="space-y-4 text-center py-2">
            <div className="w-24 h-24 mx-auto rounded-full bg-sky-500/10 border-2 border-sky-400/40 flex items-center justify-center text-sky-400 shadow-xl shadow-sky-500/10">
              <Volume2 className="w-12 h-12 animate-pulse" />
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
              <h2 className="text-xl font-black text-white">
                Слушайте спикера и отгадывайте!
              </h2>
              <div className="text-xs text-sky-300 font-bold">
                Спикер: {game.speakerName}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-2">
                Спикер объясняет вам секретное слово голосом. Выкрикивайте свои варианты вслух! Как только прозвучит правильный ответ — спикер нажмет кнопку «Угадано».
              </p>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-400">
              Мины соперников скрыты от вас и спикера.
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* ВАРИАНТ 3: ВЫ В МИНИРУЮЩЕЙ КОМАНДЕ (Ловите спикера на словах-минах) */}
        {/* =============================================================== */}
        {isMyTeamTrapping && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-rose-950/70 to-slate-900 border border-rose-800/40 rounded-2xl p-3.5 text-center">
              <div className="text-[11px] text-rose-300 font-bold uppercase tracking-wider mb-0.5">
                Спикер соперников объясняет слово:
              </div>
              <div className="text-2xl font-black text-white uppercase tracking-wide">
                «{game.word}»
              </div>
            </div>

            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 px-1">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Нажмите кнопку мины, если спикер произнес ее!</span>
            </div>

            {/* Сетка гигантских кнопок-мин */}
            <div className="grid grid-cols-1 gap-2.5">
              {game.traps.map((trap, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTriggerTrap(idx)}
                  className="w-full py-4 px-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-between bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 hover:from-rose-600 hover:to-amber-500 text-white shadow-xl shadow-rose-950/40 border border-rose-500/40 active:scale-95 transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <Bomb className="w-5 h-5 text-amber-200 animate-pulse" />
                    <span>{trap || `Мина #${idx + 1}`}</span>
                  </span>
                  <span className="text-xs font-black bg-black/40 px-2.5 py-1 rounded-lg border border-white/20">
                    БАХ! 💥
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Футер */}
      <footer className="pt-2 pb-6 text-center text-xs text-slate-500">
        Объясняет {explainingTeamName} команда • Соперники слушают в оба уха
      </footer>

      {/* Защищенное модальное окно выхода */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => onLeaveRoom?.(isHost)}
        isHost={isHost}
        customTitle={isHost ? 'Закрыть комнату для всех?' : 'Покинуть игру?'}
        customDesc={isHost
          ? 'Вы организатор (хост). Если вы выйдете, матч завершится для всех игроков.'
          : 'Вы покинете команду и вернетесь в главное меню.'}
      />
    </div>
  );
}
