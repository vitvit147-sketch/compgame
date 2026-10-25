// src/components/bunker/BunkerHome.jsx - Просторный мобильный экран входа и создания игры «Бункер»
import React, { useState, useEffect } from 'react';
import { bunkerSocket, bunkerPlayerId, getSavedBunkerName, saveBunkerName } from '../../utils/bunkerSocket';
import { sounds } from '../../utils/soundEffects';
import GameHeader from '../common/GameHeader';
import {
  Shield,
  Users,
  Play,
  ArrowRight,
  Radio,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Flame,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';

const BUNKER_AVATARS = ['🦺', '👨‍🔬', '👩‍🚀', '🥽', '🛠️', '🧬', '🔬', '📻'];

export default function BunkerHome({ onBackToHub, errorMessage, setErrorMessage }) {
  const [playerName, setPlayerName] = useState(getSavedBunkerName() || '');
  const [selectedAvatar, setSelectedAvatar] = useState('🦺');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Настройка времени выступления на этапе создания (превью для хоста)
  const [speechTimerPreset, setSpeechTimerPreset] = useState(45);

  // Автозаполнение из URL ?room=XXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCode(roomParam.trim());
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
    const baseName = playerName.trim() || `Выживший ${Math.floor(Math.random() * 900) + 100}`;
    const fullName = `${selectedAvatar} ${baseName.replace(/^[\p{Emoji}\s]+/u, '')}`.trim();
    saveBunkerName(fullName);
    sounds.playTap();
    bunkerSocket.emit('create_room', {
      playerName: fullName,
      playerId: bunkerPlayerId,
      speechTimeSeconds: speechTimerPreset
    });
  };

  const handleJoinRoom = (e) => {
    e?.preventDefault();
    if (!roomCode.trim()) {
      setErrorMessage('Введите номер стола (например 4819)');
      return;
    }
    setIsJoining(true);
    const baseName = playerName.trim() || `Выживший ${Math.floor(Math.random() * 900) + 100}`;
    const fullName = `${selectedAvatar} ${baseName.replace(/^[\p{Emoji}\s]+/u, '')}`.trim();
    saveBunkerName(fullName);
    sounds.playTap();
    bunkerSocket.emit('join_room', {
      roomCode: roomCode.trim(),
      playerName: fullName,
      playerId: bunkerPlayerId
    });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start select-none overflow-x-hidden">
      {/* Универсальный крупный мобильный хедер */}
      <GameHeader
        onBack={onBackToHub}
        backLabel="В меню"
        title="БУНКЕР"
        icon="☢️"
        badge="Онлайн"
      />

      {/* Основной скроллируемый контент: широкий, просторный, с большими отступами между карточками (space-y-6 sm:space-y-8) */}
      <main className="max-w-lg w-full mx-auto px-5 sm:px-6 py-6 space-y-6 sm:space-y-7 pb-28 overflow-y-auto">
        {/* Заголовок и интро */}
        <div className="text-center pt-1 pb-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-3">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Экстренное оповещение</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
            Бункер 3.0
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed font-medium">
            Командная онлайн-игра на выживание. Докажите свою полезность и займите место в убежище!
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
        {/* КАРТОЧКА 1: ПРОФИЛЬ ВЫЖИВШЕГО (Аватар + Широкое поле ввода)       */}
        {/* ================================================================= */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedAvatar}</span>
              <h2 className="text-lg font-black text-white">Ваш профиль выжившего</h2>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Шаг 1
            </span>
          </div>

          {/* Выбор аватара */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
              Выберите значок выжившего:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {BUNKER_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setSelectedAvatar(emoji);
                  }}
                  className={`min-h-[50px] py-2 rounded-2xl text-2xl flex items-center justify-center border transition-all active:scale-95 touch-manipulation ${
                    selectedAvatar === emoji
                      ? 'bg-amber-500/25 border-amber-400 shadow-md ring-2 ring-amber-400/40 scale-105'
                      : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Большое широкое поле ввода имени */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
              Ваш позывной или реальное имя:
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Например: Сталкер, Док, Лиза"
              maxLength={20}
              className="w-full px-5 py-4 sm:py-5 bg-slate-950 border-2 border-slate-700/80 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 rounded-2xl text-white placeholder-slate-600 text-lg sm:text-xl font-bold transition-all outline-none"
            />
          </div>
        </section>

        {/* ================================================================= */}
        {/* КАРТОЧКА 2: СОЗДАТЬ СТОЛ (ХОСТ)                                    */}
        {/* ================================================================= */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-lg font-black text-white flex items-center gap-3">
              <Shield className="w-6 h-6 text-amber-400" />
              <span>Создать новое убежище</span>
            </div>
            <span className="text-xs font-black text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider">
              Хост
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Вы станете организатором игры. После создания вы получите 4-значный код комнаты и QR-код для подключения друзей со своих смартфонов.
          </p>

          {/* Настройка таймера для хоста */}
          <div className="pt-1">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
              Время на речь каждого игрока:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: 30, label: '30 сек', desc: 'Блиц' },
                { val: 45, label: '45 сек', desc: 'Стандарт' },
                { val: 60, label: '60 сек', desc: 'Свободно' }
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setSpeechTimerPreset(item.val);
                  }}
                  className={`min-h-[54px] py-3 px-2 rounded-2xl text-center border transition-all active:scale-95 touch-manipulation ${
                    speechTimerPreset === item.val
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40'
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
            className={`w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-xl shadow-amber-950/50 active:scale-98 transition-all touch-manipulation ${
              isCreating ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-3 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Создание убежища...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>СОЗДАТЬ БУНКЕР 🏢</span>
              </>
            )}
          </button>
        </section>

        {/* ================================================================= */}
        {/* КАРТОЧКА 3: ВОЙТИ ПО КОДУ (ВЫЖИВШИЙ)                              */}
        {/* ================================================================= */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-lg font-black text-white flex items-center gap-3">
              <Users className="w-6 h-6 text-sky-400" />
              <span>Войти в убежище по коду</span>
            </div>
            <span className="text-xs font-black text-sky-400 bg-sky-500/15 px-3 py-1 rounded-full border border-sky-500/30 uppercase tracking-wider">
              Выживший
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Если хост уже создал комнату, введите 4-значный номер убежища с его экрана:
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
                placeholder="7412"
                className="w-full py-4 sm:py-5 px-4 bg-slate-950 border-2 border-slate-700/80 focus:border-sky-400 rounded-2xl text-center font-mono text-3xl sm:text-4xl font-black tracking-widest text-sky-400 placeholder-slate-700 transition-all outline-none"
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
                  <span>ПРИСОЕДИНИТЬСЯ К ГРУППЕ</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </section>

        {/* ================================================================= */}
        {/* КАРТОЧКА 4: ПРАВИЛА И МЕХАНИКА ИГРЫ «БУНКЕР»                      */}
        {/* ================================================================= */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-black text-white">Как устроена игра «Бункер 3.0»</h2>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <div className="font-extrabold text-sm sm:text-base text-amber-300 flex items-center gap-2">
                <span>☢️ 1. Катастрофа и вместимость</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                На планете случился апокалипсис. Бункер рассчитан ровно на <strong>50% участников</strong>. Остальные останутся на поверхности.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <div className="font-extrabold text-sm sm:text-base text-sky-300 flex items-center gap-2">
                <span>🃏 2. Семь скрытых характеристик</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Каждый получает профессию, здоровье, багаж, хобби, фобию, факт и карту действия. В каждом раунде вы открываете по одной карте и доказываете свою полезность.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <div className="font-extrabold text-sm sm:text-base text-rose-300 flex items-center gap-2">
                <span>🗳️ 3. Голосование за изгнание</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                После каждого круга дебатов игроки тайно голосуют со своих смартфонов за того, кого изгнать. Изгнанный выбывает из борьбы.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <div className="font-extrabold text-sm sm:text-base text-emerald-300 flex items-center gap-2">
                <span>🏆 4. Финал и возрождение</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Выжившие входят в бункер и система подводит итог: сможет ли группа восстановить популяцию и цивилизацию с полученным набором навыков и багажа.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* КАРТОЧКА 5: СОВЕТЫ ДЛЯ КОМПАНИИ                                    */}
        {/* ================================================================= */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-black text-white">Советы для яркой партии</h2>
          </div>
          <ul className="text-xs sm:text-sm text-slate-300 space-y-2 leading-relaxed font-medium list-disc list-inside">
            <li>Не бойтесь плохих карт — даже болезнь можно повернуть как повод спасти уникальный научный опыт.</li>
            <li>Приберегите спец-карты до критических моментов голосования.</li>
            <li>Обсуждайте, какие профессии действительно нужны бункеру при текущей катастрофе.</li>
          </ul>
        </section>

        <footer className="text-center pt-2 pb-4 text-xs text-slate-500 font-medium">
          Для 3–16 человек • Синхронизация карт и голосования со смартфонов в реальном времени
        </footer>
      </main>
    </div>
  );
}
