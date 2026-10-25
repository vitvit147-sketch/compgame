// src/components/deception/DeceptionFinaleScreen.jsx - Экран финала дела «Криминалист»
import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { deceptionSocket } from '../../utils/deceptionSocket';
import { sounds } from '../../utils/soundEffects';
import GameHeader from '../common/GameHeader';
import {
  Trophy,
  Skull,
  RotateCcw,
  Home,
  Shield,
  Eye,
  Check,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export default function DeceptionFinaleScreen({ roomData, myPlayer, isHost, onExitToHome }) {
  const game = roomData.game || {};
  const isWitnessGuessPhase = game.phase === 'WITNESS_GUESS';
  const winner = game.winner;
  const isInvestigatorsWin = winner === 'investigators';
  const solution = game.solution || {};
  const players = roomData.players || [];

  const [selectedWitnessId, setSelectedWitnessId] = useState(null);

  useEffect(() => {
    if (!isWitnessGuessPhase) {
      if (isInvestigatorsWin) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        sounds.playSuccess();
      } else {
        sounds.playExplosion();
      }
    }
  }, [isWitnessGuessPhase, isInvestigatorsWin]);

  const handleRematch = () => {
    sounds.playTap();
    deceptionSocket.emit('reset_to_lobby');
  };

  const handleGuessWitness = () => {
    if (!selectedWitnessId) return;
    sounds.playTap();
    deceptionSocket.emit('murderer_guess_witness', {
      suspectWitnessId: selectedWitnessId
    });
  };

  // Потенциальные свидетели (все кроме убийцы, криминалиста и соучастника)
  const potentialWitnesses = players.filter(p => p.role !== 'murderer' && p.role !== 'scientist' && p.role !== 'accomplice');
  const isMurdererTeam = myPlayer?.role === 'murderer' || myPlayer?.role === 'accomplice';

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start select-none">
      <GameHeader
        onBack={() => onExitToHome?.(isHost)}
        backLabel="В меню"
        title="ИТОГИ ДЕЛА"
        icon="⚖️"
        badge={isWitnessGuessPhase ? 'Последний шанс' : isInvestigatorsWin ? 'Победа следствия' : 'Победа убийцы'}
      />

      <main className="max-w-md w-full mx-auto px-5 sm:px-6 py-6 pb-48 overflow-y-auto">
        {/* ================================================================= */}
        {/* ФАЗА: УБИЙЦА УГАДЫВАЕТ СВИДЕТЕЛЯ (ПОСЛЕДНИЙ ШАНС)                  */}
        {/* ================================================================= */}
        {isWitnessGuessPhase ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-4xl mb-3 shadow-xl shadow-rose-950/60 animate-bounce">
                🎯
              </div>
              <h1 className="text-2xl font-black text-rose-400 uppercase tracking-tight">
                Охота на Свидетеля!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xs mx-auto leading-relaxed">
                Следователи безошибочно вычислили преступление! Но у преступников есть последний шанс: если Убийца назовет Свидетеля — преступники победят.
              </p>
            </div>

            {isMurdererTeam ? (
              <section className="mobile-card border-rose-500/50 space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-rose-300 block">
                  Убийца, укажите, кто был Свидетелем:
                </span>
                <div className="space-y-2">
                  {potentialWitnesses.map(p => {
                    const isSelected = selectedWitnessId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          sounds.playTap();
                          setSelectedWitnessId(p.id);
                        }}
                        className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                          isSelected
                            ? 'bg-rose-600 border-rose-400 text-white shadow-xl shadow-rose-950/80 font-black'
                            : 'bg-slate-950/80 border-slate-750 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{p.avatar || '🕵️'}</span>
                          <span className="font-bold text-sm">{p.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleGuessWitness}
                  disabled={!selectedWitnessId}
                  className={`w-full min-h-[54px] rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
                    selectedWitnessId
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-950/60 active:scale-98'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Ликвидировать свидетеля 🎯
                </button>
              </section>
            ) : (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3">
                <span className="text-3xl animate-pulse block">🤫</span>
                <h3 className="font-black text-base text-white">Убийца совещается...</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Преступник пытается вычислить Свидетеля среди следователей. Сохраняйте спокойствие!
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ================================================================= */
          /* ФИНАЛЬНЫЙ ЭКРАН ИТОГОВ И РАСКРЫТИЯ ВСЕХ КАРТ                     */
          /* ================================================================= */
          <div className="space-y-6">
            {/* Карточка триумфатора */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-slate-900 border-2 border-amber-500/50 shadow-2xl shadow-amber-950/50 flex items-center justify-center text-5xl mb-4">
                {isInvestigatorsWin ? '🏆' : '💀'}
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest mb-2.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Дело закрыто</span>
              </div>

              <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${
                isInvestigatorsWin ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {isInvestigatorsWin ? 'Победа Следователей!' : 'Победа Убийцы!'}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-xs mx-auto font-medium">
                {game.winReason}
              </p>
            </div>

            {/* Карточка раскрытия тайны преступления */}
            <section className="mobile-card border-amber-500/50 space-y-3">
              <div className="mobile-card-header">
                <h3 className="font-black text-sm uppercase tracking-wider text-amber-400">
                  Раскрытые улики преступления
                </h3>
              </div>

              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Настоящий убийца:</span>
                  <span className="text-rose-400 font-black">{solution.murdererName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Орудие убийства:</span>
                  <span className="text-sky-400 font-black">«{solution.meansTitle}»</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Ключевая улика:</span>
                  <span className="text-rose-400 font-black">«{solution.clueTitle}»</span>
                </div>
              </div>
            </section>

            {/* Список всех ролей участников */}
            <section className="mobile-card space-y-3">
              <div className="mobile-card-header">
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  Роли всех участников дела
                </h3>
              </div>

              <div className="space-y-2">
                {players.map(p => {
                  const roleTitle = p.role === 'scientist'
                    ? 'Судмедэксперт'
                    : p.role === 'murderer'
                    ? 'Убийца'
                    : p.role === 'accomplice'
                    ? 'Соучастник'
                    : p.role === 'witness'
                    ? 'Свидетель'
                    : 'Следователь';

                  const badgeColor = p.role === 'murderer'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : p.role === 'scientist'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : p.role === 'accomplice'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/40';

                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{p.avatar || '🕵️'}</span>
                        <span className="font-bold text-white text-sm">{p.name}</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${badgeColor}`}>
                        {roleTitle}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Нижняя панель действий */}
      {!isWitnessGuessPhase && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-md mx-auto shadow-2xl space-y-2.5">
          {isHost ? (
            <button
              type="button"
              onClick={handleRematch}
              className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-2xl shadow-amber-950/60 active:scale-98 transition-all touch-manipulation"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Сыграть новое дело (Реванш)</span>
            </button>
          ) : (
            <div className="min-h-[56px] p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs sm:text-sm text-slate-300 flex items-center justify-center font-bold shadow-lg">
              Ожидаем, пока шеф отдела запустит новое дело...
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
