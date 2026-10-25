// src/components/spy/SpyGame.jsx - Полноценная игра «Шпион» (Spyfall) для одного телефона
import React, { useState, useEffect } from 'react';
import { SPY_LOCATIONS, SPY_CATEGORIES, getRandomLocation } from '../../data/spyLocations';
import { sounds } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
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
  ArrowLeft
} from 'lucide-react';

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
      setPhase('PLAYING');
      setIsTimerRunning(true);
      sounds.playSuccess();
    }
  };

  // --------------------------------------------------------------------------
  // ЗАВЕРШЕНИЕ РАУНДА И РАСКРЫТИЕ ИТОГОВ
  // --------------------------------------------------------------------------
  const handleTimeOutOrManualEnd = () => {
    setIsTimerRunning(false);
    sounds.playTap();
    setPhase('VOTING');
  };

  const handleCiviliansWin = (reason = 'Мирные вычислили всех шпионов!') => {
    setIsTimerRunning(false);
    setGameResult({
      winner: 'civilians',
      reason
    });
    setPhase('RESULTS');
    confetti({ particleCount: 90, spread: 60 });
    sounds.playSuccess();
  };

  const handleSpiesWin = (reason = 'Шпион остался неразоблаченным!') => {
    setIsTimerRunning(false);
    setGameResult({
      winner: 'spies',
      reason
    });
    setPhase('RESULTS');
    sounds.playExplosion();
  };

  const handleSpyGuessAttempt = (guessedLoc) => {
    setIsTimerRunning(false);
    sounds.playTap();

    if (guessedLoc.id === currentLocation.id) {
      handleSpiesWin(`Шпион раскрылся и точно назвал локацию: «${currentLocation.name.toUpperCase()}»!`);
    } else {
      handleCiviliansWin(`Шпион назвал «${guessedLoc.name}», но правильная локация была «${currentLocation.name}»!`);
    }
  };

  // --------------------------------------------------------------------------
  // ВСПОМОГАТЕЛЬНЫЕ ДАННЫЕ
  // --------------------------------------------------------------------------
  const currentCard = gameAssignments[currentPassIndex];

  const availableLocationsForCheatsheet = SPY_LOCATIONS.filter(l =>
    selectedCategories.includes(l.category)
  );

  const filteredLocations = availableLocationsForCheatsheet.filter(l =>
    l.name.toLowerCase().includes(cheatFilter.toLowerCase())
  );

  const toggleCategory = (catId) => {
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  // ==========================================================================
  // РЕНДЕР
  // ==========================================================================
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col select-none relative z-10">
      {/* ==================================================================== */}
      {/* ФАЗА 1: НАСТРОЙКИ (SETUP) - ПРОСТОРНЫЙ МОБИЛЬНЫЙ ФОРМАТ             */}
      {/* ==================================================================== */}
      {phase === 'SETUP' && (
        <div className="flex-1 flex flex-col">
          {/* Верхняя навигационная панель */}
          <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
            <button
              onClick={onBackToHub}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/20 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>В меню хаба</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🕵️‍♂️</span>
              <span className="text-sm font-black tracking-wide uppercase text-white">ШПИОН</span>
            </div>
          </header>

          {/* Основной скроллируемый контент */}
          <main className="max-w-md w-full mx-auto px-4 py-5 space-y-4 pb-32">
            {/* Описание игры */}
            <div className="text-center pb-1">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                Находка для шпиона
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Игра на одном телефоне. Задавайте вопросы, блефуйте и вычислите предателя!
              </p>
            </div>

            {/* Карточка 1: Количество участников */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Игроки за столом</span>
                </div>
                <span className="px-3 py-1 bg-amber-500/15 text-amber-300 font-black text-sm rounded-xl border border-amber-500/30">
                  {playerCount} чел.
                </span>
              </div>

              {/* Большой удобный счетчик с кнопками +/- */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPlayerCount(p => Math.max(3, p - 1))}
                  className="w-13 h-12 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-xl font-bold flex items-center justify-center text-white border border-slate-700 shadow transition-all flex-shrink-0"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="flex-1 flex flex-col justify-center">
                  <input
                    type="range"
                    min="3"
                    max="14"
                    value={playerCount}
                    onChange={(e) => setPlayerCount(Number(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1 px-1">
                    <span>3 чел</span>
                    <span>8 чел</span>
                    <span>14 чел</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPlayerCount(p => Math.min(14, p + 1))}
                  className="w-13 h-12 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-xl font-bold flex items-center justify-center text-white border border-slate-700 shadow transition-all flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Быстрые кнопки пресетов */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                {[4, 5, 6, 8, 10, 12].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPlayerCount(num)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border active:scale-95 ${
                      playerCount === num
                        ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-950/40'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </section>

            {/* Карточка 2: Формат и время */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Шпионов в партии
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSpyCount(1)}
                    className={`py-3 px-3 rounded-xl text-left border transition-all ${
                      spyCount === 1
                        ? 'bg-rose-500/20 border-rose-500 text-white shadow-lg shadow-rose-950/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-extrabold text-sm flex items-center justify-between">
                      <span>🕵️ 1 Шпион</span>
                      {spyCount === 1 && <Check className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Канон для 3–7 игроков</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpyCount(2)}
                    disabled={playerCount < 5}
                    className={`py-3 px-3 rounded-xl text-left border transition-all ${
                      spyCount === 2
                        ? 'bg-rose-500/20 border-rose-500 text-white shadow-lg shadow-rose-950/30'
                        : playerCount < 5
                        ? 'opacity-30 cursor-not-allowed bg-slate-950/30 border-slate-850 text-slate-600'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-extrabold text-sm flex items-center justify-between">
                      <span>🕵️🕵️ 2 Шпиона</span>
                      {spyCount === 2 && <Check className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Для 5–14 игроков</div>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Время раунда на вопросы
                  </span>
                  <span className="text-amber-400 font-bold">{roundMinutes} мин</span>
                </label>

                <div className="grid grid-cols-4 gap-2">
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
                      className={`py-2.5 px-2 rounded-xl text-center border transition-all ${
                        roundMinutes === item.val
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-black">{item.label}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Карточка 3: Опции и механики */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Дополнительные правила
              </h2>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 active:bg-slate-900 cursor-pointer transition-all">
                <div className="pr-3">
                  <div className="font-extrabold text-sm text-slate-200">
                    🎭 Роли и профессии внутри локации
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Каждый мирный получает должность (врач, турист, охранник...)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableRoles}
                  onChange={(e) => setEnableRoles(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer flex-shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 active:bg-slate-900 cursor-pointer transition-all">
                <div className="pr-3">
                  <div className="font-extrabold text-sm text-slate-200">
                    💡 Подсказка шпиону (фора)
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Шпион видит общую тему (например «Транспорт» или «Отдых»)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={spyCategoryHint}
                  onChange={(e) => setSpyCategoryHint(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer flex-shrink-0"
                />
              </label>
            </section>

            {/* Карточка 4: Наборы локаций */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Наборы локаций</span>
                </div>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {availableLocationsForCheatsheet.length} локаций
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.values(SPY_CATEGORIES).map(cat => {
                  const isChecked = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`py-3 px-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow'
                          : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-bold truncate pr-1">{cat.name}</span>
                      {isChecked && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </section>
          </main>

          {/* Фиксированная нативная кнопка запуска снизу (как в Мафии) */}
          <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 z-40 max-w-md mx-auto">
            <button
              onClick={startNewGame}
              className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-xl shadow-rose-950/50 active:scale-98 transition-all"
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
        <div className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto p-4 sm:p-6">
          {/* Верхняя плашка прогресса */}
          <div className="flex items-center justify-between text-xs font-bold pt-2">
            <span className="text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              Игрок {currentPassIndex + 1} из {playerCount}
            </span>
            <button
              onClick={() => setPhase('SETUP')}
              className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
            >
              Сброс
            </button>
          </div>

          {/* Центральный блок передачи */}
          <div className="my-auto text-center space-y-6 py-8">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-slate-900 border border-slate-700 flex items-center justify-center text-5xl shadow-2xl shadow-sky-950/50 animate-bounce">
              📱
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Передайте телефон:
              </h2>
              <div className="text-3xl sm:text-4xl font-black text-sky-400 drop-shadow-lg">
                {currentCard.name}
              </div>
            </div>

            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-slate-300 max-w-xs mx-auto shadow-lg leading-relaxed">
              Убедитесь, что никто за столом не подсматривает в экран, затем нажмите кнопку ниже.
            </div>
          </div>

          {/* Кнопка открытия роли */}
          <button
            onClick={handleShowRole}
            className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-xl shadow-sky-950/50 active:scale-95 transition-all mb-2"
          >
            <Eye className="w-5 h-5" />
            <span>Я держу телефон, показать роль!</span>
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 3: СЕКРЕТНЫЙ ПРОСМОТР РОЛИ (REVEAL)                              */}
      {/* ==================================================================== */}
      {phase === 'REVEAL' && currentCard && (
        <div className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto p-4 sm:p-6">
          <div className="text-center text-xs font-bold text-slate-400 pt-2">
            Карточка игрока: <span className="text-white font-extrabold">{currentCard.name}</span>
          </div>

          {/* Карточка роли */}
          <div className="my-auto py-4">
            {currentCard.isSpy ? (
              /* КАРТОЧКА ШПИОНА */
              <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 border-2 border-rose-600 rounded-3xl p-6 text-center shadow-2xl shadow-rose-950/60 space-y-4 animate-fadeIn">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-600/20 border border-rose-500 flex items-center justify-center text-5xl shadow-inner">
                  🕵️‍♂️
                </div>

                <div className="text-xs font-black uppercase tracking-widest text-rose-400">
                  Ваша секретная роль
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                  ВЫ ШПИОН!
                </h2>

                <p className="text-xs text-rose-200 leading-relaxed px-2">
                  Вы <strong>НЕ знаете</strong>, в какой локации находятся остальные жители за столом!
                </p>

                {spyCategoryHint && (
                  <div className="p-3 bg-rose-900/30 border border-rose-700/40 rounded-xl text-xs text-rose-300">
                    💡 Подсказка: локация относится к категории <strong>«{currentLocation?.category}»</strong>
                  </div>
                )}

                <div className="p-3.5 bg-slate-950/70 border border-rose-900/40 rounded-xl text-xs text-slate-300 text-left space-y-1.5">
                  <div className="font-bold text-amber-300">🎯 Ваша цель:</div>
                  <div>• Внимательно слушайте чужие вопросы и ответы.</div>
                  <div>• Отвечайте уклончиво, чтобы не выдать себя.</div>
                  <div>• Постарайтесь понять локацию или продержаться до конца времени!</div>
                </div>
              </div>
            ) : (
              /* КАРТОЧКА МИРНОГО */
              <div className="bg-gradient-to-br from-sky-950 via-slate-900 to-slate-900 border-2 border-sky-500 rounded-3xl p-6 text-center shadow-2xl shadow-sky-950/60 space-y-4 animate-fadeIn">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-5xl shadow-inner">
                  {currentLocation?.emoji || '📍'}
                </div>

                <div className="text-xs font-black uppercase tracking-widest text-sky-400">
                  Секретная локация
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                  {currentLocation?.name}
                </h2>

                {enableRoles && currentCard.role && (
                  <div className="py-2.5 px-3 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                    <div className="text-[10px] text-sky-300 uppercase tracking-wider font-semibold">
                      Ваша профессия / роль:
                    </div>
                    <div className="text-lg font-black text-white mt-0.5">
                      {currentCard.role}
                    </div>
                  </div>
                )}

                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 text-left space-y-1.5">
                  <div className="font-bold text-sky-300">🎯 Ваша цель:</div>
                  <div>• Задавайте хитрые вопросы другим игрокам по этой локации.</div>
                  <div>• Отвечайте так, чтобы свои поняли, а шпион не догадался.</div>
                  <div>• Вычислите того, кто плавает в ответах!</div>
                </div>
              </div>
            )}
          </div>

          {/* Кнопка скрыть и передать дальше */}
          <button
            onClick={handleHideAndNext}
            className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-xl shadow-emerald-950/50 active:scale-95 transition-all mb-2"
          >
            <EyeOff className="w-5 h-5" />
            <span>
              {currentPassIndex < playerCount - 1
                ? 'Запомнил(а), передать следующему'
                : 'Запомнил(а), начать раунд!'}
            </span>
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 4: РАУНД ИГРЫ (ОБСУЖДЕНИЕ И ТАЙМЕР)                              */}
      {/* ==================================================================== */}
      {phase === 'PLAYING' && (
        <div className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto p-4 sm:p-5 space-y-4">
          <header className="flex items-center justify-between pt-1">
            <button
              onClick={onBackToHub}
              className="text-xs text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
            >
              ← В меню хаба
            </button>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Игроков: {playerCount} • Шпионов: {spyCount}
            </span>
          </header>

          {/* Большой таймер */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-4 my-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
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
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`py-3 px-6 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow ${
                  isTimerRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-emerald-600 text-white shadow-emerald-950/50 hover:bg-emerald-500'
                }`}
              >
                {isTimerRunning ? 'Пауза ⏸' : 'Старт ▶'}
              </button>

              <button
                onClick={() => setTimerSeconds(prev => prev + 60)}
                className="py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all"
              >
                +1 мин
              </button>
            </div>
          </div>

          {/* Памятка по правилам вопроса */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-1 shadow">
            <div className="font-bold text-amber-400">💡 Правила диалога:</div>
            <div>1. Игрок А задает вопрос любому игроку Б: <em>«Какая тут погода?»</em></div>
            <div>2. Игрок Б отвечает и передает вопрос любому третьему (кроме игрока А).</div>
          </div>

          {/* Кнопка шпаргалки со всеми локациями */}
          <button
            onClick={() => setShowLocationsCheatSheet(true)}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sky-400 shadow transition-all active:scale-98"
          >
            <BookOpen className="w-4 h-4" />
            <span>Шпаргалка всех локаций ({availableLocationsForCheatsheet.length})</span>
          </button>

          {/* Кнопки завершения раунда */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setPhase('SPY_GUESS');
              }}
              className="py-3.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 active:scale-95 transition-all shadow-lg shadow-rose-950/40"
            >
              <span>🕵️ Шпион сдается</span>
            </button>

            <button
              onClick={handleTimeOutOrManualEnd}
              className="py-3.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-200 active:scale-95 transition-all shadow-lg shadow-indigo-950/40"
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
        <div className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto p-4 sm:p-6 space-y-4">
          <div className="my-auto space-y-4 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-600/20 border border-indigo-500 flex items-center justify-center text-4xl shadow-xl">
              ⚖️
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Кто, по мнению города, шпион?
            </h2>

            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Обсудите за столом и проголосуйте за подозреваемого. Затем зафиксируйте итог:
            </p>

            <div className="space-y-3 pt-3">
              <button
                onClick={() => handleCiviliansWin('Город единогласно нашел шпиона!')}
                className="w-full py-4 px-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/50 active:scale-95 transition-all"
              >
                <span>🎉 Город поймал шпиона! (Победа Мирных)</span>
              </button>

              <button
                onClick={() => handleSpiesWin('Город ошибся и обвинил невиновного жителя!')}
                className="w-full py-4 px-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-950/50 active:scale-95 transition-all"
              >
                <span>🕵️ Шпион обманул город! (Победа Шпиона)</span>
              </button>

              <button
                onClick={() => setPhase('SPY_GUESS')}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 transition-all"
              >
                Шпион хочет назвать локацию перед арестом!
              </button>
            </div>
          </div>

          <button
            onClick={() => setPhase('PLAYING')}
            className="w-full py-3 text-xs text-slate-400 hover:text-white"
          >
            ← Отмена, вернуться к таймеру
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 6: ШПИОН УГАДЫВАЕТ ЛОКАЦИЮ                                       */}
      {/* ==================================================================== */}
      {phase === 'SPY_GUESS' && (
        <div className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto p-4 sm:p-5 space-y-3">
          <div className="text-center pt-2">
            <h2 className="text-xl font-black text-white">
              Шпион называет локацию!
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Если шпион угадает точную локацию, он мгновенно побеждает:
            </p>
          </div>

          <div className="flex-1 max-h-[60vh] overflow-y-auto space-y-2 p-2 bg-slate-900 border border-slate-800 rounded-2xl">
            {availableLocationsForCheatsheet.map(loc => (
              <button
                key={loc.id}
                onClick={() => handleSpyGuessAttempt(loc)}
                className="w-full py-3 px-3.5 rounded-xl text-left text-xs font-bold bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-600/60 flex items-center gap-3 text-slate-200 transition-all active:scale-98"
              >
                <span className="text-xl">{loc.emoji}</span>
                <span className="text-sm">{loc.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setPhase('PLAYING')}
            className="w-full py-3 text-xs text-slate-400 hover:text-white"
          >
            ← Отмена, вернуться к таймеру
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 7: РЕЗУЛЬТАТЫ И РАСКРЫТИЕ (RESULTS)                              */}
      {/* ==================================================================== */}
      {phase === 'RESULTS' && gameResult && (
        <div className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto p-4 sm:p-6 space-y-4">
          <div className="space-y-4 text-center my-auto">
            <div className="space-y-1">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                Итоги раунда
              </div>
              <h1
                className={`text-3xl font-black uppercase drop-shadow-lg ${
                  gameResult.winner === 'civilians' ? 'text-emerald-400' : 'text-rose-500'
                }`}
              >
                {gameResult.winner === 'civilians' ? 'ПОБЕДА МИРНЫХ ЖИТЕЛЕЙ!' : 'ПОБЕДА ШПИОНА!'}
              </h1>
              <p className="text-xs text-slate-300 px-2">{gameResult.reason}</p>
            </div>

            {/* Раскрытие локации */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Секретная локация была:</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 flex items-center justify-center gap-2">
                <span>{currentLocation?.emoji}</span>
                <span>{currentLocation?.name}</span>
              </div>
            </div>

            {/* Список ролей */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 text-left space-y-2 max-h-52 overflow-y-auto">
              <div className="text-xs font-bold text-slate-400 pb-1 border-b border-slate-800">
                Кто кем был:
              </div>
              {gameAssignments.map(a => (
                <div
                  key={a.playerIndex}
                  className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg ${
                    a.isSpy ? 'bg-rose-950/60 text-rose-300 font-bold border border-rose-900/40' : 'text-slate-300'
                  }`}
                >
                  <span className="font-semibold">{a.name}</span>
                  <span>
                    {a.isSpy ? '🕵️‍♂️ Шпион' : a.role ? `${a.role}` : 'Мирный житель'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Кнопки перезапуска */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={startNewGame}
              className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-xl shadow-rose-950/50 active:scale-95 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Сыграть еще раз (Новая локация)</span>
            </button>

            <button
              onClick={() => setPhase('SETUP')}
              className="w-full py-3 text-xs text-slate-400 hover:text-white"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm max-h-[85vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Список возможных локаций</h3>
                <p className="text-[10px] text-slate-400">Шпион и мирные могут сверяться во время игры</p>
              </div>
              <button
                onClick={() => setShowLocationsCheatSheet(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Поиск */}
            <div className="p-3 border-b border-slate-800">
              <input
                type="text"
                placeholder="Быстрый поиск локации..."
                value={cheatFilter}
                onChange={(e) => setCheatFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Список локаций */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredLocations.map(loc => (
                <div
                  key={loc.id}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3 text-xs"
                >
                  <span className="text-2xl">{loc.emoji}</span>
                  <div>
                    <div className="font-bold text-slate-200 text-sm">{loc.name}</div>
                    {enableRoles && (
                      <div className="text-[10px] text-slate-500 truncate max-w-[240px] mt-0.5">
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
