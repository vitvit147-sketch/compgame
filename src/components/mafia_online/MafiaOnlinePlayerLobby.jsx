// src/components/mafia_online/MafiaOnlinePlayerLobby.jsx - Экран ожидания для игроков в Мафии Онлайн
import React, { useState } from 'react';
import { sounds } from '../../utils/soundEffects';
import ExitConfirmModal from '../common/ExitConfirmModal';
import { Users, LogOut, Shield, Crown, Sparkles, Clock } from 'lucide-react';

export default function MafiaOnlinePlayerLobby({ roomData, myPlayer, onLeaveRoom }) {
  const [showExitModal, setShowExitModal] = useState(false);

  const players = (roomData.players || []).filter(p => !p.isHost);
  const hostName = roomData.hostName || 'Ведущий';

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start select-none">
      {/* Шапка */}
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
            Комната Мафии
          </span>
          <span className="text-base font-mono font-black text-purple-400">
            № {roomData.code}
          </span>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto px-5 sm:px-6 py-6 pb-32 overflow-y-auto">
        {/* Баннер ожидания */}
        <section className="mobile-card border-purple-500/40 text-center py-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/15 border-2 border-purple-500/40 flex items-center justify-center text-4xl mb-4 shadow-xl shadow-purple-950/50 animate-bounce">
            🎭
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Ожидание старта</span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            Вы за столом Мафии
          </h1>

          <div className="mt-3 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 max-w-xs mx-auto text-xs text-slate-300">
            Ведущий стола: <strong className="text-amber-400 font-black">{hostName} 🎩</strong>
          </div>

          <p className="text-xs text-slate-400 mt-3 max-w-xs mx-auto leading-relaxed">
            Ведущий сейчас настраивает роли и правила. Как только он нажмет кнопку запуска — на этом экране появится ваша тайная роль!
          </p>
        </section>

        {/* Список игроков за столом */}
        <section className="mobile-card">
          <div className="mobile-card-header">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h2 className="text-base sm:text-lg font-black text-white">
                  Игроки за столом ({players.length})
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                Живая очередь
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
                      ? 'bg-purple-500/15 border-purple-500/40 shadow-sm'
                      : 'bg-slate-950/80 border-slate-750'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.avatar || '👤'}</span>
                    <div>
                      <div className="font-black text-sm text-white flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {isMe && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 border border-purple-500/40">
                            Вы
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Игрок #{idx + 1}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Футер ожидания */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-md mx-auto shadow-2xl">
        <div className="min-h-[56px] p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs sm:text-sm text-slate-300 flex items-center justify-center gap-2.5 font-bold shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
          <span>Ожидаем раздачи ролей от <strong className="text-amber-400 font-black">{hostName}</strong>...</span>
        </div>
      </footer>

      {/* Безопасный выход */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => onLeaveRoom?.(false)}
        isHost={false}
        customTitle="Покинуть комнату Мафии?"
        customDesc="Вы выйдете из комнаты ожидания и вернетесь в главное меню."
      />
    </div>
  );
}
