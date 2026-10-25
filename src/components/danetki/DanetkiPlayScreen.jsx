// src/components/danetki/DanetkiPlayScreen.jsx - Экран игры «Данетки» (локально и онлайн)
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/soundEffects';
import { DANETKI_CATEGORIES, getRandomDanetka } from '../../data/danetkiData';
import { danetkiSocket } from '../../utils/danetkiSocket';
import GameHeader from '../common/GameHeader';
import ExitConfirmModal from '../common/ExitConfirmModal';
import DanetkiCatalogModal from './DanetkiCatalogModal';
import {
  Eye,
  EyeOff,
  HelpCircle,
  Sparkles,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Hand,
  Lightbulb,
  CheckCircle2,
  Users,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function DanetkiPlayScreen({
  isOnline = false,
  roomData = null,
  myPlayer = null,
  isHost = true,
  onExit,
  completedIds = [],
  onMarkCompleted
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [revealedHints, setRevealedHints] = useState([]);
  const [localQuestionCount, setLocalQuestionCount] = useState(0);
  const [localLog, setLocalLog] = useState([]);
  const [isSolved, setIsSolved] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Для локального режима храним текущую данетку в локальном стейте
  const [localDanetka, setLocalDanetka] = useState(() => getRandomDanetka('all', completedIds));

  // Текущая загадка: из комнаты (в онлайне) или локальная
  const danetka = isOnline ? (roomData?.game?.currentDanetka || localDanetka) : localDanetka;
  const questionsCount = isOnline ? (roomData?.game?.questionsCount || 0) : localQuestionCount;
  const answersLog = isOnline ? (roomData?.game?.answersLog || []) : localLog;
  const solved = isOnline ? (roomData?.game?.status === 'SOLVED') : isSolved;
  const lastPing = roomData?.game?.lastPing;

  // Категория
  const currentCategory = DANETKI_CATEGORIES.find(c => c.id === danetka?.category) || DANETKI_CATEGORIES[0];

  // Сброс подсказок при смене загадки
  useEffect(() => {
    setShowAnswer(false);
    setRevealedHints([]);
    setIsSolved(false);
  }, [danetka?.id]);

  // Звуковое оповещение при победе в онлайне
  useEffect(() => {
    if (solved) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      });
      sounds.playSuccess();
      if (danetka?.id && onMarkCompleted) {
        onMarkCompleted(danetka.id);
      }
    }
  }, [solved, danetka?.id]);

  // Обработчик ответа ведущего (ДА / НЕТ / НЕ ИМЕЕТ ЗНАЧЕНИЯ)
  const handleAnswer = (type) => {
    if (type === 'yes') sounds.playSuccess();
    else if (type === 'no') sounds.playVote();
    else sounds.playTap();

    if (isOnline) {
      danetkiSocket.emit('answer_question', { type });
    } else {
      const nextCount = localQuestionCount + 1;
      const label = type === 'yes' ? 'ДА' : type === 'no' ? 'НЕТ' : 'НЕ ИМЕЕТ ЗНАЧЕНИЯ';
      setLocalQuestionCount(nextCount);
      setLocalLog(prev => [{
        id: 'ans_' + Date.now(),
        number: nextCount,
        type,
        label,
        timestamp: Date.now()
      }, ...prev].slice(0, 5));
    }
  };

  // Нажатие «ОТГАДАНО!»
  const handleSolve = () => {
    setShowAnswer(true);
    setIsSolved(true);
    if (isOnline) {
      danetkiSocket.emit('solve_danetka');
    }
  };

  // Переход к следующей данетке
  const handleNextDanetka = () => {
    sounds.playTap();
    if (isOnline) {
      danetkiSocket.emit('next_danetka');
    } else {
      const next = getRandomDanetka('all', completedIds);
      setLocalDanetka(next);
      setLocalQuestionCount(0);
      setLocalLog([]);
      setIsSolved(false);
      setShowAnswer(false);
      setRevealedHints([]);
    }
  };

  // Выбор данетки из каталога
  const handleSelectFromCatalog = (item) => {
    sounds.playTap();
    if (isOnline) {
      // В онлайне ведущий может переключить загадку
      danetkiSocket.emit('next_danetka', { category: item.category });
    } else {
      setLocalDanetka(item);
      setLocalQuestionCount(0);
      setLocalLog([]);
      setIsSolved(false);
      setShowAnswer(false);
      setRevealedHints([]);
    }
  };

  // Поднятие руки / версия игрока (онлайн)
  const handleRaiseHand = (pingType) => {
    sounds.playTap();
    danetkiSocket.emit('raise_hand', { pingType });
  };

  // Раскрытие подсказки
  const handleToggleHint = (idx) => {
    sounds.playTap();
    setRevealedHints(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      return [...prev, idx];
    });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-lg w-full mx-auto select-none overflow-y-auto">
      {/* Хедер */}
      <GameHeader
        onBack={() => setShowExitModal(true)}
        backLabel="Меню"
        title={isOnline ? `Комната #${roomData?.code}` : 'Данетки'}
        icon="🧩"
        badge={isOnline ? (isHost ? 'Ведущий 👑' : 'Игрок 🕵️') : 'Оффлайн'}
      />

      <main className="px-4 sm:px-6 py-4 pb-36 space-y-4">
        {/* Оповещение ведущего о поднятых руках игроков */}
        {isOnline && isHost && lastPing && Date.now() - lastPing.timestamp < 10000 && (
          <div className="p-3.5 bg-amber-500/20 border-2 border-amber-500/50 rounded-2xl flex items-center justify-between gap-3 text-amber-300 font-bold animate-bounce">
            <div className="flex items-center gap-2">
              <span className="text-xl">{lastPing.type === 'version' ? '💡' : '✋'}</span>
              <span className="text-sm">
                Игрок <strong>{lastPing.playerName}</strong> {lastPing.type === 'version' ? 'готов назвать версию!' : 'хочет задать вопрос!'}
              </span>
            </div>
          </div>
        )}

        {/* Карточка загадки */}
        <section className="mobile-card border-amber-500/30">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider">
              <span>{currentCategory.icon}</span>
              <span>{currentCategory.name}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCatalog(true)}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                title="Открыть каталог всех загадок"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Каталог</span>
              </button>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-3">
            {danetka?.title}
          </h2>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-base sm:text-lg text-slate-200 font-medium leading-relaxed">
            «{danetka?.question}»
          </div>

          {/* Статус отгадки */}
          {solved && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-300 text-center font-black text-base flex items-center justify-center gap-2 animate-fadeIn">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Загадка успешно разгадана! 🎉</span>
            </div>
          )}
        </section>

        {/* Секция только для ведущего: СКРЫТАЯ РАЗГАДКА */}
        {(!isOnline || isHost || solved) && (
          <section className={`mobile-card transition-all ${
            showAnswer || solved
              ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900'
              : 'border-slate-800 bg-slate-900/60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>{isHost ? 'Разгадка (для ведущего)' : 'Полная разгадка'}</span>
              </div>

              {!solved && isHost && (
                <button
                  type="button"
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                >
                  {showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showAnswer ? 'Скрыть' : 'Показать'}</span>
                </button>
              )}
            </div>

            {showAnswer || solved ? (
              <div className="text-sm sm:text-base text-emerald-200/90 leading-relaxed font-medium bg-slate-950/70 p-4 rounded-2xl border border-emerald-500/20 animate-fadeIn">
                {danetka?.answer}
              </div>
            ) : (
              <div
                onClick={() => setShowAnswer(true)}
                className="p-5 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center cursor-pointer hover:border-amber-500/40 transition-colors"
              >
                <Eye className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                <span className="text-xs font-bold text-slate-400 block">
                  Нажмите, чтобы прочитать ответ ведущему
                </span>
              </div>
            )}
          </section>
        )}

        {/* Подсказки (только ведущий может раскрывать) */}
        {isHost && danetka?.hints && danetka.hints.length > 0 && (
          <section className="mobile-card border-slate-800 space-y-2">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Наводящие подсказки (если игроки в тупике):</span>
            </div>

            <div className="space-y-2">
              {danetka.hints.map((hint, idx) => {
                const isOpen = revealedHints.includes(idx);
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleHint(idx)}
                      className="w-full p-3 text-left flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white"
                    >
                      <span>💡 Подсказка #{idx + 1}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 text-xs text-amber-200/90 leading-relaxed border-t border-slate-800/80 pt-2">
                        {hint}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Пульт ведущего: кнопки «ДА / НЕТ / НЕ ВАЖНО» со звуками */}
        {isHost && !solved && (
          <section className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider">
                Ответ ведущего:
              </span>
              <span className="font-mono font-bold text-amber-400">
                Задано вопросов: {questionsCount}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleAnswer('yes')}
                className="min-h-[58px] p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-base shadow-lg shadow-emerald-950/60 flex flex-col items-center justify-center gap-0.5 border border-emerald-400/40 touch-manipulation transition-all"
              >
                <span>ДА 🟢</span>
              </button>

              <button
                type="button"
                onClick={() => handleAnswer('no')}
                className="min-h-[58px] p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-base shadow-lg shadow-rose-950/60 flex flex-col items-center justify-center gap-0.5 border border-rose-400/40 touch-manipulation transition-all"
              >
                <span>НЕТ 🔴</span>
              </button>

              <button
                type="button"
                onClick={() => handleAnswer('irrelevant')}
                className="min-h-[58px] p-2 sm:p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 font-black text-xs sm:text-sm shadow-lg flex flex-col items-center justify-center text-center border border-slate-700 touch-manipulation transition-all leading-tight"
              >
                <span>НЕ ВАЖНО ⚪</span>
              </button>
            </div>
          </section>
        )}

        {/* Экран для игроков в онлайне: кнопки действий */}
        {isOnline && !isHost && !solved && (
          <section className="space-y-3 pt-2">
            <div className="text-center text-xs font-bold text-slate-400">
              Задавайте ведущему вопросы, требующие ответа «Да» или «Нет»
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRaiseHand('question')}
                className="min-h-[54px] p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-300 font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow touch-manipulation"
              >
                <Hand className="w-5 h-5 text-amber-400" />
                <span>Поднять руку ✋</span>
              </button>

              <button
                type="button"
                onClick={() => handleRaiseHand('version')}
                className="min-h-[54px] p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-500/20 touch-manipulation"
              >
                <Lightbulb className="w-5 h-5" />
                <span>Есть версия! 💡</span>
              </button>
            </div>
          </section>
        )}

        {/* Живая лента последних ответов ведущего */}
        {answersLog.length > 0 && (
          <section className="mobile-card border-slate-800/80">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Лента ответов ({questionsCount}):</span>
              <span className="text-[11px] font-normal text-slate-500">Последние</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {answersLog.slice(0, 8).map(ans => (
                <div
                  key={ans.id}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-black shrink-0 ${
                    ans.type === 'yes'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : ans.type === 'no'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  #{ans.number} {ans.label}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Нижняя панель действий */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-lg mx-auto shadow-2xl">
        {isHost ? (
          solved ? (
            <button
              type="button"
              onClick={handleNextDanetka}
              className="w-full min-h-[56px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-2xl shadow-amber-500/30 active:scale-98 transition-all touch-manipulation"
            >
              <span>Следующая данетка</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleNextDanetka}
                className="min-h-[52px] py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-extrabold text-sm border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Сменить</span>
              </button>

              <button
                type="button"
                onClick={handleSolve}
                className="min-h-[52px] py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation"
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>ОТГАДАНО! 🎉</span>
              </button>
            </div>
          )
        ) : (
          <div className="min-h-[52px] p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-300 flex items-center justify-center font-bold">
            {solved ? 'Загадка разгадана! Ведущий выбирает следующую...' : 'Слушайте ответы ведущего и задавайте новые вопросы'}
          </div>
        )}
      </footer>

      {/* Каталог данеток */}
      <DanetkiCatalogModal
        isOpen={showCatalog}
        onClose={() => setShowCatalog(false)}
        onSelectDanetka={handleSelectFromCatalog}
        completedIds={completedIds}
      />

      {/* Модалка выхода */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={onExit}
        isHost={isHost}
        customTitle="Завершить игру в данетки?"
        customDesc="Вы вернетесь в главное меню. Пройденные загадки сохранятся в вашей истории."
      />
    </div>
  );
}
