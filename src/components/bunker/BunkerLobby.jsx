// src/components/bunker/BunkerLobby.jsx
import React, { useState } from 'react';
import { bunkerSocket } from '../../utils/bunkerSocket';
import { sounds } from '../../utils/soundEffects';
import { Users, QrCode, Copy, Check, Play, Crown, ArrowLeft, Clock, Shield } from 'lucide-react';
import QRModal from '../trapwords/QRModal';

export default function BunkerLobby({ roomData, myPlayer, isHost, onLeaveRoom }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const canStart = players.length >= 3;

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto px-4 pt-safe pb-safe space-y-3.5 select-none">
      {/* Навигация */}
      <header className="flex items-center justify-between gap-2 pb-0.5">
        <button
          onClick={onLeaveRoom}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl active:scale-95 transition-all shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Выйти</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQR(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-all active:scale-95"
            title="Показать QR-код"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={copyLink}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Ссылка</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Карточка убежища */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Убежище № {roomCode}</span>
          </div>
          <div className="text-xl font-black text-white mt-0.5">
            Зона ожидания выживших
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-bold">У дверей</div>
          <div className="text-lg font-black text-amber-400">{players.length} чел.</div>
        </div>
      </div>

      {/* Настройка таймера для хоста */}
      {isHost && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Время на речь выжившего:</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[30, 45, 60].map(sec => (
              <button
                key={sec}
                type="button"
                onClick={() => setSpeakerSeconds(sec)}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  speakerSeconds === sec
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {sec} сек
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Список собравшихся участников */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Очередь перед гермодверью ({players.length}):</span>
          <span className="text-amber-400 text-[11px]">
            {players.length < 3 ? 'Нужно минимум 3 человека' : 'Готовы к входу'}
          </span>
        </div>

        <div className="space-y-1.5">
          {players.map(p => (
            <div
              key={p.id}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs ${
                p.id === myPlayer?.id
                  ? 'bg-amber-500/15 border border-amber-500/40 font-bold text-white shadow-sm'
                  : 'bg-slate-950/60 text-slate-300 border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{p.avatar || '🦺'}</span>
                <span>{p.name}</span>
                {p.id === myPlayer?.id && (
                  <span className="text-[10px] text-amber-300 font-semibold">(Вы)</span>
                )}
              </div>
              {p.isHost && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-bold">
                  <Crown className="w-3 h-3" /> Командир
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Подсказка о вместимости */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300/90 leading-relaxed text-center">
        ⚠️ <strong>Суровое правило бункера:</strong> спастись сможет ровно половина ({Math.max(1, Math.floor(players.length / 2))} из {players.length} человек). Остальные будут изгнаны на голосовании!
      </div>

      {/* Нижняя кнопка */}
      <footer className="pt-2 pb-6">
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={!canStart}
            className={`w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              canStart
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-xl shadow-amber-950/50 active:scale-98'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{canStart ? 'Объявить катастрофу и войти ☢️' : 'Ожидаем игроков (мин. 3)...'}</span>
          </button>
        ) : (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Ожидаем, пока <strong className="text-amber-400">Командир</strong> запустит игру...</span>
          </div>
        )}
      </footer>

      {showQR && <QRModal roomCode={roomCode} onClose={() => setShowQR(false)} />}
    </div>
  );
}
