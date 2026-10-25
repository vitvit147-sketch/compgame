import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Clock, Target, Check, AlertOctagon, Skull, Moon, Volume2, ShieldAlert } from 'lucide-react';
import { sound } from '../utils/audio';

export function DayPhase({ round, players, setPlayers, onFinishDay, onKamikazeWin, settings = {} }) {
  // Таймер речей
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeSpeakerIndex, setActiveSpeakerIndex] = useState(0);

  // Кандидаты на голосование (массив id игроков)
  const [nominatedIds, setNominatedIds] = useState([]);

  // Режим: 'discussion' (спичи по кругу) или 'voting' (подсчет голосов)
  const [subPhase, setSubPhase] = useState('discussion');

  // Результаты голосования: { [candidateId]: { votesCount: number, mayorVoted: boolean } }
  const [voteResults, setVoteResults] = useState({});

  // Игрок, приговоренный к казни
  const [executedPlayerId, setExecutedPlayerId] = useState(null);
  const [isPardoned, setIsPardoned] = useState(false);

  // Живые игроки
  const alivePlayers = players.filter(p => p.isAlive);
  const currentSpeaker = alivePlayers[activeSpeakerIndex] || alivePlayers[0];

  // Эффект таймера
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev === 11) {
            sound.playWarning(); // Предупреждение за 10 сек
          }
          if (prev <= 1) {
            sound.playTimeEnd();
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const toggleTimer = () => {
    sound.init();
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = (sec = 60) => {
    setIsTimerRunning(false);
    setTimerSeconds(sec);
  };

  const addTime = (sec = 10) => {
    setTimerSeconds(prev => prev + sec);
  };

  const nextSpeaker = () => {
    setIsTimerRunning(false);
    setTimerSeconds(60);
    if (activeSpeakerIndex < alivePlayers.length - 1) {
      setActiveSpeakerIndex(prev => prev + 1);
    } else {
      setActiveSpeakerIndex(0);
    }
    sound.playTick();
  };

  // Выставление на голосование
  const toggleNomination = (playerId) => {
    sound.playTick();
    setNominatedIds(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  // Добавление фола игроку
  const addFoul = (playerId) => {
    sound.playWarning();
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const nextFouls = (p.fouls || 0) + 1;
        const isDisqualified = nextFouls >= 4;
        return {
          ...p,
          fouls: nextFouls,
          isAlive: isDisqualified ? false : p.isAlive,
          deathReason: isDisqualified ? 'Дисквалификация за 4 фола' : p.deathReason
        };
      }
      return p;
    }));
  };

  // Сброс фолов игроку
  const removeFoul = (playerId) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, fouls: Math.max(0, (p.fouls || 0) - 1) };
      }
      return p;
    }));
  };

  // Изменение голосов за кандидата
  const handleVoteCountChange = (candidateId, delta) => {
    sound.playTick();
    setVoteResults(prev => {
      const current = prev[candidateId] || { votesCount: 0, mayorVoted: false };
      const nextVotes = Math.max(0, current.votesCount + delta);
      return {
        ...prev,
        [candidateId]: { ...current, votesCount: nextVotes }
      };
    });
  };

  // Переключение бонуса голоса мэра
  const toggleMayorVote = (candidateId) => {
    setVoteResults(prev => {
      const current = prev[candidateId] || { votesCount: 0, mayorVoted: false };
      return {
        ...prev,
        [candidateId]: { ...current, mayorVoted: !current.mayorVoted }
      };
    });
  };

  // Подтверждение казни
  const executeCandidate = (playerId) => {
    sound.playGong();
    const victim = players.find(p => p.id === playerId);
    setExecutedPlayerId(playerId);

    // Проверка победы Камикадзе!
    if (victim?.roleId === 'kamikaze') {
      onKamikazeWin(victim);
      return;
    }

    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          isAlive: false,
          deathReason: 'Казнен на дневном голосовании'
        };
      }
      return p;
    }));
    // Включаем 60 секунд на последнее слово
    resetTimer(60);
  };

  return (
    <div className="day-container">
      {/* Навигация подфаз дня */}
      <div className="day-subtabs">
        <button 
          className={`subtab-btn ${subPhase === 'discussion' ? 'active' : ''}`}
          onClick={() => setSubPhase('discussion')}
        >
          🎙 1. Выступления жителей по кругу
        </button>
        <button 
          className={`subtab-btn ${subPhase === 'voting' ? 'active' : ''}`}
          onClick={() => setSubPhase('voting')}
        >
          ⚖️ 2. Голосование ({nominatedIds.length} кандидатов)
        </button>
      </div>

      {subPhase === 'discussion' ? (
        <div className="discussion-layout">
          {/* Блок таймера оратора */}
          <div className="speaker-timer-card">
            <div className="speaker-header">
              <span className="speaker-pill">Слово держит:</span>
              <h2 className="speaker-title">
                №{currentSpeaker?.number} — {currentSpeaker?.name}
              </h2>
              <span className="speaker-role-hint">({currentSpeaker?.roleName})</span>
            </div>

            <div className={`timer-display ${timerSeconds <= 10 ? 'urgent' : ''}`}>
              <Clock size={40} className="timer-icon" />
              <span className="timer-digits">
                {Math.floor(timerSeconds / 60)}:{timerSeconds % 60 < 10 ? '0' : ''}{timerSeconds % 60}
              </span>
            </div>

            <div className="timer-controls">
              <button 
                className={`btn-timer-action ${isTimerRunning ? 'pause' : 'play'}`}
                onClick={toggleTimer}
              >
                {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
                <span>{isTimerRunning ? 'Пауза' : 'Старт'}</span>
              </button>

              <button className="btn-timer-sec" onClick={() => addTime(10)}>+10 сек</button>
              <button className="btn-timer-sec" onClick={() => addTime(30)}>+30 сек</button>
              <button className="btn-timer-sec" onClick={() => resetTimer(60)} title="Сбросить на 1 минуту">
                <RotateCcw size={16} />
              </button>
            </div>

            <div className="speaker-action-row">
              <button 
                className={`btn-nominate ${nominatedIds.includes(currentSpeaker?.id) ? 'active' : ''}`}
                onClick={() => toggleNomination(currentSpeaker?.id)}
              >
                <Target size={18} />
                <span>
                  {nominatedIds.includes(currentSpeaker?.id) 
                    ? 'Снять свою кандидатуру' 
                    : 'Выдвинут на голосование'}
                </span>
              </button>

              <button className="btn-next-speaker" onClick={nextSpeaker}>
                <span>Следующий оратор</span>
                →
              </button>
            </div>
          </div>

          {/* Список всех живых игроков для быстрого выставления и фолов */}
          <div className="players-table-card">
            <h3 className="card-heading">Участники стола: Фолы и Выдвижение кандидатур</h3>
            <div className="day-players-list">
              {players.map(player => {
                const isNominated = nominatedIds.includes(player.id);
                const isCurrent = player.id === currentSpeaker?.id;
                const isDead = !player.isAlive;

                return (
                  <div 
                    key={player.id} 
                    className={`day-player-row ${isCurrent ? 'active-speaker' : ''} ${isDead ? 'dead' : ''}`}
                  >
                    <div className="player-meta">
                      <span className="player-badge">№{player.number}</span>
                      <span className="player-name-text">{player.name}</span>
                      <span className="player-role-small">({player.roleName})</span>
                    </div>

                    {!isDead ? (
                      <div className="player-row-actions">
                        {/* Фолы */}
                        <div className="fouls-tracker">
                          <span className="foul-label">Фолы: {player.fouls || 0}/4</span>
                          <button 
                            className="btn-foul-add" 
                            onClick={() => addFoul(player.id)}
                            title="Дать замечание/фол"
                          >
                            +Фол
                          </button>
                          {(player.fouls || 0) > 0 && (
                            <button 
                              className="btn-foul-remove" 
                              onClick={() => removeFoul(player.id)}
                              title="Снять замечание"
                            >
                              -
                            </button>
                          )}
                        </div>

                        {/* Кнопка выставления */}
                        <button 
                          className={`btn-nominate-mini ${isNominated ? 'nominated' : ''}`}
                          onClick={() => toggleNomination(player.id)}
                          title="Выставить на голосование"
                        >
                          <Target size={14} />
                          {isNominated ? 'В списке' : 'Выставить'}
                        </button>
                      </div>
                    ) : (
                      <span className="dead-label">Погиб</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Режим Голосования */
        <div className="voting-layout">
          <div className="voting-header-card">
            <div className="flex-between">
              <div>
                <h2>⚖️ Дневной Суд — Подсчет голосов</h2>
                <p>Ведущий последовательно ставит кандидатуры на голосование в порядке выдвижения.</p>
              </div>

              {(round === 1 || settings?.noKillDay1) && (
                <button 
                  className={`btn-pardon ${isPardoned ? 'active' : ''}`}
                  onClick={() => {
                    setIsPardoned(!isPardoned);
                    setExecutedPlayerId(null);
                    sound.playReveal();
                  }}
                >
                  🕊️ {isPardoned ? 'Помилование активно' : 'Право дня: Никого не казнить'}
                </button>
              )}
            </div>

            {isPardoned && (
              <div className="pardon-banner">
                <span>🕊️ <strong>Город помилован:</strong> Голосование завершено без казни! Все участники стола выжили и засыпают на следующую ночь.</span>
              </div>
            )}
          </div>

          {nominatedIds.length === 0 ? (
            <div className="empty-voting">
              <AlertOctagon size={32} className="text-yellow-400" />
              <h3>Ни один игрок не был выставлен на голосование!</h3>
              <p>Город никого не подозревает. Казнь не состоится.</p>
            </div>
          ) : (
            <div className="candidates-list">
              {nominatedIds.map(candidateId => {
                const candidate = players.find(p => p.id === candidateId);
                const result = voteResults[candidateId] || { votesCount: 0, mayorVoted: false };
                const totalVotes = result.votesCount + (result.mayorVoted ? 1 : 0);
                const isExecuted = executedPlayerId === candidateId;

                return (
                  <div key={candidateId} className={`candidate-card ${isExecuted ? 'executed' : ''}`}>
                    <div className="candidate-info">
                      <span className="candidate-num">№{candidate?.number}</span>
                      <div>
                        <h3 className="candidate-name">{candidate?.name}</h3>
                        <span className="candidate-role">({candidate?.roleName})</span>
                      </div>
                    </div>

                    <div className="vote-counter-wrap">
                      <div className="counter-controls">
                        <button 
                          className="btn-vote-step"
                          onClick={() => handleVoteCountChange(candidateId, -1)}
                        >
                          -
                        </button>
                        <span className="vote-total-badge">{totalVotes} голосов</span>
                        <button 
                          className="btn-vote-step"
                          onClick={() => handleVoteCountChange(candidateId, 1)}
                        >
                          +
                        </button>
                      </div>

                      {/* Бонус голоса мэра */}
                      <label className="mayor-vote-checkbox">
                        <input 
                          type="checkbox" 
                          checked={result.mayorVoted} 
                          onChange={() => toggleMayorVote(candidateId)}
                        />
                        <span>Голос Мэра (+1)</span>
                      </label>
                    </div>

                    <div className="candidate-actions">
                      {isExecuted ? (
                        <span className="executed-tag">💀 КАЗНЕН ГОРОДОМ</span>
                      ) : (
                        <button 
                          className="btn-execute"
                          onClick={() => executeCandidate(candidateId)}
                        >
                          <Skull size={18} />
                          Казнить по итогам
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Реплика ведущего на закрытие дня */}
          <div className="speech-box">
            <span className="speech-tag">🎙 СЛОВА ВЕДУЩЕГО НА ЗАВЕРШЕНИЕ ДНЯ:</span>
            <p className="speech-text">
              «День подходит к концу. Суд города вынес свой вердикт. Солнце опускается за горизонт. Город засыпает...»
            </p>
          </div>
        </div>
      )}

      {/* Кнопка перехода к следующей ночи */}
      <div className="day-footer-bar">
        <button className="btn-start-next-night" onClick={onFinishDay}>
          <Moon size={20} />
          <span>ГОРОД ЗАСЫПАЕТ: НАЧАТЬ НОЧЬ #{round + 1} 🌙</span>
        </button>
      </div>
    </div>
  );
}
