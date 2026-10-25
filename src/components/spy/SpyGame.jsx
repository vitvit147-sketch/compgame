// src/components/spy/SpyGame.jsx - Полноценная игра «Шпион» (Spyfall) для одного телефона
import React, { useState, useEffect, useRef } from 'react';
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
  HelpCircle,
  Check,
  AlertTriangle,
  ChevronRight,
  Shield,
  Search,
  BookOpen,
  Volume2,
  VolumeX,
  X,
  UserCheck
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
  const [gameResult, setGameResult] = useState(null); // { winner: 'spies'|'civilians', reason: string, guessedLocation: string }

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

    // 1. Выбираем случайную локацию из выбранных категорий
    const loc = getRandomLocation(selectedCategories);
    setCurrentLocation(loc);

    // 2. Выбираем, кто будет шпионом
    const indices = Array.from({ length: playerCount }, (_, i) => i);
    const shuffledIndices = [...indices].sort(() => Math.random() - 0.5);
    const spyIndices = shuffledIndices.slice(0, spyCount);

    // 3. Перемешиваем роли внутри локации
    const shuffledRoles = [...loc.roles].sort(() => Math.random() - 0.5);

    // 4. Формируем карточки для каждого игрока
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

    // Переходим к фазе передачи телефона первому игроку
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
      // Все игроки посмотрели свои роли — начинаем раунд обсуждения!
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
      // Шпион угадал локацию!
      handleSpiesWin(`Шпион раскрылся и точно назвал локацию: «${currentLocation.name.toUpperCase()}»!`);
    } else {
      // Шпион ошибся!
      handleCiviliansWin(`Шпион назвал «${guessedLoc.name}», но правильная локация была «${currentLocation.name}»!`);
    }
  };

  // --------------------------------------------------------------------------
  // ВСПОМОГАТЕЛЬНЫЕ ДАННЫЕ
  // --------------------------------------------------------------------------
  const currentCard = gameAssignments[currentPassIndex];
  const spiesList = gameAssignments.filter(a => a.isSpy);

  const availableLocationsForCheatsheet = SPY_LOCATIONS.filter(l =>
    selectedCategories.includes(l.category)
  );

  const filteredLocations = availableLocationsForCheatsheet.filter(l =>
    l.name.toLowerCase().includes(cheatFilter.toLowerCase())
  );

  const toggleCategory = (catId) => {
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev; // Минимум 1 категория
        return prev.filter(c => c !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto p-4 pb-6 select-none relative z-10">
      {/* ==================================================================== */}
      {/* ФАЗА 1: НАСТРОЙКИ (SETUP)                                            */}
      {/* ==================================================================== */}
      {phase === 'SETUP' && (
        <div className="space-y-4 my-auto">
          {/* Заголовок */}
          <div className="text-center pt-2">
            <button
              onClick={onBackToHub}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 transition-colors"
            >
              ← Назад в меню хаба
            </button>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl">🕵️‍♂️</span>
              <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                ШПИОН
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Находка для шпиона на одном телефоне. Задавайте вопросы, блефуйте и вычислите предателя!
            </p>
          </div>

          {/* Карточка настроек */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            {/* Количество игроков */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-400" />
                  Количество игроков:
                </span>
                <span className="text-base text-amber-400 font-black">{playerCount} чел.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPlayerCount(p => Math.max(3, p - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-90 text-lg font-bold flex items-center justify-center text-slate-300 border border-slate-800 transition-all shadow"
                >
                  −
                </button>
                <input
                  type="range"
                  min="3"
                  max="14"
                  value={playerCount}
                  onChange={(e) => setPlayerCount(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setPlayerCount(p => Math.min(14, p + 1))}
                  className="w-10 h-10 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-90 text-lg font-bold flex items-center justify-center text-slate-300 border border-slate-800 transition-all shadow"
                >
                  +
                </button>
              </div>
            </div>

            {/* Количество шпионов и время раунда */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Шпионов в игре
                </label>
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    onClick={() => setSpyCount(1)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      spyCount === 1 ? 'bg-rose-600 text-white shadow' : 'text-slate-400'
                    }`}
                  >
                    1 шпион
                  </button>
                  <button
                    onClick={() => setSpyCount(2)}
                    disabled={playerCount < 5}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      spyCount === 2
                        ? 'bg-rose-600 text-white shadow'
                        : playerCount < 5
                        ? 'opacity-30 cursor-not-allowed text-slate-600'
                        : 'text-slate-400'
                    }`}
                  >
                    2 шпиона
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Время раунда
                </label>
                <select
                  value={roundMinutes}
                  onChange={(e) => setRoundMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs font-bold text-white focus:outline-none"
                >
                  <option value="3">3 минуты (быстро)</option>
                  <option value="5">5 минут (стандарт)</option>
                  <option value="7">7 минут</option>
                  <option value="8">8 минут (канон)</option>
                </select>
              </div>
            </div>

            {/* Опции игры */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-200">Роли внутри локации</div>
                  <div className="text-[10px] text-slate-400">Каждый мирный получает профессию (врач, турист...)</div>
                </div>
                <input
                  type="checkbox"
                  checked={enableRoles}
                  onChange={(e) => setEnableRoles(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-200">Подсказка шпиону (фора)</div>
                  <div className="text-[10px] text-slate-400">Шпион видит общую категорию локации</div>
                </div>
                <input
                  type="checkbox"
                  checked={spyCategoryHint}
                  onChange={(e) => setSpyCategoryHint(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Выбор наборов локаций */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">Наборы локаций:</span>
                <span className="text-[10px] text-amber-400 font-semibold">
                  {availableLocationsForCheatsheet.length} локаций
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {Object.values(SPY_CATEGORIES).map(cat => {
                  const isChecked = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`py-2 px-2.5 rounded-xl text-left text-[11px] font-bold border transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-slate-950/50 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Кнопка старта */}
          <button
            onClick={startNewGame}
            className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-xl shadow-rose-950/40 active:scale-98 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Начать раздачу ролей</span>
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 2: ПЕРЕДАЧА ТЕЛЕФОНА (PASS)                                      */}
      {/* ==================================================================== */}
      {phase === 'PASS' && currentCard && (
        <div className="my-auto text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border border-slate-700 flex items-center justify-center text-4xl shadow-2xl animate-bounce">
            📱
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Игрок {currentPassIndex + 1} из {playerCount}
            </span>
            <h2 className="text-2xl font-black text-white">
              Передайте телефон:
            </h2>
            <div className="text-3xl font-extrabold text-sky-400 drop-shadow">
              {currentCard.name}
            </div>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-400 max-w-xs mx-auto">
            Убедитесь, что никто не подсматривает в экран, затем нажмите кнопку ниже.
          </div>

          <button
            onClick={handleShowRole}
            className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-xl shadow-sky-950/40 active:scale-95 transition-all"
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
        <div className="my-auto space-y-4">
          <div className="text-center text-xs font-bold text-slate-400">
            Карта игрока: <span className="text-white">{currentCard.name}</span>
          </div>

          {currentCard.isSpy ? (
            /* ================= КАРТОЧКА ШПИОНА ================= */
            <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 border-2 border-rose-600 rounded-3xl p-6 text-center shadow-2xl shadow-rose-950/50 space-y-3 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-600/20 border border-rose-500 flex items-center justify-center text-4xl shadow-inner">
                🕵️‍♂️
              </div>

              <div className="text-xs font-black uppercase tracking-widest text-rose-400">
                Ваша секретная роль
              </div>

              <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                ВЫ ШПИОН!
              </h2>

              <p className="text-xs text-rose-200 leading-relaxed">
                Вы <strong>НЕ знаете</strong>, в какой локации находятся остальные игроки.
              </p>

              {spyCategoryHint && (
                <div className="p-2.5 bg-rose-900/30 border border-rose-700/40 rounded-xl text-xs text-rose-300">
                  💡 Подсказка: локация относится к категории <strong>«{currentLocation?.category}»</strong>
                </div>
              )}

              <div className="p-3 bg-slate-950/70 border border-rose-900/40 rounded-xl text-[11px] text-slate-300 text-left space-y-1">
                <div className="font-bold text-amber-300">🎯 Ваша цель:</div>
                <div>• Внимательно слушайте чужие вопросы и ответы.</div>
                <div>• Давайте уклончивые ответы, чтобы не выдать себя.</div>
                <div>• Постарайтесь понять локацию или не дать поймать себя до конца таймера!</div>
              </div>
            </div>
          ) : (
            /* ================= КАРТОЧКА МИРНОГО ================= */
            <div className="bg-gradient-to-br from-sky-950 via-slate-900 to-slate-900 border-2 border-sky-500 rounded-3xl p-6 text-center shadow-2xl shadow-sky-950/50 space-y-3 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-4xl shadow-inner">
                {currentLocation?.emoji || '📍'}
              </div>

              <div className="text-xs font-black uppercase tracking-widest text-sky-400">
                Секретная локация
              </div>

              <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                {currentLocation?.name}
              </h2>

              {enableRoles && currentCard.role && (
                <div className="py-2 px-3 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                  <div className="text-[10px] text-sky-300 uppercase tracking-wider font-semibold">
                    Ваша профессия / статус:
                  </div>
                  <div className="text-lg font-black text-white mt-0.5">
                    {currentCard.role}
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-300 text-left space-y-1">
                <div className="font-bold text-sky-300">🎯 Ваша цель:</div>
                <div>• Задавайте хитрые вопросы другим игрокам по этой локации.</div>
                <div>• Отвечайте так, чтобы свои поняли, а шпион ничего не разгадал.</div>
                <div>• Вычислите того, кто плавает в ответах!</div>
              </div>
            </div>
          )}

          {/* Кнопка скрыть и передать дальше */}
          <button
            onClick={handleHideAndNext}
            className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-xl shadow-emerald-950/40 active:scale-95 transition-all"
          >
            <EyeOff className="w-5 h-5" />
            <span>
              {currentPassIndex < playerCount - 1
                ? 'Запомнил(а), передать следующему'
                : 'Запомнил(а), начать игру!'}
            </span>
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 4: РАУНД ИГРЫ (ОБСУЖДЕНИЕ И ТАЙМЕР)                              */}
      {/* ==================================================================== */}
      {phase === 'PLAYING' && (
        <div className="my-auto space-y-4">
          {/* Таймер */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Время на расследование
            </div>

            <div
              className={`text-6xl font-black font-mono tracking-tight my-2 transition-colors ${
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

            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                  isTimerRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-600 text-white shadow-lg'
                }`}
              >
                {isTimerRunning ? 'Пауза' : 'Продолжить'}
              </button>

              <button
                onClick={() => setTimerSeconds(prev => prev + 60)}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
              >
                +1 мин
              </button>
            </div>
          </div>

          {/* Памятка по правилам вопроса */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-[11px] text-slate-300 space-y-1">
            <div className="font-bold text-amber-400">💡 Как вести диалог:</div>
            <div>
              1. Игрок А задает вопрос любому игроку Б: <em>«Какая тут температура?»</em>
            </div>
            <div>
              2. Игрок Б отвечает и задает вопрос любому следующему (кроме игрока А).
            </div>
          </div>

          {/* Кнопка шпаргалки со всеми локациями (для шпиона и мирных) */}
          <button
            onClick={() => setShowLocationsCheatSheet(true)}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sky-400 shadow transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Открыть список всех возможных локаций ({availableLocationsForCheatsheet.length})</span>
          </button>

          {/* Кнопки остановки игры: "Шпион вскрывается" или "Голосование" */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setPhase('SPY_GUESS');
              }}
              className="py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 active:scale-95 transition-all"
            >
              <span>🕵️ Шпион сдается</span>
            </button>

            <button
              onClick={handleTimeOutOrManualEnd}
              className="py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-200 active:scale-95 transition-all"
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
        <div className="my-auto space-y-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500 flex items-center justify-center text-3xl">
            ⚖️
          </div>

          <h2 className="text-2xl font-black text-white">
            Кто, по мнению города, шпион?
          </h2>

          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Обсудите и проголосуйте за подозреваемого. Затем выберите исход голосования:
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleCiviliansWin('Город единогласно нашел шпиона!')}
              className="w-full py-4 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95 transition-all"
            >
              <span>🎉 Город поймал шпиона! (Победа Мирных)</span>
            </button>

            <button
              onClick={() => handleSpiesWin('Город ошибся и обвинил невиновного жителя!')}
              className="w-full py-4 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-lg active:scale-95 transition-all"
            >
              <span>🕵️ Шпион обманул город! (Победа Шпиона)</span>
            </button>

            <button
              onClick={() => setPhase('SPY_GUESS')}
              className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all"
            >
              Шпион хочет назвать локацию перед арестом!
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 6: ШПИОН УГАДЫВАЕТ ЛОКАЦИЮ                                       */}
      {/* ==================================================================== */}
      {phase === 'SPY_GUESS' && (
        <div className="my-auto space-y-3">
          <div className="text-center">
            <h2 className="text-xl font-black text-white">
              Шпион называет локацию!
            </h2>
            <p className="text-xs text-slate-400">
              Если шпион угадает точную локацию, он побеждает!
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 p-2 bg-slate-900 border border-slate-800 rounded-2xl">
            {availableLocationsForCheatsheet.map(loc => (
              <button
                key={loc.id}
                onClick={() => handleSpyGuessAttempt(loc)}
                className="w-full py-2.5 px-3 rounded-xl text-left text-xs font-bold bg-slate-950 hover:bg-rose-950/60 border border-slate-800/80 hover:border-rose-600/60 flex items-center gap-2 text-slate-200 transition-all"
              >
                <span className="text-base">{loc.emoji}</span>
                <span>{loc.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setPhase('PLAYING')}
            className="w-full py-2.5 text-xs text-slate-400 hover:text-white"
          >
            ← Отмена, вернуться к таймеру
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ФАЗА 7: РЕЗУЛЬТАТЫ И РАСКРЫТИЕ (RESULTS)                              */}
      {/* ==================================================================== */}
      {phase === 'RESULTS' && gameResult && (
        <div className="my-auto space-y-4 text-center">
          <div className="space-y-1">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">
              Итоги партии
            </div>
            <h1
              className={`text-3xl font-black uppercase drop-shadow-lg ${
                gameResult.winner === 'civilians' ? 'text-emerald-400' : 'text-rose-500'
              }`}
            >
              {gameResult.winner === 'civilians' ? 'ПОБЕДА МИРНЫХ ЖИТЕЛЕЙ!' : 'ПОБЕДА ШПИОНА!'}
            </h1>
            <p className="text-xs text-slate-300">{gameResult.reason}</p>
          </div>

          {/* Раскрытие локации */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Секретная локация была:</div>
            <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-2">
              <span>{currentLocation?.emoji}</span>
              <span>{currentLocation?.name}</span>
            </div>
          </div>

          {/* Список кто кем был */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-left space-y-1.5 max-h-48 overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-400 pb-1 border-b border-slate-800">
              Роли игроков:
            </div>
            {gameAssignments.map(a => (
              <div
                key={a.playerIndex}
                className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg ${
                  a.isSpy ? 'bg-rose-950/60 text-rose-300 font-bold' : 'text-slate-300'
                }`}
              >
                <span>{a.name}</span>
                <span>
                  {a.isSpy ? '🕵️‍♂️ Шпион' : a.role ? `${a.role}` : 'Мирный житель'}
                </span>
              </div>
            ))}
          </div>

          {/* Кнопки */}
          <div className="space-y-2 pt-2">
            <button
              onClick={startNewGame}
              className="w-full py-4 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-xl active:scale-95 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Сыграть еще раз (Новая локация)</span>
            </button>

            <button
              onClick={() => setPhase('SETUP')}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white"
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
          <div className="relative w-full max-w-sm max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Список возможных локаций</h3>
                <p className="text-[10px] text-slate-400">Шпион и мирные могут сверяться во время игры</p>
              </div>
              <button
                onClick={() => setShowLocationsCheatSheet(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Список */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredLocations.map(loc => (
                <div
                  key={loc.id}
                  className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5 text-xs"
                >
                  <span className="text-xl">{loc.emoji}</span>
                  <div>
                    <div className="font-bold text-slate-200">{loc.name}</div>
                    {enableRoles && (
                      <div className="text-[10px] text-slate-500 truncate max-w-[240px]">
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
