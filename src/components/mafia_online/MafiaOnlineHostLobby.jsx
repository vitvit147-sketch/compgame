// src/components/mafia_online/MafiaOnlineHostLobby.jsx - Лобби Ведущего для настройки ролей и запуска онлайн-партии
import React, { useState, useEffect } from 'react';
import { mafiaOnlineSocket } from '../../utils/mafiaOnlineSocket';
import { sounds } from '../../utils/soundEffects';
import { sound } from '../../utils/audio';
import { ROLES, PRESETS } from '../../data/rolesData';
import ExitConfirmModal from '../common/ExitConfirmModal';
import {
  Users,
  Copy,
  Check,
  Play,
  Plus,
  Minus,
  Crown,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  Shuffle
} from 'lucide-react';

export default function MafiaOnlineHostLobby({ roomData, myPlayer, onLeaveRoom }) {
  const [copied, setCopied] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Список подключившихся игроков (кроме ведущего)
  const connectedPlayers = (roomData.players || []).filter(p => !p.isHost);
  const playerCount = connectedPlayers.length;

  // Роли для партии
  const [roleCounts, setRoleCounts] = useState({
    don: 1,
    mafioso: 1,
    sheriff: 1,
    doctor: 1,
    citizen: Math.max(0, playerCount - 4)
  });

  const [noKillFirstNight, setNoKillFirstNight] = useState(true);
  const [noKillDay1, setNoKillDay1] = useState(true);

  // При изменении числа подключенных игроков автоматически корректируем мирных
  useEffect(() => {
    if (playerCount >= 4) {
      setRoleCounts(prev => {
        const nonCitizens = Object.entries(prev).reduce((acc, [id, count]) => {
          return id === 'citizen' ? acc : acc + (count || 0);
        }, 0);
        const neededCitizens = Math.max(0, playerCount - nonCitizens);
        return {
          ...prev,
          citizen: neededCitizens
        };
      });
    }
  }, [playerCount]);

  const totalRoles = Object.values(roleCounts).reduce((a, b) => a + (b || 0), 0);
  const isRolesMatch = playerCount >= 4 && totalRoles === playerCount;

  const handleCopyLink = () => {
    sounds.playTap();
    const url = `${window.location.origin}${window.location.pathname}?mafia_room=${roomData.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const changeRoleCount = (roleId, delta) => {
    sounds.playTap();
    const current = roleCounts[roleId] || 0;
    const next = Math.max(0, current + delta);
    setRoleCounts(prev => ({
      ...prev,
      [roleId]: next
    }));
  };

  const autoFillCitizens = () => {
    sounds.playTap();
    const nonCitizens = Object.entries(roleCounts).reduce((acc, [id, count]) => {
      return id === 'citizen' ? acc : acc + (count || 0);
    }, 0);
    const needed = Math.max(0, playerCount - nonCitizens);
    setRoleCounts(prev => ({
      ...prev,
      citizen: needed
    }));
  };

  const applyPreset = (preset) => {
    sounds.playTap();
    setRoleCounts({ ...preset.roles });
    autoFillCitizens();
  };

  const handleStartGame = () => {
    if (!isRolesMatch) return;
    sound.playGong();

    // 1. Формируем пул ролей
    const rolesPool = [];
    Object.entries(roleCounts).forEach(([roleId, count]) => {
      for (let i = 0; i < count; i++) {
        rolesPool.push(roleId);
      }
    });

    // 2. Случайно перемешиваем роли
    const shuffledRoles = [...rolesPool].sort(() => Math.random() - 0.5);

    // 3. Назначаем роли подключенным игрокам
    const assignedPlayers = connectedPlayers.map((player, idx) => {
      const roleId = shuffledRoles[idx] || 'citizen';
      const roleDef = ROLES[roleId] || ROLES.citizen;
      return {
        ...player,
        number: idx + 1,
        roleId,
        roleName: roleDef.name,
        faction: roleDef.faction,
        isAlive: true,
        fouls: 0,
        luckyShield: roleDef.passiveShield || 0
      };
    });

    // 4. Отправляем в сокет
    mafiaOnlineSocket.emit('start_online_game', {
      assignedPlayers,
      settings: {
        noKillFirstNight,
        noKillDay1
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start select-none">
      {/* Шапка */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] flex items-center justify-between shadow-md">
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-750 hover:bg-rose-950/50 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 flex items-center gap-1.5 text-xs font-black transition-colors active:scale-95 touch-manipulation"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Выход</span>
        </button>

        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
            Пульт Ведущего
          </span>
          <span className="text-base font-mono font-black text-amber-400">
            Стол № {roomData.code}
          </span>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto px-5 sm:px-6 py-6 pb-48 overflow-y-auto">
        {/* Баннер номера комнаты */}
        <section className="mobile-card border-amber-500/40 text-center">
          <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest block mb-1">
            Код для подключения игроков
          </span>
          <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-[0.25em] py-1 text-center">
            {roomData.code}
          </div>
          <p className="text-xs text-slate-400 mt-2 mb-4">
            Игроки вводят этот код у себя в приложении или переходят по ссылке:
          </p>
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full min-h-[50px] py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-750 text-xs font-black uppercase tracking-wider text-amber-400 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md touch-manipulation"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Ссылка скопирована в буфер!' : 'Скопировать ссылку для игроков'}</span>
          </button>
        </section>

        {/* Подключенные игроки */}
        <section className="mobile-card">
          <div className="mobile-card-header">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h2 className="text-base sm:text-lg font-black text-white">
                  Подключились ({playerCount})
                </h2>
              </div>
              <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-full border ${
                playerCount >= 4
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
              }`}>
                {playerCount >= 4 ? 'Готовы к игре' : `Нужно минимум 4 (еще ${4 - playerCount})`}
              </span>
            </div>
          </div>

          {playerCount === 0 ? (
            <div className="p-5 text-center text-xs text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
              Пока никто не подключился. Отправьте код <strong className="text-amber-400 font-mono text-sm">{roomData.code}</strong> игрокам за столом!
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {connectedPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-750 text-xs font-bold text-white flex items-center gap-2"
                >
                  <span>{p.avatar || '👤'}</span>
                  <span>{p.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Настройка ролей */}
        <section className="mobile-card border-purple-500/30 space-y-4">
          <div className="mobile-card-header">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  Распределение ролей
                </h3>
              </div>
              <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-full border ${
                isRolesMatch
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
              }`}>
                {totalRoles} из {playerCount} ролей
              </span>
            </div>
          </div>

          {/* Готовые пресеты */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              Быстрые шаблоны под состав:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.slice(0, 4).map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-xs font-bold text-slate-300 active:scale-95 transition-all"
                >
                  {preset.name} ({preset.playerCount} чел)
                </button>
              ))}
            </div>
          </div>

          {/* Список ключевых ролей */}
          <div className="space-y-2 pt-1">
            {[
              { id: 'don', name: 'Дон Мафии', color: 'text-rose-400', icon: '🎩' },
              { id: 'mafioso', name: 'Мафиози', color: 'text-rose-400', icon: '🕶️' },
              { id: 'sheriff', name: 'Шериф (Комиссар)', color: 'text-sky-400', icon: '⭐️' },
              { id: 'doctor', name: 'Доктор', color: 'text-emerald-400', icon: '💊' },
              { id: 'putana', name: 'Путана', color: 'text-pink-400', icon: '💋' },
              { id: 'maniac', name: 'Маньяк', color: 'text-purple-400', icon: '🪓' },
              { id: 'citizen', name: 'Мирный житель', color: 'text-slate-300', icon: '👤' }
            ].map(role => {
              const count = roleCounts[role.id] || 0;
              return (
                <div
                  key={role.id}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{role.icon}</span>
                    <span className={`font-black text-xs sm:text-sm ${role.color}`}>
                      {role.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => changeRoleCount(role.id, -1)}
                      className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-750 flex items-center justify-center text-slate-300 active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-black text-sm w-4 text-center text-white">
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeRoleCount(role.id, 1)}
                      className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-750 flex items-center justify-center text-slate-300 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Кнопка автоматического заполнения мирными жителями */}
          <button
            type="button"
            onClick={autoFillCitizens}
            className="w-full py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Дополнить мирными до {playerCount} чел</span>
          </button>
        </section>

        {/* Дополнительные правила */}
        <section className="mobile-card space-y-3">
          <div className="mobile-card-header">
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">
              Баланс и правила
            </h4>
          </div>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
            <span>🛡️ Первая ночь без убийств (знакомство)</span>
            <input
              type="checkbox"
              checked={noKillFirstNight}
              onChange={(e) => setNoKillFirstNight(e.target.checked)}
              className="w-5 h-5 rounded accent-purple-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
            <span>☀️ Первый день без исключения игрока</span>
            <input
              type="checkbox"
              checked={noKillDay1}
              onChange={(e) => setNoKillDay1(e.target.checked)}
              className="w-5 h-5 rounded accent-purple-500"
            />
          </label>
        </section>
      </main>

      {/* Футер запуска игры */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-md mx-auto shadow-2xl">
        <button
          type="button"
          onClick={handleStartGame}
          disabled={!isRolesMatch}
          className={`w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 transition-all touch-manipulation ${
            isRolesMatch
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-2xl shadow-amber-950/60 active:scale-98'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
          <span>
            {playerCount < 4
              ? `Ожидание игроков (${playerCount}/4)`
              : isRolesMatch
              ? `Раздать роли и начать (${playerCount} чел) 🎭`
              : `Ролей: ${totalRoles} (нужно ровно ${playerCount})`}
          </span>
        </button>
      </footer>

      {/* Безопасный выход */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => onLeaveRoom?.(true)}
        isHost={true}
        customTitle="Закрыть стол Мафии для всех?"
        customDesc="Вы ведущий стола. Если вы закроете комнату, она удалится для всех подключенных участников."
      />
    </div>
  );
}
