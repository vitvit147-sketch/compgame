// src/components/trapwords/LobbyScreen.jsx - Эргономичное мобильное лобби Слова-Мины
import React, { useState } from 'react';
import { socket } from '../../utils/socket';
import { sounds } from '../../utils/soundEffects';
import GameHeader from '../common/GameHeader';
import {
  Users,
  QrCode,
  Copy,
  Check,
  Shuffle,
  Play,
  Crown,
  Sliders
} from 'lucide-react';
import QRModal from './QRModal';

export default function LobbyScreen({ roomData, myPlayer, isHost, onLeaveRoom }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const roomCode = roomData.code;
  const game = roomData.game || {};
  const players = roomData.players || [];

  const redPlayers = players.filter(p => p.team === 'red');
  const bluePlayers = players.filter(p => p.team === 'blue');

  const shareUrl = `${window.location.origin}/?room=${roomCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    sounds.playTap();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinTeam = (team) => {
    sounds.playTap();
    socket.emit('set_team', { team });
  };

  const handleShuffle = () => {
    sounds.playTap();
    socket.emit('shuffle_teams');
  };

  const handleStartGame = () => {
    sounds.playTap();
    socket.emit('start_game');
  };

  const handleUpdateSetting = (key, val) => {
    socket.emit('update_settings', { [key]: val });
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setShowQR(true)}
        className="w-11 h-11 rounded-2xl bg-slate-900 hover:bg-slate-850 active:scale-95 text-sky-400 border border-slate-700/80 flex items-center justify-center transition-all shadow-md touch-manipulation"
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
      {isHost && (
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all active:scale-95 touch-manipulation shadow-md ${
            showSettings
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 ring-1 ring-amber-500/30'
              : 'bg-slate-900 hover:bg-slate-850 border-slate-700/80 text-slate-400'
          }`}
          title="Настройки раунда"
        >
          <Sliders className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto select-none overflow-y-auto">
      {/* Крупный эргономичный хедер */}
      <GameHeader
        onBack={onLeaveRoom}
        backLabel="Выйти"
        title="СЛОВА-МИНЫ"
        icon="💣"
        rightAction={headerActions}
      />

      <main className="p-4 space-y-4 pb-44">
        {/* Карточка стола */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Комната ожидания
            </span>
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              {players.length} игроков за столом
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <div className="text-xs text-slate-400 font-bold">Номер стола:</div>
              <div className="text-4xl font-black font-mono tracking-widest text-amber-400">
                {roomCode}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>QR-код</span>
            </button>
          </div>
        </div>

        {/* Панель настроек хоста (выдвижная) */}
        {isHost && showSettings && (
          <section className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-sm font-black text-amber-400">
              <span>Параметры партии</span>
              <span className="text-xs text-slate-400 font-normal">для ведущего</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-bold mb-1">
                  <span>Мин на раунд:</span>
                  <span className="text-amber-400 font-black">{game.trapCount || 5}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleUpdateSetting('trapCount', c)}
                      className={`min-h-[42px] py-2 rounded-xl border font-black transition-all ${
                        (game.trapCount || 5) === c
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400'
                      }`}
                    >
                      {c} мин
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-bold mb-1">
                  <span>Очков для победы:</span>
                  <span className="text-amber-400 font-black">{game.targetScore || 3}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleUpdateSetting('targetScore', s)}
                      className={`min-h-[42px] py-2 rounded-xl border font-black transition-all ${
                        (game.targetScore || 3) === s
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400'
                      }`}
                    >
                      До {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Команды: Красные и Синие */}
        <div className="space-y-3.5">
          {/* Красная команда */}
          <div className="bg-slate-900/90 border-2 border-rose-600/40 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/50"></span>
                <span className="font-black text-base text-rose-400">
                  Красная команда ({redPlayers.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleJoinTeam('red')}
                className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 text-rose-300 border border-rose-500/40 text-xs font-black transition-all touch-manipulation"
              >
                Вступить
              </button>
            </div>

            <div className="space-y-2">
              {redPlayers.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-2 text-center">
                  Пока никого. Нажмите «Вступить»
                </div>
              ) : (
                redPlayers.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl text-sm min-h-[48px] ${
                      p.id === myPlayer?.id
                        ? 'bg-rose-500/20 border border-rose-500/50 font-black text-white shadow-sm'
                        : 'bg-slate-950/70 text-slate-200 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{p.avatar}</span>
                      <span className="font-extrabold">{p.name}</span>
                      {p.id === myPlayer?.id && (
                        <span className="text-xs text-rose-300 font-bold bg-rose-500/15 px-2 py-0.5 rounded-md border border-rose-500/30">(Вы)</span>
                      )}
                    </div>
                    {p.isHost && (
                      <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 font-black">
                        <Crown className="w-3.5 h-3.5" /> Хост
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Синяя команда */}
          <div className="bg-slate-900/90 border-2 border-sky-600/40 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-sky-500 shadow-md shadow-sky-500/50"></span>
                <span className="font-black text-base text-sky-400">
                  Синяя команда ({bluePlayers.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleJoinTeam('blue')}
                className="px-4 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 active:scale-95 text-sky-300 border border-sky-500/40 text-xs font-black transition-all touch-manipulation"
              >
                Вступить
              </button>
            </div>

            <div className="space-y-2">
              {bluePlayers.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-2 text-center">
                  Пока никого. Нажмите «Вступить»
                </div>
              ) : (
                bluePlayers.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl text-sm min-h-[48px] ${
                      p.id === myPlayer?.id
                        ? 'bg-sky-500/20 border border-sky-500/50 font-black text-white shadow-sm'
                        : 'bg-slate-950/70 text-slate-200 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{p.avatar}</span>
                      <span className="font-extrabold">{p.name}</span>
                      {p.id === myPlayer?.id && (
                        <span className="text-xs text-sky-300 font-bold bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-500/30">(Вы)</span>
                      )}
                    </div>
                    {p.isHost && (
                      <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 font-black">
                        <Crown className="w-3.5 h-3.5" /> Хост
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Кнопка перемешать составы */}
        {isHost && (
          <button
            type="button"
            onClick={handleShuffle}
            className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-850 active:scale-98 text-slate-300 text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow touch-manipulation"
          >
            <Shuffle className="w-4 h-4" />
            <span>Перемешать команды случайно</span>
          </button>
        )}
      </main>

      {/* Нижняя кнопка старта или ожидание */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-md mx-auto shadow-2xl">
        {isHost ? (
          <button
            type="button"
            onClick={handleStartGame}
            className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-2xl shadow-emerald-950/60 active:scale-98 transition-all touch-manipulation"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Начать игру 🎲</span>
          </button>
        ) : (
          <div className="min-h-[56px] p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-sm text-slate-300 flex items-center justify-center gap-2 font-bold shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Ожидаем, пока <strong className="text-amber-400 font-black">Хост</strong> запустит игру...</span>
          </div>
        )}
      </footer>

      {showQR && <QRModal roomCode={roomCode} onClose={() => setShowQR(false)} />}
    </div>
  );
}
