// src/components/bunker/BunkerGameScreen.jsx
import React, { useState, useEffect } from 'react';
import { bunkerSocket } from '../../utils/bunkerSocket';
import { sounds } from '../../utils/soundEffects';
import {
  Shield,
  Eye,
  Lock,
  Users,
  Clock,
  ChevronRight,
  Vote,
  Sparkles,
  Info,
  AlertTriangle,
  Briefcase,
  Heart,
  Dna,
  Compass,
  Package,
  FileText,
  Zap
} from 'lucide-react';

const CARD_CONFIG = [
  { key: 'profession', label: 'Профессия', icon: Briefcase, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  { key: 'biology', label: 'Биология', icon: Dna, color: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/10' },
  { key: 'health', label: 'Здоровье', icon: Heart, color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
  { key: 'hobby', label: 'Хобби', icon: Compass, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  { key: 'baggage', label: 'Багаж', icon: Package, color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  { key: 'fact', label: 'Факт биографии', icon: FileText, color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' },
  { key: 'specialCondition', label: 'Спецусловие', icon: Zap, color: 'text-pink-400', border: 'border-pink-500/30', bg: 'bg-pink-500/10' }
];

export default function BunkerGameScreen({ roomData, myPlayer, isHost }) {
  const [activeTab, setActiveTab] = useState('my_cards'); // 'my_cards' | 'table'
  const [selectedCardToReveal, setSelectedCardToReveal] = useState(null);
  const [speakerTimer, setSpeakerTimer] = useState(45);

  const game = roomData.game || {};
  const players = roomData.players || [];
  const myCharacter = myPlayer?.character || {};
  const currentRound = game.round || 1;
  const currentRoom = game.bunkerRooms?.[currentRound - 1] || game.bunkerRooms?.[0] || {};
  const disaster = game.disaster || {};
  const activeSpeaker = players.find(p => p.id === game.activeSpeakerId) || players[0];

  const alivePlayers = players.filter(p => p.status !== 'exiled');
  const exiledPlayers = players.filter(p => p.status === 'exiled');

  // Таймер спикера
  useEffect(() => {
    setSpeakerTimer(game.speakerSeconds || 45);
    const interval = setInterval(() => {
      setSpeakerTimer(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [game.activeSpeakerId]);

  const handleRevealCard = (cardKey) => {
    sounds.playSuccess();
    bunkerSocket.emit('reveal_card', { cardKey });
    setSelectedCardToReveal(null);
  };

  const handleNextSpeaker = () => {
    sounds.playTap();
    const currentIndex = players.findIndex(p => p.id === game.activeSpeakerId);
    const nextIndex = (currentIndex + 1) % players.length;
    bunkerSocket.emit('set_active_speaker', { speakerId: players[nextIndex].id });
  };

  const handleStartVoting = () => {
    sounds.playTap();
    bunkerSocket.emit('start_voting');
  };

  const isExiled = myPlayer?.status === 'exiled';

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto px-4 pt-safe pb-safe space-y-3.5 select-none">
      {/* Верхняя статусная панель */}
      <header className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
        <div>
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            Раунд {currentRound} из {game.maxRounds || 5}
          </div>
          <div className="text-sm font-black text-white">
            {disaster.icon || '☢️'} {disaster.title || 'Катастрофа'}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Мест в убежище
          </div>
          <div className="text-base font-black text-emerald-400 font-mono">
            {game.shelterCapacity} чел.
          </div>
        </div>
      </header>

      {/* Оповещение об изгнании если игрок изгнан */}
      {isExiled && (
        <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-center text-xs text-rose-300 font-bold">
          💀 Вы были изгнаны наружу на голосовании! Но вы остаетесь в игре и наблюдаете за финалом.
        </div>
      )}

      {/* Карточка помещения бункера в текущем раунде */}
      {currentRoom.title && (
        <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 rounded-2xl p-3.5 shadow-md flex items-start gap-3">
          <Shield className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-black text-sky-300">
              Помещение #{currentRound}: {currentRoom.title}
            </div>
            <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
              {currentRoom.desc}
            </p>
          </div>
        </div>
      )}

      {/* Активный спикер и таймер речи */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{activeSpeaker?.avatar || '🦺'}</span>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Сейчас выступает:
            </div>
            <div className="text-sm font-black text-amber-300">
              {activeSpeaker?.name} {activeSpeaker?.id === myPlayer?.id && '(Вы)'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-xl font-mono font-bold text-xs border ${
            speakerTimer <= 10
              ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
              : 'bg-slate-950 border-slate-800 text-amber-400'
          }`}>
            <Clock className="w-3 h-3 inline mr-1" />
            {speakerTimer}с
          </div>

          {isHost && (
            <button
              onClick={handleNextSpeaker}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold active:scale-95 transition-all"
              title="Передать слово следующему"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Переключатель вкладок */}
      <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('my_cards')}
          className={`py-2.5 rounded-xl transition-all ${
            activeTab === 'my_cards'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Мои карты (7)
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`py-2.5 rounded-xl transition-all ${
            activeTab === 'table'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Все выжившие ({players.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* ВКЛАДКА 1: МОИ КАРТЫ ВЫЖИВШЕГО                          */}
      {/* ======================================================== */}
      {activeTab === 'my_cards' && (
        <div className="space-y-2.5 flex-1">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Нажмите на закрытую карту, чтобы вскрыть её:</span>
          </div>

          {CARD_CONFIG.map(cfg => {
            const cardData = myCharacter[cfg.key];
            if (!cardData) return null;
            const Icon = cfg.icon;
            const isRevealed = cardData.revealed;

            return (
              <div
                key={cfg.key}
                className={`rounded-2xl p-3.5 border transition-all ${
                  isRevealed
                    ? `${cfg.border} bg-slate-900 shadow-md`
                    : 'border-slate-800/80 bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isRevealed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {isRevealed ? 'Открыта всем 👁️' : 'Скрыта 🔒'}
                  </span>
                </div>

                <div className="text-xs text-slate-200 font-medium leading-relaxed mb-2">
                  {cardData.name && <strong className="text-white block text-sm mb-0.5">{cardData.name}</strong>}
                  {cardData.text || cardData.desc}
                </div>

                {!isRevealed && !isExiled && (
                  <button
                    onClick={() => setSelectedCardToReveal(cfg.key)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Вскрыть карту «{cfg.label}» для всех</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* ВКЛАДКА 2: СТОЛ ВЫЖИВШИХ (ВСЕ ИГРОКИ)                   */}
      {/* ======================================================== */}
      {activeTab === 'table' && (
        <div className="space-y-3 flex-1">
          <div className="text-xs text-slate-400 px-1">
            Живые: <strong className="text-white">{alivePlayers.length}</strong> • Изгнаны: <strong className="text-rose-400">{exiledPlayers.length}</strong>
          </div>

          <div className="space-y-2">
            {players.map(p => {
              const char = p.character || {};
              const isPExiled = p.status === 'exiled';

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl p-3.5 border transition-all ${
                    isPExiled
                      ? 'bg-rose-950/20 border-rose-900/40 opacity-70'
                      : p.id === myPlayer?.id
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.avatar || '🦺'}</span>
                      <span className="font-extrabold text-sm text-white">
                        {p.name} {p.id === myPlayer?.id && '(Вы)'}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isPExiled
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      {isPExiled ? 'Изгнан 💀' : 'У дверей 🚪'}
                    </span>
                  </div>

                  {/* Раскрытые карты игрока */}
                  <div className="space-y-1.5 text-xs">
                    {CARD_CONFIG.map(cfg => {
                      const item = char[cfg.key];
                      if (!item) return null;
                      if (!item.revealed) {
                        return (
                          <div key={cfg.key} className="flex items-center justify-between text-slate-600 text-[11px] py-0.5 border-b border-slate-800/40">
                            <span>{cfg.label}:</span>
                            <span className="font-mono">🔒 скрыто</span>
                          </div>
                        );
                      }

                      return (
                        <div key={cfg.key} className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                          <span className={`text-[10px] font-bold uppercase block ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="text-slate-200 font-medium">
                            {item.name ? `${item.name} — ` : ''}{item.text || item.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Нижняя панель действий для хоста */}
      <footer className="pt-2 pb-6">
        {isHost ? (
          <button
            onClick={handleStartVoting}
            className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-xl shadow-rose-950/50 active:scale-98 transition-all"
          >
            <Vote className="w-5 h-5" />
            <span>Открыть тайное голосование 🗳️</span>
          </button>
        ) : (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
            Обсуждайте и аргументируйте. Скоро командир объявит голосование!
          </div>
        )}
      </footer>

      {/* Модалка подтверждения вскрытия карты */}
      {selectedCardToReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400">
              <Eye className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Вскрыть карту?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Все выжившие за столом увидят вашу карту{' '}
                <strong className="text-amber-300">
                  «{CARD_CONFIG.find(c => c.key === selectedCardToReveal)?.label}»
                </strong>
                . Это действие нельзя отменить!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setSelectedCardToReveal(null)}
                className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Отмена
              </button>
              <button
                onClick={() => handleRevealCard(selectedCardToReveal)}
                className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30"
              >
                Да, вскрыть 📢
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
