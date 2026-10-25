import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Skull, Users } from 'lucide-react';
import { sound } from '../utils/audio';

export function VictoryModal({ victoryInfo, players, onRestart }) {
  if (!victoryInfo) return null;

  useEffect(() => {
    sound.playMorning();
    // Запуск праздничного конфетти
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 60,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 60,
          origin: { x: 1 }
        });
      }, 350);
    } catch (e) {
      console.error(e);
    }
  }, [victoryInfo]);

  return (
    <div className="modal-backdrop victory-backdrop">
      <div className="modal-dialog victory-dialog" style={{ borderColor: victoryInfo.color || '#eab308' }}>
        <div className="victory-icon-circle" style={{ backgroundColor: victoryInfo.color || '#eab308' }}>
          <Trophy size={48} className="text-white" />
        </div>

        <h1 className="victory-title" style={{ color: victoryInfo.color || '#eab308' }}>
          {victoryInfo.title}
        </h1>

        <p className="victory-reason">{victoryInfo.reason}</p>

        {/* Раскрытие всех ролей игроков */}
        <div className="victory-players-summary">
          <h3>Карты всех участников стола:</h3>
          <div className="summary-grid">
            {players.map(p => (
              <div key={p.id} className={`player-summary-badge ${p.isAlive ? 'alive' : 'dead'}`}>
                <span className="summary-num">№{p.number}</span>
                <span className="summary-name">{p.name}:</span>
                <span className="summary-role">{p.roleName}</span>
                <span className="summary-status">{p.isAlive ? '🏆 Выжил' : '💀 Погиб'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="victory-actions">
          <button className="btn-restart-game" onClick={onRestart}>
            <RotateCcw size={18} />
            <span>Начать новую партию</span>
          </button>
        </div>
      </div>
    </div>
  );
}
