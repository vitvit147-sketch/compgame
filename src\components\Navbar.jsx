import React from 'react';
import { Shield, Moon, Sun, BookOpen, Volume2, VolumeX, Bell, ScrollText, RotateCcw } from 'lucide-react';
import { sound } from '../utils/audio';

export function Navbar({ gameState, players, onOpenRules, onOpenLog, onResetGame, isMuted, setIsMuted }) {
  const alivePlayers = players.filter(p => p.isAlive);
  const mafiaCount = alivePlayers.filter(p => p.faction === 'mafia').length;
  const cityCount = alivePlayers.filter(p => p.faction === 'city').length;
  const renegadeCount = alivePlayers.filter(p => p.faction === 'renegade').length;

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleManualGong = () => {
    sound.playGong();
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-logo">🎭</div>
        <div>
          <h1 className="brand-title">МАФИЯ <span className="badge-pro">ПУЛЬТ ВЕДУЩЕГО</span></h1>
          <p className="brand-sub">Безупречный контроль каждой ночи и дня</p>
        </div>
      </div>

      {gameState.phase !== 'setup' && (
        <div className="phase-indicator">
          <div className={`phase-badge ${gameState.phase}`}>
            {gameState.phase === 'night' && <Moon size={16} className="text-purple-400" />}
            {gameState.phase === 'morning' && <Sun size={16} className="text-yellow-400" />}
            {gameState.phase === 'day' && <Sun size={16} className="text-amber-500" />}
            <span>
              {gameState.phase === 'night' && `Ночь #${gameState.round}`}
              {gameState.phase === 'morning' && `Итоги Ночи #${gameState.round}`}
              {gameState.phase === 'day' && `День #${gameState.round}`}
            </span>
          </div>

          <div className="alive-stats">
            <span className="stat-pill city" title="Живых мирных">
              🕊 {cityCount}
            </span>
            <span className="stat-pill mafia" title="Живых мафиози">
              🕵️ {mafiaCount}
            </span>
            {renegadeCount > 0 && (
              <span className="stat-pill renegade" title="Живых отщепенцев">
                ⚔️ {renegadeCount}
              </span>
            )}
            <span className="stat-pill total" title="Всего в живых">
              Всего: {alivePlayers.length}/{players.length}
            </span>
          </div>
        </div>
      )}

      <div className="navbar-actions">
        <button 
          className="btn-icon" 
          onClick={handleManualGong} 
          title="Удар в гонг (привлечь внимание стола)"
        >
          <Bell size={18} />
          <span className="btn-label">Гонг</span>
        </button>

        <button 
          className="btn-icon" 
          onClick={toggleSound} 
          title={isMuted ? "Включить звук" : "Выключить звук"}
        >
          {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-emerald-400" />}
        </button>

        <button 
          className="btn-icon" 
          onClick={onOpenRules} 
          title="Справочник ролей и правил"
        >
          <BookOpen size={18} />
          <span className="btn-label">Правила</span>
        </button>

        {gameState.phase !== 'setup' && (
          <button 
            className="btn-icon" 
            onClick={onOpenLog} 
            title="Летопись игры (лог событий)"
          >
            <ScrollText size={18} />
            <span className="btn-label">Лог</span>
          </button>
        )}

        {gameState.phase !== 'setup' && (
          <button 
            className="btn-icon btn-danger-soft" 
            onClick={onResetGame} 
            title="Сбросить текущую игру"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
