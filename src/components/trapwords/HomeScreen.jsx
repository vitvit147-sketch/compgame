// src/components/trapwords/HomeScreen.jsx - Просторный мобильный экран для «Слова-Мины»
import React, { useState, useEffect } from 'react';
import { socket, playerId, getSavedPlayerName, savePlayerName } from '../../utils/socket';
import { sounds } from '../../utils/soundEffects';
import GameHeader from '../common/GameHeader';
import {
  Sparkles,
  Users,
  Bomb,
  ArrowRight,
  Play,
  Shield,
  HelpCircle,
  AlertTriangle,
  Flame,
  Target
} from 'lucide-react';

const TRAPWORDS_AVATARS = ['💣', '🕵️', '🤠', '🤖', '🧙', '🦊', '👑', '🕶️'];

export default function HomeScreen({ onSelectMafiaMode, errorMessage, setErrorMessage }) {
  const [playerName, setPlayerName] = useState(getSavedPlayerName() || '');
  const [selectedAvatar, setSelectedAvatar] = useState('💣');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Настройка очков для победы (превью для хоста)
  const [targetScorePreset, setTargetScorePreset] = useState(5);

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
    const baseName = playerName.trim() || `Игрок ${Math.floor(Math.random() * 900) + 100}`;
    const fullName = `${selectedAvatar} ${baseName.replace(/^[\p{Emoji}\s]+/u, '')}`.trim();
    savePlayerName(fullName);
    sounds.playTap();
    socket.emit('create_room', {
      playerName: fullName,
      playerId,
      targetScore: targetScorePreset
    });
  };

  const handleJoinRoom = (e) => {
    e?.preventDefault();
    if (!roomCode.trim()) {
      setErrorMessage('Введите номер стола (например 4819)');
      return;
    }
    setIsJoining(true);
    const baseName = playerName.trim() || `Игрок ${Math.floor(Math.random() * 900) + 100}`;
    const fullName = `${selectedAvatar} ${baseName.replace(/^[\p{Emoji}\s]+/u, '')}`.trim();
    savePlayerName(fullName);
    sounds.playTap();
    socket.emit('join_room', {
      roomCode: roomCode.trim(),
      playerName: fullName,
      playerId
    });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start select-none overflow-x-hidden">
      {/* Крупный эргономичный мобильный хедер */}
      <GameHeader
        onBack={onSelectMafiaMode}
        backLabel="В меню"
        title="СЛОВА-МИНЫ"
        icon="💣"
        badge="Онлайн"
      />

      {/* Основной скроллируемый контент: широкий, просторный, с большими отступами между карточками (space-y-6 sm:space-y-8) */}
      <main className="max-w-lg w-full mx-auto px-5 sm:px-6 py-6 space-y-6 sm:space-y-7 pb-28 overflow-y-auto">
        {/* Заголовок игры */}
        <div className="text-center pt-1 pb-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-widest mb-3">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Командная дуэль умов</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-3xl sm:text-4xl font-black text-rose-500 uppercase tracking-tight">СЛОВА</span>
            <span className="text-2xl font-bold text-slate-500">-</span>
            <span className="text-3xl sm:text-4xl font-black text-amber-400 uppercase tracking-tight">МИНЫ</span>
            <span className="text-3xl">💣</span>
          </div>
          <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed font-medium">
            Командная битва на блеф, ассоциации и скрытые ловушки. Объясняйте слова, избегая чужих мин!
          </p>
        </div>

        {/* Ошибка если была */}
        {errorMessage && (
          <div className="p-5 bg-rose-500/20 border-2 border-rose-500/40 rounded-3xl text-rose-200 text-sm font-bold text-center flex items-center justify-center gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* КАРТОЧКА 1: ПРОФИЛЬ ИГРОКА (Аватар + Широкое поле ввода)          */}
        {/* ================================================================= */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedAvatar}</span>
              <h2 className="text-lg font-black text-white">Ваш профиль игрока</h2>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Шаг 1
            </span>
          </div>

          {/* Выбор аватара */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
              Выберите игровой аватар:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {TRAPWORDS_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setSelectedAvatar(emoji);
                  }}
                  className={`min-h-[50px] py-2 rounded-2xl text-2xl flex items-center justify-center border transition-all active:scale-95 touch-manipulation ${
                    selectedAvatar === emoji
                      ? 'bg-rose-500/25 border-rose-400 shadow-md ring-2 ring-rose-400/40 scale-105'
                      : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Широкое поле ввода имени */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
              Ваше имя или никнейм:
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Например: Артур, Лиза, Капитан"
              maxLength={20}
              className="w-full px-5 py-4 sm:py-5 bg-slate-950 border-2 border-slate-700/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/20 rounded-2xl text-white placeholder-slate-600 text-lg sm:text-xl font-bold transition-all outline-none"
            />
          </div>
        </section>

        {/* ================================================================= */}
        {/* КАРТОЧКА 2: СОЗДАТЬ СТОЛ (ХОСТ)                                    */}
        {/* ================================================================= */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-lg font-black text-white flex items-center gap-3">
              <Shield className="w-6 h-6 text-rose-400" />
              <span>Создать новую комнату</span>
            </div>
            <span className="text-xs font-black text-rose-400 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/30 uppercase tracking-wider">
              Хост
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Создайте комнату для двух команд: 🔴 Красные против 🔵 Синие. Вы получите 4-значный PIN-код или QR для друзей.
          </p>

          {/* Настройка целевых очков */}
          <div className="pt-1">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-400" />
              Очков для победы в матче:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: 3, label: '3 очка', desc: 'Быстрая' },
                { val: 5, label: '5 очков', desc: 'Стандарт' },
                { val: 7, label: '7 очков', desc: 'Эпик' }
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setTargetScorePreset(item.val);
                  }}
                  className={`min-h-[54px] py-3 px-2 rounded-2xl text-center border transition-all active:scale-95 touch-manipulation ${
                    targetScorePreset === item.val
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-md ring-1 ring-rose-400/40'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-base font-black">{item.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5 font-medium">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={isCreating}
            className={`w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-xl shadow-rose-950/50 active:scale-98 transition-all touch-manipulation ${
              isCreating ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Создание комнаты...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>СОЗДАТЬ СТОЛ 💣</span>
              </>
            )}
          </button>
        </section>

        {/* ================================================================= */}
        {/* КАРТОЧКА 3: ВОЙТИ ПО КОДУ (ИГРОК)                                 */}
        {/* ================================================================= */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-lg font-black text-white flex items-center gap-3">
              <Users className="w-6 h-6 text-sky-400" />
              <span>Войти по коду комнаты</span>
            </div>
            <span className="text-xs font-black text-sky-400 bg-sky-500/15 px-3 py-1 rounded-full border border-sky-500/30 uppercase tracking-wider">
              Игрок
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Если хост уже запустил лобби, введите 4 цифры комнаты с его смартфона:
          </p>

          <form onSubmit={handleJoinRoom} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                4-значный код комнаты:
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="4819"
                className="w-full py-4 sm:py-5 px-4 bg-slate-950 border-2 border-slate-700/80 focus:border-rose-400 rounded-2xl text-center font-mono text-3xl sm:text-4xl font-black tracking-widest text-rose-400 placeholder-slate-700 transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className={`w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 active:scale-98 transition-all shadow-lg touch-manipulation ${
                isJoining ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Подключение...</span>
                </>
              ) : (
                <>
                  <span>ПРИСОЕДИНИТЬСЯ К КОМАНДЕ</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </section>

        {/* ================================================================= */}
        {/* КАРТОЧКА 4: ПРАВИЛА ИГРЫ «СЛОВА-МИНЫ»                             */}
        {/* ================================================================= */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-rose-400" />
            <h2 className="text-lg font-black text-white">Как устроена игра «Слова-Мины»</h2>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <div className="font-extrabold text-sm sm:text-base text-rose-300 flex items-center gap-2">
                <span>💣 1. Скрытые слова-ловушки</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Команда соперников тайно загадывает 3–5 слов-мин к секретному слову, которое будет объяснять ведущий.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <div className="font-extrabold text-sm sm:text-base text-amber-300 flex items-center gap-2">
                <span>🗣️ 2. Объяснение без мин</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Ведущий видит только загаданное слово (но не знает чужих мин!). Он пытается объяснить его своей команде, осторожно подбирая синонимы.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <div className="font-extrabold text-sm sm:text-base text-sky-300 flex items-center gap-2">
                <span>💥 3. Кнопка «БАХ!» со смартфона</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Если ведущий произносит заминированное слово, соперники жмут кнопку <strong>«БАХ!»</strong> — раунд моментально взрывается!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <div className="font-extrabold text-sm sm:text-base text-emerald-300 flex items-center gap-2">
                <span>🏆 4. Гонка команд</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Если команда угадала слово и не подорвалась — она забирает победный балл. Команда, первая набравшая нужное количество очков, побеждает.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* КАРТОЧКА 5: СОВЕТЫ ПО СТРАТЕГИИ                                   */}
        {/* ================================================================= */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">Стратегические подсказки</h2>
          </div>
          <ul className="text-xs sm:text-sm text-slate-300 space-y-2 leading-relaxed font-medium list-disc list-inside">
            <li>Минируйте не только очевидные ассоциации, но и служебные слова или части предмета.</li>
            <li>Ведущему выгодно строить рассказ через метафоры и антонимы, чтобы обойти ловушки.</li>
            <li>Следите за реакцией соперников во время своего объяснения.</li>
          </ul>
        </section>

        <footer className="text-center pt-2 pb-4 text-xs text-slate-500 font-medium">
          Для 4–16 человек • Две команды • Синхронизация ловушек и таймера в реальном времени
        </footer>
      </main>
    </div>
  );
}
