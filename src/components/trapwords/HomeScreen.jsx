// src/components/trapwords/HomeScreen.jsx - Эргономичный экран Слова-Мины
import React, { useState, useEffect } from 'react';
import { socket, playerId, getSavedPlayerName, savePlayerName } from '../../utils/socket';
import { sounds } from '../../utils/soundEffects';
import GameHeader from '../common/GameHeader';
import { Sparkles, Users, Bomb, ArrowRight, Play } from 'lucide-react';

export default function HomeScreen({ onSelectMafiaMode, errorMessage, setErrorMessage }) {
  const [playerName, setPlayerName] = useState(getSavedPlayerName() || '');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Автозаполнение номера комнаты из URL (например ?room=4912)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCode(roomParam.trim());
      setIsJoining(true);
    }
  }, []);

  // Сброс загрузки при ошибке
  useEffect(() => {
    if (errorMessage) {
      setIsCreating(false);
      setIsJoining(false);
    }
  }, [errorMessage]);

  const handleCreateRoom = () => {
    setIsCreating(true);
    const name = playerName.trim() || `Игрок ${Math.floor(Math.random() * 900) + 100}`;
    savePlayerName(name);
    sounds.playTap();
    socket.emit('create_room', { playerName: name, playerId });
  };

  const handleJoinRoom = (e) => {
    e?.preventDefault();
    if (!roomCode.trim()) {
      setErrorMessage('Введите номер стола (например 4819)');
      return;
    }
    setIsJoining(true);
    const name = playerName.trim() || `Игрок ${Math.floor(Math.random() * 900) + 100}`;
    savePlayerName(name);
    sounds.playTap();
    socket.emit('join_room', { roomCode: roomCode.trim(), playerName: name, playerId });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto select-none overflow-y-auto pb-10">
      {/* Крупный эргономичный мобильный хедер */}
      <GameHeader
        onBack={onSelectMafiaMode}
        backLabel="В меню"
        title="СЛОВА-МИНЫ"
        icon="💣"
        badge="Онлайн"
      />

      <div className="p-4 space-y-4">
        {/* Заголовок игры */}
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-3xl sm:text-4xl font-black text-rose-500 uppercase tracking-tight">СЛОВА</span>
            <span className="text-2xl font-bold text-slate-500">-</span>
            <span className="text-3xl sm:text-4xl font-black text-amber-400 uppercase tracking-tight">МИНЫ</span>
            <span className="text-3xl">💣</span>
          </div>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed font-medium">
            Командная битва на блеф, ассоциации и секретные ловушки со смартфонов!
          </p>
        </div>

        {/* Ошибка если была */}
        {errorMessage && (
          <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-200 text-sm text-center font-bold">
            {errorMessage}
          </div>
        )}

        {/* Блок 1: Имя игрока */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2.5">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300">
            Ваше имя в игре:
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Например: Артур, Лиза, Капитан"
            maxLength={18}
            className="w-full px-4 py-4 bg-slate-950 border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-2xl text-white placeholder-slate-500 text-lg font-bold transition-all outline-none"
          />
        </section>

        {/* Блок 2: Создать новый стол (Хост) */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" />
              <span>Вы ведущий вечеринки?</span>
            </div>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Хост
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
            Создайте новую комнату и получите 4-значный код для ваших друзей.
          </p>
          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={isCreating}
            className={`w-full min-h-[56px] py-4 px-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-xl shadow-rose-950/50 active:scale-98 transition-all touch-manipulation ${isCreating ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Создание стола...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Создать новый стол 🎲</span>
              </>
            )}
          </button>
        </section>

        {/* Блок 3: Войти за существующий стол */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <span>Подключение по коду</span>
            </div>
            <span className="text-xs font-extrabold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              Игрок
            </span>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">
                Введите 4 цифры стола:
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="4819"
                className="w-full py-4 px-4 bg-slate-950 border-2 border-slate-700/80 focus:border-sky-400 rounded-2xl text-center font-mono text-3xl font-black tracking-widest text-sky-400 placeholder-slate-700 transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className={`w-full min-h-[56px] py-4 px-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 active:scale-98 transition-all shadow touch-manipulation ${isJoining ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Подключение...</span>
                </>
              ) : (
                <>
                  <span>Войти за стол</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </section>

        <footer className="text-center pt-2 pb-6 text-xs text-slate-500 font-medium">
          Подходит для 4–16 игроков • Синхронизация в реальном времени
        </footer>
      </div>
    </div>
  );
}
