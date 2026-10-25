import React, { useState } from 'react';
import { ROLES, FACTIONS, PRESETS } from '../data/rolesData';
import { Users, Shuffle, ShieldCheck, AlertTriangle, Plus, Minus, Sparkles, HeartHandshake } from 'lucide-react';
import { sound } from '../utils/audio';

export function SetupScreen({ onStartGame }) {
  // По умолчанию ставим 7 игроков и сбалансированный сетап
  const [playerCount, setPlayerCount] = useState(7);
  const [roleCounts, setRoleCounts] = useState({
    don: 1,
    mafioso: 1,
    sheriff: 1,
    doctor: 1,
    lucky: 1,
    citizen: 2
  });

  const [playerNames, setPlayerNames] = useState(
    Array.from({ length: 24 }, (_, i) => `Игрок ${i + 1}`)
  );

  const [assignMode, setAssignMode] = useState('auto'); // 'auto' | 'manual'
  const [manualAssignments, setManualAssignments] = useState({});

  // Настройки для малой компании и раздачи
  const [noKillFirstNight, setNoKillFirstNight] = useState(true);
  const [noKillDay1, setNoKillDay1] = useState(true);
  const [passAndPlayDealing, setPassAndPlayDealing] = useState(true);

  // Подсчет выбранных ролей
  const totalRolesSelected = Object.values(roleCounts).reduce((a, b) => a + (b || 0), 0);

  // Применение пресета
  const applyPreset = (preset) => {
    setPlayerCount(preset.playerCount);
    setRoleCounts({ ...preset.roles });
    // Для малых составов автоматически включаем защиту
    if (preset.playerCount <= 8) {
      setNoKillFirstNight(true);
      setNoKillDay1(true);
    }
    sound.playReveal();
  };

  // Изменение количества конкретной роли
  const changeRoleCount = (roleId, delta) => {
    const current = roleCounts[roleId] || 0;
    const next = Math.max(0, current + delta);
    setRoleCounts(prev => ({
      ...prev,
      [roleId]: next
    }));
  };

  // Автоматически дополнить мирными жителями до числа игроков
  const autoFillCitizens = () => {
    const nonCitizens = Object.entries(roleCounts).reduce((acc, [id, count]) => {
      return id === 'citizen' ? acc : acc + (count || 0);
    }, 0);
    const neededCitizens = Math.max(0, playerCount - nonCitizens);
    setRoleCounts(prev => ({
      ...prev,
      citizen: neededCitizens
    }));
  };

  // Сборка списка ролей в массив
  const getExpandedRoleList = () => {
    const list = [];
    Object.entries(roleCounts).forEach(([roleId, count]) => {
      for (let i = 0; i < count; i++) {
        list.push(roleId);
      }
    });
    return list;
  };

  // Старт игры
  const handleStart = () => {
    let finalPlayers = [];

    if (assignMode === 'auto') {
      const rolesPool = getExpandedRoleList();
      const shuffled = [...rolesPool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      finalPlayers = Array.from({ length: playerCount }, (_, i) => {
        const roleId = shuffled[i] || 'citizen';
        const roleDef = ROLES[roleId];
        return {
          id: `player_${i + 1}`,
          number: i + 1,
          name: playerNames[i] || `Игрок ${i + 1}`,
          roleId: roleId,
          roleName: roleDef.name,
          faction: roleDef.faction,
          isAlive: true,
          fouls: 0,
          luckyShield: roleDef.passiveShield || 0,
          isRevolutionaryCell: false
        };
      });
    } else {
      // Ручной режим
      finalPlayers = Array.from({ length: playerCount }, (_, i) => {
        const roleId = manualAssignments[i + 1] || 'citizen';
        const roleDef = ROLES[roleId];
        return {
          id: `player_${i + 1}`,
          number: i + 1,
          name: playerNames[i] || `Игрок ${i + 1}`,
          roleId: roleId,
          roleName: roleDef.name,
          faction: roleDef.faction,
          isAlive: true,
          fouls: 0,
          luckyShield: roleDef.passiveShield || 0,
          isRevolutionaryCell: false
        };
      });
    }

    sound.playGong();
    onStartGame(finalPlayers, {
      noKillFirstNight,
      noKillDay1,
      passAndPlayDealing
    });
  };

  const mafiaRolesCount = Object.entries(roleCounts).reduce((acc, [id, count]) => {
    return ROLES[id]?.faction === 'mafia' ? acc + (count || 0) : acc;
  }, 0);

  const hasManiac = (roleCounts.maniac || 0) > 0;
  const isDangerousSmallGame = playerCount <= 8 && hasManiac && mafiaRolesCount > 0;

  const canStart = totalRolesSelected === playerCount && mafiaRolesCount > 0;

  return (
    <div className="setup-container">
      {/* 1. Блок шаблонов */}
      <section className="setup-card">
        <h2 className="section-title">
          <Sparkles size={20} className="text-yellow-400" />
          Готовые сценарии партий
        </h2>
        <div className="presets-grid">
          {PRESETS.map(preset => (
            <div 
              key={preset.id} 
              className={`preset-card ${playerCount === preset.playerCount && JSON.stringify(roleCounts) === JSON.stringify(preset.roles) ? 'active' : ''}`}
              onClick={() => applyPreset(preset)}
            >
              <div className="preset-header">
                <h3>{preset.name}</h3>
                <span className="preset-count">{preset.playerCount} чел.</span>
              </div>
              <p className="preset-desc">{preset.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Количество игроков */}
      <section className="setup-card">
        <div className="flex-between">
          <h2 className="section-title">
            <Users size={20} className="text-blue-400" />
            Количество участников за столом
          </h2>
          <div className="count-stepper">
            <button 
              className="stepper-btn" 
              onClick={() => {
                const next = Math.max(5, playerCount - 1);
                setPlayerCount(next);
              }}
            >
              <Minus size={16} />
            </button>
            <span className="stepper-value">{playerCount}</span>
            <button 
              className="stepper-btn" 
              onClick={() => {
                const next = Math.min(24, playerCount + 1);
                setPlayerCount(next);
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Индикатор баланса ролей */}
        <div className={`balance-bar ${totalRolesSelected === playerCount ? 'valid' : 'invalid'}`}>
          <div className="balance-info">
            <span>Выбрано карт: <strong>{totalRolesSelected}</strong> из <strong>{playerCount}</strong></span>
            {totalRolesSelected !== playerCount && (
              <span className="balance-warning">
                {totalRolesSelected < playerCount 
                  ? `(Не хватает еще ${playerCount - totalRolesSelected} карт)`
                  : `(Лишних карт: ${totalRolesSelected - playerCount})`}
              </span>
            )}
          </div>
          {totalRolesSelected !== playerCount && (
            <button className="btn-secondary btn-sm" onClick={autoFillCitizens}>
              Заполнить мирными ({playerCount - (totalRolesSelected - (roleCounts.citizen || 0))})
            </button>
          )}
        </div>
      </section>

      {/* 3. СПЕЦИАЛЬНЫЙ БЛОК: Баланс для малой компании (5-8 человек) */}
      <section className="setup-card small-company-card">
        <div className="section-title-wrap">
          <h2 className="section-title">
            <ShieldCheck size={22} className="text-emerald-400" />
            Баланс для малой компании ({playerCount} игроков)
          </h2>
          <span className="badge-small-team">Анти-вылет за 1 ночь</span>
        </div>

        <p className="small-company-intro">
          В компании из 7 человек две смерти за ночь или быстрая ошибка днем моментально заканчивают игру. Эти правила дают городу полноценно поиграть:
        </p>

        <div className="small-rules-options">
          <label className="checkbox-card-label">
            <input 
              type="checkbox" 
              checked={passAndPlayDealing}
              onChange={(e) => setPassAndPlayDealing(e.target.checked)}
            />
            <div className="checkbox-card-content">
              <strong>📱 Раздача ролей через телефон (Pass & Play)</strong>
              <span>Игроки по очереди берут телефон и тайно смотрят свою карту. Если у вас пластиковые/бумажные карты — снимите галочку.</span>
            </div>
          </label>

          <label className="checkbox-card-label">
            <input 
              type="checkbox" 
              checked={noKillFirstNight}
              onChange={(e) => setNoKillFirstNight(e.target.checked)}
            />
            <div className="checkbox-card-content">
              <strong>🌙 Ночь #1: Знакомство без убийств</strong>
              <span>Мафия просыпается только познакомиться. Выстрела в первую ночь нет! Шериф и Доктор делают ознакомительные ходы.</span>
            </div>
          </label>

          <label className="checkbox-card-label">
            <input 
              type="checkbox" 
              checked={noKillDay1}
              onChange={(e) => setNoKillDay1(e.target.checked)}
            />
            <div className="checkbox-card-content">
              <strong>🕊️ День #1: Право на помилование («Без казни»)</strong>
              <span>В первый день город может воздержаться и никого не казнить, чтобы не убить своего мирного жителя вслепую.</span>
            </div>
          </label>
        </div>

        {/* Предупреждение о Маньяке при 7 игроках */}
        {isDangerousSmallGame && (
          <div className="small-company-danger">
            <AlertTriangle size={20} className="text-amber-400 flex-shrink-0" />
            <div>
              <strong>Внимание по балансу!</strong> На {playerCount} человек выбраны одновременно Мафия и Маньяк (2 трупа за ночь). При 2 выстрелах игра закончится уже к утру 2-го дня!
              <div className="danger-tip">
                💡 <em>Совет:</em> Для 7 игроков лучше взять <strong>Революционера</strong> (он вербует, а не убивает) или оставить только Мафию со <strong>Счастливчиком</strong>.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Выбор ролей по фракциям */}
      <section className="setup-card">
        <h2 className="section-title">Выбор активных ролей</h2>
        
        {['city', 'mafia', 'renegade'].map(factionKey => {
          const faction = FACTIONS[factionKey.toUpperCase()];
          const rolesInFaction = Object.values(ROLES).filter(r => r.faction === factionKey);

          return (
            <div key={factionKey} className="faction-group">
              <div className="faction-header" style={{ borderLeftColor: faction.color }}>
                <span className="faction-badge">{faction.badge}</span>
                <h3>{faction.name}</h3>
              </div>

              <div className="roles-grid">
                {rolesInFaction.map(role => {
                  const count = roleCounts[role.id] || 0;
                  const isSelected = count > 0;

                  return (
                    <div 
                      key={role.id} 
                      className={`role-select-card ${isSelected ? 'selected' : ''}`}
                      style={{ borderColor: isSelected ? faction.color : undefined }}
                    >
                      <div className="role-card-top">
                        <span className="role-name">{role.name}</span>
                        {role.id === 'lucky' && <span className="tag-lucky">🛡 1 хит</span>}
                        {role.id === 'revolutionary' && <span className="tag-rev">🚩 Вербовщик</span>}
                      </div>
                      <p className="role-card-desc">{role.shortDesc}</p>

                      <div className="role-card-controls">
                        <button 
                          className="role-btn-minus"
                          onClick={() => changeRoleCount(role.id, -1)}
                          disabled={count === 0}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="role-counter">{count}</span>
                        <button 
                          className="role-btn-plus"
                          onClick={() => changeRoleCount(role.id, 1)}
                          disabled={role.id !== 'citizen' && role.id !== 'mafioso' && count >= 1}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* 5. Режим раздачи: Авто или Вручную по физическим картам */}
      <section className="setup-card">
        <h2 className="section-title">
          <Shuffle size={20} className="text-emerald-400" />
          Способ раздачи ролей игрокам
        </h2>

        <div className="mode-toggle">
          <button 
            className={`mode-btn ${assignMode === 'auto' ? 'active' : ''}`}
            onClick={() => setAssignMode('auto')}
          >
            🎲 Авто-раздача (приложение перемешает и раздаст)
          </button>
          <button 
            className={`mode-btn ${assignMode === 'manual' ? 'active' : ''}`}
            onClick={() => setAssignMode('manual')}
          >
            🃏 Физические карты (ведущий введет кому что выпало)
          </button>
        </div>

        {/* Список игроков для редактирования имен */}
        <div className="players-setup-list">
          <div className="players-grid">
            {Array.from({ length: playerCount }, (_, i) => {
              const pNum = i + 1;
              return (
                <div key={pNum} className="player-row">
                  <span className="player-num-badge">№{pNum}</span>
                  <input 
                    type="text" 
                    className="player-name-input"
                    value={playerNames[i]}
                    onChange={(e) => {
                      const newNames = [...playerNames];
                      newNames[i] = e.target.value;
                      setPlayerNames(newNames);
                    }}
                    placeholder={`Игрок ${pNum}`}
                  />

                  {assignMode === 'manual' && (
                    <select 
                      className="player-role-select"
                      value={manualAssignments[pNum] || 'citizen'}
                      onChange={(e) => {
                        setManualAssignments(prev => ({
                          ...prev,
                          [pNum]: e.target.value
                        }));
                      }}
                    >
                      {Object.values(ROLES).map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.faction === 'mafia' ? 'Мафия' : r.faction === 'renegade' ? 'Отщепенец' : 'Мирный'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Кнопка запуска */}
      <div className="start-game-bar">
        {!canStart && (
          <div className="start-warning">
            <AlertTriangle size={18} />
            <span>
              {totalRolesSelected !== playerCount 
                ? `Количество ролей (${totalRolesSelected}) должно точно совпадать с числом игроков (${playerCount})!`
                : 'В игре должна присутствовать хотя бы одна мафия!'}
            </span>
          </div>
        )}

        <button 
          className="btn-start-game"
          disabled={!canStart}
          onClick={handleStart}
        >
          <span>{passAndPlayDealing ? 'РАЗДАТЬ РОЛИ ИГРОКАМ 📱' : 'НАЧАТЬ ПЕРВУЮ НОЧЬ 🌙'}</span>
        </button>
      </div>
    </div>
  );
}
