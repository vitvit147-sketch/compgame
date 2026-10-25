// src/components/bunker/BunkerLobby.jsx - Эргономичное мобильное лобби Бункера
import React, { useState } from 'react';
import { bunkerSocket } from '../../utils/bunkerSocket';
import { sounds } from '../../utils/soundEffects';
import GameHeader from '../common/GameHeader';
import { Users, QrCode, Copy, Check, Play, Crown, Clock, Shield, LogOut } from 'lucide-react';
import QRModal from '../trapwords/QRModal';
import ExitConfirmModal from '../common/ExitConfirmModal';

export default function BunkerLobby({ roomData, myPlayer, isHost, onLeaveRoom }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [speakerSeconds, setSpeakerSeconds] = useState(45);

  const roomCode = roomData.code;
  const players = roomData.players || [];

  const shareUrl = `${window.location.origin}/?bunker_room=${roomCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    sounds.playTap();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    sounds.playTap();
    bunkerSocket.emit('start_game', { speakerSeconds });
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    onLeaveRoom?.(isHost);
  };

  const canStart = players.length >= 3;

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setShowQR(true)}
        className="w-11 h-11 rounded-2xl bg-slate-900 hover:bg-slate-850 active:scale-95 text-amber-400 border border-slate-700/80 flex items-center justify-center transition-all shadow-md touch-manipulation"
        title="Показать QR-код"
      >
        <QrCode className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 active:scale-95 text-slate-200 border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md touch-manipulation"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">Скопировано!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-slate-400" />
            <span>Ссылка</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-lg w-full mx-auto select-none overflow-y-auto">
      {/* Крупный эргономичный хедер с защищенной кнопкой выхода */}
      <GameHeader
        onBack={() => setShowExitModal(true)}
        backLabel={isHost ? "Закрыть комнату" : "Выйти"}
        title="БУНКЕР"
        icon="☢️"
        rightAction={headerActions}
      />

      <main className="px-5 sm:px-6 py-6 pb-44">
        {/* Карточка убежища и код комнаты */}
        <section className="mobile-card">
          <div className="mobile-card-header">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Номер убежища:</span>
            </span>
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider bg-slate-800/90 px-3 py-1 rounded-full border border-slate-700">
              {players.length} у входа
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-950/80 border border-slate-700/80 p-5 rounded-2xl">
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Код для друзей:</div>
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-amber-400 mt-1">
                {roomCode}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="px-4 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-sm flex items-center gap-2 active:scale-95 transition-all shadow-md"
            >
              <QrCode className="w-5 h-5" />
              <span>QR-код</span>
            </button>
          </div>
        </section>

        {/* Настройка таймера на выступление (для хоста) */}
        {isHost && (
          <section className="mobile-card">
            <div className="mobile-card-header">
              <label className="text-base font-black text-slate-200 flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Время на речь выжившего в раунде:</span>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[30, 45, 60].map(sec => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSpeakerSeconds(sec)}
                  className={`min-h-[54px] py-3 rounded-2xl text-base font-black transition-all border active:scale-95 touch-manipulation ${
                    speakerSeconds === sec
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-slate-950/70 border-slate-750 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  {sec} сек
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Список собравшихся участников */}
        <section className="mobile-card">
          <div className="mobile-card-header">
            <span className="font-black text-slate-200 text-base">Очередь перед гермодверью ({players.length}):</span>
            <span className="text-amber-400 text-xs font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              {players.length < 3 ? 'Нужно мин. 3 чел.' : 'Готовы к входу'}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {players.map(p => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-4.5 rounded-2xl text-sm min-h-[58px] transition-all ${
                  p.id === myPlayer?.id
                    ? 'bg-amber-500/15 border-2 border-amber-500/40 font-black text-white shadow-md'
                    : 'bg-slate-950/70 text-slate-200 border border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.avatar || '🦺'}</span>
                  <span className="font-extrabold text-base">{p.name}</span>
                  {p.id === myPlayer?.id && (
                    <span className="text-xs text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      Вы
                    </span>
                  )}
                </div>
                {p.isHost && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 font-black">
                    <Crown className="w-3.5 h-3.5" /> Командир
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Информационная плашка о вместимости */}
        <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-3xl text-sm text-amber-300/90 leading-relaxed text-center font-medium shadow-md">
          ⚠️ <strong>Суровое правило бункера:</strong> спастись сможет ровно половина ({Math.max(1, Math.floor(players.length / 2))} из {players.length} человек). Лишние кандидаты изгоняются на тайном голосовании!
        </div>

        {/* Кнопка выхода / закрытия лобби */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="w-full min-h-[50px] py-3 px-4 rounded-2xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/40 text-rose-300 font-extrabold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all touch-manipulation"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>{isHost ? 'Закрыть и распустить убежище' : 'Покинуть убежище'}</span>
          </button>
        </div>
      </main>

      {/* Фиксированная кнопка запуска внизу экрана с защитой от вырезов */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-lg mx-auto shadow-2xl">
        {isHost ? (
          <button
            type="button"
            onClick={handleStartGame}
            disabled={!canStart}
            className={`w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all touch-manipulation shadow-2xl ${
              canStart
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-950/60 active:scale-98'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{canStart ? 'Объявить катастрофу и войти ☢️' : 'Ожидаем игроков (мин. 3)...'}</span>
          </button>
        ) : (
          <div className="min-h-[56px] p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-sm text-slate-300 flex items-center justify-center gap-2.5 font-bold shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Ожидаем, пока <strong className="text-amber-400 font-black">Командир</strong> запустит игру...</span>
          </div>
        )}
      </footer>

      {showQR && <QRModal roomCode={roomCode} onClose={() => setShowQR(false)} />}

      {/* Модальное окно защищенного выхода */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={handleConfirmExit}
        isHost={isHost}
      />
    </div>
  );
}
