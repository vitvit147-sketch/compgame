import React, { useState } from 'react';
import { ROLES } from '../data/rolesData';
import { Moon, Check, ChevronRight, ChevronLeft, ShieldAlert, AlertCircle, Bell, UserCheck, Eye, EyeOff } from 'lucide-react';
import { sound } from '../utils/audio';

export function NightPhase({ round, players, onFinishNight, previousNightActions, settings = {} }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [nightActions, setNightActions] = useState({});
  const [inspectorResult, setInspectorResult] = useState(null);

  const isFirstNightNoKill = round === 1 && settings?.noKillFirstNight;

  // 1. Формируем список шагов на эту ночь (только живые роли с ночными действиями)
  const alivePlayers = players.filter(p => p.isAlive);

  // Определяем, кто активен
  const steps = [];

  // Путана
  if (alivePlayers.some(p => p.roleId === 'putana')) {
    steps.push({
      roleId: 'putana',
      title: 'Путана (Любовница)',
      key: 'putana',
      speech: 'Город засыпает. Просыпается Путана. Путана выбирает, к кому пойти в гости этой ночью...',
      desc: 'Выберите одного игрока, чье ночное действие будет полностью заблокировано.',
      targetType: 'single',
      canSelf: false
    });
  }

  // Шулер
  if (alivePlayers.some(p => p.roleId === 'cardsharp')) {
    steps.push({
      roleId: 'cardsharp',
      title: 'Шулер',
      key: 'cardsharp',
      speech: 'Просыпается Шулер. Шулер тасует судьбы двух жителей...',
      desc: 'Выберите двух игроков, чьи личности поменяются местами для всех действий этой ночи.',
      targetType: 'double',
      canSelf: true
    });
  }

  // Вор
  if (alivePlayers.some(p => p.roleId === 'thief')) {
    steps.push({
      roleId: 'thief',
      title: 'Вор',
      key: 'thief',
      speech: 'Просыпается Вор. У кого сегодня исчезнет ночная способность?',
      desc: 'Выберите игрока для кражи способности.',
      targetType: 'single',
      canSelf: false
    });
  }

  // Адвокат
  if (alivePlayers.some(p => p.roleId === 'lawyer')) {
    steps.push({
      roleId: 'lawyer',
      title: 'Адвокат Мафии',
      key: 'lawyer',
      speech: 'Просыпается Адвокат. Кого из мафии вы прикрываете алиби от Шерифа?',
      desc: 'Выберите члена мафии (или себя). Для Шерифа он покажется «Мирным».',
      targetType: 'single',
      canSelf: true,
      filterFaction: 'mafia'
    });
  }

  // Доктор
  if (alivePlayers.some(p => p.roleId === 'doctor')) {
    steps.push({
      roleId: 'doctor',
      title: 'Доктор (Лекарь)',
      key: 'doctor',
      speech: 'Просыпается Доктор. Кого вы сегодня исцелите от смертельной раны?',
      desc: 'Выберите одного игрока для спасения. (Нельзя лечить одного и того же 2 ночи подряд)',
      targetType: 'single',
      canSelf: true
    });
  }

  // Телохранитель
  if (alivePlayers.some(p => p.roleId === 'bodyguard')) {
    steps.push({
      roleId: 'bodyguard',
      title: 'Телохранитель',
      key: 'bodyguard',
      speech: 'Просыпается Телохранитель. Кого вы берете под личную охрану?',
      desc: 'Если подопечного атакуют, телохранитель примет огонь на себя.',
      targetType: 'single',
      canSelf: false
    });
  }

  // Мафия (общий выстрел или знакомство)
  const aliveMafia = alivePlayers.filter(p => p.faction === 'mafia');
  if (aliveMafia.length > 0) {
    steps.push({
      roleId: 'mafioso',
      title: isFirstNightNoKill ? 'Мафия (Знакомство — БЕЗ ВЫСТРЕЛА)' : 'Мафия (Синдикат)',
      key: 'mafia',
      speech: isFirstNightNoKill
        ? 'Город засыпает. Просыпается Мафия в полном составе! Познакомьтесь друг с другом, поприветствуйте Дона. Этой ночью выстрел не производится.'
        : 'Город засыпает. Просыпается Мафия в полном составе! Выберите жертву ночного выстрела.',
      desc: isFirstNightNoKill
        ? 'Мафия только знакомится и договаривается. Нажимать на игроков не требуется.'
        : 'Дон и мафиози единогласно указывают на игрока для устранения.',
      targetType: isFirstNightNoKill ? 'none' : 'single',
      canSelf: false
    });
  }

  // Дон Мафии (проверка на Шерифа)
  const aliveDon = alivePlayers.filter(p => p.roleId === 'don');
  if (aliveDon.length > 0) {
    steps.push({
      roleId: 'don',
      title: 'Дон Мафии (Поиск Шерифа)',
      key: 'don',
      speech: 'Мафия засыпает. Дон остается один и ищет Шерифа города...',
      desc: 'Дон указывает на подозреваемого. Ведущий жестом отвечает «Да/Нет».',
      targetType: 'single',
      canSelf: false,
      isInspection: 'don_sheriff'
    });
  }

  // Маньяк
  if (alivePlayers.some(p => p.roleId === 'maniac')) {
    steps.push({
      roleId: 'maniac',
      title: isFirstNightNoKill ? 'Маньяк (Знакомство с ведущим)' : 'Маньяк (Одиночка)',
      key: 'maniac',
      speech: isFirstNightNoKill
        ? 'Просыпается Маньяк. Покажитесь ведущему. В первую ночь вы только осматриваете город, выстрела нет.'
        : 'В ночной тьме на кровавую охоту выходит Маньяк...',
      desc: isFirstNightNoKill ? 'Маньяк просто подтверждает свою роль ведущему.' : 'Маньяк выбирает свою жертву.',
      targetType: isFirstNightNoKill ? 'none' : 'single',
      canSelf: false
    });
  }

  // Революционер
  if (alivePlayers.some(p => p.roleId === 'revolutionary')) {
    steps.push({
      roleId: 'revolutionary',
      title: 'Революционер',
      key: 'revolutionary',
      speech: 'Просыпается Революционер. Кого вы вербуете в Ячейку Восстания?',
      desc: 'Революционер склоняет жителя на свою сторону (мирные вербуются, мафия иммунна).',
      targetType: 'single',
      canSelf: false
    });
  }

  // Шериф (или Сержант, если Шериф погиб)
  const aliveSheriff = alivePlayers.filter(p => p.roleId === 'sheriff');
  const aliveSergeant = alivePlayers.filter(p => p.roleId === 'sergeant');
  if (aliveSheriff.length > 0 || aliveSergeant.length > 0) {
    const isSergeantTurn = aliveSheriff.length === 0;
    steps.push({
      roleId: isSergeantTurn ? 'sergeant' : 'sheriff',
      title: isSergeantTurn ? 'Сержант (вместо погибшего Шерифа)' : 'Комиссар (Шериф)',
      key: 'sheriff',
      speech: isSergeantTurn 
        ? 'Просыпается Сержант, принявший значок Шерифа. Кто вызывает подозрение?' 
        : 'Просыпается Шериф. Укажите игрока для проверки на причастность к криминалу.',
      desc: 'Ведущий показывает Шерифу: «Мирный» (палец вверх/зеленый) или «Мафия» (палец вниз/красный).',
      targetType: 'single',
      canSelf: false,
      isInspection: 'sheriff_faction'
    });
  }

  // Журналист
  if (alivePlayers.some(p => p.roleId === 'journalist')) {
    steps.push({
      roleId: 'journalist',
      title: 'Журналист',
      key: 'journalist',
      speech: 'Просыпается Журналист. Укажите двух жителей для журналистского расследования.',
      desc: 'Ведущий жестом сообщает: они из одной команды или из разных.',
      targetType: 'double',
      canSelf: false,
      isInspection: 'journalist_compare'
    });
  }

  // Священник
  if (alivePlayers.some(p => p.roleId === 'priest')) {
    steps.push({
      roleId: 'priest',
      title: 'Священник',
      key: 'priest',
      speech: 'Просыпается Священник. К кому вы идете принимать исповедь?',
      desc: 'Ведущий показывает Священнику точную роль выбранного жителя.',
      targetType: 'single',
      canSelf: false,
      isInspection: 'priest_role'
    });
  }

  // Свидетель
  if (alivePlayers.some(p => p.roleId === 'witness')) {
    steps.push({
      roleId: 'witness',
      title: 'Свидетель (Бомж)',
      key: 'witness',
      speech: 'Просыпается Свидетель. За чьим порогом вы сегодня следите из подворотни?',
      desc: 'Утром Свидетель узнает номер того, кто приходил к выбранному игроку.',
      targetType: 'single',
      canSelf: false
    });
  }

  const currentStep = steps[currentStepIndex] || null;

  // Игроки, которые просыпаются на текущем шаге
  const activeActors = currentStep 
    ? alivePlayers.filter(p => {
        if (currentStep.key === 'mafia') return p.faction === 'mafia';
        return p.roleId === currentStep.roleId;
      })
    : [];

  // Проверка: был ли этот персонаж заблокирован Путаной?
  const isActorBlockedByPutana = activeActors.some(p => nightActions.putana === p.id);

  // Выбор цели
  const handleSelectTarget = (targetPlayerId) => {
    if (!currentStep) return;

    sound.playTick();

    if (currentStep.targetType === 'single') {
      const isAlreadySelected = nightActions[currentStep.key] === targetPlayerId;
      const newAction = isAlreadySelected ? null : targetPlayerId;

      setNightActions(prev => ({
        ...prev,
        [currentStep.key]: newAction
      }));

      // Если это проверка (Шериф, Дон, Священник) — подготовить результат для ведущего
      if (newAction && currentStep.isInspection) {
        calculateInspectionResult(currentStep.isInspection, newAction);
      } else {
        setInspectorResult(null);
      }
    } else if (currentStep.targetType === 'double') {
      const currentList = nightActions[currentStep.key] || [];
      let updatedList = [];
      if (currentList.includes(targetPlayerId)) {
        updatedList = currentList.filter(id => id !== targetPlayerId);
      } else {
        if (currentList.length < 2) {
          updatedList = [...currentList, targetPlayerId];
        } else {
          updatedList = [currentList[1], targetPlayerId];
        }
      }
      setNightActions(prev => ({
        ...prev,
        [currentStep.key]: updatedList
      }));

      if (updatedList.length === 2 && currentStep.isInspection === 'journalist_compare') {
        const p1 = players.find(p => p.id === updatedList[0]);
        const p2 = players.find(p => p.id === updatedList[1]);
        const sameTeam = p1?.faction === p2?.faction;
        setInspectorResult({
          type: 'journalist',
          title: sameTeam ? '👥 ОДНА КОМАНДА' : '⚡ РАЗНЫЕ КОМАНДЫ',
          badgeColor: sameTeam ? '#10b981' : '#f59e0b',
          desc: `Игрок №${p1?.number} (${p1?.roleName}) и Игрок №${p2?.number} (${p2?.roleName})`
        });
        sound.playReveal();
      } else {
        setInspectorResult(null);
      }
    }
  };

  // Расчет результата проверки для ведущего
  const calculateInspectionResult = (inspectionType, targetId) => {
    const target = players.find(p => p.id === targetId);
    if (!target) return;

    if (inspectionType === 'sheriff_faction') {
      // Учитываем Адвоката! Если Адвокат прикрыл эту мафию, показываем мирный
      const isCoveredByLawyer = nightActions.lawyer === target.id;
      const isMafia = target.faction === 'mafia' && !isCoveredByLawyer;

      setInspectorResult({
        type: 'sheriff',
        title: isMafia ? '🔴 МАФИЯ' : '🟢 МИРНЫЙ ЖИТЕЛЬ',
        badgeColor: isMafia ? '#ef4444' : '#10b981',
        desc: isCoveredByLawyer ? '⚠️ Игрок из Мафии, но прикрыт Адвокатом (покажите Шерифу: МИРНЫЙ)!' : `Игрок №${target.number}: роль «${target.roleName}»`
      });
      sound.playReveal();
    } else if (inspectionType === 'don_sheriff') {
      const isSheriff = target.roleId === 'sheriff';
      setInspectorResult({
        type: 'don',
        title: isSheriff ? '🎯 ДА, ЭТО ШЕРИФ!' : '⚪ НЕТ, НЕ ШЕРИФ',
        badgeColor: isSheriff ? '#10b981' : '#64748b',
        desc: `Игрок №${target.number} имеет роль «${target.roleName}»`
      });
      sound.playReveal();
    } else if (inspectionType === 'priest_role') {
      setInspectorResult({
        type: 'priest',
        title: `📜 РОЛЬ: ${target.roleName.toUpperCase()}`,
        badgeColor: '#a855f7',
        desc: `Фракция: ${target.faction === 'mafia' ? 'Мафия' : target.faction === 'renegade' ? 'Отщепенец' : 'Мирные'}`
      });
      sound.playReveal();
    }
  };

  const handleNextStep = () => {
    setInspectorResult(null);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Конец ночи!
      sound.playMorning();
      onFinishNight(nightActions);
    }
  };

  const handlePrevStep = () => {
    setInspectorResult(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (steps.length === 0) {
    return (
      <div className="night-container empty">
        <h2>В городе не осталось активных ночных ролей.</h2>
        <button className="btn-primary" onClick={() => onFinishNight({})}>
          Рассчитать утро
        </button>
      </div>
    );
  }

  const selectedTargets = currentStep.targetType === 'single'
    ? [nightActions[currentStep.key]].filter(Boolean)
    : (nightActions[currentStep.key] || []);

  const currentRoleDef = ROLES[currentStep.roleId];

  return (
    <div className="night-container">
      {/* Шапка шагов */}
      <div className="night-wizard-header flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {currentRoleDef?.image && (
            <div className="w-14 h-16 rounded-xl overflow-hidden border-2 border-amber-500/40 bg-slate-950 shadow-lg flex-shrink-0">
              <img src={currentRoleDef.image} alt={currentStep.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="step-progress-info">
            <span className="step-count">Шаг {currentStepIndex + 1} из {steps.length}</span>
            <h2 className="step-role-title">
              <Moon size={22} className="text-purple-400" />
              {currentStep.title}
            </h2>
            {currentRoleDef?.thoughtTitle && (
              <span className="text-[11px] font-mono text-amber-400/80 block mt-0.5">
                «{currentRoleDef.thoughtTitle}»
              </span>
            )}
          </div>
        </div>

        <div className="actor-badges">
          <span className="actor-label">Просыпаются за столом:</span>
          {activeActors.map(actor => (
            <span key={actor.id} className="actor-pill">
              №{actor.number} {actor.name}
            </span>
          ))}
        </div>
      </div>

      {/* Предупреждение о блоке Путаны */}
      {isActorBlockedByPutana && (
        <div className="alert-blocked">
          <AlertCircle size={20} />
          <div>
            <strong>ВНИМАНИЕ ВЕДУЩЕМУ!</strong> Этот игрок этой ночью был заблокирован Путаной. Вы можете сделать вид, что приняли действие, но оно не будет иметь эффекта.
          </div>
        </div>
      )}

      {/* Реплика ведущего (что говорить вслух) */}
      <div className="speech-box">
        <div className="speech-header">
          <span className="speech-tag">🎙 СЛОВА ВЕДУЩЕГО (ОЗВУЧИТЕ ВСЛУХ):</span>
          <button className="btn-mini-sound" onClick={() => sound.playGong()} title="Подать тихий звуковой сигнал">
            <Bell size={14} /> Сигнал
          </button>
        </div>
        <p className="speech-text">«{currentStep.speech}»</p>
        <span className="speech-hint">💡 {currentStep.desc}</span>
      </div>

      {/* Секретный результат проверки (если есть) */}
      {inspectorResult && (
        <div className="secret-card-reveal" style={{ borderColor: inspectorResult.badgeColor }}>
          <div className="reveal-badge" style={{ backgroundColor: inspectorResult.badgeColor }}>
            {inspectorResult.title}
          </div>
          <p className="reveal-desc">{inspectorResult.desc}</p>
          <span className="reveal-note">Покажите результат игроку жестом согласно правилам!</span>
        </div>
      )}

      {/* Сетка игроков для выбора цели или плашка знакомства */}
      {currentStep.targetType === 'none' ? (
        <div className="no-target-box">
          <span className="no-target-emoji">🕊️</span>
          <div className="no-target-info">
            <h4>Ночь знакомства (выстрелы отключены)</h4>
            <p>В эту ночь никто не погибает. Нажмите «Далее», чтобы перейти к следующему персонажу.</p>
          </div>
        </div>
      ) : (
        <div className="targets-section">
          <h3 className="targets-title">Выберите цель действия:</h3>
          <div className="targets-grid">
            {players.map(player => {
              const isSelected = selectedTargets.includes(player.id);
              const isDead = !player.isAlive;
              const isSelfActor = activeActors.some(a => a.id === player.id);
              const isDisabled = isDead || (isSelfActor && !currentStep.canSelf);

              return (
                <button
                  key={player.id}
                  className={`target-card ${isSelected ? 'selected' : ''} ${isDead ? 'dead' : ''}`}
                  disabled={isDisabled}
                  onClick={() => handleSelectTarget(player.id)}
                >
                  <div className="target-num">№{player.number}</div>
                  <div className="target-info">
                    <div className="target-name">{player.name}</div>
                    <div className="target-role-sub">
                      {/* Ведущий видит реальную роль */}
                      {player.roleName}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="target-check">
                      <Check size={18} />
                    </div>
                  )}
                  {isDead && <span className="dead-tag">Погиб</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Навигация внизу */}
      <div className="night-nav-footer">
        <button 
          className="btn-nav-prev"
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft size={18} />
          <span>Назад</span>
        </button>

        <div className="target-summary">
          {selectedTargets.length > 0 ? (
            <span>Выбрано: {selectedTargets.map(id => `№${players.find(p => p.id === id)?.number}`).join(', ')}</span>
          ) : (
            <span className="text-gray-400">Цель не выбрана (действие пропущено)</span>
          )}
        </div>

        <button 
          className="btn-nav-next"
          onClick={handleNextStep}
        >
          <span>{currentStepIndex === steps.length - 1 ? 'Завершить ночь ☀️' : 'Далее'}</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
