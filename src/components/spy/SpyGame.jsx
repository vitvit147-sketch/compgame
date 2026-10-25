// src/components/spy/SpyGame.jsx - Полноценная игра «Шпион» (Spyfall) для одного телефона
import React, { useState, useEffect } from 'react';
import { SPY_LOCATIONS, SPY_CATEGORIES, getRandomLocation } from '../../data/spyLocations';
import { sounds } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import GameHeader from '../common/GameHeader';
import {
  Users,
  Eye,
  EyeOff,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  MapPin,
  Check,
  AlertTriangle,
  ChevronRight,
  Shield,
  BookOpen,
  X,
  Minus,
  Plus,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

const SPY_PRESETS = [
  {
    id: 'classic',
    title: '🏙️ Классический шпион',
    desc: '5 игроков, 1 шпион, 5 минут • Город, работа и путешествия',
    players: 5,
    spies: 1,
    time: 5,
    roles: true,
    hint: false,
    categories: ['classic', 'travel', 'work']
  },
  {
    id: 'blitz',
    title: '⚡ Шпионский блиц',
    desc: '4 игрока, 1 шпион, 3 минуты • Быстрые вопросы на реакцию',
    players: 4,
    spies: 1,
    time: 3,
    roles: false,
    hint: false,
    categories: ['classic', 'crazy']
  },
  {
    id: 'double_agent',
    title: '🕵️🕵️ Двойной агент',
    desc: '8 игроков, 2 шпиона, 7 минут • Шпионы не знают друг друга',
    players: 8,
    spies: 2,
    time: 7,
    roles: true,
    hint: true,
    categories: ['classic', 'travel', 'adventure', 'work', 'crazy']
  },
  {
    id: 'party',
    title: '🎉 Большая вечеринка',
    desc: '10 игроков, 2 шпиона, 8 минут • Все категории локаций включены',
    players: 10,
    spies: 2,
    time: 8,
    roles: true,
    hint: true,
    categories: ['classic', 'travel', 'adventure', 'work', 'crazy', 'history']
  }
];

export default function SpyGame({ onBackToHub }) {
  // --------------------------------------------------------------------------
  // НАСТРОЙКИ ИГРЫ
  // --------------------------------------------------------------------------
  const [playerCount, setPlayerCount] = useState(5);
  const [spyCount, setSpyCount] = useState(1);
  const [roundMinutes, setRoundMinutes] = useState(5);
  const [enableRoles, setEnableRoles] = useState(true);
  const [spyCategoryHint, setSpyCategoryHint] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([
    'classic',
    'travel',
    'adventure',
    'work',
    'crazy'
  ]);

  const [playerNames, setPlayerNames] = useState(
    Array.from({ length: 16 }, (_, i) => `Игрок ${i + 1}`)
  );

  // --------------------------------------------------------------------------
  // СОСТОЯНИЕ ТЕКУЩЕЙ ПАРТИИ
  // --------------------------------------------------------------------------
  // Фазы: 'SETUP' | 'PASS' | 'REVEAL' | 'PLAYING' | 'VOTING' | 'SPY_GUESS' | 'RESULTS'
  const [phase, setPhase] = useState('SETUP');
  const [currentPassIndex, setCurrentPassIndex] = useState(0);
  const [isCardRevealed, setIsCardRevealed] = useState(false);

  // Сгенерированные роли текущего раунда: [{ playerIndex, name, isSpy, location, role }]
  const [gameAssignments, setGameAssignments] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Таймер раунда
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Модалка шпаргалки локаций
  const [showLocationsCheatSheet, setShowLocationsCheatSheet] = useState(false);
  const [cheatFilter, setCheatFilter] = useState('');

  // Исход игры
  const [gameResult, setGameResult] = useState(null);

  // Применение готового сценария
  const applyPreset = (preset) => {
    setPlayerCount(preset.players);
    setSpyCount(preset.spies);
    setRoundMinutes(preset.time);
    setEnableRoles(preset.roles);
    setSpyCategoryHint(preset.hint);
    setSelectedCategories(preset.categories);
    sounds.playTap();
  };

  const isPresetActive = (preset) => (
    playerCount === preset.players &&
    spyCount === preset.spies &&
    roundMinutes === preset.time &&
    enableRoles === preset.roles
  );

  // --------------------------------------------------------------------------
  // ТАЙМЕР
  // --------------------------------------------------------------------------
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            sounds.playExplosion();
            return 0;
          }
          if (prev <= 11) {
            sounds.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // --------------------------------------------------------------------------
  // СТАРТ ПАРТИИ И РАЗДАЧА РОЛЕЙ
  // --------------------------------------------------------------------------
  const startNewGame = () => {
    sounds.playTap();

    // 1. Случайная локация из выбранных категорий
    const loc = getRandomLocation(selectedCategories);
    setCurrentLocation(loc);

    // 2. Выбираем шпионов
    const indices = Array.from({ length: playerCount }, (_, i) => i);
    const shuffledIndices = [...indices].sort(() => Math.random() - 0.5);
    const spyIndices = shuffledIndices.slice(0, spyCount);

    // 3. Перемешиваем роли внутри локации
    const shuffledRoles = [...loc.roles].sort(() => Math.random() - 0.5);

    // 4. Формируем карточки игроков
    let roleIdx = 0;
    const assignments = indices.map(idx => {
      const isSpy = spyIndices.includes(idx);
      const role = !isSpy && enableRoles
        ? (shuffledRoles[roleIdx++ % shuffledRoles.length] || 'Местный житель')
        : null;

      return {
        playerIndex: idx,
        name: playerNames[idx] || `Игрок ${idx + 1}`,
        isSpy,
        location: loc,
        role: role
      };
    });

    setGameAssignments(assignments);
    setCurrentPassIndex(0);
    setIsCardRevealed(false);
    setTimerSeconds(roundMinutes * 60);
    setIsTimerRunning(false);
    setGameResult(null);

    setPhase('PASS');
  };

  // --------------------------------------------------------------------------
  // ПЕРЕДАЧА ТЕЛЕФОНА И ПРОСМОТР РОЛИ
  // --------------------------------------------------------------------------
  const handleShowRole = () => {
    sounds.playTap();
    setPhase('REVEAL');
    setIsCardRevealed(true);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleHideAndNext = () => {
    sounds.playTap();
    setIsCardRevealed(false);

    if (currentPassIndex < playerCount - 1) {
      setCurrentPassIndex(prev => prev + 1);
      setPhase('PASS');
    } else {
      sounds.playRoundStart();
      setPhase('PLAYING');
      setIsTimerRunning(true);
    }
  };

  // --------------------------------------------------------------------------
  // ИСХОДЫ ИГРЫ
  // --------------------------------------------------------------------------
  const handleCiviliansWin = (reason = 'Шпион разоблачен!') => {
    sounds.playVictory();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    setGameResult({
      winner: 'civilians',
      reason,
      location: currentLocation,
      spies: gameAssignments.filter(a => a.isSpy)
    });
    setPhase('RESULTS');
  };

  const handleSpiesWin = (reason = 'Шпион перехитрил город!') => {
    sounds.playVictory();
    setGameResult({
      winner: 'spies',
      reason,
      location: currentLocation,
      spies: gameAssignments.filter(a => a.isSpy)
    });
    setPhase('RESULTS');
  };

  const handleSpyGuessAttempt = (guessedLocation) => {
    if (!guessedLocation) return;
    if (guessedLocation.id === currentLocation.id) {
      handleSpiesWin(`Шпион безошибочно угадал секретную локацию: «${currentLocation.name}»!`);
    } else {
      handleCiviliansWin(`Шпион ошибся! Он назвал «${guessedLocation.name}», но правильная локация — «${currentLocation.name}».`);
    }
  };

  const handleTimeOutOrManualEnd = () => {
    setIsTimerRunning(false);
    setPhase('VOTING');
  };

  const toggleCategory = (catId) => {
    sounds.playTap();
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        if (prev.length <= 1) return prev;
        return prev.filter(c => c !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const currentCard = gameAssignments[currentPassIndex];

  const availableLocationsForCheatsheet = SPY_LOCATIONS.filter(l =>
    selectedCategories.includes(l.category)
  );

  const filteredLocations = availableLocationsForCheatsheet.filter(l =>
    l.name.toLowerCase().includes(cheatFilter.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col select-none relative z-10">
      {/* ==================================================================== */}
      {/* ФАЗА 1: НАСТРОЙКИ (SETUP) - ПРОСТОРНЫЙ МОБИЛЬНЫЙ ФОРМАТ             */}
      {/* ==================================================================== */}
      {phase === 'SETUP' && (
        <div className="flex-1 flex flex-col">
          {/* Универсальный большой хедер */}
          <GameHeader
            onBack={onBackToHub}
            backLabel="В меню"
            title="ШПИОН"
            icon="🕵️‍♂️"
            badge="Pass & Play"
          />

          {/* Основной контент: просторный, с большими отступами между карточками (space-y-8 sm:space-y-9) */}
          <main className="max-w-lg w-full mx-auto px-5 sm:px-6 py-6 space-y-8 sm:space-y-9 pb-48 overflow-y-auto">
            {/* Описание игры */}
            <div className="text-center pt-1 pb-2">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                Находка для шпиона
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed font-medium">
                Игра на одном телефоне. Задавайте наводящие вопросы, блефуйте и вычислите предателя!
              </p>
            </div>

            {/* Карточка 0: Готовые сценарии партий (Пресеты, как в Мафии) */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-black text-white">Готовые сценарии партий</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {SPY_PRESETS.map(preset => {
                  const active = isPresetActive(preset);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`p-5 rounded-2xl text-left border transition-all active:scale-98 touch-manipulation ${
                        active
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/40'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div className="font-extrabold text-base text-white flex items-center justify-between mb-1.5">
                        <span>{preset.title}</span>
                        {active && <span className="text-amber-400 text-xs font-black px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">Активен</span>}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">{preset.desc}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Карточка 1: Количество участников */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-lg font-black text-white">
                  <Users className="w-6 h-6 text-sky-400" />
                  <span>Игроки за столом</span>
                </div>
                <span className="px-4 py-1.5 bg-amber-500/15 text-amber-300 font-black text-base rounded-2xl border border-amber-500/30">
                  {playerCount} чел.
                </span>
              </div>

              {/* Большой удобный счетчик с кнопками +/- (56px+) */}
              <div className="flex items-center justify-between gap-5 py-3">
                <button
                  type="button"
                  onClick={() => setPlayerCount(p => Math.max(3, p - 1))}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-3xl font-black flex items-center justify-center text-white border border-slate-700 shadow-xl transition-all flex-shrink-0 touch-manipulation"
                  aria-label="Меньше игроков"
                >
                  <Minus className="w-8 h-8 stroke-[3]" />
                </button>

                <div className="flex flex-col items-center justify-center">
                  <span className="text-5xl sm:text-6xl font-black text-amber-400 font-mono tracking-tight">
                    {playerCount}
                  </span>
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                    участников
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setPlayerCount(p => Math.min(14, p + 1))}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-3xl font-black flex items-center justify-center text-white border border-slate-700 shadow-xl transition-all flex-shrink-0 touch-manipulation"
                  aria-label="Больше игроков"
                >
                  <Plus className="w-8 h-8 stroke-[3]" />
                </button>
              </div>

              {/* Быстрые кнопки пресетов (3 колонки х 2 строки для комфортных тач-таргетов) */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                {[
                  { num: 4, label: '4 игрока' },
                  { num: 5, label: '5 игроков' },
                  { num: 6, label: '6 игроков' },
                  { num: 8, label: '8 игроков' },
                  { num: 10, label: '10 игроков' },
                  { num: 12, label: '12 игроков' }
                ].map(item => (
                  <button
                    key={item.num}
                    type="button"
                    onClick={() => setPlayerCount(item.num)}
                    className={`min-h-[50px] py-3 px-2 rounded-2xl text-sm font-black transition-all border active:scale-95 touch-manipulation flex items-center justify-center ${
                      playerCount === item.num
                        ? 'bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-950/50'
                        : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Карточка 2: Формат и время */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-widest mb-3">
                  Шпионов в партии
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setSpyCount(1)}
                    className={`p-5 rounded-2xl text-left border transition-all active:scale-98 touch-manipulation ${
                      spyCount === 1
                        ? 'bg-rose-500/20 border-rose-500 text-white shadow-xl shadow-rose-950/40 ring-1 ring-rose-500/30'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-black text-base flex items-center justify-between">
                      <span>🕵️ 1 Шпион</span>
                      {spyCount === 1 && <Check className="w-5 h-5 text-rose-400" />}
                    </div>
                    <div className="text-xs text-slate-400 mt-1.5 font-medium">Канон для 3–7 игроков</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpyCount(2)}
                    disabled={playerCount < 5}
                    className={`p-5 rounded-2xl text-left border transition-all active:scale-98 touch-manipulation ${
                      spyCount === 2
                        ? 'bg-rose-500/20 border-rose-500 text-white shadow-xl shadow-rose-950/40 ring-1 ring-rose-500/30'
                        : playerCount < 5
                        ? 'opacity-35 cursor-not-allowed bg-slate-950/30 border-slate-850 text-slate-600'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-black text-base flex items-center justify-between">
                      <span>🕵️🕵️ 2 Шпиона</span>
                      {spyCount === 2 && <Check className="w-5 h-5 text-rose-400" />}
                    </div>
                    <div className="text-xs text-slate-400 mt-1.5 font-medium">Для 5–14 игроков</div>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <label className="block text-xs font-black text-slate-300 uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Время раунда на вопросы
                  </span>
                  <span className="text-amber-400 font-black text-sm">{roundMinutes} мин</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { val: 3, label: '3 мин', desc: 'Блиц' },
                    { val: 5, label: '5 мин', desc: 'Стандарт' },
                    { val: 7, label: '7 мин', desc: 'Дольше' },
                    { val: 8, label: '8 мин', desc: 'Канон' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setRoundMinutes(item.val)}
                      className={`min-h-[58px] py-3.5 px-3 rounded-2xl text-center border transition-all active:scale-95 touch-manipulation ${
                        roundMinutes === item.val
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg ring-1 ring-amber-500/40'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-base font-black">{item.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-medium">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Карточка 3: Опции и механики */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
              <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">
                Дополнительные правила
              </h2>

              <label className="flex items-center justify-between p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-slate-800 active:bg-slate-900 cursor-pointer transition-all touch-manipulation gap-4">
                <div className="pr-2">
                  <div className="font-extrabold text-base text-slate-100">
                    🎭 Роли и профессии внутри локации
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed font-medium">
                    Каждый мирный житель получает должность (врач, турист, капитан, охранник...)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableRoles}
                  onChange={(e) => setEnableRoles(e.target.checked)}
                  className="w-6 h-6 accent-amber-500 rounded-lg cursor-pointer flex-shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-slate-800 active:bg-slate-900 cursor-pointer transition-all touch-manipulation gap-4">
                <div className="pr-2">
                  <div className="font-extrabold text-base text-slate-100">
                    💡 Подсказка шпиону (фора)
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed font-medium">
                    Шпион видит общую тему (например «Транспорт» или «Отдых») для баланса
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={spyCategoryHint}
                  onChange={(e) => setSpyCategoryHint(e.target.checked)}
                  className="w-6 h-6 accent-amber-500 rounded-lg cursor-pointer flex-shrink-0"
                />
              </label>
            </section>

            {/* Карточка 4: Наборы локаций */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-lg font-black text-white">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <span>Наборы локаций</span>
                </div>
                <span className="text-xs text-emerald-400 font-extrabold bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/20">
                  {availableLocationsForCheatsheet.length} локаций
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {Object.values(SPY_CATEGORIES).map(cat => {
                  const isChecked = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-5 rounded-2xl text-left border transition-all flex items-center justify-between gap-3 touch-manipulation active:scale-[0.98] ${
                        isChecked
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-sm font-extrabold leading-tight">{cat.name}</span>
                      {isChecked && <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Карточка 5: Краткие советы ведущему и игрокам */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-3.5">
              <div className="flex items-center gap-2.5 text-base font-black text-amber-400">
                <Lightbulb className="w-5 h-5" />
                <span>Как играть и побеждать:</span>
              </div>
              <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                <div>• <strong>Мирным:</strong> не задавайте слишком прямые вопросы («Ты капитан корабля?»), иначе шпион сразу поймет локацию. Задавайте вопросы с двойным дном!</div>
                <div>• <strong>Шпиону:</strong> слушайте внимательно, не спешите с ответом, цепляйтесь за общие слова и старайтесь отвести подозрения на соседа.</div>
              </div>
            </section>
          </main>

          {/* Фиксированная нативная кнопка запуска снизу с защитой от вырезов */}
          <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-lg mx-auto shadow-2xl">
            <button
              type="button"
              onClick={startNewGame}
              className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-2xl shadow-rose-950/60 active:scale-98 transition-all touch-manipulation"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Начать раздачу ролей 🎲</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 2: ПЕРЕДАЧА ТЕЛЕФОНА (PASS)                                      */}
      {/* ==================================================================== */}
      {phase === 'PASS' && currentCard && (
        <div className="flex-1 flex flex-col justify-between max-w-lg w-full mx-auto">
          <GameHeader
            onBack={() => setPhase('SETUP')}
            backLabel="Настройки"
            title="РАЗДАЧА РОЛЕЙ"
            icon="📱"
            badge={`${currentPassIndex + 1} из ${playerCount}`}
          />

          <div className="my-auto text-center space-y-6 px-6 py-8">
            <div className="w-32 h-32 mx-auto rounded-3xl bg-slate-900 border border-slate-700 flex items-center justify-center text-6xl shadow-2xl shadow-sky-950/50 animate-bounce">
              📱
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
                Передайте телефон игроку:
              </h2>
              <div className="text-4xl sm:text-5xl font-black text-sky-400 drop-shadow-lg">
                {currentCard.name}
              </div>
            </div>

            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl text-sm sm:text-base text-slate-300 max-w-sm mx-auto shadow-xl leading-relaxed font-medium">
              Убедитесь, что никто за столом не видит экран, затем нажмите кнопку ниже.
            </div>
          </div>

          <div className="p-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))]">
            <button
              type="button"
              onClick={handleShowRole}
              className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-2xl shadow-sky-950/50 active:scale-95 transition-all touch-manipulation"
            >
              <Eye className="w-6 h-6" />
              <span>Я держу телефон, показать роль!</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 3: СЕКРЕТНЫЙ ПРОСМОТР РОЛИ (REVEAL)                              */}
      {/* ==================================================================== */}
      {phase === 'REVEAL' && currentCard && (
        <div className="flex-1 flex flex-col justify-between max-w-lg w-full mx-auto">
          <GameHeader
            onBack={() => setPhase('SETUP')}
            backLabel="Сброс"
            title="КАРТОЧКА"
            icon="👁️"
            badge={currentCard.name}
          />

          <div className="my-auto py-6 px-5 sm:px-6">
            {currentCard.isSpy ? (
              <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 border-2 border-rose-600 rounded-3xl p-7 text-center shadow-2xl shadow-rose-950/60 space-y-5 animate-fadeIn">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-rose-600/20 border border-rose-500 flex items-center justify-center text-6xl shadow-inner">
                  🕵️‍♂️
                </div>

                <div className="text-xs font-black uppercase tracking-widest text-rose-400">
                  Ваша секретная роль
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                  ВЫ ШПИОН!
                </h2>

                <p className="text-sm sm:text-base text-rose-200 leading-relaxed px-2 font-medium">
                  Вы <strong>НЕ знаете</strong>, в какой локации находятся остальные жители за столом!
                </p>

                {spyCategoryHint && (
                  <div className="p-4 bg-rose-900/30 border border-rose-700/40 rounded-2xl text-xs sm:text-sm text-rose-300 font-semibold">
                    💡 Подсказка: локация относится к категории <strong>«{currentLocation?.category}»</strong>
                  </div>
                )}

                <div className="p-5 bg-slate-950/70 border border-rose-900/40 rounded-2xl text-xs sm:text-sm text-slate-300 text-left space-y-2">
                  <div className="font-extrabold text-amber-300 text-sm">🎯 Ваша цель:</div>
                  <div>• Внимательно слушайте чужие вопросы и ответы.</div>
                  <div>• Отвечайте уклончиво, чтобы не выдать себя.</div>
                  <div>• Постарайтесь понять локацию или продержаться до конца времени!</div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-sky-950 via-slate-900 to-slate-900 border-2 border-sky-500 rounded-3xl p-7 text-center shadow-2xl shadow-sky-950/60 space-y-5 animate-fadeIn">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-6xl shadow-inner">
                  {currentLocation?.emoji || '📍'}
                </div>

                <div className="text-xs font-black uppercase tracking-widest text-sky-400">
                  Секретная локация
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                  {currentLocation?.name}
                </h2>

                {enableRoles && currentCard.role && (
                  <div className="py-3.5 px-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl">
                    <div className="text-xs text-sky-300 uppercase tracking-wider font-extrabold">
                      Ваша профессия / роль:
                    </div>
                    <div className="text-xl font-black text-white mt-1">
                      {currentCard.role}
                    </div>
                  </div>
                )}

                <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-300 text-left space-y-2">
                  <div className="font-extrabold text-sky-300 text-sm">🎯 Ваша цель:</div>
                  <div>• Задавайте хитрые вопросы другим игрокам по этой локации.</div>
                  <div>• Отвечайте так, чтобы свои поняли, а шпион не догадался.</div>
                  <div>• Вычислите того, кто плавает в ответах!</div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))]">
            <button
              type="button"
              onClick={handleHideAndNext}
              className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-2xl shadow-emerald-950/50 active:scale-95 transition-all touch-manipulation"
            >
              <EyeOff className="w-6 h-6" />
              <span>
                {currentPassIndex < playerCount - 1
                  ? 'Запомнил(а), передать следующему'
                  : 'Запомнил(а), начать раунд!'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 4: РАУНД ИГРЫ (ОБСУЖДЕНИЕ И ТАЙМЕР)                              */}
      {/* ==================================================================== */}
      {phase === 'PLAYING' && (
        <div className="flex-1 flex flex-col justify-between max-w-lg w-full mx-auto">
          <GameHeader
            onBack={onBackToHub}
            backLabel="В меню"
            title="РАУНД ИГРЫ"
            icon="⏱️"
            badge={`${playerCount} чел`}
          />

          <div className="p-5 sm:p-6 space-y-5 my-auto">
            {/* Большой таймер */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 text-center shadow-2xl space-y-5">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Осталось времени на вопросы
              </div>

              <div
                className={`text-6xl sm:text-7xl font-black font-mono tracking-tight transition-colors ${
                  timerSeconds <= 30
                    ? 'text-rose-500 animate-pulse'
                    : timerSeconds <= 60
                    ? 'text-amber-400'
                    : 'text-white'
                }`}
              >
                {Math.floor(timerSeconds / 60)}:
                {timerSeconds % 60 < 10 ? '0' : ''}
                {timerSeconds % 60}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`min-h-[54px] py-3.5 px-8 rounded-2xl text-base font-black uppercase tracking-wider transition-all shadow-lg touch-manipulation active:scale-95 ${
                    isTimerRunning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-emerald-600 text-white shadow-emerald-950/50 hover:bg-emerald-500'
                  }`}
                >
                  {isTimerRunning ? 'Пауза ⏸' : 'Старт ▶'}
                </button>

                <button
                  type="button"
                  onClick={() => setTimerSeconds(prev => prev + 60)}
                  className="min-h-[54px] py-3.5 px-6 rounded-2xl text-base font-extrabold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all touch-manipulation"
                >
                  +1 мин
                </button>
              </div>
            </div>

            {/* Памятка по правилам диалога */}
            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl text-xs sm:text-sm text-slate-300 space-y-2 shadow">
              <div className="font-black text-amber-400 text-sm">💡 Правила диалога:</div>
              <div>1. Игрок А задает вопрос любому игроку Б: <em>«Какая тут погода?»</em></div>
              <div>2. Игрок Б отвечает и передает вопрос любому третьему (кроме игрока А).</div>
            </div>

            {/* Кнопка шпаргалки со всеми локациями */}
            <button
              type="button"
              onClick={() => setShowLocationsCheatSheet(true)}
              className="w-full min-h-[54px] py-4 px-5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sky-400 shadow-md transition-all active:scale-98 touch-manipulation"
            >
              <BookOpen className="w-5 h-5" />
              <span>Шпаргалка всех локаций ({availableLocationsForCheatsheet.length})</span>
            </button>
          </div>

          {/* Кнопки завершения раунда */}
          <div className="p-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => {
                setIsTimerRunning(false);
                setPhase('SPY_GUESS');
              }}
              className="min-h-[56px] py-4 px-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-rose-950/90 hover:bg-rose-900 border border-rose-800 text-rose-200 active:scale-95 transition-all shadow-xl shadow-rose-950/40 touch-manipulation"
            >
              <span>🕵️ Шпион сдается</span>
            </button>

            <button
              type="button"
              onClick={handleTimeOutOrManualEnd}
              className="min-h-[56px] py-4 px-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-800 text-indigo-200 active:scale-95 transition-all shadow-xl shadow-indigo-950/40 touch-manipulation"
            >
              <span>⚖️ Обвинение / Суд</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 5: ОБВИНЕНИЕ ИЛИ ВЫБОР ШПИОНА                                    */}
      {/* ==================================================================== */}
      {phase === 'VOTING' && (
        <div className="flex-1 flex flex-col justify-between max-w-lg w-full mx-auto">
          <GameHeader
            onBack={() => setPhase('PLAYING')}
            backLabel="К таймеру"
            title="СУД ГОРОДА"
            icon="⚖️"
          />

          <div className="my-auto space-y-6 text-center p-5 sm:p-6">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-indigo-600/20 border border-indigo-500 flex items-center justify-center text-5xl shadow-xl">
              ⚖️
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Кто, по мнению города, шпион?
            </h2>

            <p className="text-sm sm:text-base text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
              Обсудите за столом и проголосуйте за подозреваемого. Затем зафиксируйте итог:
            </p>

            <div className="space-y-3.5 pt-2">
              <button
                type="button"
                onClick={() => handleCiviliansWin('Город единогласно нашел шпиона!')}
                className="w-full min-h-[58px] py-4 px-5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/50 active:scale-95 transition-all touch-manipulation"
              >
                <span>🎉 Город поймал шпиона! (Победа Мирных)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSpiesWin('Город ошибся и обвинил невиновного жителя!')}
                className="w-full min-h-[58px] py-4 px-5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-950/50 active:scale-95 transition-all touch-manipulation"
              >
                <span>🕵️ Шпион обманул город! (Победа Шпиона)</span>
              </button>

              <button
                type="button"
                onClick={() => setPhase('SPY_GUESS')}
                className="w-full min-h-[54px] py-4 px-5 rounded-2xl font-black text-sm text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 transition-all touch-manipulation"
              >
                Шпион хочет назвать локацию перед арестом!
              </button>
            </div>
          </div>

          <div className="p-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))]">
            <button
              type="button"
              onClick={() => setPhase('PLAYING')}
              className="w-full min-h-[48px] py-3 text-sm font-bold text-slate-400 hover:text-white"
            >
              ← Отмена, вернуться к таймеру
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 6: ШПИОН УГАДЫВАЕТ ЛОКАЦИЮ                                       */}
      {/* ==================================================================== */}
      {phase === 'SPY_GUESS' && (
        <div className="flex-1 flex flex-col justify-between max-w-lg w-full mx-auto">
          <GameHeader
            onBack={() => setPhase('PLAYING')}
            backLabel="Назад"
            title="ДОГАДКА ШПИОНА"
            icon="🎯"
          />

          <div className="p-5 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Шпион называет локацию!
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Если шпион угадает точную локацию, он мгновенно побеждает:
            </p>
          </div>

          <div className="flex-1 max-h-[60vh] overflow-y-auto space-y-3 p-5 mx-5 bg-slate-900 border border-slate-800 rounded-3xl">
            {availableLocationsForCheatsheet.map(loc => (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSpyGuessAttempt(loc)}
                className="w-full min-h-[56px] py-4 px-4 rounded-2xl text-left font-bold bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-600/60 flex items-center gap-3.5 text-slate-200 transition-all active:scale-98 touch-manipulation"
              >
                <span className="text-2xl">{loc.emoji}</span>
                <span className="text-base font-extrabold">{loc.name}</span>
              </button>
            ))}
          </div>

          <div className="p-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))]">
            <button
              type="button"
              onClick={() => setPhase('PLAYING')}
              className="w-full min-h-[48px] py-3 text-sm font-bold text-slate-400 hover:text-white"
            >
              ← Отмена, вернуться к таймеру
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 7: РЕЗУЛЬТАТЫ И РАСКРЫТИЕ (RESULTS)                              */}
      {/* ==================================================================== */}
      {phase === 'RESULTS' && gameResult && (
        <div className="flex-1 flex flex-col justify-between max-w-lg w-full mx-auto">
          <GameHeader
            onBack={() => setPhase('SETUP')}
            backLabel="В лобби"
            title="ИТОГИ"
            icon="🏆"
          />

          <div className="space-y-5 text-center my-auto p-5 sm:p-6 overflow-y-auto">
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                Раунд завершен
              </div>
              <h1
                className={`text-3xl sm:text-4xl font-black uppercase drop-shadow-lg leading-tight ${
                  gameResult.winner === 'civilians' ? 'text-emerald-400' : 'text-rose-500'
                }`}
              >
                {gameResult.winner === 'civilians' ? 'ПОБЕДА МИРНЫХ ЖИТЕЛЕЙ!' : 'ПОБЕДА ШПИОНА!'}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 px-2 font-medium">{gameResult.reason}</p>
            </div>

            {/* Раскрытие локации */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-2">
              <div className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                Секретная локация была:
              </div>
              <div className="text-3xl font-black text-amber-400 flex items-center justify-center gap-2.5 pt-1">
                <span>{currentLocation?.emoji}</span>
                <span>{currentLocation?.name}</span>
              </div>
            </div>

            {/* Список ролей */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 text-left space-y-2.5 max-h-60 overflow-y-auto">
              <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                Кто кем был:
              </div>
              {gameAssignments.map(a => (
                <div
                  key={a.playerIndex}
                  className={`flex items-center justify-between text-sm py-2.5 px-3.5 rounded-xl ${
                    a.isSpy ? 'bg-rose-950/60 text-rose-300 font-black border border-rose-900/40' : 'text-slate-300 font-medium'
                  }`}
                >
                  <span className="font-bold">{a.name}</span>
                  <span>
                    {a.isSpy ? '🕵️‍♂️ Шпион' : a.role ? `${a.role}` : 'Мирный житель'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Кнопки перезапуска */}
          <div className="p-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] space-y-3">
            <button
              type="button"
              onClick={startNewGame}
              className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-2xl shadow-rose-950/50 active:scale-95 transition-all touch-manipulation"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Сыграть еще раз (Новая локация)</span>
            </button>

            <button
              type="button"
              onClick={() => setPhase('SETUP')}
              className="w-full min-h-[48px] py-3 text-sm font-bold text-slate-400 hover:text-white"
            >
              Изменить настройки и число игроков
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* МОДАЛКА ШПАРГАЛКИ ВСЕХ ЛОКАЦИЙ                                        */}
      {/* ==================================================================== */}
      {showLocationsCheatSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md max-h-[85vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-white text-base">Список возможных локаций</h3>
                <p className="text-xs text-slate-400">Шпион и мирные могут сверяться во время игры</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationsCheatSheet(false)}
                className="w-10 h-10 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Поиск */}
            <div className="p-4 border-b border-slate-800">
              <input
                type="text"
                placeholder="Быстрый поиск локации..."
                value={cheatFilter}
                onChange={(e) => setCheatFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Список локаций */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredLocations.map(loc => (
                <div
                  key={loc.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3 text-sm"
                >
                  <span className="text-2xl">{loc.emoji}</span>
                  <div>
                    <div className="font-extrabold text-slate-200 text-sm">{loc.name}</div>
                    {enableRoles && (
                      <div className="text-xs text-slate-400 truncate max-w-[260px] mt-0.5">
                        {loc.roles.slice(0, 4).join(', ')}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
