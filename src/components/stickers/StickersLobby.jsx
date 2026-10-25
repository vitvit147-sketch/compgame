// src/components/stickers/StickersLobby.jsx - Экран лобби ожидания игроков в «Стикеры»
import React, { useState } from 'react';
import { Copy, Share2, Play, Users, Crown, Check, Clock, Sparkles } from 'lucide-react';
import GameHeader from '../common/GameHeader';
import ExitConfirmModal from '../common/ExitConfirmModal';
import { stickersSocket } from '../../utils/stickersSocket';
import { STICKERS_CATEGORIES } from '../../data/stickersData';
import { sounds } from '../../utils/soundEffects';

export default function StickersLobby({ roomData, onLeaveRoom }) {
  const [copied, setCopied] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  if (!roomData) return null;

  const { code, isHost, players = [], settings = {}, myPlayerId } = roomData;
  const currentCategory = STICKERS_CATEGORIES.find(c => c.id === settings.category) || STICKERS_CATEGORIES[0];
  const canStart = players.length >= 2;

  const handleCopyLink = () => {
    sounds.playTap();
    const url = `${window.location.origin}${window.location.pathname}?stickers_room=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShare = () => {
    sounds.playTap();
    const url = `${window.location.origin}${window.location.pathname}?stickers_room=${code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Стикеры на лоб — Играем вместе!',
        text: `Заходи в игру «Стикеры» по коду: ${code}`,
        url: url
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleStartGame = () => {
    if (!canStart || !isHost) return;
    sounds.playTap();
    stickersSocket.emit('start_naming');
  };

  const handleCategoryChange = (catId) => {
    if (!isHost) return;
    sounds.playTap();
    stickersSocket.emit('update_settings', {
      ...settings,
      category: catId
    });
  };

  const handleTimerChange = (seconds) => {
    if (!isHost) return;
    sounds.playTap();
    stickersSocket.emit('update_settings', {
      ...settings,
      timerSeconds: seconds
    });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-between select-none">
      <GameHeader
        onBack={() => setShowExitModal(true)}
        backLabel={isHost ? 'Закрыть' : 'Выйти'}
        title="Стикеры"
        icon="🏷️"
        badge={`Код: ${code}`}
      />

      <main className="flex-1 max-w-lg w-full mx-auto px-5 py-5 flex flex-col justify-start space-y-5 overflow-y-auto">
        {/* Карточка кода комнаты */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 text-center space-y-3 shadow-xl">
          <div className="text-xs font-black uppercase tracking-widest text-amber-400">
            Код комнаты для друзей
          </div>
          <div className="text-4xl sm:text-5xl font-black text-amber-300 tracking-widest font-mono">
            {code}
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-200 text-xs font-bold active:scale-95 transition-all shadow-md"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>{copied ? 'Ссылка скопирована! ✅' : 'Скопировать ссылку'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold active:scale-95 transition-all shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>Поделиться</span>
            </button>
          </div>
        </div>

        {/* Настройки (для ведущего кликабельны, для игроков — информационны) */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Параметры партии</span>
            {isHost && <span className="text-amber-400">Ведущий настраивает</span>}
          </div>

          {/* Тематика */}
          <div>
            <div className="text-xs text-slate-400 mb-1.5">Тематика персонажей:</div>
            {isHost ? (
              <div className="grid grid-cols-2 gap-2">
                {STICKERS_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                      settings.category === cat.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-sm font-semibold text-amber-300">
                <span>{currentCategory.icon}</span>
                <span>{currentCategory.title}</span>
              </div>
            )}
          </div>

          {/* Таймер */}
          <div>
            <div className="text-xs text-slate-400 mb-1.5">Таймер на ход:</div>
            {isHost ? (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 0, label: 'Без таймера' },
                  { value: 60, label: '60 сек' },
                  { value: 90, label: '90 сек' }
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleTimerChange(item.value)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      settings.timerSeconds === item.value
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{settings.timerSeconds ? `${settings.timerSeconds} секунд на вопрос` : 'Без ограничения по времени'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Список участников */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Игроки в комнате ({players.length})</span>
            </div>
            {!canStart && <span className="text-rose-400 font-semibold">Нужно минимум 2</span>}
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {players.map((p) => {
              const isMe = p.id === myPlayerId;
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    isMe
                      ? 'bg-amber-500/10 border-amber-400/50 shadow-md'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                      {p.avatar || '👤'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{p.name}</span>
                        {p.isHost && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[10px] font-black uppercase">
                            <Crown className="w-3 h-3" />
                            <span>Хост</span>
                          </span>
                        )}
                        {isMe && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                            Вы
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Готов к игре</div>
                    </div>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Нижняя кнопка запуска */}
      <footer className="p-5 max-w-lg w-full mx-auto bg-slate-950/95 backdrop-blur-md border-t border-slate-800">
        {isHost ? (
          <button
            type="button"
            onClick={handleStartGame}
            disabled={!canStart}
            className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 min-h-[56px] shadow-xl transition-all touch-manipulation ${
              canStart
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/25 active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{canStart ? 'Раздать цели и начать! 🚀' : 'Ждём игроков (мин. 2)...'}</span>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
            <div className="text-amber-400 font-bold text-sm flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              <span>Ждём, пока ведущий начнёт игру...</span>
            </div>
            <div className="text-xs text-slate-400">
              Как только ведущий нажмёт старт, вы получите игрока для загадывания!
            </div>
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
        customTitle={isHost ? 'Закрыть комнату?' : 'Покинуть лобби?'}
        customDesc={
          isHost
            ? 'Вы ведущий. При выходе комната будет удалена, а игроки вернутся в главное меню.'
            : 'Вы покинете эту комнату и вернетесь в меню выбора игр.'
        }
      />
    </div>
  );
}
