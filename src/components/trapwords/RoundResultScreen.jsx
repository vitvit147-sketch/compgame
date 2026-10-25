// src/components/trapwords/RoundResultScreen.jsx
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { socket } from '../../utils/socket';
import { sounds } from '../../utils/soundEffects';
import { Bomb, CheckCircle2, Clock, Play, Trophy, Sparkles, XCircle } from 'lucide-react';

export default function RoundResultScreen({ roomData, myPlayer, isHost }) {
  const game = roomData.game || {};
  const result = game.roundResult || {};
  const isTrapDetonated = result.outcome === 'TRAP_TRIGGERED';
  const isGuessed = result.outcome === 'GUESSED';

  useEffect(() => {
    if (isGuessed) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      sounds.playSuccess();
    } else if (isTrapDetonated) {
      sounds.playExplosion();
    }
  }, [result.outcome]);

  const handleNextRound = () => {
    sounds.playTap();
    socket.emit('next_round');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto px-4 pt-safe pb-safe space-y-4 select-none">
      {/* Шапка счета */}
      <header className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl text-center">
        <div className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
          Счет после {game.round} раунда (игра до {game.targetScore})
        </div>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-xs text-rose-300 font-bold mb-0.5">🔴 Красные</div>
            <div className="text-3xl font-black text-rose-400">{game.scores?.red || 0}</div>
          </div>
          <div className="text-2xl font-black text-slate-600">:</div>
          <div className="text-center">
            <div className="text-xs text-sky-300 font-bold mb-0.5">🔵 Синие</div>
            <div className="text-3xl font-black text-sky-400">{game.scores?.blue || 0}</div>
          </div>
        </div>
      </header>

      {/* Результат раунда */}
      <div className="space-y-4">
        {/* Баннер исхода 1: Мина взорвалась */}
        {isTrapDetonated && (
          <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 border-2 border-rose-600 rounded-3xl p-6 text-center shadow-2xl shadow-rose-950/60 animate-bounceOnce">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-600/20 border border-rose-500 flex items-center justify-center text-rose-400 mb-3 shadow-lg shadow-rose-600/30">
              <Bomb className="w-8 h-8 animate-pulse" />
            </div>
            <div className="text-xs font-bold text-rose-300 uppercase tracking-widest mb-1">
              Мина сработала! 💥
            </div>
            <h2 className="text-3xl font-black text-white uppercase mb-2">
              «{game.triggeredTrap}»
            </h2>
            <p className="text-xs text-slate-300">
              {result.triggeredBy ? (
                <>
                  Ловушку активировал(а): <strong className="text-amber-400">{result.triggeredBy}</strong>
                </>
              ) : (
                'Спикер произнес запрещенное слово-мину!'
              )}
            </p>
            <div className="mt-3 text-xs font-bold text-rose-400 bg-rose-500/10 py-1.5 px-4 rounded-xl border border-rose-500/20 inline-block">
              Раунд проигран • 0 очков
            </div>
          </div>
        )}

        {/* Баннер исхода 2: Угадано */}
        {isGuessed && (
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500 rounded-3xl p-6 text-center shadow-2xl shadow-emerald-950/60">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1">
              Победа в раунде! 🎉
            </div>
            <h2 className="text-3xl font-black text-white uppercase mb-2">
              «{game.word}»
            </h2>
            <p className="text-xs text-slate-300">
              Команда успешно отгадала слово и не наступила ни на одну мину!
            </p>
            <div className="mt-3 text-xs font-bold text-emerald-300 bg-emerald-500/20 py-1.5 px-4 rounded-xl border border-emerald-500/30 inline-block">
              +1 Очко команде!
            </div>
          </div>
        )}

        {/* Баннер исхода 3: Время вышло */}
        {result.outcome === 'TIME_OUT' && (
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center shadow-xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white mb-1">Время вышло!</h2>
            <p className="text-xs text-slate-400 mb-2">
              Секретное слово было: <strong className="text-white uppercase">{game.word}</strong>
            </p>
            <div className="text-xs text-slate-400 bg-slate-800 py-1.5 px-3.5 rounded-xl inline-block">
              Ничья в раунде
            </div>
          </div>
        )}

        {/* Баннер исхода 4: Сдались */}
        {result.outcome === 'GIVE_UP' && (
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center shadow-xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white mb-1">Команда сдалась</h2>
            <p className="text-xs text-slate-400 mb-2">
              Секретное слово было: <strong className="text-white uppercase">{game.word}</strong>
            </p>
          </div>
        )}

        {/* Раскрытие всех расставленных мин */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
            <Bomb className="w-4 h-4 text-amber-400" />
            <span>Все заложенные мины в этом раунде:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {game.traps?.map((trap, idx) => {
              const wasTriggered = trap && trap.toLowerCase() === game.triggeredTrap?.toLowerCase();
              return (
                <span
                  key={idx}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                    wasTriggered
                      ? 'bg-rose-600 text-white border border-rose-400 shadow-md shadow-rose-900/50 scale-105'
                      : 'bg-slate-950 text-slate-300 border border-slate-800'
                  }`}
                >
                  {wasTriggered ? '💥 ' : ''}
                  {trap}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Кнопка "Следующий раунд" */}
      <footer className="pt-2 pb-6">
        {isHost ? (
          <button
            onClick={handleNextRound}
            className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-xl shadow-sky-950/50 active:scale-98 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Следующий раунд</span>
          </button>
        ) : (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span>Ожидаем, пока <strong className="text-amber-400">Хост</strong> запустит следующий раунд...</span>
          </div>
        )}
      </footer>
    </div>
  );
}
