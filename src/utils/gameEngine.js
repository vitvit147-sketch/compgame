// Движок расчета ночных событий и победных условий

export function resolveNight(players, nightActions) {
  // Копируем игроков для вычисления изменений
  let updatedPlayers = players.map(p => ({ ...p }));
  const logs = [];
  const morningAnnouncements = [];

  // 1. Кто заблокирован Путаной?
  const blockedPlayerId = nightActions.putana;
  if (blockedPlayerId) {
    const blockedPlayer = updatedPlayers.find(p => p.id === blockedPlayerId);
    logs.push(`Путана посетила игрока №${blockedPlayer?.number} (${blockedPlayer?.name}) и заблокировала его ночное действие.`);
  }

  // Проверка: заблокирован ли Доктор?
  const doctorPlayer = updatedPlayers.find(p => p.roleId === 'doctor' && p.isAlive);
  const isDoctorBlocked = doctorPlayer && blockedPlayerId === doctorPlayer.id;

  // Проверка: заблокирован ли Маньяк?
  const maniacPlayer = updatedPlayers.find(p => p.roleId === 'maniac' && p.isAlive);
  const isManiacBlocked = maniacPlayer && blockedPlayerId === maniacPlayer.id;

  // Проверка: заблокирован ли Революционер?
  const revPlayer = updatedPlayers.find(p => p.roleId === 'revolutionary' && p.isAlive);
  const isRevBlocked = revPlayer && blockedPlayerId === revPlayer.id;

  // Подмена Шулера (если был активен)
  let swapTargets = nightActions.cardsharp; // [id1, id2]
  const remapTarget = (id) => {
    if (!id || !swapTargets || swapTargets.length !== 2) return id;
    if (id === swapTargets[0]) return swapTargets[1];
    if (id === swapTargets[1]) return swapTargets[0];
    return id;
  };

  // 2. Цели нападения
  const hits = {}; // playerId -> array of attackers ['mafia', 'maniac']

  // Выстрел мафии
  let mafiaTargetId = remapTarget(nightActions.mafia);
  if (mafiaTargetId) {
    if (!hits[mafiaTargetId]) hits[mafiaTargetId] = [];
    hits[mafiaTargetId].push('Мафия');
  }

  // Выстрел маньяка
  let maniacTargetId = remapTarget(nightActions.maniac);
  if (maniacTargetId && !isManiacBlocked) {
    if (!hits[maniacTargetId]) hits[maniacTargetId] = [];
    hits[maniacTargetId].push('Маньяк');
  }

  // 3. Защита Телохранителя
  let bodyguardTargetId = remapTarget(nightActions.bodyguard);
  const bodyguardPlayer = updatedPlayers.find(p => p.roleId === 'bodyguard' && p.isAlive);
  const isBodyguardBlocked = bodyguardPlayer && blockedPlayerId === bodyguardPlayer.id;

  if (bodyguardTargetId && !isBodyguardBlocked && bodyguardPlayer) {
    // Если на подопечного покушались
    if (hits[bodyguardTargetId] && hits[bodyguardTargetId].length > 0) {
      logs.push(`Телохранитель защитил Игрока №${updatedPlayers.find(p => p.id === bodyguardTargetId)?.number} и принял огонь на себя!`);
      // Переносим 1 удар на самого телохранителя
      const transferredHit = hits[bodyguardTargetId].shift();
      if (!hits[bodyguardPlayer.id]) hits[bodyguardPlayer.id] = [];
      hits[bodyguardPlayer.id].push(transferredHit + ' (через защиту)');
    }
  }

  // 4. Лечение Доктора
  let doctorTargetId = remapTarget(nightActions.doctor);
  let wasHealed = false;
  if (doctorTargetId && !isDoctorBlocked) {
    if (hits[doctorTargetId] && hits[doctorTargetId].length > 0) {
      const savedFrom = hits[doctorTargetId].shift(); // Снимаем 1 ранение
      wasHealed = true;
      logs.push(`Доктор успешно вылечил Игрока №${updatedPlayers.find(p => p.id === doctorTargetId)?.number} от атаки [${savedFrom}]!`);
    } else {
      logs.push(`Доктор оказал профилактическую помощь Игроку №${updatedPlayers.find(p => p.id === doctorTargetId)?.number}.`);
    }
  }

  // 5. Обработка урона и механика Счастливчика
  const killedPlayerIds = [];

  for (const [targetId, attackers] of Object.entries(hits)) {
    if (attackers.length === 0) continue;

    const victimIndex = updatedPlayers.findIndex(p => p.id === targetId);
    if (victimIndex === -1) continue;

    const victim = updatedPlayers[victimIndex];

    // Проверяем, Счастливчик ли это с активным щитом
    if (victim.roleId === 'lucky' && (victim.luckyShield ?? 1) > 0) {
      // Счастливчик поглощает первое покушение!
      updatedPlayers[victimIndex] = {
        ...victim,
        luckyShield: 0,
        luckyHitHistory: true
      };
      logs.push(`✨ СЧАСТЛИВЧИК: На Игрока №${victim.number} (${victim.name}) было совершено покушение (${attackers.join(', ')}), но его щит удачи сработал! Он выжил!`);
      morningAnnouncements.push(`Этой ночью на Игрока №${victim.number} было совершено нападение, но невероятная удача спасла ему жизнь!`);
      
      // Если было 2 нападения одновременно, второй удар все равно убивает
      if (attackers.length > 1) {
        updatedPlayers[victimIndex].isAlive = false;
        killedPlayerIds.push(victim.id);
        logs.push(`Однако второй выстрел оказался смертельным для Счастливчика!`);
      }
    } else {
      // Игрок погибает
      updatedPlayers[victimIndex] = {
        ...victim,
        isAlive: false,
        deathReason: attackers.join(', ')
      };
      killedPlayerIds.push(victim.id);
      logs.push(`💀 Игрок №${victim.number} (${victim.name}, роль: ${victim.roleName}) погиб от рук: ${attackers.join(', ')}.`);
    }
  }

  // 6. Вербовка Революционера
  let revRecruitTargetId = remapTarget(nightActions.revolutionary);
  if (revRecruitTargetId && !isRevBlocked) {
    const recruitTarget = updatedPlayers.find(p => p.id === revRecruitTargetId);
    if (recruitTarget && recruitTarget.isAlive) {
      if (recruitTarget.faction === 'mafia') {
        logs.push(`Революционер попытался завербовать Игрока №${recruitTarget.number}, но тот оказался членом Мафии. Вербовка провалена!`);
      } else {
        const rIndex = updatedPlayers.findIndex(p => p.id === revRecruitTargetId);
        updatedPlayers[rIndex] = {
          ...recruitTarget,
          isRevolutionaryCell: true
        };
        logs.push(`🚩 Революционер успешно завербовал Игрока №${recruitTarget.number} (${recruitTarget.name}) в Ячейку Революции!`);
      }
    }
  }

  // 7. Формирование речи ведущего для утра
  let morningSpeech = '';
  if (killedPlayerIds.length === 0) {
    morningSpeech = 'Доброе утро, город! Ночь прошла на удивление спокойно: все жители проснулись живыми и невредимыми!';
  } else {
    const deadDescriptions = killedPlayerIds.map(id => {
      const p = updatedPlayers.find(pl => pl.id === id);
      return `Игрок №${p.number} (${p.name})`;
    }).join(' и ');
    morningSpeech = `Город просыпается в трауре. Этой ночью нас покинули: ${deadDescriptions}. Давайте почтим их память минутой тишины.`;
  }

  return {
    updatedPlayers,
    killedPlayerIds,
    logs,
    morningAnnouncements,
    morningSpeech,
    blockedPlayerId
  };
}

// Проверка условий победы
export function checkWinCondition(players) {
  const alive = players.filter(p => p.isAlive);
  const aliveCount = alive.length;

  if (aliveCount === 0) {
    return { winner: 'none', title: 'Ничья', reason: 'Все жители города погибли.' };
  }

  const mafiaAlive = alive.filter(p => p.faction === 'mafia');
  const cityAlive = alive.filter(p => p.faction === 'city');
  const maniacAlive = alive.filter(p => p.roleId === 'maniac');
  const revolutionaryAlive = alive.filter(p => p.roleId === 'revolutionary');
  const revCellAlive = alive.filter(p => p.isRevolutionaryCell || p.roleId === 'revolutionary');

  // Победа Революции (если революционеры составляют большинство)
  if (revolutionaryAlive.length > 0 && revCellAlive.length >= Math.ceil(aliveCount / 2)) {
    return {
      winner: 'revolutionary',
      title: 'Победа Революции!',
      color: '#a855f7',
      reason: `Ячейка Революции перехватила власть в городе (${revCellAlive.length} из ${aliveCount} выживших)!`
    };
  }

  // Победа Маньяка
  if (maniacAlive.length > 0 && aliveCount <= 2 && mafiaAlive.length === 0) {
    return {
      winner: 'maniac',
      title: 'Победа Маньяка!',
      color: '#f97316',
      reason: 'Маньяк остался один на один с последней жертвой и уничтожил весь город!'
    };
  }

  // Победа Мафии
  if (mafiaAlive.length >= (aliveCount - mafiaAlive.length) && maniacAlive.length === 0) {
    return {
      winner: 'mafia',
      title: 'Победа Мафии!',
      color: '#ef4444',
      reason: `Мафия захватила контроль над городом (${mafiaAlive.length} мафиози против ${aliveCount - mafiaAlive.length} остальных)!`
    };
  }

  // Победа Города
  if (mafiaAlive.length === 0 && maniacAlive.length === 0 && revolutionaryAlive.length === 0) {
    return {
      winner: 'city',
      title: 'Победа Города (Мирные)!',
      color: '#3b82f6',
      reason: 'Вся мафия и опасные отщепенцы полностью устранены! Мирные жители спасли город.'
    };
  }

  return null; // Игра продолжается
}
