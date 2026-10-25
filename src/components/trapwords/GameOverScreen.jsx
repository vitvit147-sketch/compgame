// src/components/trapwords/GameOverScreen.jsx
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { socket } from '../../utils/socket';
import { sounds } from '../../utils/soundEffects';
import { Trophy, Sparkles, RotateCcw, Home } from 'lucide-react';

export default function GameOverScreen({ roomData, myPlayer, isHost, onExitToHome }) {
  const game = roomData.game || {};
  const isWinnerRed = game.winner === 'red';
  const winnerName = isWinnerRed ? 'КРАСНАЯ КОМАНДА' : 'СИНЯЯ КОМАНДА';
  const isMyTeamWinner = myPlayer?.team === game.winner;

  useEffect(() => {
    // Двойной залп конфетти
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } });
    }, 400);

    sounds.playSuccess();
  }, [game.winner]);

  const handleRematch = () => {
    sounds.playTap();
    socket.emit('reset_to_lobby');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto px-4 pt-safe pb-safe space-y-5 select-none text-center">
      {/* Кубок */}
      <div className="relative w-28 h-28 mx-auto flex items-center justify-center pt-2">
        <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-2xl shadow-amber-500/40">
          <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-amber-400">
            <Trophy className="w-12 h-12 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Текст триумфа */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Победа в игре!</span>
        </div>

        <h1
          className={`text-3xl font-black uppercase tracking-tight ${
            isWinnerRed ? 'text-rose-400' : 'text-sky-400'
          }`}
        >
          {winnerName}
        </h1>

        <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
          {isMyTeamWinner
            ? '🎉 Поздравляем! Ваша команда проявила гениальную интуицию!'
            : 'В этот раз соперники оказались чуть хитрее. Время для реванша!'}
        </p>
      </div>

      {/* Финальный счет */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl max-w-xs w-full mx-auto">
        <div className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">Финальный счет</div>
        <div className="flex items-center justify-center gap-8">
          <div>
            <div className="text-xs text-rose-300 font-bold mb-0.5">🔴 Красные</div>
            <div className="text-3xl font-black text-rose-400">{game.scores?.red || 0}</div>
          </div>
          <div className="text-2xl font-black text-slate-600">:</div>
          <div>
            <div className="text-xs text-sky-300 font-bold mb-0.5">🔵 Синие</div>
            <div className="text-3xl font-black text-sky-400">{game.scores?.blue || 0}</div>
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <footer className="space-y-3 pt-2 pb-6 w-full">
        {isHost ? (
          <button
            onClick={handleRematch}
            className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white shadow-xl shadow-rose-950/50 active:scale-98 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Играть еще раз (Реванш)</span>
          </button>
        ) : (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
            Ожидаем, пока <span className="text-amber-400 font-bold">Хост</span> начнет новую игру...
          </div>
        )}

        <button
          onClick={onExitToHome}
          className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all active:scale-98"
        >
          <Home className="w-4 h-4" />
          <span>Выйти на главную</span>
        </button>
      </footer>
    </div>
  );
}
