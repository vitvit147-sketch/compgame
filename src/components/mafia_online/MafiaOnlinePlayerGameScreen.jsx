// src/components/mafia_online/MafiaOnlinePlayerGameScreen.jsx - Экран игрока в активной партии Мафии Онлайн
import React, { useState } from 'react';
import { sounds } from '../../utils/soundEffects';
import { ROLES, FACTIONS } from '../../data/rolesData';
import ExitConfirmModal from '../common/ExitConfirmModal';
import {
  Eye,
  EyeOff,
  Shield,
  Moon,
  Sun,
  Skull,
  Users,
  LogOut,
  AlertTriangle,
  HeartHandshake,
  Vote
} from 'lucide-react';

const FACTION_CONFIG = {
  city: {
    title: 'Город (Мирные)',
    gradient: 'from-sky-950 via-slate-900 to-slate-900',
    border: 'border-sky-500/50',
    text: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    icon: '🕊'
  },
  mafia: {
    title: 'Синдикат Мафии',
    gradient: 'from-rose-950 via-slate-900 to-slate-900',
    border: 'border-rose-500/50',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: '🕵️'
  },
  renegade: {
    title: 'Отщепенец (Одиночка)',
    gradient: 'from-purple-950 via-slate-900 to-slate-900',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: '⚔️'
  }
};

export default function MafiaOnlinePlayerGameScreen({ roomData, myPlayer, onLeaveRoom }) {
  const [isRevealed, setIsRevealed] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  const game = roomData.game || {};
  const currentRound = game.round || 1;
  const phase = game.phase || 'night';
  const players = (roomData.players || []).filter(p => !p.isHost);

  const roleId = myPlayer?.roleId || 'citizen';
  const roleDef = ROLES[roleId] || ROLES.citizen;
  const factionConfig = FACTION_CONFIG[roleDef.faction] || FACTION_CONFIG.city;

  const isAlive = myPlayer?.isAlive !== false;
  const fouls = myPlayer?.fouls || 0;

  // Список сообщников мафии (если я мафия или дон)
  const isMafiaMember = roleDef.faction === 'mafia';
  const mafiaTeammates = isMafiaMember
    ? players.filter(p => p.id !== myPlayer?.id && (p.faction === 'mafia' || p.roleId === 'don' || p.roleId === 'mafioso'))
    : [];

  const handleToggleReveal = () => {
    sounds.playTap();
    setIsRevealed(prev => !prev);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start select-none">
      {/* Шапка со статусом фазы */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] flex items-center justify-between shadow-md">
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-750 hover:bg-rose-950/50 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 flex items-center gap-1 text-xs font-black transition-colors active:scale-95 touch-manipulation"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Выход</span>
        </button>

        {/* Фаза игры */}
        <div className="flex items-center gap-2">
          {phase === 'night' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-black uppercase tracking-wider animate-pulse">
              <Moon className="w-3.5 h-3.5" />
              <span>Ночь #{currentRound}</span>
            </span>
          )}
          {phase === 'morning' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Sun className="w-3.5 h-3.5" />
              <span>Утро #{currentRound}</span>
            </span>
          )}
          {phase === 'day' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-black uppercase tracking-wider">
              <Sun className="w-3.5 h-3.5" />
              <span>День #{currentRound}</span>
            </span>
          )}
        </div>

        {/* Фолы */}
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Фолы
          </span>
          <span className={`text-xs font-mono font-black ${
            fouls >= 3 ? 'text-rose-400 animate-pulse' : 'text-slate-300'
          }`}>
            {fouls}/4
          </span>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto px-5 sm:px-6 py-6 pb-24 overflow-y-auto">
        {/* Оповещение если игрок погиб */}
        {!isAlive && (
          <div className="mb-6 p-4 rounded-3xl bg-rose-500/20 border-2 border-rose-500/40 text-center text-xs sm:text-sm text-rose-300 font-bold shadow-xl animate-fadeIn">
            💀 Вы погибли и выбыли из борьбы! Но вы остаетесь в игре как призрак и наблюдаете за финалом.
          </div>
        )}

        {/* Текущее состояние в игре от ведущего */}
        <section className="mb-5 p-4 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-1">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Состояние города:
          </div>
          <div className="text-sm font-black text-white">
            {phase === 'night' && '🌙 Город спит. Ведущий опрашивает ночные роли...'}
            {phase === 'morning' && '☀️ Город просыпается! Ведущий оглашает ночные события.'}
            {phase === 'day' && '🗣️ Идет дневное обсуждение. Вычисляйте подозреваемых!'}
          </div>
        </section>

        {/* ================================================================= */}
        {/* КАРТОЧКА РОЛИ ИГРОКА                                             */}
        {/* ================================================================= */}
        <section className={`mobile-card border-2 transition-all ${factionConfig.border} bg-gradient-to-br ${factionConfig.gradient} shadow-2xl`}>
          {/* Переключатель видимости для защиты от подглядывания */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Ваша секретная роль
            </span>
            <button
              type="button"
              onClick={handleToggleReveal}
              className="py-1 px-3 rounded-lg bg-slate-950/80 border border-slate-750 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all"
            >
              {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-sky-400" />}
              <span>{isRevealed ? 'Скрыть роль' : 'Показать роль'}</span>
            </button>
          </div>

          {isRevealed ? (
            <div className="pt-3 text-center space-y-3 animate-fadeIn">
              {/* Портрет Кабинета Мыслей / Иконка роли */}
              {roleDef.image ? (
                <div className="w-full max-w-[240px] aspect-[4/5] mx-auto rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl shadow-black relative bg-slate-950">
                  <img
                    src={roleDef.image}
                    alt={roleDef.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 pointer-events-none" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase px-2 py-0.5 rounded bg-black/75 backdrop-blur-md border border-amber-500/30">
                      Кабинет Мыслей
                    </span>
                    <span className="text-xs">{factionConfig.icon}</span>
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-950/80 border border-white/20 flex items-center justify-center text-5xl shadow-xl">
                  {roleDef.faction === 'mafia' ? '🎩' : roleDef.id === 'sheriff' ? '⭐️' : roleDef.id === 'doctor' ? '💊' : '🕊'}
                </div>
              )}

              <div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-1.5 border ${factionConfig.badge}`}>
                  <span>{factionConfig.icon}</span>
                  <span>{factionConfig.title}</span>
                </span>
                {roleDef.thoughtTitle && (
                  <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 mb-1">
                    «{roleDef.thoughtTitle}»
                  </div>
                )}
                <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${factionConfig.text}`}>
                  {roleDef.name}
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium px-2">
                {roleDef.description}
              </p>

              {/* Тайная банда для мафии */}
              {isMafiaMember && mafiaTeammates.length > 0 && (
                <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-left space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>Ваши сообщники по мафии:</span>
                  </div>
                  <div className="space-y-1">
                    {mafiaTeammates.map(mate => (
                      <div key={mate.id} className="text-xs text-white font-bold flex items-center justify-between">
                        <span>{mate.avatar || '🕶️'} {mate.name}</span>
                        <span className="text-[10px] text-rose-400 font-mono">({mate.roleName || 'Мафия'})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 text-3xl">
                🔒
              </div>
              <div className="text-sm font-black text-slate-400">
                Роль скрыта от любопытных глаз
              </div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Нажмите «Показать роль» выше, когда никто не смотрит в ваш экран.
              </p>
            </div>
          )}
        </section>

        {/* Список игроков за столом */}
        <section className="mobile-card mt-6">
          <div className="mobile-card-header">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-300">
                Жители города ({players.filter(p => p.isAlive !== false).length} живых из {players.length})
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            {players.map((p, idx) => {
              const pAlive = p.isAlive !== false;
              const isMe = p.id === myPlayer?.id;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    !pAlive
                      ? 'bg-slate-950/40 border-slate-800/50 text-slate-600 opacity-60'
                      : isMe
                      ? 'bg-purple-500/10 border-purple-500/40 text-white'
                      : 'bg-slate-950/80 border-slate-750 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{pAlive ? (p.avatar || '👤') : '💀'}</span>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span className={!pAlive ? 'line-through' : ''}>{p.name}</span>
                        {isMe && <span className="text-[10px] text-purple-300 font-bold">(Вы)</span>}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {pAlive ? `Житель #${idx + 1}` : 'Погиб'}
                      </span>
                    </div>
                  </div>

                  {p.fouls > 0 && (
                    <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      Фолы: {p.fouls}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Безопасный выход */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => onLeaveRoom?.(false)}
        isHost={false}
        customTitle="Покинуть игру в Мафию?"
        customDesc="Вы выйдете из текущей партии и вернетесь в главное меню."
      />
    </div>
  );
}
