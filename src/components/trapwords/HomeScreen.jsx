// src/components/trapwords/HomeScreen.jsx
import React, { useState, useEffect } from 'react';
import { socket, playerId, getSavedPlayerName, savePlayerName } from '../../utils/socket';
import { sounds } from '../../utils/soundEffects';
import { Sparkles, Users, Bomb, Shield, ArrowRight, Play, Dice5 } from 'lucide-react';

export default function HomeScreen({ onSelectMafiaMode, errorMessage, setErrorMessage }) {
  const [playerName, setPlayerName] = useState(getSavedPlayerName() || '');
  const [roomCode, setRoomCode] = useState('');
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

  const handleCreateRoom = () => {
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
    const name = playerName.trim() || `Игрок ${Math.floor(Math.random() * 900) + 100}`;
    savePlayerName(name);
    sounds.playTap();
    socket.emit('join_room', { roomCode: roomCode.trim(), playerName: name, playerId });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between p-4 max-w-md mx-auto text-slate-100">
      {/* Шапка с переключателем режима */}
      <header className="pt-4 pb-2 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Party Games Hub • Онлайн со смартфонов</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center justify-center gap-2">
          <span className="text-rose-500">Слова</span>
          <span className="text-slate-400">-</span>
          <span className="text-amber-400">Мины</span>
          <Bomb className="w-7 h-7 text-rose-500 animate-bounce" />
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Командная игра на ассоциации, блеф и секретные ловушки. Без скачиваний — прямо в браузере!
        </p>
      </header>

      {/* Ошибка если была */}
      {errorMessage && (
        <div className="p-3 mb-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs text-center animate-shake">
          {errorMessage}
        </div>
      )}

      {/* Основная карточка входа */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4 my-auto">
        {/* Поле имени игрока */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Ваше имя в игре
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Например: Артур, Лиза, Капитан"
            maxLength={18}
            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
        </div>

        {/* Кнопка Создать стол */}
        <button
          onClick={handleCreateRoom}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white shadow-lg shadow-rose-950/40 active:scale-98 transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Создать новый стол</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-xs text-slate-500 font-medium uppercase tracking-wider">
            или войти по коду
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Форма подключения по номеру стола */}
        <form onSubmit={handleJoinRoom} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Номер стола (4 цифры)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="Например: 4819"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-center font-mono text-xl tracking-widest text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 active:scale-98 transition-all"
          >
            <span>Войти за стол</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Нижняя панель: Переход в главное меню */}
      <footer className="pt-3 pb-2 space-y-2 text-center">
        <button
          onClick={onSelectMafiaMode}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-2 transition-all"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180 text-amber-400" />
          <span>← Назад в меню всех игр (Хаб)</span>
        </button>

        <p className="text-[11px] text-slate-600">
          Подходит для 4–16 игроков • Смартфон как пульт и карта
        </p>
      </footer>
    </div>
  );
}
