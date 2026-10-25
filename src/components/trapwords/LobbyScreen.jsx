// src/components/trapwords/LobbyScreen.jsx
import React, { useState } from 'react';
import { socket } from '../../utils/socket';
import { sounds } from '../../utils/soundEffects';
import {
  Users,
  QrCode,
  Copy,
  Check,
  Settings,
  Shuffle,
  Play,
  Crown,
  Sparkles,
  ArrowRightLeft,
  Sliders
} from 'lucide-react';
import QRModal from './QRModal';

export default function LobbyScreen({ roomData, myPlayer, isHost }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const roomCode = roomData.code;
  const game = roomData.game || {};
  const players = roomData.players || [];

  const redPlayers = players.filter(p => p.team === 'red');
  const bluePlayers = players.filter(p => p.team === 'blue');
  const spectators = players.filter(p => p.team === 'spectator');

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

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between p-4 max-w-md mx-auto text-slate-100">
      {/* Шапка комнаты */}
      <header className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Игровой стол
            </div>
            <div className="text-2xl font-black font-mono tracking-wider text-amber-400">
              № {roomCode}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQR(true)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-all active:scale-95"
              title="Показать QR-код"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              onClick={copyLink}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Скопировано!</span>
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
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                  showSettings
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
                }`}
                title="Настройки раунда"
              >
                <Sliders className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Настройки игры (для хоста) */}
        {showSettings && isHost && (
          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs animate-fadeIn">
            <div>
              <label className="text-slate-400 block mb-1">Очков для победы</label>
              <select
                value={game.targetScore || 3}
                onChange={(e) => handleUpdateSetting('targetScore', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-medium focus:outline-none"
              >
                <option value="2">2 очка (быстрая)</option>
                <option value="3">3 очка (стандарт)</option>
                <option value="5">5 очков (долгая)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Мин на команду</label>
              <select
                value={game.trapCount || 5}
                onChange={(e) => handleUpdateSetting('trapCount', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-medium focus:outline-none"
              >
                <option value="3">3 мины</option>
                <option value="4">4 мины</option>
                <option value="5">5 мин (баланс)</option>
                <option value="6">6 мин (хардкор)</option>
              </select>
            </div>
          </div>
        )}
      </header>

      {/* Команды: Красные vs Синие */}
      <div className="flex-1 space-y-3 overflow-y-auto mb-3">
        {/* Кнопка перемешать */}
        {isHost && players.length >= 2 && (
          <button
            onClick={handleShuffle}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>Случайный баланс команд</span>
          </button>
        )}

        {/* Красная команда */}
        <div className="bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-slate-900 border border-rose-800/40 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80"></span>
              <h3 className="font-bold text-rose-300 text-sm">
                Красная команда ({redPlayers.length})
              </h3>
            </div>
            {myPlayer?.team !== 'red' && (
              <button
                onClick={() => handleJoinTeam('red')}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all active:scale-95"
              >
                Вступить
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {redPlayers.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-2 text-center">
                Пока никого. Нажмите «Вступить»
              </div>
            ) : (
              redPlayers.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                    p.id === myPlayer?.id
                      ? 'bg-rose-500/20 border border-rose-500/40 font-bold text-white'
                      : 'bg-slate-950/50 text-slate-300 border border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{p.avatar}</span>
                    <span>{p.name}</span>
                    {p.id === myPlayer?.id && (
                      <span className="text-[10px] text-rose-300 font-normal">(Вы)</span>
                    )}
                  </div>
                  {p.isHost && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                      <Crown className="w-3 h-3" /> Хост
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Синяя команда */}
        <div className="bg-gradient-to-br from-sky-950/40 via-slate-900/90 to-slate-900 border border-sky-800/40 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500 shadow-sm shadow-sky-500/80"></span>
              <h3 className="font-bold text-sky-300 text-sm">
                Синяя команда ({bluePlayers.length})
              </h3>
            </div>
            {myPlayer?.team !== 'blue' && (
              <button
                onClick={() => handleJoinTeam('blue')}
                className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold transition-all active:scale-95"
              >
                Вступить
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {bluePlayers.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-2 text-center">
                Пока никого. Нажмите «Вступить»
              </div>
            ) : (
              bluePlayers.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                    p.id === myPlayer?.id
                      ? 'bg-sky-500/20 border border-sky-500/40 font-bold text-white'
                      : 'bg-slate-950/50 text-slate-300 border border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{p.avatar}</span>
                    <span>{p.name}</span>
                    {p.id === myPlayer?.id && (
                      <span className="text-[10px] text-sky-300 font-normal">(Вы)</span>
                    )}
                  </div>
                  {p.isHost && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                      <Crown className="w-3 h-3" /> Хост
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Нижняя панель действий */}
      <footer className="pt-2">
        {isHost ? (
          <button
            onClick={handleStartGame}
            className="w-full py-4 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-xl shadow-emerald-950/50 active:scale-98 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Начать игру</span>
          </button>
        ) : (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
            Ожидаем, пока <span className="text-amber-400 font-semibold">Хост</span> запустит игру...
          </div>
        )}
      </footer>

      {/* QR модалка */}
      {showQR && <QRModal roomCode={roomCode} onClose={() => setShowQR(false)} />}
    </div>
  );
}
