import React from 'react';
import { Sun, Skull, Heart, Shield, Sparkles, Volume2, ArrowRight, AlertTriangle } from 'lucide-react';
import { sound } from '../utils/audio';
import { ROLES } from '../data/rolesData';

export function MorningSummary({ round, nightResult, players, setPlayers, onProceedToDay }) {
  const { killedPlayerIds, logs, morningAnnouncements, morningSpeech } = nightResult;

  const togglePlayerAlive = (playerId) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, isAlive: !p.isAlive };
      }
      return p;
    }));
  };

  return (
    <div className="morning-container">
      <div className="morning-header">
        <div className="sun-icon-wrap">
          <Sun size={36} className="text-amber-400" />
        </div>
        <div>
          <h2>Итоги Ночи #{round} — Рассвет над городом</h2>
          <p className="morning-sub">Сводка событий и текст утреннего обращения ведущего</p>
        </div>
      </div>

      {/* Готовая речь ведущего для зачитывания */}
      <div className="speech-box morning-speech-box">
        <div className="speech-header">
          <span className="speech-tag">🎙 СЛОВА ВЕДУЩЕГО (ОБЪЯВИТЕ ГОРОДУ):</span>
          <button className="btn-mini-sound" onClick={() => sound.playMorning()}>
            <Volume2 size={14} /> Звон рассвета
          </button>
        </div>
        <p className="speech-text large">«{morningSpeech}»</p>
        {morningAnnouncements.length > 0 && (
          <div className="morning-extra-notes">
            {morningAnnouncements.map((note, i) => (
              <p key={i} className="extra-note-item">«{note}»</p>
            ))}
          </div>
        )}
      </div>

      {/* Список потерь и чудесных спасений */}
      <div className="morning-cards-row">
        {/* Погибшие */}
        <div className="summary-card deaths-card">
          <div className="card-header">
            <Skull size={20} className="text-red-400" />
            <h3>Погибшие этой ночью ({killedPlayerIds.length})</h3>
          </div>
          {killedPlayerIds.length === 0 ? (
            <p className="empty-notice text-emerald-400">✨ Жертв нет! Город проснулся в полном составе.</p>
          ) : (
            <div className="dead-players-list">
              {killedPlayerIds.map(id => {
                const player = players.find(p => p.id === id);
                const roleDef = ROLES[player?.roleId];
                return (
                  <div key={id} className="dead-player-item flex items-center gap-2">
                    {roleDef?.image && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-rose-500/50 bg-slate-900 flex-shrink-0">
                        <img src={roleDef.image} alt={player?.roleName} className="w-full h-full object-cover grayscale opacity-80" />
                      </div>
                    )}
                    <span className="dead-num">№{player?.number}</span>
                    <span className="dead-name">{player?.name}</span>
                    <span className="dead-role">({player?.roleName})</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Секретный журнал ведущего */}
        <div className="summary-card logs-card">
          <div className="card-header">
            <Sparkles size={20} className="text-yellow-400" />
            <h3>Секретные подробности ночи (для ведущего)</h3>
          </div>
          <div className="night-log-items">
            {logs.map((log, idx) => (
              <div key={idx} className="log-line">
                <span className="log-dot">•</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Возможность ручной корректировки статусов */}
      <div className="manual-override-section">
        <h4 className="override-title">
          <AlertTriangle size={16} />
          Корректировка статусов игроков (при необходимости):
        </h4>
        <div className="override-chips">
          {players.map(p => (
            <button
              key={p.id}
              className={`override-chip ${p.isAlive ? 'alive' : 'dead'}`}
              onClick={() => togglePlayerAlive(p.id)}
              title="Нажмите, чтобы переключить Жив / Погиб"
            >
              №{p.number} {p.name}: {p.isAlive ? 'Жив' : 'Погиб 💀'}
            </button>
          ))}
        </div>
      </div>

      {/* Кнопка перехода к дневному обсуждению */}
      <div className="morning-actions-bar">
        <button className="btn-proceed-day" onClick={onProceedToDay}>
          <span>ОТКРЫТЬ ДНЕВНОЕ СОБРАНИЕ И ТАЙМЕРЫ ☀️</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
