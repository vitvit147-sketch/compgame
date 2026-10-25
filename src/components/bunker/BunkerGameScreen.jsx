// src/components/bunker/BunkerGameScreen.jsx - Эргономичный экран игры «Бункер 3.0»
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
  { key: 'profession', label: 'Профессия', icon: Briefcase, color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/15' },
  { key: 'biology', label: 'Биология', icon: Dna, color: 'text-sky-400', border: 'border-sky-500/40', bg: 'bg-sky-500/15' },
  { key: 'health', label: 'Здоровье', icon: Heart, color: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/15' },
  { key: 'hobby', label: 'Хобби', icon: Compass, color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/15' },
  { key: 'baggage', label: 'Багаж', icon: Package, color: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/15' },
  { key: 'fact', label: 'Факт биографии', icon: FileText, color: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/15' },
  { key: 'specialCondition', label: 'Спецусловие', icon: Zap, color: 'text-pink-400', border: 'border-pink-500/40', bg: 'bg-pink-500/15' }
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
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto select-none overflow-y-auto">
      {/* Верхняя статусная панель */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] flex items-center justify-between shadow-md">
        <div>
          <div className="text-xs font-black text-amber-400 uppercase tracking-wider">
            Раунд {currentRound} из {game.maxRounds || 5}
          </div>
          <div className="text-base font-black text-white">
            {disaster.icon || '☢️'} {disaster.title || 'Катастрофа'}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Мест в убежище
          </div>
          <div className="text-lg font-black text-emerald-400 font-mono">
            {game.shelterCapacity} чел.
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-44">
        {/* Оповещение об изгнании если игрок изгнан */}
        {isExiled && (
          <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-3xl text-center text-sm text-rose-300 font-bold shadow-lg">
            💀 Вы были изгнаны наружу на голосовании! Но вы остаетесь в игре и наблюдаете за финалом.
          </div>
        )}

        {/* Карточка помещения бункера в текущем раунде */}
        {currentRoom.title && (
          <section className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 rounded-3xl p-5 sm:p-6 shadow-md flex items-start gap-3.5">
            <Shield className="w-6 h-6 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-black text-sky-300">
                Помещение #{currentRound}: {currentRoom.title}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                {currentRoom.desc}
              </p>
            </div>
          </section>
        )}

        {/* Активный спикер и таймер речи */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activeSpeaker?.avatar || '🦺'}</span>
            <div>
              <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Сейчас выступает:
              </div>
              <div className="text-base font-black text-amber-300">
                {activeSpeaker?.name} {activeSpeaker?.id === myPlayer?.id && '(Вы)'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-2xl font-mono font-black text-sm border shadow ${
              speakerTimer <= 10
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-amber-400'
            }`}>
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              {speakerTimer}с
            </div>

            {isHost && (
              <button
                type="button"
                onClick={handleNextSpeaker}
                className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center justify-center active:scale-95 transition-all shadow touch-manipulation"
                title="Передать слово следующему"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </section>

        {/* Переключатель вкладок (большие эргономичные кнопки) */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('my_cards')}
            className={`min-h-[48px] py-3 rounded-xl text-sm font-black transition-all touch-manipulation ${
              activeTab === 'my_cards'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Мои карты (7)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`min-h-[48px] py-3 rounded-xl text-sm font-black transition-all touch-manipulation ${
              activeTab === 'table'
                ? 'bg-amber-500 text-slate-950 shadow-md'
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
          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-bold px-1">
              Нажмите кнопку под картой, чтобы вскрыть её всем игрокам:
            </div>

            {CARD_CONFIG.map(cfg => {
              const cardData = myCharacter[cfg.key];
              if (!cardData) return null;
              const Icon = cfg.icon;
              const isRevealed = cardData.revealed;

              return (
                <div
                  key={cfg.key}
                  className={`rounded-3xl p-5 sm:p-6 border transition-all shadow-lg ${
                    isRevealed
                      ? `${cfg.border} bg-slate-900 ring-1 ring-amber-500/20`
                      : 'border-slate-800/80 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${cfg.bg} ${cfg.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-sm font-black uppercase tracking-wider ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                      isRevealed
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      {isRevealed ? 'Открыта всем 👁️' : 'Скрыта 🔒'}
                    </span>
                  </div>

                  <div className="text-sm text-slate-200 font-medium leading-relaxed mb-3">
                    {cardData.name && <strong className="text-white block text-base font-extrabold mb-0.5">{cardData.name}</strong>}
                    {cardData.text || cardData.desc}
                  </div>

                  {!isRevealed && !isExiled && (
                    <button
                      type="button"
                      onClick={() => setSelectedCardToReveal(cfg.key)}
                      className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-amber-300 font-extrabold text-sm border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all shadow touch-manipulation"
                    >
                      <Eye className="w-4 h-4" />
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
          <div className="space-y-3.5">
            <div className="text-xs font-bold text-slate-400 px-1">
              Живые: <strong className="text-white">{alivePlayers.length}</strong> • Изгнаны: <strong className="text-rose-400">{exiledPlayers.length}</strong>
            </div>

            <div className="space-y-3">
              {players.map(p => {
                const char = p.character || {};
                const isPExiled = p.status === 'exiled';

                return (
                  <div
                    key={p.id}
                    className={`rounded-3xl p-5 sm:p-6 border transition-all shadow-xl ${
                      isPExiled
                        ? 'bg-rose-950/20 border-rose-900/40 opacity-70'
                        : p.id === myPlayer?.id
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{p.avatar || '🦺'}</span>
                        <span className="font-black text-base text-white">
                          {p.name} {p.id === myPlayer?.id && '(Вы)'}
                        </span>
                      </div>

                      <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                        isPExiled
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      }`}>
                        {isPExiled ? 'Изгнан 💀' : 'У дверей 🚪'}
                      </span>
                    </div>

                    {/* Раскрытые карты игрока */}
                    <div className="space-y-2 text-xs">
                      {CARD_CONFIG.map(cfg => {
                        const item = char[cfg.key];
                        if (!item) return null;
                        if (!item.revealed) {
                          return (
                            <div key={cfg.key} className="flex items-center justify-between text-slate-500 text-xs py-1 border-b border-slate-800/40">
                              <span className="font-bold">{cfg.label}:</span>
                              <span className="font-mono text-slate-600">🔒 скрыто</span>
                            </div>
                          );
                        }

                        return (
                          <div key={cfg.key} className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                            <span className={`text-xs font-black uppercase tracking-wider block mb-0.5 ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <span className="text-slate-200 text-sm font-medium">
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
      </main>

      {/* Нижняя фиксированная панель действий */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-md mx-auto shadow-2xl">
        {isHost ? (
          <button
            type="button"
            onClick={handleStartVoting}
            className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-2xl shadow-rose-950/60 active:scale-98 transition-all touch-manipulation"
          >
            <Vote className="w-5 h-5" />
            <span>Открыть тайное голосование 🗳️</span>
          </button>
        ) : (
          <div className="min-h-[56px] p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-sm text-slate-300 flex items-center justify-center gap-2 font-bold shadow-lg">
            <span>Обсуждайте и аргументируйте. Скоро командир объявит суд!</span>
          </div>
        )}
      </footer>

      {/* Модалка подтверждения вскрытия карты */}
      {selectedCardToReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400">
              <Eye className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Вскрыть карту?</h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Все выжившие за столом увидят вашу карту{' '}
                <strong className="text-amber-400 font-extrabold">
                  «{CARD_CONFIG.find(c => c.key === selectedCardToReveal)?.label}»
                </strong>
                . Это действие нельзя отменить!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCardToReveal(null)}
                className="min-h-[52px] py-3 px-4 rounded-2xl bg-slate-800 text-slate-300 font-bold text-sm active:scale-95 transition-all"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleRevealCard(selectedCardToReveal)}
                className="min-h-[52px] py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 active:scale-95 transition-all"
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
