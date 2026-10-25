// src/components/bunker/BunkerHome.jsx
import React, { useState, useEffect } from 'react';
import { bunkerSocket, bunkerPlayerId, getSavedBunkerName, saveBunkerName } from '../../utils/bunkerSocket';
import { sounds } from '../../utils/soundEffects';
import { Shield, Users, Play, ArrowRight, ArrowLeft, Radio } from 'lucide-react';

export default function BunkerHome({ onBackToHub, errorMessage, setErrorMessage }) {
  const [playerName, setPlayerName] = useState(getSavedBunkerName() || '');
  const [roomCode, setRoomCode] = useState('');

  // Автозаполнение из URL ?room=XXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCode(roomParam.trim());
    }
  }, []);

  const handleCreateRoom = () => {
    const name = playerName.trim() || `Выживший ${Math.floor(Math.random() * 900) + 100}`;
    saveBunkerName(name);
    sounds.playTap();
    bunkerSocket.emit('create_room', { playerName: name, playerId: bunkerPlayerId });
  };

  const handleJoinRoom = (e) => {
    e?.preventDefault();
    if (!roomCode.trim()) {
      setErrorMessage('Введите номер стола (например 4819)');
      return;
    }
    const name = playerName.trim() || `Выживший ${Math.floor(Math.random() * 900) + 100}`;
    saveBunkerName(name);
    sounds.playTap();
    bunkerSocket.emit('join_room', { roomCode: roomCode.trim(), playerName: name, playerId: bunkerPlayerId });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto px-4 pt-safe pb-safe space-y-4 select-none">
      {/* Навигация */}
      <header className="flex items-center justify-between pb-1">
        <button
          onClick={onBackToHub}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/20 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>В меню хаба</span>
        </button>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Бункер Онлайн</span>
        </div>
      </header>

      {/* Заголовок */}
      <div className="text-center py-1">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-3xl font-black text-amber-400 uppercase tracking-tight">БУНКЕР</span>
          <span className="text-3xl">☢️</span>
        </div>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          Командная игра на выживание. Докажите свою ценность и займите место в убежище!
        </p>
      </div>

      {/* Ошибка если была */}
      {errorMessage && (
        <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-200 text-xs text-center font-bold">
          {errorMessage}
        </div>
      )}

      {/* Блок 1: Имя игрока */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          Ваш позывной / Имя:
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Например: Сталкер, Док, Лиза"
          maxLength={18}
          className="w-full px-4 py-3.5 bg-slate-950 border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-2xl text-white placeholder-slate-500 text-base font-semibold transition-all outline-none"
        />
      </section>

      {/* Блок 2: Создать стол (Хост) */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-extrabold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Создать новое убежище</span>
          </div>
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            Хост
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Создайте новую комнату и получите 4-значный код для друзей.
        </p>
        <button
          onClick={handleCreateRoom}
          className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-xl shadow-amber-950/50 active:scale-98 transition-all"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Создать бункер 🏢</span>
        </button>
      </section>

      {/* Блок 3: Подключиться по коду */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-extrabold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span>Войти к убежищу по коду</span>
          </div>
          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
            Выживший
          </span>
        </div>

        <form onSubmit={handleJoinRoom} className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">
              Введите 4 цифры комнаты:
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="7412"
              className="w-full py-3.5 px-4 bg-slate-950 border-2 border-slate-700/80 focus:border-sky-400 rounded-2xl text-center font-mono text-2xl font-black tracking-widest text-sky-400 placeholder-slate-700 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 active:scale-98 transition-all shadow"
          >
            <span>Присоединиться к группе</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </section>

      <footer className="text-center pt-2 pb-6 text-[11px] text-slate-500">
        Для 3–16 человек • Тайные карточки на экране каждого смартфона
      </footer>
    </div>
  );
}
