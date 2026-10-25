// src/components/bunker/BunkerCatastropheScreen.jsx
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
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto px-4 pt-safe pb-safe space-y-4 select-none">
      {/* Шапка тревоги */}
      <div className="flex items-center justify-between pb-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Глобальная тревога</span>
        </span>
        <span className="text-xs font-mono font-bold text-amber-400">
          Стол № {roomData.code}
        </span>
      </div>

      {/* Карточка катастрофы */}
      <div className="bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-900 border-2 border-rose-600/50 rounded-3xl p-5 shadow-2xl space-y-3">
        <div className="text-center py-2">
          <div className="text-5xl mb-2">{disaster.icon || '☢️'}</div>
          <div className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">
            Конец света наступил
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            {disaster.title}
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-center px-2">
          {disaster.description}
        </p>

        <div className="pt-2 border-t border-rose-500/20 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Срок изоляции</span>
            <span className="text-base font-black text-amber-400">{disaster.durationYears || 5} лет</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Мест в убежище</span>
            <span className="text-base font-black text-emerald-400">{capacity} из {players.length}</span>
          </div>
        </div>
      </div>

      {/* Первое открытое помещение бункера */}
      {firstRoom.title && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <h3 className="font-extrabold text-sm text-sky-300">
              Разведка убежища: {firstRoom.title}
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {firstRoom.desc}
          </p>
        </div>
      )}

      {/* Правило отбора */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300/90 leading-relaxed text-center space-y-1">
        <p className="font-bold">Цель каждого выжившего:</p>
        <p className="text-slate-300 text-[11px]">
          По очереди открывайте свои карты, доказывайте полезность профессии, здоровья и багажа. На тайном голосовании группа будет выгонять наименее нужных людей!
        </p>
      </div>

      {/* Кнопка старта раунда 1 */}
      <footer className="pt-2 pb-6">
        {isHost ? (
          <button
            onClick={handleProceed}
            className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-xl shadow-amber-950/50 active:scale-98 transition-all"
          >
            <span>Начать 1-й раунд: Раскрытие карт</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
            Ожидаем, пока <strong className="text-amber-400">Командир</strong> откроет шлюз...
          </div>
        )}
      </footer>
    </div>
  );
}
