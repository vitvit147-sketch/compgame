// src/components/danetki/DanetkiHome.jsx - Стартовый экран «Данеток»
import React, { useState } from 'react';
import { DANETKI_CATEGORIES, ALL_DANETKI } from '../../data/danetkiData';
import { danetkiSocket, getSavedDanetkiName, saveDanetkiName } from '../../utils/danetkiSocket';
import { sounds } from '../../utils/soundEffects';
import GameHeader from '../common/GameHeader';
import DanetkiCatalogModal from './DanetkiCatalogModal';
import {
  Sparkles,
  Smartphone,
  Globe,
  Play,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export default function DanetkiHome({
  onBackToHub,
  onStartLocalGame,
  errorMessage,
  setErrorMessage,
  completedIds = []
}) {
  const [playMode, setPlayMode] = useState('local'); // 'local' | 'online'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [playerName, setPlayerName] = useState(getSavedDanetkiName() || '');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Старт локальной игры на 1 телефоне
  const handleStartLocal = () => {
    sounds.playTap();
    onStartLocalGame(selectedCategory);
  };

  // Создание онлайн комнаты
  const handleCreateOnlineRoom = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMessage?.('Введите ваше имя перед созданием комнаты!');
      return;
    }
    setErrorMessage?.('');
    setIsSubmitting(true);
    sounds.playTap();
    try {
      saveDanetkiName(playerName);
      await danetkiSocket.emit('create_room', { playerName: playerName.trim() });
    } catch (err) {
      setErrorMessage?.(err.message || 'Ошибка создания комнаты');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Вход в онлайн комнату
  const handleJoinOnlineRoom = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMessage?.('Введите ваше имя перед входом!');
      return;
    }
    if (!roomCodeInput.trim()) {
      setErrorMessage?.('Введите 4-значный номер комнаты!');
      return;
    }
    setErrorMessage?.('');
    setIsSubmitting(true);
    sounds.playTap();
    try {
      saveDanetkiName(playerName);
      await danetkiSocket.emit('join_room', {
        roomCode: roomCodeInput.trim(),
        playerName: playerName.trim()
      });
    } catch (err) {
      setErrorMessage?.(err.message || 'Ошибка подключения к комнате');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-lg w-full mx-auto select-none overflow-y-auto">
      {/* Хедер */}
      <GameHeader
        onBack={onBackToHub}
        backLabel="В меню"
        title="ДАНЕТКИ"
        icon="🧩"
        badge="Детектив & Логика"
      />

      <main className="px-5 sm:px-6 py-6 pb-28 space-y-5">
        {/* Карточка игры */}
        <section className="text-center py-2">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center text-4xl mb-3 shadow-xl shadow-amber-500/10">
            🧩
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Данетки
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed font-medium">
            Загадки на нестандартное мышление. Ведущий отвечает только «Да», «Нет» или «Не имеет значения»!
          </p>

          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-bold text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>В базе: {ALL_DANETKI.length} загадок • Отгадано: {completedIds.length}</span>
          </div>
        </section>

        {/* Переключатель формата: на 1 телефоне / онлайн */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setPlayMode('local');
            }}
            className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              playMode === 'local'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>На 1 телефоне</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setPlayMode('online');
            }}
            className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              playMode === 'online'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Онлайн со смартфонов</span>
          </button>
        </div>

        {/* Ошибки */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-bold text-center animate-fadeIn">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* ======================================================== */}
        {/* РЕЖИМ 1: НА ОДНОМ ТЕЛЕФОНЕ (В КРУГУ ДРУЗЕЙ)              */}
        {/* ======================================================== */}
        {playMode === 'local' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Выбор категории */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider block px-1">
                Категория загадок:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DANETKI_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setSelectedCategory(cat.id);
                    }}
                    className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all flex items-center gap-2 ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Главные кнопки старта */}
            <button
              type="button"
              onClick={handleStartLocal}
              className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-2xl shadow-amber-500/20 active:scale-98 transition-all touch-manipulation"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Начать случайную данетку 🎲</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCatalog(true)}
              className="w-full min-h-[52px] py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all touch-manipulation"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Выбрать загадку из каталога ({ALL_DANETKI.length})</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* РЕЖИМ 2: ОНЛАЙН СО СМАРТФОНОВ                            */}
        {/* ======================================================== */}
        {playMode === 'online' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Имя игрока */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider block px-1">
                Ваше имя или никнейм:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                placeholder="Например: Шерлок"
                className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-750 text-white font-bold text-base focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Создание комнаты */}
            <div className="mobile-card border-amber-500/30">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                Создать комнату (Я ведущий) 👑
              </h3>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Вы будете загадывать данетку, видеть разгадку и отвечать «Да/Нет» на экране.
              </p>
              <button
                type="button"
                onClick={handleCreateOnlineRoom}
                disabled={isSubmitting}
                className="w-full min-h-[52px] py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 transition-all touch-manipulation disabled:opacity-50"
              >
                Создать новую комнату 🚀
              </button>
            </div>

            {/* Подключение по коду */}
            <div className="mobile-card border-slate-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                Подключиться к комнате 🚪
              </h3>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Введите 4-значный номер, который вам назвал ведущий:
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  pattern="[0-9]*"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  placeholder="Код (например: 4821)"
                  className="flex-1 p-3.5 rounded-2xl bg-slate-950 border border-slate-750 text-white font-mono font-black text-center text-lg tracking-widest focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleJoinOnlineRoom}
                  disabled={isSubmitting}
                  className="min-h-[50px] px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-black text-sm active:scale-98 transition-all touch-manipulation disabled:opacity-50"
                >
                  Войти
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Правила игры (аккордеон) */}
        <section className="mobile-card border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>Как играть в «Данетки»?</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${showRules ? 'rotate-90' : ''}`} />
          </button>

          {showRules && (
            <div className="pt-3 text-xs text-slate-300 space-y-2 border-t border-slate-800 mt-3 animate-fadeIn leading-relaxed">
              <p>
                <strong>1. Загадка:</strong> Ведущий вслух зачитывает странную или парадоксальную ситуацию.
              </p>
              <p>
                <strong>2. Вопросы:</strong> Игроки задают ведущему любые вопросы, на которые можно ответить строго <strong>«Да»</strong>, <strong>«Нет»</strong> или <strong>«Не имеет значения»</strong>.
              </p>
              <p>
                <strong>3. Логика:</strong> Шаг за шагом игроки отметают ложные гипотезы и восстанавливают полную цепочку событий.
              </p>
              <p>
                <strong>4. Победа:</strong> Тот, кто первый назовет точную разгадку, побеждает и может стать следующим ведущим!
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Каталог данеток */}
      <DanetkiCatalogModal
        isOpen={showCatalog}
        onClose={() => setShowCatalog(false)}
        onSelectDanetka={(item) => {
          onStartLocalGame('all', item);
        }}
        completedIds={completedIds}
      />
    </div>
  );
}
