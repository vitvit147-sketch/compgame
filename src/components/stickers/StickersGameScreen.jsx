// src/components/stickers/StickersGameScreen.jsx - Основной экран угадывания персонажей
import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, CheckCircle2, ChevronRight, Clock, Users, ArrowRight, Trophy, Flag, AlertCircle } from 'lucide-react';
import GameHeader from '../common/GameHeader';
import ExitConfirmModal from '../common/ExitConfirmModal';
import { stickersSocket } from '../../utils/stickersSocket';
import { STICKERS_QUESTION_HINTS } from '../../data/stickersData';
import { sounds } from '../../utils/soundEffects';

export default function StickersGameScreen({ roomData, onLeaveRoom }) {
  const [showExitModal, setShowExitModal] = useState(false);
  const [showConfirmGuessModal, setShowConfirmGuessModal] = useState(false);
  const [showHintsModal, setShowHintsModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  if (!roomData) return null;

  const {
    code,
    isHost,
    players = [],
    stickers = {},
    assignments = {},
    activeTurnPlayerId,
    guessedPlayerIds = [],
    settings = {},
    turnStartTime,
    myPlayerId
  } = roomData;

  const mySticker = stickers[myPlayerId];
  const isMyTurn = activeTurnPlayerId === myPlayerId;
  const hasGuessedMySticker = guessedPlayerIds.includes(myPlayerId);

  const activePlayer = players.find(p => p.id === activeTurnPlayerId) || players[0];
  const myAuthor = players.find(p => p.id === mySticker?.authorId);

  // Таймер хода
  useEffect(() => {
    if (!settings.timerSeconds || !turnStartTime) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
      const remaining = Math.max(0, settings.timerSeconds - elapsed);
      setTimeLeft(remaining);
    }, 500);

    return () => clearInterval(interval);
  }, [settings.timerSeconds, turnStartTime]);

  const handleNextTurn = () => {
    sounds.playTap();
    stickersSocket.emit('next_turn');
  };

  const handleConfirmGuess = () => {
    sounds.playTap();
    setShowConfirmGuessModal(false);
    stickersSocket.emit('mark_as_guessed', { playerId: myPlayerId });
  };

  const otherPlayers = players.filter(p => p.id !== myPlayerId);

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-between select-none">
      <GameHeader
        onBack={() => setShowExitModal(true)}
        backLabel={isHost ? 'Закрыть' : 'Выйти'}
        title="Стикеры"
        icon="🏷️"
        badge={`Отгадано: ${guessedPlayerIds.length}/${players.length}`}
        rightAction={
          <button
            type="button"
            onClick={() => setShowHintsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold active:scale-95 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Шпаргалка</span>
          </button>
        }
      />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4 flex flex-col justify-start space-y-5 overflow-y-auto">
        {/* Баннер текущего хода */}
        <div className={`p-4 rounded-3xl border shadow-xl transition-all ${
          isMyTurn
            ? 'bg-gradient-to-r from-amber-500/25 via-amber-600/15 to-slate-900 border-amber-400 shadow-amber-500/20 animate-pulse'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                {activePlayer?.avatar || '👤'}
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  {isMyTurn ? '🌟 ТВОЙ ХОД!' : 'Сейчас задаёт вопросы:'}
                </div>
                <div className="text-lg font-black text-white">
                  {isMyTurn ? 'Задавай вопросы компании!' : activePlayer?.name}
                </div>
              </div>
            </div>

            {/* Таймер или кнопка следующего хода */}
            <div className="flex items-center gap-2 shrink-0">
              {timeLeft !== null && (
                <div className={`px-2.5 py-1.5 rounded-xl border font-mono font-black text-xs flex items-center gap-1 ${
                  timeLeft <= 10
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-ping'
                    : 'bg-slate-800 border-slate-700 text-amber-300'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeLeft}с</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleNextTurn}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold active:scale-95 transition-all flex items-center gap-1 shadow-sm"
              >
                <span>След. ход</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Подсказка по правилам для текущего хода */}
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>Отвечайте игроку только «ДА» или «НЕТ»</span>
            <span>Если «НЕТ» — передайте ход ➡️</span>
          </div>
        </div>

        {/* 🟨 МОЙ СТИКЕР (Стикер на лбу игрока) */}
        <section className="space-y-2">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
            <span>Твой стикер (на твоём лбу)</span>
            {hasGuessedMySticker && (
              <span className="text-emerald-400 font-bold">🎉 ОТГАДАН!</span>
            )}
          </div>

          <div className={`p-5 rounded-3xl border-2 transition-all shadow-2xl relative ${
            hasGuessedMySticker
              ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-400/80'
              : 'bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-400 border-yellow-200 text-slate-950 shadow-amber-500/30'
          }`}>
            {/* Графика канцелярской кнопки / скотча */}
            <div className="w-12 h-4 mx-auto rounded-full bg-black/10 border border-black/10 -mt-2 mb-3 shadow-inner" />

            {!hasGuessedMySticker ? (
              // СТИКЕР ЕЩЁ НЕ ОТГАДАН (ЗАГАДКА)
              <div className="text-center space-y-4">
                <div className="space-y-1">
                  <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950">
                    ❓ КТО Я? ❓
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Тебе загадал(а): <b>{myAuthor?.name || mySticker?.authorName || 'Сосед'}</b>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-black/10 text-xs font-semibold text-slate-900 max-w-xs mx-auto leading-relaxed">
                  Ты не видишь своего персонажа! Задавай другим вопросы «Да/Нет» и попробуй отгадать, кто ты.
                </div>

                {/* Кнопка "Я отгадал!" */}
                <button
                  type="button"
                  onClick={() => setShowConfirmGuessModal(true)}
                  className="w-full py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[54px] touch-manipulation border border-amber-400/40"
                >
                  <Trophy className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                  <span>Я отгадал своего персонажа! 🎉</span>
                </button>
              </div>
            ) : (
              // СТИКЕР УСПЕШНО ОТГАДАН (ТАЙНА РАСКРЫТА)
              <div className="text-center space-y-3 py-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Отгадано! Поздравляем!</span>
                </div>
                <div className="text-3xl font-black text-white">
                  «{mySticker?.text}»
                </div>
                <div className="text-xs text-slate-400">
                  Загадал(а): <b>{myAuthor?.name || mySticker?.authorName}</b>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 🟨 СТИКЕРЫ ВСЕХ ОСТАЛЬНЫХ УЧАСТНИКОВ */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Стикеры других игроков ({otherPlayers.length})</span>
            </div>
            <span className="text-[11px] text-slate-500">Ты видишь их имена</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {otherPlayers.map((p, idx) => {
              const pSticker = stickers[p.id];
              const isTurn = activeTurnPlayerId === p.id;
              const hasGuessed = guessedPlayerIds.includes(p.id);
              const author = players.find(a => a.id === pSticker?.authorId);

              // Разные цвета стикеров для визуального разнообразия
              const noteColors = [
                'from-amber-200 to-amber-300 text-slate-950 border-amber-400',
                'from-yellow-200 to-yellow-300 text-slate-950 border-yellow-400',
                'from-lime-200 to-lime-300 text-slate-950 border-lime-400',
                'from-cyan-200 to-cyan-300 text-slate-950 border-cyan-400',
                'from-pink-200 to-pink-300 text-slate-950 border-pink-400'
              ];
              const noteStyle = noteColors[idx % noteColors.length];

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-3xl border transition-all ${
                    isTurn
                      ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{p.avatar || '👤'}</span>
                      <div>
                        <div className="font-black text-white text-base leading-tight">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Загадал(а): {author?.name || pSticker?.authorName || 'Сосед'}
                        </div>
                      </div>
                    </div>

                    {/* Статус отгадал / думает */}
                    <div>
                      {hasGuessed ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Отгадал!</span>
                        </span>
                      ) : isTurn ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black animate-pulse">
                          🎤 Его ход
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                          🤔 В игре
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Сам стикер на лбу этого игрока */}
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${noteStyle} shadow-md border text-center transform ${
                    idx % 2 === 0 ? 'rotate-[-0.5deg]' : 'rotate-[0.5deg]'
                  }`}>
                    <div className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-0.5">
                      На лбу написано:
                    </div>
                    <div className={`text-xl sm:text-2xl font-black tracking-tight ${
                      hasGuessed ? 'line-through opacity-60' : ''
                    }`}>
                      {pSticker?.text || 'Стикер скрыт'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Кнопка завершения игры для ведущего */}
        {isHost && (
          <div className="pt-4 pb-2">
            <button
              type="button"
              onClick={() => stickersSocket.emit('end_game')}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-amber-400 text-xs font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Flag className="w-4 h-4" />
              <span>Завершить игру и показать всех победителей</span>
            </button>
          </div>
        )}
      </main>

      {/* Модальное окно подтверждения угадывания */}
      {showConfirmGuessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-amber-400/80 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-3xl">
              🎉
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Ты отгадал персонажа?</h3>
              <p className="text-xs text-slate-300">
                Назови своего персонажа вслух остальным игрокам. Если они подтвердили правильность — нажми «Да, я отгадал»!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmGuessModal(false)}
                className="py-3.5 rounded-2xl bg-slate-800 text-slate-300 font-bold text-sm active:scale-95"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmGuess}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 active:scale-95"
              >
                Да, я отгадал! 🏆
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно шпаргалки вопросов */}
      {showHintsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-black text-white uppercase">Шпаргалка вопросов</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHintsModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Задавай вопросы, на которые другие игроки могут ответить только <b>«ДА»</b> или <b>«НЕТ»</b>.
            </p>

            <div className="space-y-3">
              {STICKERS_QUESTION_HINTS.map((group, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <div className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    {group.category}
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {group.questions.map((q, qIdx) => (
                      <li key={qIdx} className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowHintsModal(false)}
              className="w-full py-3.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm active:scale-98 transition-all"
            >
              Закрыть шпаргалку
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно выхода */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => {
          setShowExitModal(false);
          onLeaveRoom(isHost);
        }}
        isHost={isHost}
        customTitle={isHost ? 'Закрыть игру?' : 'Покинуть игру?'}
        customDesc={
          isHost
            ? 'Вы ведущий. При вашем выходе комната закроется для всех.'
            : 'Вы покинете текущую партию.'
        }
      />
    </div>
  );
}
