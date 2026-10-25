// src/components/deception/DeceptionHome.jsx - Главный экран входа в «Криминалист»
import React, { useState } from 'react';
import { deceptionSocket, getSavedDeceptionName, saveDeceptionName } from '../../utils/deceptionSocket';
import { sounds } from '../../utils/soundEffects';
import GameHeader from '../common/GameHeader';
import {
  Search,
  Plus,
  LogIn,
  Shield,
  HelpCircle,
  FileQuestion,
  Users,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export default function DeceptionHome({ onBackToHub, errorMessage, setErrorMessage }) {
  const [playerName, setPlayerName] = useState(getSavedDeceptionName() || '');
  const [roomCode, setRoomCode] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreate = () => {
    sounds.playTap();
    if (!playerName.trim()) {
      setErrorMessage('Пожалуйста, введите ваше имя детектива');
      return;
    }
    setErrorMessage('');
    setIsCreating(true);
    saveDeceptionName(playerName);
    deceptionSocket.emit('create_room', { playerName: playerName.trim() });
  };

  const handleJoin = (e) => {
    e?.preventDefault();
    sounds.playTap();
    if (!playerName.trim()) {
      setErrorMessage('Пожалуйста, введите ваше имя детектива');
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length < 4) {
      setErrorMessage('Введите 4-значный номер дела (код комнаты)');
      return;
    }
    setErrorMessage('');
    setIsJoining(true);
    saveDeceptionName(playerName);
    deceptionSocket.emit('join_room', {
      roomCode: roomCode.trim(),
      playerName: playerName.trim()
    });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start select-none">
      {/* Крупный мобильный хедер */}
      <GameHeader
        onBack={onBackToHub}
        backLabel="В меню"
        title="КРИМИНАЛИСТ"
        icon="🔍"
        badge="Убийство в Гонконге"
      />

      <main className="max-w-md w-full mx-auto px-5 sm:px-6 py-6 pb-24 overflow-y-auto">
        {/* Атмосферный баннер детективного дела */}
        <div className="text-center pt-2 pb-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border-2 border-amber-500/50 shadow-2xl shadow-amber-950/40 flex items-center justify-center text-4xl mb-3.5">
            🕵️‍♂️
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Убийство в Гонконге
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed font-medium">
            Психологический детектив на ассоциации и дедукцию. Один из вас — убийца, а эксперт не имеет права говорить!
          </p>
        </div>

        {/* Оповещение об ошибке */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Карточка 1: Имя игрока */}
        <section className="mobile-card">
          <div className="mobile-card-header">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-amber-400" />
              <label htmlFor="playerNameInput" className="mobile-label mb-0">
                Ваше имя или позывной
              </label>
            </div>
          </div>
          <input
            id="playerNameInput"
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="Например: Детектив Чен"
            maxLength={18}
            className="w-full min-h-[56px] px-4 rounded-2xl bg-slate-950/80 border-2 border-slate-750 focus:border-amber-500 focus:bg-slate-900 text-white font-bold text-base placeholder-slate-500 transition-all outline-none"
          />
        </section>

        {/* Карточка 2: Создать новое расследование (Хост) */}
        <section className="mobile-card border-amber-500/30">
          <div className="mobile-card-header">
            <div className="flex items-center gap-2.5">
              <Plus className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-black text-white">Открыть новое дело</h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Вы станете организатором расследования. Другие игроки подключатся к вашему столу по 4-значному коду.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-xl shadow-amber-950/50 active:scale-98 transition-all touch-manipulation disabled:opacity-50"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>{isCreating ? 'Открываем дело...' : 'Создать расследование'}</span>
          </button>
        </section>

        {/* Карточка 3: Войти в дело по коду комнаты */}
        <section className="mobile-card border-sky-500/30">
          <div className="mobile-card-header">
            <div className="flex items-center gap-2.5">
              <LogIn className="w-5 h-5 text-sky-400" />
              <h2 className="text-base sm:text-lg font-black text-white">Войти по номеру дела</h2>
            </div>
          </div>
          <form onSubmit={handleJoin} className="space-y-3.5">
            <div>
              <span className="mobile-label">Код комнаты (4 цифры)</span>
              <input
                type="tel"
                pattern="[0-9]*"
                maxLength={4}
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.replace(/\D/g, ''));
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Например: 4821"
                className="w-full min-h-[56px] px-4 rounded-2xl bg-slate-950/80 border-2 border-slate-750 focus:border-sky-500 focus:bg-slate-900 text-white font-mono font-black text-center text-2xl tracking-[0.3em] placeholder-slate-600 transition-all outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isJoining}
              className="w-full min-h-[56px] py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-sky-300 hover:text-white shadow-lg active:scale-98 transition-all touch-manipulation disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isJoining ? 'Подключение...' : 'Присоединиться к следствию'}</span>
            </button>
          </form>
        </section>

        {/* Кнопка открытия кратких правил */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setShowRules(!showRules);
            }}
            className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-amber-300 active:scale-95 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>{showRules ? 'Скрыть правила' : 'Как играть в «Криминалиста»?'}</span>
          </button>
        </div>

        {/* Блок правил игры */}
        {showRules && (
          <div className="mt-4 p-5 rounded-3xl bg-slate-900/95 border border-slate-750 space-y-4 text-xs leading-relaxed text-slate-300 animate-fadeIn shadow-2xl">
            <div className="flex items-center gap-2 text-sm font-black text-amber-400 uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>Суть расследования</span>
            </div>
            <p>
              В начале игры каждый участник получает перед собой <strong className="text-sky-300">4 Орудия преступления</strong> (синие карты) и <strong className="text-rose-300">4 Улики</strong> (красные карты).
            </p>
            <div className="space-y-2.5 border-t border-slate-800 pt-3">
              <p>
                🎭 <strong className="text-white">Роли:</strong> Судмедэксперт (знает всё, но <strong className="text-amber-400">не может говорить</strong> ни слова!), Убийца (тайно выбирает 1 свое орудие и 1 улику) и Следователи.
              </p>
              <p>
                📋 <strong className="text-white">Планшеты реконструкции:</strong> Эксперт расставляет маркеры-пули на подсказки: <em>Причина смерти, Место, Состояние тела, Запах</em> и т.д.
              </p>
              <p>
                🛡️ <strong className="text-white">Обвинение (Жетон):</strong> У каждого следователя есть ровно 1 попытка обвинения за игру. Чтобы победить, нужно безошибочно назвать: <strong>Игрока-убийцу + его Орудие + его Улику</strong>.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
