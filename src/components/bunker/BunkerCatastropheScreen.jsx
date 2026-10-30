// src/components/bunker/BunkerCatastropheScreen.jsx - Эргономичный экран катастрофы Бункера
import React, { useState } from 'react';
import { bunkerSocket } from '../../utils/bunkerSocket';
import { sounds } from '../../utils/soundEffects';
import { AlertTriangle, Shield, Clock, Users, ArrowRight, LogOut, ShieldAlert, HeartHandshake } from 'lucide-react';
import ExitConfirmModal from '../common/ExitConfirmModal';
import { BUNKER_GAME_MODES } from '../../data/bunkerData';

export default function BunkerCatastropheScreen({ roomData, myPlayer, isHost, onLeaveRoom }) {
  const [showExitModal, setShowExitModal] = useState(false);
  const game = roomData.game || {};
  const disaster = game.disaster || {};
  const players = roomData.players || [];
  const capacity = game.shelterCapacity || Math.floor(players.length / 2);
  const firstRoom = game.bunkerRooms?.[0] || {};
  const gameMode = game.gameMode || 'threats';
  const modeConfig = BUNKER_GAME_MODES[gameMode] || BUNKER_GAME_MODES.threats;
  const firstThreat = game.threats?.[0];

  const handleProceed = () => {
    sounds.playTap();
    bunkerSocket.emit('proceed_to_investigation');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto select-none overflow-y-auto">
      {/* Шапка тревоги с кнопкой выхода */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-750 hover:bg-rose-950/50 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 flex items-center gap-1.5 text-xs font-black transition-colors active:scale-95 touch-manipulation"
            title="Покинуть убежище"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Выход</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Тревога</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
            {modeConfig.badge}
          </span>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-750 hidden sm:inline">
            № {roomData.code}
          </span>
        </div>
      </header>

      <main className="max-w-lg w-full mx-auto px-5 sm:px-6 py-6 pb-48">
        {/* Карточка катастрофы */}
        <section className="mobile-card border-rose-600/50">
          <div className="text-center py-2 mb-4">
            <div className="text-6xl mb-3">{disaster.icon || '☢️'}</div>
            <div className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1.5">
              Апокалипсис наступил
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {disaster.title}
            </h1>
          </div>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed text-center font-medium mb-6">
            {disaster.description}
          </p>

          <div className="pt-5 border-t border-rose-500/20 grid grid-cols-2 gap-3.5">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700/80 text-center">
              <span className="text-slate-400 block text-xs uppercase font-extrabold">Срок изоляции</span>
              <span className="text-xl font-black text-amber-400 font-mono mt-1 block">{disaster.durationYears || 5} лет</span>
            </div>
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700/80 text-center">
              <span className="text-slate-400 block text-xs uppercase font-extrabold">Мест внутри</span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">{capacity} из {players.length}</span>
            </div>
          </div>
        </section>

        {/* Открытая угроза №1 (Режим Бункер 3.1) */}
        {gameMode === 'threats' && firstThreat && (
          <section className="mobile-card border-amber-500/50 bg-amber-950/20">
            <div className="mobile-card-header">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h3 className="font-black text-sm uppercase tracking-wider text-amber-300">
                  Угроза убежища №1 (известна со старта):
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                Бункер 3.1
              </span>
            </div>
            <div className="text-base font-black text-white mb-1.5">
              {firstThreat.title}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mb-2.5 leading-relaxed">
              {firstThreat.desc}
            </p>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs text-amber-200 font-medium">
              💡 <strong>Кого искать и спасать:</strong> {firstThreat.solution}
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-medium">
              * Вторая угроза будет раскрыта в 3-м раунде при обследовании дальних отсеков убежища.
            </div>
          </section>
        )}

        {/* Цели классического возрождения */}
        {gameMode === 'classic' && (
          <section className="mobile-card border-sky-500/40 bg-sky-950/20">
            <div className="mobile-card-header">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏛</span>
                <h3 className="font-black text-sm uppercase tracking-wider text-sky-300">
                  Критерии победы: Возрождение цивилизации
                </h3>
              </div>
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-slate-200">
              <div className="flex items-start gap-2">
                <span className="text-sky-400 font-bold">•</span>
                <span><strong>Демография:</strong> В убежище обязательно должны войти хотя бы 1 фертильный мужчина и 1 женщина для продолжения рода.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sky-400 font-bold">•</span>
                <span><strong>Жизнеобеспечение:</strong> Закройте потребности в питании, инженерии и медицине под катастрофу ({disaster.durationYears || 5} лет).</span>
              </div>
            </div>
          </section>
        )}

        {/* Случайные ЧП (Хардкор) */}
        {gameMode === 'hardcore' && (
          <section className="mobile-card border-purple-500/40 bg-purple-950/20">
            <div className="flex items-center gap-2 text-purple-300 font-black text-sm">
              <span className="text-xl">🎲</span>
              <span>Режим «Хардкор»: Угрозы скрыты!</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Вы не знаете, какие поломки произойдут в убежище. Собирайте сбалансированную команду и берегите спецусловия и багаж для финала!
            </p>
          </section>
        )}

        {/* Первое открытое помещение бункера */}
        {firstRoom.title && (
          <section className="mobile-card border-sky-500/40">
            <div className="mobile-card-header">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-sky-400" />
                <h3 className="font-black text-base sm:text-lg text-sky-300">
                  Разведка убежища: {firstRoom.title}
                </h3>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {firstRoom.desc}
            </p>
          </section>
        )}

        {/* Правило отбора */}
        <section className="mobile-card border-amber-500/30 text-center space-y-2">
          <p className="font-black text-base text-amber-400">Цель каждого выжившего:</p>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            По очереди открывайте свои карты, доказывайте полезность профессии, здоровья и багажа. На тайном голосовании группа будет выгонять наименее нужных людей!
          </p>
        </section>
      </main>

      {/* Фиксированная кнопка внизу с защитой от вырезов */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-md mx-auto shadow-2xl">
        {isHost ? (
          <button
            type="button"
            onClick={handleProceed}
            className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-2xl shadow-amber-950/60 active:scale-98 transition-all touch-manipulation"
          >
            <span>Начать 1-й раунд: Раскрытие карт</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="min-h-[56px] p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-sm text-slate-300 flex items-center justify-center gap-2 font-bold shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Ожидаем, пока <strong className="text-amber-400 font-black">Командир</strong> откроет шлюз...</span>
          </div>
        )}
      </footer>

      {/* Модальное окно безопасного выхода с двойным подтверждением */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => onLeaveRoom?.(isHost)}
        isHost={isHost}
        customTitle={isHost ? 'Закрыть убежище для всех?' : 'Покинуть убежище?'}
        customDesc={isHost
          ? 'Вы командир (хост). Если вы закроете убежище, игра завершится для всех игроков.'
          : 'Вы покинете бункер и вернетесь в главное меню. Прогресс этой партии будет потерян.'}
      />
    </div>
  );
}
