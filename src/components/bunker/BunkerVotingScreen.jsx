// src/components/bunker/BunkerVotingScreen.jsx - Эргономичный экран голосования Бункера
import React, { useState } from 'react';
import { bunkerSocket } from '../../utils/bunkerSocket';
import { sounds } from '../../utils/soundEffects';
import { Vote, Skull, Check, ArrowRight, ShieldAlert, Users } from 'lucide-react';

export default function BunkerVotingScreen({ roomData, myPlayer, isHost }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const game = roomData.game || {};
  const players = roomData.players || [];
  const votesRevealed = game.votesRevealed;
  const lastCounts = game.lastVoteCounts || {};
  const exiledId = game.lastExiledId;
  const exiledPlayer = players.find(p => p.id === exiledId);

  // Кандидаты (живые игроки, не изгнанные ранее)
  const candidates = players.filter(p => p.status !== 'exiled');

  const myVote = myPlayer?.votedFor;

  const handleCastVote = (candidateId) => {
    sounds.playTap();
    setSelectedCandidate(candidateId);
    bunkerSocket.emit('cast_vote', { candidateId });
  };

  const handleFinishVoting = () => {
    sounds.playExplosion();
    bunkerSocket.emit('finish_voting');
  };

  const handleNextRound = () => {
    sounds.playTap();
    bunkerSocket.emit('next_round');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto select-none overflow-y-auto">
      {/* Шапка голосования */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] flex items-center justify-between shadow-md">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider">
          <Vote className="w-4 h-4" />
          <span>{votesRevealed ? 'Итоги голосования' : 'Тайное голосование'}</span>
        </div>
        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Убежище № {roomData.code}
        </span>
      </header>

      <main className="max-w-lg w-full mx-auto px-5 sm:px-6 py-6 pb-48">
        <div className="text-center pt-2 pb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            {votesRevealed ? 'Решение бункера принято' : 'Кого оставить снаружи?'}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
            {votesRevealed
              ? 'Большинство решило судьбу одного из выживших.'
              : 'Выберите человека, чьи качества наименее полезны для выживания группы.'}
          </p>
        </div>

        {/* ======================================================== */}
        {/* СИТУАЦИЯ 1: ИДЕТ ГОЛОСОВАНИЕ                            */}
        {/* ======================================================== */}
        {!votesRevealed && (
          <div>
            <div className="mobile-label">
              <span>Кандидаты на изгнание ({candidates.length}):</span>
            </div>

            <div className="space-y-3.5">
              {candidates.map(candidate => {
                const isSelected = (myVote || selectedCandidate) === candidate.id;

                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => handleCastVote(candidate.id)}
                    className={`w-full min-h-[64px] p-5 sm:p-6 rounded-3xl border text-left flex items-center justify-between transition-all active:scale-98 touch-manipulation shadow-lg ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-500 shadow-rose-950/50 text-white ring-1 ring-rose-500/40'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-3xl">{candidate.avatar || '🦺'}</span>
                      <div>
                        <div className="font-black text-base flex items-center gap-2">
                          <span>{candidate.name}</span>
                          {candidate.id === myPlayer?.id && (
                            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">(Вы)</span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-400 mt-0.5">
                          {candidate.character?.profession?.revealed
                            ? `💼 ${candidate.character.profession.name}`
                            : '💼 Профессия скрыта'}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-md">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Статус отданного голоса */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl text-center text-sm text-slate-300 font-medium shadow-md">
              {myVote ? (
                <span className="text-emerald-400 font-black">
                  ✓ Ваш голос тайно зафиксирован. Ожидаем остальных...
                </span>
              ) : (
                <span>Нажмите на кандидата, чтобы проголосовать</span>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* СИТУАЦИЯ 2: ГОЛОСА ВСКРЫТЫ                               */}
        {/* ======================================================== */}
        {votesRevealed && (
          <div className="space-y-4">
            {exiledPlayer ? (
              <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 border-2 border-rose-600 rounded-3xl p-6 text-center shadow-2xl shadow-rose-950/60 animate-bounceOnce space-y-3.5">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-600/20 border border-rose-500 flex items-center justify-center text-rose-400 shadow-inner">
                  <Skull className="w-10 h-10 animate-pulse" />
                </div>
                <div className="text-xs font-black text-rose-300 uppercase tracking-widest">
                  Изгнан наружу
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                  {exiledPlayer.name}
                </h2>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  Набрал(а) больше всего голосов ({lastCounts[exiledId] || 1} шт.). Гермодвери закрылись перед ним(ней)!
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-2 shadow-xl">
                <h3 className="text-xl font-black text-white">Ничья на голосовании!</h3>
                <p className="text-sm text-slate-400">Никто не набрал решающего большинства голосов.</p>
              </div>
            )}

            {/* Раскладка голосов */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                Распределение голосов группы:
              </div>
              <div className="space-y-2">
                {Object.entries(lastCounts).map(([cId, count]) => {
                  const cand = players.find(p => p.id === cId);
                  return (
                    <div key={cId} className="flex items-center justify-between text-sm py-2 px-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <span className="text-slate-200 font-bold">{cand?.name || 'Кандидат'}</span>
                      <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                        {count} {count === 1 ? 'голос' : 'голоса'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Нижняя фиксированная панель действий */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-md mx-auto shadow-2xl">
        {!votesRevealed ? (
          isHost ? (
            <button
              type="button"
              onClick={handleFinishVoting}
              className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-2xl shadow-rose-950/60 active:scale-98 transition-all touch-manipulation"
            >
              <Skull className="w-5 h-5" />
              <span>Вскрыть голоса и изгнать 📣</span>
            </button>
          ) : (
            <div className="min-h-[56px] p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-sm text-slate-300 flex items-center justify-center font-bold shadow-lg">
              Ожидаем, пока командир бункера вскроет результаты...
            </div>
          )
        ) : (
          isHost ? (
            <button
              type="button"
              onClick={handleNextRound}
              className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-2xl shadow-amber-950/60 active:scale-98 transition-all touch-manipulation"
            >
              <span>Продолжить игру ➡️</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="min-h-[56px] p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-sm text-slate-300 flex items-center justify-center font-bold shadow-lg">
              Ожидаем перехода к следующему раунду...
            </div>
          )
        )}
      </footer>
    </div>
  );
}
