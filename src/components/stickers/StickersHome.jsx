// src/components/stickers/StickersHome.jsx - Главный экран входа в игру «Стикеры»
import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, Users, LogIn, PlusCircle, ArrowLeft, Dices, ChevronRight, Check } from 'lucide-react';
import GameHeader from '../common/GameHeader';
import {
  stickersSocket,
  getSavedStickersName,
  saveStickersName
} from '../../utils/stickersSocket';
import { STICKERS_CATEGORIES } from '../../data/stickersData';
import { sounds } from '../../utils/soundEffects';

export default function StickersHome({ onBackToHub, errorMessage, setErrorMessage }) {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    const saved = getSavedStickersName();
    if (saved) setPlayerName(saved);

    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('stickers_room');
    if (codeParam) {
      setRoomCode(codeParam.trim().toUpperCase());
      setActiveTab('join');
    }
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMessage('Пожалуйста, введите ваше имя');
      return;
    }
    setErrorMessage('');
    sounds.playTap();
    stickersSocket.emit('create_room', {
      hostName: playerName.trim(),
      settings: {
        category: selectedCategory,
        timerSeconds: Number(timerSeconds)
      }
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMessage('Пожалуйста, введите ваше имя');
      return;
    }
    if (!roomCode.trim()) {
      setErrorMessage('Введите 4-значный код комнаты');
      return;
    }
    setErrorMessage('');
    sounds.playTap();
    stickersSocket.emit('join_room', {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim()
    });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-between select-none">
      <GameHeader
        onBack={onBackToHub}
        backLabel="Хаб игр"
        title="Стикеры"
        icon="🏷️"
        badge="Онлайн"
        rightAction={
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold active:scale-95 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Правила</span>
          </button>
        }
      />

      <main className="flex-1 max-w-md w-full mx-auto px-5 py-6 flex flex-col justify-center space-y-6">
        {/* Заголовок с анимированным стикером */}
        <div className="text-center space-y-3">
          <div className="inline-block relative transform -rotate-2 hover:rotate-0 transition-transform">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 shadow-xl shadow-amber-500/20 flex flex-col items-center justify-center border-2 border-amber-200/50">
              <span className="text-3xl">🏷️</span>
              <span className="text-[10px] font-black text-slate-950 uppercase tracking-wider">Кто я?</span>
            </div>
            <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
              Вечеринка
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">
              Стикеры на лоб
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto leading-relaxed">
              Каждый придумывает персонажа для соседа. Узнай, кто ты, задавая вопросы «Да/Нет»!
            </p>
          </div>
        </div>

        {/* Сообщение об ошибке */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm font-semibold text-center animate-shake">
            {errorMessage}
          </div>
        )}

        {/* Переключатель режима: Создать / Войти */}
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setErrorMessage('');
            }}
            className={`py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Создать игру</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('join');
              setErrorMessage('');
            }}
            className={`py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'join'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span>Войти по коду</span>
          </button>
        </div>

        {/* Форма создания комнаты */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Ваше имя / никнейм
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Например: Денис"
                maxLength={20}
                className="w-full px-4 py-4 rounded-2xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-white text-lg font-medium placeholder-slate-500 transition-colors"
              />
            </div>

            {/* Настройка тематики */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Тематика (подсказка для игроков)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {STICKERS_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500/15 border-amber-400/80 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-sm font-semibold">{cat.title}</span>
                    </div>
                    {selectedCategory === cat.id && (
                      <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Настройка таймера хода */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Таймер на ход игрока
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 0, label: 'Без таймера' },
                  { value: 60, label: '60 сек' },
                  { value: 90, label: '90 сек' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTimerSeconds(item.value)}
                    className={`py-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                      timerSeconds === item.value
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-lg shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[56px] touch-manipulation"
            >
              <span>Создать комнату</span>
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </button>
          </form>
        )}

        {/* Форма входа по коду */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Ваше имя / никнейм
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Например: Катя"
                maxLength={20}
                className="w-full px-4 py-4 rounded-2xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-white text-lg font-medium placeholder-slate-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Код комнаты (4 цифры)
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="1234"
                maxLength={6}
                className="w-full px-4 py-4 rounded-2xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-amber-400 text-2xl font-black text-center tracking-widest placeholder-slate-600 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-lg shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[56px] touch-manipulation"
            >
              <span>Войти в комнату</span>
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </button>
          </form>
        )}
      </main>

      {/* Футер */}
      <footer className="text-center py-4 text-xs text-slate-500">
        У каждого свой стикер на лбу • Угадайте, кто вы!
      </footer>

      {/* Модальное окно правил */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏷️</span>
                <h3 className="text-lg font-black text-white uppercase">Правила игры «Стикеры»</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                💡 <b>Суть игры:</b> вам на лоб наклеен секретный персонаж. Все остальные видят, кто вы, а вы — нет!
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span>1️⃣</span> Фаза загадывания:
                </h4>
                <p className="text-xs text-slate-400 pl-6">
                  Система случайно назначает каждому игроку соседа. Вы тайно придумываете персонажа для него (или берете случайного из базы).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span>2️⃣</span> Фаза игры:
                </h4>
                <p className="text-xs text-slate-400 pl-6">
                  Все видят стикеры друг друга, кроме своего! По очереди игроки задают вопросы, на которые можно ответить только <b>«ДА»</b> или <b>«НЕТ»</b>.
                </p>
                <div className="pl-6 text-xs text-amber-400">
                  • Если ответ «ДА» — игрок продолжает задавать вопросы.<br />
                  • Если ответ «НЕТ» — ход переходит к следующему.
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span>3️⃣</span> Победа:
                </h4>
                <p className="text-xs text-slate-400 pl-6">
                  Когда вы поняли, кто вы — называете персонажа вслух и нажимаете кнопку <b>«Я отгадал!»</b>. Побеждает тот, кто отгадал первым!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRulesModal(false)}
              className="w-full py-3.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm active:scale-98 transition-all"
            >
              Всё понятно!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
