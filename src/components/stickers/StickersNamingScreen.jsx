// src/components/stickers/StickersNamingScreen.jsx - Фаза загадывания персонажей
import React, { useState, useEffect } from 'react';
import { Sparkles, Dices, Check, Edit2, Users, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import GameHeader from '../common/GameHeader';
import ExitConfirmModal from '../common/ExitConfirmModal';
import { stickersSocket } from '../../utils/stickersSocket';
import { getRandomSticker, STICKERS_DATABASE } from '../../data/stickersData';
import { sounds } from '../../utils/soundEffects';

export default function StickersNamingScreen({ roomData, onLeaveRoom }) {
  const [characterText, setCharacterText] = useState('');
  const [characterHint, setCharacterHint] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  if (!roomData) return null;

  const {
    code,
    isHost,
    players = [],
    assignments = {},
    stickers = {},
    myPlayerId,
    settings = {}
  } = roomData;

  // Игрок, которому я загадываю персонажа
  const targetPlayerId = assignments[myPlayerId];
  const targetPlayer = players.find(p => p.id === targetPlayerId);

  // Стикер, который я уже записал для него (если есть)
  const mySubmittedSticker = targetPlayerId ? stickers[targetPlayerId] : null;
  const isAlreadyReady = mySubmittedSticker && mySubmittedSticker.isReady && mySubmittedSticker.text;

  useEffect(() => {
    if (isAlreadyReady && !characterText) {
      setCharacterText(mySubmittedSticker.text);
      setIsEditing(false);
    }
  }, [isAlreadyReady, mySubmittedSticker]);

  // Подсчёт готовых игроков
  const totalPlayers = players.length;
  const readyCount = players.filter(p => stickers[p.id]?.isReady).length;

  const handleRandomPick = () => {
    sounds.playTap();
    const cat = settings.category || 'all';
    const randomName = getRandomSticker(cat);
    setCharacterText(randomName);

    const found = STICKERS_DATABASE.find(item => item.name === randomName);
    setCharacterHint(found ? found.hint : '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!characterText.trim() || !targetPlayerId) return;

    sounds.playTap();
    setIsEditing(false);
    stickersSocket.emit('submit_sticker', {
      targetPlayerId,
      stickerText: characterText.trim()
    });
  };

  const handleEdit = () => {
    sounds.playTap();
    setIsEditing(true);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-between select-none">
      <GameHeader
        onBack={() => setShowExitModal(true)}
        backLabel={isHost ? 'Закрыть' : 'Выйти'}
        title="Стикеры"
        icon="🏷️"
        badge="Загадывание"
      />

      <main className="flex-1 max-w-lg w-full mx-auto px-5 py-5 flex flex-col justify-start space-y-6 overflow-y-auto">
        {/* Информационный баннер цели */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Фаза 1: Стикер на лоб</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Придумай персонажа!
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            Ты тайком наклеиваешь этот стикер на лоб игроку ниже. Он не будет видеть своего персонажа!
          </p>
        </div>

        {/* Карточка цели: кому загадываем */}
        {targetPlayer ? (
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-400/50 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center text-4xl shadow-inner shrink-0">
                {targetPlayer.avatar || '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-black uppercase tracking-widest text-amber-400 mb-0.5">
                  Ты загадываешь для:
                </div>
                <div className="text-xl sm:text-2xl font-black text-white truncate">
                  {targetPlayer.name}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Придумай то, что ему будет весело и интересно отгадывать!
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
            Определение цели...
          </div>
        )}

        {/* Форма ввода персонажа или карточка готовности */}
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Имя персонажа или предмета
                </label>
                <button
                  type="button"
                  onClick={handleRandomPick}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold active:scale-95 transition-all"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Случайный 🎲</span>
                </button>
              </div>

              <input
                type="text"
                value={characterText}
                onChange={(e) => {
                  setCharacterText(e.target.value);
                  setCharacterHint('');
                }}
                placeholder="Например: Шрек, Терминатор, Пикачу..."
                maxLength={40}
                className="w-full px-4 py-4 rounded-2xl bg-slate-900 border-2 border-slate-700 focus:border-amber-400 focus:outline-none text-white text-lg font-bold placeholder-slate-500 transition-colors shadow-inner"
              />

              {characterHint && (
                <div className="text-xs text-amber-400/90 font-medium px-1 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>{characterHint}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!characterText.trim()}
              className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 min-h-[56px] shadow-xl transition-all touch-manipulation ${
                characterText.trim()
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/25 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Наклеить стикер! 📌</span>
            </button>
          </form>
        ) : (
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Стикер сохранён</span>
              </div>
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:text-white active:scale-95 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Изменить</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-400 text-slate-950 text-center font-black text-xl shadow-md rotate-[-1deg]">
              «{characterText}»
            </div>

            <p className="text-xs text-slate-400 text-center">
              Вы успешно наклеили секретный стикер для <b>{targetPlayer?.name}</b>!
            </p>
          </div>
        )}

        {/* Прогресс готовности комнаты */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Готовность игроков</span>
            </div>
            <span className="text-amber-400 font-mono">
              {readyCount} из {totalPlayers}
            </span>
          </div>

          {/* Индикаторная полоса */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-500"
              style={{ width: `${(readyCount / totalPlayers) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {players.map((p) => {
              const isPReady = stickers[p.id]?.isReady;
              const isMe = p.id === myPlayerId;
              return (
                <div
                  key={p.id}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{p.avatar || '👤'}</span>
                    <span className="font-bold text-white">
                      {p.name} {isMe && '(Вы)'}
                    </span>
                  </div>
                  {isPReady ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Готов</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium animate-pulse">
                      Придумывает... ⏳
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-1 text-[11px] text-slate-400">
            ⚡ Как только все участники подтвердят свои стикеры, игра начнётся автоматически!
          </div>
        </div>
      </main>

      {/* Модальное окно подтверждения выхода */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => {
          setShowExitModal(false);
          onLeaveRoom(isHost);
        }}
        isHost={isHost}
        customTitle={isHost ? 'Закрыть игру?' : 'Выйти из игры?'}
        customDesc={
          isHost
            ? 'Вы ведущий. При выходе игра будет остановлена для всех участников.'
            : 'Вы покинете партию. Другим игрокам придётся перезапустить раунд.'
        }
      />
    </div>
  );
}
