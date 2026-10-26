import React, { useState, useCallback } from 'react';
import { Eye, Smartphone } from 'lucide-react';
import { sound } from '../utils/audio';
import { ROLES, FACTIONS } from '../data/rolesData';

const FACTION_STYLES = {
  city: {
    gradient: 'bg-gradient-to-b from-blue-950 to-slate-900',
    border: 'border-blue-500/40',
    glow: 'shadow-blue-500/20',
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    accent: 'text-blue-400',
    button: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
    emoji: '🕊',
    label: 'Мирные жители',
    hint: 'Ваша задача — вычислить Мафию на дневных обсуждениях.',
  },
  mafia: {
    gradient: 'bg-gradient-to-b from-rose-950 to-slate-900',
    border: 'border-rose-500/40',
    glow: 'shadow-rose-500/20',
    badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    accent: 'text-rose-400',
    button: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700',
    emoji: '🕵️',
    label: 'Мафия',
    hint: 'Вы узнаете своих союзников, когда Мафия проснётся в первую ночь.',
  },
  renegade: {
    gradient: 'bg-gradient-to-b from-purple-950 to-slate-900',
    border: 'border-purple-500/40',
    glow: 'shadow-purple-500/20',
    badge: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    accent: 'text-purple-400',
    button: 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700',
    emoji: '⚔️',
    label: 'Отщепенцы',
    hint: 'Вы играете за себя. У вас своя уникальная цель победы.',
  },
};

export default function DealingPhase({ players, onDealingComplete, onCancel }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const total = players.length;
  const player = players[currentIndex];
  const isLast = currentIndex === total - 1;

  const handleReveal = useCallback(() => {
    sound.playReveal();
    setIsRevealed(true);
  }, []);

  const handleNext = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      if (isLast) {
        onDealingComplete();
      } else {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
        setTransitioning(false);
      }
    }, 250);
  }, [isLast, onDealingComplete]);

  const faction = FACTION_STYLES[player.faction] || FACTION_STYLES.city;
  const roleData = ROLES[player.roleId];

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col justify-start pt-safe pb-safe select-none">
      <div className="max-w-md w-full mx-auto flex flex-col flex-1 px-4 py-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          {onCancel ? (
            <button
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl active:scale-95 transition-all"
            >
              ← Назад в настройки
            </button>
          ) : <div />}
          <span className="text-[11px] font-black tracking-wider text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            Раздача ролей
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400">
              Игрок {currentIndex + 1} из {total}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {Math.round(((currentIndex + (isRevealed ? 1 : 0.5)) / total) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentIndex + (isRevealed ? 1 : 0.5)) / total) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-1.5 mb-6 flex-wrap">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < currentIndex
                  ? 'bg-amber-500'
                  : i === currentIndex
                    ? 'bg-amber-400 scale-125 ring-2 ring-amber-400/30'
                    : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Main content area */}
        <div
          className={`flex-1 flex flex-col transition-opacity duration-250 ${
            transitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {!isRevealed ? (
            /* ========== PASS SUB-PHASE ========== */
            <div className="flex-1 flex flex-col items-center justify-start pt-8">
              {/* Phone hand-off illustration */}
              <div className="relative mb-8">
                <div className="w-28 h-28 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
                  <Smartphone className="w-14 h-14 text-slate-400" strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <span className="text-lg">👋</span>
                </div>
              </div>

              {/* Instruction text */}
              <p className="text-sm text-slate-400 mb-2 tracking-wide uppercase">
                Передайте телефон игроку:
              </p>

              {/* Player info */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-1.5 mb-3">
                  <span className="text-xs font-semibold text-amber-400">
                    Игрок №{player.number}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {player.name}
                </h2>
              </div>

              {/* Warning */}
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 mt-4">
                <Eye className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-sm text-amber-300/90">
                  Убедитесь, что никто не подглядывает!
                </p>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Reveal button */}
              <button
                onClick={handleReveal}
                className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-base py-4 rounded-2xl transition-colors duration-150 mb-4 shadow-lg shadow-amber-500/20"
              >
                📱 Я держу телефон — показать роль!
              </button>
            </div>
          ) : (
            /* ========== REVEAL SUB-PHASE ========== */
            <div className="flex-1 flex flex-col items-center justify-start">
              {/* Player badge */}
              <div className="inline-flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-1.5 mb-4">
                <span className="text-xs font-semibold text-slate-300">
                  Игрок №{player.number}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-medium text-slate-400">
                  {player.name}
                </span>
              </div>

              {/* Role card */}
              <div
                className={`w-full ${faction.gradient} ${faction.border} border rounded-3xl p-5 shadow-2xl ${faction.glow} relative overflow-hidden`}
              >
                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 right-4 text-8xl rotate-12 select-none pointer-events-none">
                    {faction.emoji}
                  </div>
                </div>

                {/* Card content */}
                <div className="relative z-10 flex flex-col items-center">
                  {/* Faction badge */}
                  <div
                    className={`inline-flex items-center gap-2 ${faction.badge} rounded-full px-4 py-1.5 mb-5`}
                  >
                    <span className="text-base">{faction.emoji}</span>
                    <span className="text-xs font-semibold tracking-wide uppercase">
                      {faction.label}
                    </span>
                  </div>

                  {/* Role illustration (Thought Cabinet Art) */}
                  {roleData?.image ? (
                    <div className="w-full max-w-[260px] aspect-[4/5] rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-2xl shadow-black/80 mb-3 relative group bg-black/50">
                      <img
                        src={roleData.image}
                        alt={player.roleName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="eager"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 pointer-events-none" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-amber-500/30">
                          Кабинет Мыслей
                        </span>
                        <span className="text-xs bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
                          {faction.emoji}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                      <span className="text-4xl">
                        {roleData?.emoji || faction.emoji}
                      </span>
                    </div>
                  )}

                  {/* Thought Title in Disco Elysium style */}
                  {roleData?.thoughtTitle && (
                    <div className="text-[11px] font-mono uppercase tracking-widest text-amber-400/90 mb-1">
                      «{roleData.thoughtTitle}»
                    </div>
                  )}

                  {/* Role name */}
                  <h1 className="text-3xl font-black text-white text-center mb-2 tracking-tight">
                    {player.roleName}
                  </h1>

                  {/* Short description */}
                  {roleData?.shortDesc && (
                    <p className={`text-sm font-medium ${faction.accent} text-center mb-4`}>
                      {roleData.shortDesc}
                    </p>
                  )}

                  {/* Divider */}
                  <div className="w-16 h-px bg-white/10 mb-4" />

                  {/* Full description */}
                  {roleData?.description && (
                    <p className="text-sm text-slate-300/90 text-center leading-relaxed mb-5 px-2">
                      {roleData.description}
                    </p>
                  )}

                  {/* Team hint */}
                  <div
                    className={`w-full ${faction.badge} rounded-2xl px-4 py-3`}
                  >
                    <p className="text-xs text-center leading-relaxed">
                      {faction.hint}
                    </p>
                  </div>
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Next / Finish button */}
              <button
                onClick={handleNext}
                className={`w-full ${faction.button} text-white font-bold text-base py-4 rounded-2xl transition-colors duration-150 mt-6 mb-4 shadow-lg`}
              >
                {isLast
                  ? '🎭 Все роли розданы — начать игру!'
                  : '✅ Запомнил(а) — передать дальше'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
