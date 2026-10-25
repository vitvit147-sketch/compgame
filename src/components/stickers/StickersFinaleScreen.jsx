// src/components/stickers/StickersFinaleScreen.jsx - Финальный экран результатов партии «Стикеры»
import React, { useState } from 'react';
import { Trophy, RotateCcw, Home, Sparkles, Award, Users, Check } from 'lucide-react';
import GameHeader from '../common/GameHeader';
import ExitConfirmModal from '../common/ExitConfirmModal';
import { stickersSocket } from '../../utils/stickersSocket';
import { sounds } from '../../utils/soundEffects';

export default function StickersFinaleScreen({ roomData, onLeaveRoom }) {
  const [showExitModal, setShowExitModal] = useState(false);

  if (!roomData) return null;

  const {
    isHost,
    players = [],
    stickers = {},
    guessedPlayerIds = [],
    myPlayerId
  } = roomData;

  const handleRestart = () => {
    sounds.playTap();
    stickersSocket.emit('restart_game');
  };

  const handleResetToLobby = () => {
    sounds.playTap();
    stickersSocket.emit('reset_to_lobby');
  };

  // Медали для первых трех отгадавших
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-between select-none">
      <GameHeader
        onBack={() => setShowExitModal(true)}
        backLabel="Выйти"
        title="Стикеры"
        icon="🏷️"
        badge="Финал"
      />

      <main className="flex-1 max-w-lg w-full mx-auto px-5 py-6 flex flex-col justify-start space-y-6 overflow-y-auto">
        {/* Заголовок финала */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-2xl shadow-amber-500/30 flex items-center justify-center text-4xl border-2 border-yellow-200/50">
            🏆
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            Все стикеры раскрыты!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            Отличная партия! Посмотрите, кто кого загадал и кто отгадал быстрее всех.
          </p>
        </div>

        {/* Пьедестал / Порядок отгадывания */}
        {guessedPlayerIds.length > 0 && (
          <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 tracking-wider">
              <Award className="w-4 h-4" />
              <span>Порядок отгадывания</span>
            </div>

            <div className="space-y-2">
              {guessedPlayerIds.map((pId, index) => {
                const player = players.find(p => p.id === pId);
                const sticker = stickers[pId];
                const author = players.find(a => a.id === sticker?.authorId);
                const isMe = pId === myPlayerId;
                const medal = medals[index] || `#${index + 1}`;

                return (
                  <div
                    key={pId}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      isMe
                        ? 'bg-amber-500/15 border-amber-400/60'
                        : 'bg-slate-800/60 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black">{medal}</span>
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                        {player?.avatar || '👤'}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">
                          {player?.name} {isMe && '(Вы)'}
                        </div>
                        <div className="text-[11px] text-amber-300 font-semibold">
                          «{sticker?.text}»
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-400">
                      от {author?.name || sticker?.authorName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Все стикеры партии */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 tracking-wider px-1">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Все участники и их персонажи ({players.length})</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {players.map((p) => {
              const sticker = stickers[p.id];
              const author = players.find(a => a.id === sticker?.authorId);
              const isMe = p.id === myPlayerId;

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.avatar || '👤'}</span>
                    <div>
                      <div className="font-bold text-white text-sm">
                        {p.name} {isMe && '(Вы)'}
                      </div>
                      <div className="text-xs text-amber-400 font-black">
                        «{sticker?.text || '—'}»
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 text-right">
                    <div className="text-[10px] text-slate-500 uppercase">Загадал(а)</div>
                    <div className="font-medium text-slate-300">
                      {author?.name || sticker?.authorName || '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Кнопки управления */}
      <footer className="p-5 max-w-lg w-full mx-auto bg-slate-950/95 backdrop-blur-md border-t border-slate-800 space-y-3">
        {isHost ? (
          <>
            <button
              type="button"
              onClick={handleRestart}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-base shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[54px] touch-manipulation"
            >
              <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              <span>Сыграть ещё раунд! 🔄</span>
            </button>

            <button
              type="button"
              onClick={handleResetToLobby}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm active:scale-[0.98] transition-all"
            >
              Вернуться в лобби настроек
            </button>
          </>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
            Ожидание решения ведущего: новый раунд или лобби...
          </div>
        )}
      </footer>

      {/* Модальное окно подтверждения выхода */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => {
          setShowExitModal(false);
          onLeaveRoom(isHost);
        }}
        isHost={isHost}
        customTitle="Покинуть игру?"
        customDesc="Вы вернетесь в главное меню хаба игр."
      />
    </div>
  );
}
