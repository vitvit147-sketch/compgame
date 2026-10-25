// src/components/mafia_online/MafiaOnlineHome.jsx - Стартовый экран выбора режима Мафии
import React, { useState } from 'react';
import { mafiaOnlineSocket, getSavedMafiaPlayerName, saveMafiaPlayerName } from '../../utils/mafiaOnlineSocket';
import { sounds } from '../../utils/soundEffects';
import GameHeader from '../common/GameHeader';
import {
  Crown,
  Smartphone,
  Radio,
  Plus,
  LogIn,
  Users,
  Shield,
  AlertTriangle,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function MafiaOnlineHome({ onBackToHub, onSelectOfflineMode, errorMessage, setErrorMessage }) {
  const [playerName, setPlayerName] = useState(getSavedMafiaPlayerName() || '');
  const [roomCode, setRoomCode] = useState('');
  const [activeTab, setActiveTab] = useState('join'); // 'host' | 'join'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRoom = () => {
    sounds.playTap();
    if (!playerName.trim()) {
      setErrorMessage('Пожалуйста, введите имя ведущего');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    saveMafiaPlayerName(playerName);
    mafiaOnlineSocket.emit('create_room', { playerName: playerName.trim() });
  };

  const handleJoinRoom = (e) => {
    e?.preventDefault();
    sounds.playTap();
    if (!playerName.trim()) {
      setErrorMessage('Пожалуйста, введите ваше имя');
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length < 4) {
      setErrorMessage('Введите 4-значный код комнаты Мафии');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    saveMafiaPlayerName(playerName);
    mafiaOnlineSocket.emit('join_room', {
      roomCode: roomCode.trim(),
      playerName: playerName.trim()
    });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start select-none">
      <GameHeader
        onBack={onBackToHub}
        backLabel="В меню"
        title="МАФИЯ"
        icon="🎭"
        badge="Онлайн и Оффлайн"
      />

      <main className="max-w-md w-full mx-auto px-5 sm:px-6 py-6 pb-24 overflow-y-auto">
        {/* Баннер Мафии */}
        <div className="text-center pt-2 pb-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border-2 border-purple-500/50 shadow-2xl shadow-purple-950/50 flex items-center justify-center text-4xl mb-3.5">
            🎭
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Мафия Онлайн
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed font-medium">
            Подключайтесь со своих смартфонов: ведущий настраивает роли, запускает партию, и каждый видит свою роль на своем экране!
          </p>
        </div>

        {/* Оповещение об ошибке */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Карточка 1: Имя игрока / ведущего */}
        <section className="mobile-card">
          <div className="mobile-card-header">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-purple-400" />
              <label htmlFor="mafiaNameInput" className="mobile-label mb-0">
                Ваше имя или никнейм
              </label>
            </div>
          </div>
          <input
            id="mafiaNameInput"
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="Например: Дон Корлеоне / Анна"
            maxLength={18}
            className="w-full min-h-[56px] px-4 rounded-2xl bg-slate-950/80 border-2 border-slate-750 focus:border-purple-500 focus:bg-slate-900 text-white font-bold text-base placeholder-slate-500 transition-all outline-none"
          />
        </section>

        {/* Переключатель: Я Игрок / Я Ведущий */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-750 mb-5">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setActiveTab('join');
            }}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'join'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Я Игрок</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setActiveTab('host');
            }}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'host'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Я Ведущий</span>
          </button>
        </div>

        {/* Вариант 1: Я Игрок (Войти по коду) */}
        {activeTab === 'join' && (
          <section className="mobile-card border-purple-500/40 animate-fadeIn">
            <div className="mobile-card-header">
              <div className="flex items-center gap-2.5">
                <LogIn className="w-5 h-5 text-purple-400" />
                <h2 className="text-base sm:text-lg font-black text-white">
                  Подключиться к комнате
                </h2>
              </div>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <span className="mobile-label">Код комнаты Мафии (4 цифры)</span>
                <input
                  type="tel"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.replace(/\D/g, ''));
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Например: 7412"
                  className="w-full min-h-[56px] px-4 rounded-2xl bg-slate-950/80 border-2 border-slate-750 focus:border-purple-500 focus:bg-slate-900 text-white font-mono font-black text-center text-2xl tracking-[0.3em] placeholder-slate-600 transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-950/60 active:scale-98 transition-all touch-manipulation disabled:opacity-50"
              >
                <LogIn className="w-5 h-5" />
                <span>{isSubmitting ? 'Входим в комнату...' : 'Войти и узнать роль'}</span>
              </button>
            </form>
          </section>
        )}

        {/* Вариант 2: Я Ведущий (Создать комнату онлайн) */}
        {activeTab === 'host' && (
          <section className="mobile-card border-amber-500/40 animate-fadeIn">
            <div className="mobile-card-header">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-400" />
                <h2 className="text-base sm:text-lg font-black text-white">
                  Создать онлайн-стол ведущего
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Вы получите 4-значный код. Игроки подключатся со своих телефонов, вы выберете роли и правила, нажмете старт — и роли распределятся по их смартфонам!
            </p>

            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={isSubmitting}
              className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-xl shadow-amber-950/60 active:scale-98 transition-all touch-manipulation disabled:opacity-50"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>{isSubmitting ? 'Создаем стол...' : 'Создать комнату Мафии'}</span>
            </button>
          </section>
        )}

        {/* Разделитель */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <span className="relative bg-slate-950 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            или
          </span>
        </div>

        {/* Вариант 3: Оффлайн-пульт на 1 телефоне (как раньше) */}
        <section className="mobile-card border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Игра на 1 устройстве
              </div>
              <div className="font-black text-sm text-white mt-0.5">
                Оффлайн-пульт ведущего
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Для игры без интернета с передачей телефона по кругу
              </div>
            </div>
            <button
              type="button"
              onClick={onSelectOfflineMode}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-black text-slate-200 active:scale-95 transition-all shrink-0"
            >
              Запустить 🎭
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
