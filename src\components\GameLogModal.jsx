import React from 'react';
import { X, ScrollText, Calendar } from 'lucide-react';

export function GameLogModal({ isOpen, onClose, logs }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog log-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <ScrollText size={20} className="text-amber-400" />
            <h2>Летопись текущей партии (Лог событий)</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body log-modal-body">
          {logs.length === 0 ? (
            <p className="empty-notice">Событий пока нет. Игра только началась!</p>
          ) : (
            <div className="log-timeline">
              {logs.map((entry, idx) => (
                <div key={idx} className="timeline-entry">
                  <div className="timeline-badge">#{logs.length - idx}</div>
                  <div className="timeline-content">
                    <span className="timeline-time">{entry.phase}</span>
                    <p className="timeline-text">{entry.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
