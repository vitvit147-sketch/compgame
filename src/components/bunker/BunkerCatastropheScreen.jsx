// src/components/bunker/BunkerCatastropheScreen.jsx - Эргономичный экран катастрофы Бункера
import React from 'react';
import { bunkerSocket } from '../../utils/bunkerSocket';
import { sounds } from '../../utils/soundEffects';
import { AlertTriangle, Shield, Clock, Users, ArrowRight } from 'lucide-react';

export default function BunkerCatastropheScreen({ roomData, myPlayer, isHost }) {
  const game = roomData.game || {};
  const disaster = game.disaster || {};
  const players = roomData.players || [];
  const capacity = game.shelterCapacity || Math.floor(players.length / 2);
  const firstRoom = game.bunkerRooms?.[0] || {};

  const handleProceed = () => {
    sounds.playTap();
    bunkerSocket.emit('proceed_to_investigation');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto select-none overflow-y-auto">
      {/* Шапка тревоги */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] flex items-center justify-between shadow-md">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          <span>Глобальная тревога</span>
        </span>
        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Убежище № {roomData.code}
        </span>
      </header>

      <main className="p-4 space-y-4 pb-44">
        {/* Карточка катастрофы */}
        <div className="bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-900 border-2 border-rose-600/50 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="text-center py-1">
            <div className="text-6xl mb-2">{disaster.icon || '☢️'}</div>
            <div className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1.5">
              Апокалипсис наступил
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {disaster.title}
            </h1>
          </div>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed text-center font-medium">
            {disaster.description}
          </p>

          <div className="pt-3 border-t border-rose-500/20 grid grid-cols-2 gap-3">
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-xs uppercase font-extrabold">Срок изоляции</span>
              <span className="text-xl font-black text-amber-400 font-mono mt-0.5 block">{disaster.durationYears || 5} лет</span>
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-xs uppercase font-extrabold">Мест внутри</span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">{capacity} из {players.length}</span>
            </div>
          </div>
        </div>

        {/* Первое открытое помещение бункера */}
        {firstRoom.title && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-sky-400" />
              <h3 className="font-black text-base text-sky-300">
                Разведка убежища: {firstRoom.title}
              </h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {firstRoom.desc}
            </p>
          </section>
        )}

        {/* Правило отбора */}
        <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-3xl text-sm text-amber-300/90 leading-relaxed text-center space-y-1.5 font-medium shadow-md">
          <p className="font-black text-base text-amber-400">Цель каждого выжившего:</p>
          <p className="text-slate-300 text-xs sm:text-sm">
            По очереди открывайте свои карты, доказывайте полезность профессии, здоровья и багажа. На тайном голосовании группа будет выгонять наименее нужных людей!
          </p>
        </div>
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
    </div>
  );
}
