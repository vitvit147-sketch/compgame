// src/components/deception/DeceptionLobby.jsx - Экран лобби расследования
import React, { useState } from 'react';
import { deceptionSocket } from '../../utils/deceptionSocket';
import { sounds } from '../../utils/soundEffects';
import ExitConfirmModal from '../common/ExitConfirmModal';
import {
  Users,
  Copy,
  Check,
  Play,
  LogOut,
  Shield,
  Eye,
  UserX,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';

export default function DeceptionLobby({ roomData, myPlayer, isHost, onLeaveRoom }) {
  const [copied, setCopied] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const players = roomData.players || [];
  const options = roomData.options || {};
  const isReadyToStart = players.length >= 4;

  const handleCopyLink = () => {
    sounds.playTap();
    const url = `${window.location.origin}${window.location.pathname}?crime_room=${roomData.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleToggleOption = (key) => {
    sounds.playTap();
    deceptionSocket.emit('toggle_room_option', {
      key,
      value: !options[key]
    });
  };

  const handleStartGame = () => {
    sounds.playTap();
    if (!isReadyToStart) return;
    deceptionSocket.emit('start_game');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start select-none">
      {/* Шапка с безопасным выходом */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] flex items-center justify-between shadow-md">
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-750 hover:bg-rose-950/50 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 flex items-center gap-1.5 text-xs font-black transition-colors active:scale-95 touch-manipulation"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Выход</span>
        </button>

        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
            Дело №
          </span>
          <span className="text-base font-mono font-black text-amber-400">
            {roomData.code}
          </span>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto px-5 sm:px-6 py-6 pb-48 overflow-y-auto">
        {/* Баннер номера дела и ссылки */}
        <section className="mobile-card border-amber-500/40 text-center">
          <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest block mb-1">
            Код подключения к расследованию
          </span>
          <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-[0.25em] py-1 text-center">
            {roomData.code}
          </div>
          <p className="text-xs text-slate-400 mt-2 mb-4">
            Назовите этот код друзьям или отправьте прямую ссылку:
          </p>
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full min-h-[50px] py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-750 text-xs font-black uppercase tracking-wider text-amber-400 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md touch-manipulation"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Ссылка скопирована в буфер!' : 'Скопировать ссылку на дело'}</span>
          </button>
        </section>

        {/* Карточка списка следователей за столом */}
        <section className="mobile-card">
          <div className="mobile-card-header">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-sky-400" />
                <h2 className="text-base sm:text-lg font-black text-white">
                  Следователи в отделе ({players.length})
                </h2>
              </div>
              <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-full border ${
                isReadyToStart
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
              }`}>
                {isReadyToStart ? 'Готовы к делу' : `Нужно еще ${4 - players.length}`}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {players.map((p, idx) => {
              const isMe = p.id === myPlayer?.id;
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    isMe
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-slate-950/80 border-slate-750'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{p.avatar || '🕵️'}</span>
                    <div className="min-w-0">
                      <div className="font-black text-sm sm:text-base text-white truncate flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {isMe && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Вы
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        Следователь #{idx + 1}
                      </span>
                    </div>
                  </div>

                  {p.isHost && (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                      Шеф отдела
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Настройки дополнительных ролей (доступно хосту) */}
        {isHost && (
          <section className="mobile-card border-indigo-500/30 space-y-4">
            <div className="mobile-card-header">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  Специальные роли (от 5-6 игроков)
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {/* Тумблер: Соучастник */}
              <button
                type="button"
                onClick={() => handleToggleOption('enableAccomplice')}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                  options.enableAccomplice
                    ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-md'
                    : 'bg-slate-950/70 border-slate-750 text-slate-400'
                }`}
              >
                <div className="pr-3">
                  <div className="font-black text-sm flex items-center gap-1.5 text-rose-300">
                    <span>🤝 Соучастник</span>
                    {options.enableAccomplice && <span className="text-xs">✅</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Знает Убийцу и его улики. Помогает преступнику запутать следствие.
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                  options.enableAccomplice ? 'bg-rose-500 border-rose-400 text-white' : 'border-slate-700'
                }`}>
                  {options.enableAccomplice && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>

              {/* Тумблер: Свидетель */}
              <button
                type="button"
                onClick={() => handleToggleOption('enableWitness')}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                  options.enableWitness
                    ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-md'
                    : 'bg-slate-950/70 border-slate-750 text-slate-400'
                }`}
              >
                <div className="pr-3">
                  <div className="font-black text-sm flex items-center gap-1.5 text-sky-300">
                    <span>👁️ Свидетель</span>
                    {options.enableWitness && <span className="text-xs">✅</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Знает, кто преступники. Но если Убийца вычислит его в финале — преступники победят!
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                  options.enableWitness ? 'bg-sky-500 border-sky-400 text-white' : 'border-slate-700'
                }`}>
                  {options.enableWitness && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Нижняя панель действий с защитой от вырезов */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-md mx-auto shadow-2xl">
        {isHost ? (
          <button
            type="button"
            onClick={handleStartGame}
            disabled={!isReadyToStart}
            className={`w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 transition-all touch-manipulation ${
              isReadyToStart
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-2xl shadow-amber-950/60 active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isReadyToStart ? 'Начать расследование' : `Ожидание игроков (${players.length}/4)`}</span>
          </button>
        ) : (
          <div className="min-h-[56px] p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs sm:text-sm text-slate-300 flex items-center justify-center gap-2.5 font-bold shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Ожидаем, пока <strong className="text-amber-400 font-black">Шеф отдела</strong> запустит расследование...</span>
          </div>
        )}
      </footer>

      {/* Модальное окно безопасного выхода с двойным подтверждением */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => onLeaveRoom?.(isHost)}
        isHost={isHost}
        customTitle={isHost ? 'Закрыть дело и распустить отдел?' : 'Покинуть расследование?'}
        customDesc={isHost
          ? 'Вы являетесь организатором дела. Если вы выйдете, комната будет полностью удалена для всех участников.'
          : 'Вы покинете комнату ожидания и вернетесь в главное меню.'}
      />
    </div>
  );
}
