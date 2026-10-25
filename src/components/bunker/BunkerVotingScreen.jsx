// src/components/bunker/BunkerVotingScreen.jsx
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
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto px-4 pt-safe pb-safe space-y-4 select-none">
      {/* Шапка голосования */}
      <header className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider">
          <Vote className="w-3.5 h-3.5" />
          <span>{votesRevealed ? 'Итоги голосования' : 'Тайное голосование на изгнание'}</span>
        </div>
        <h1 className="text-xl font-black text-white">
          {votesRevealed ? 'Решение бункера принято' : 'Кого оставить снаружи?'}
        </h1>
        <p className="text-xs text-slate-400">
          {votesRevealed
            ? 'Большинство решило судьбу одного из выживших.'
            : 'Выберите человека, чьи качества наименее полезны для выживания группы.'}
        </p>
      </header>

      {/* ======================================================== */}
      {/* СИТУАЦИЯ 1: ИДЕТ ГОЛОСОВАНИЕ                            */}
      {/* ======================================================== */}
      {!votesRevealed && (
        <div className="space-y-3 flex-1">
          <div className="text-xs font-bold text-slate-400 px-1">
            Кандидаты на изгнание ({candidates.length}):
          </div>

          <div className="space-y-2">
            {candidates.map(candidate => {
              const isSelected = (myVote || selectedCandidate) === candidate.id;

              return (
                <button
                  key={candidate.id}
                  onClick={() => handleCastVote(candidate.id)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-950/40 text-white'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{candidate.avatar || '🦺'}</span>
                    <div>
                      <div className="font-extrabold text-sm flex items-center gap-1.5">
                        <span>{candidate.name}</span>
                        {candidate.id === myPlayer?.id && (
                          <span className="text-[10px] text-amber-400 font-normal">(Вы)</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {candidate.character?.profession?.revealed
                          ? `💼 ${candidate.character.profession.name}`
                          : '💼 Профессия скрыта'}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Статус отданного голоса */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
            {myVote ? (
              <span className="text-emerald-400 font-bold">
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
        <div className="space-y-4 flex-1">
          {exiledPlayer ? (
            <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 border-2 border-rose-600 rounded-3xl p-6 text-center shadow-2xl shadow-rose-950/60 animate-bounceOnce space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-600/20 border border-rose-500 flex items-center justify-center text-rose-400">
                <Skull className="w-9 h-9 animate-pulse" />
              </div>
              <div className="text-xs font-bold text-rose-300 uppercase tracking-widest">
                Изгнан наружу
              </div>
              <h2 className="text-3xl font-black text-white uppercase">
                {exiledPlayer.name}
              </h2>
              <p className="text-xs text-slate-300">
                Набрал(а) больше всего голосов ({lastCounts[exiledId] || 1} шт.). Двери закрылись перед ним(ней)!
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-2">
              <h3 className="text-lg font-black text-white">Ничья на голосовании!</h3>
              <p className="text-xs text-slate-400">Никто не набрал решающего перевеса.</p>
            </div>
          )}

          {/* Раскладка голосов */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
            <div className="text-xs font-bold text-slate-300 mb-2">
              Распределение голосов группы:
            </div>
            {Object.entries(lastCounts).map(([cId, count]) => {
              const cand = players.find(p => p.id === cId);
              return (
                <div key={cId} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                  <span className="text-slate-300 font-semibold">{cand?.name || 'Кандидат'}</span>
                  <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    {count} {count === 1 ? 'голос' : 'голоса'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Нижняя кнопка */}
      <footer className="pt-2 pb-6">
        {!votesRevealed ? (
          isHost ? (
            <button
              onClick={handleFinishVoting}
              className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-xl shadow-rose-950/50 active:scale-98 transition-all"
            >
              <Skull className="w-5 h-5" />
              <span>Вскрыть голоса и изгнать 📣</span>
            </button>
          ) : (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              Ожидаем, пока командир бункера вскроет результаты...
            </div>
          )
        ) : (
          isHost ? (
            <button
              onClick={handleNextRound}
              className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-xl shadow-amber-950/50 active:scale-98 transition-all"
            >
              <span>Продолжить игру ➡️</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              Ожидаем перехода к следующему раунду...
            </div>
          )
        )}
      </footer>
    </div>
  );
}
