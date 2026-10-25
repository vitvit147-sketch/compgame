// src/components/deception/DeceptionBoardScreen.jsx - Главный интерактивный экран расследования «Криминалист»
import React, { useState } from 'react';
import { deceptionSocket } from '../../utils/deceptionSocket';
import { sounds } from '../../utils/soundEffects';
import ExitConfirmModal from '../common/ExitConfirmModal';
import DeceptionAccusationModal from './DeceptionAccusationModal';
import {
  FileText,
  Shield,
  Users,
  Target,
  Clock,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Check,
  RefreshCw,
  LogOut,
  X,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function DeceptionBoardScreen({ roomData, myPlayer, isHost, onLeaveRoom }) {
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'my_cards' | 'suspects'
  const [showAccusationModal, setShowAccusationModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [tileToReplaceId, setTileToReplaceId] = useState(null);
  const [newTileOptionId, setNewTileOptionId] = useState(null);

  const game = roomData.game || {};
  const currentRound = game.round || 1;
  const maxRounds = game.maxRounds || 3;
  const activeTiles = game.activeTiles || [];
  const unusedTiles = game.unusedTiles || [];
  const players = roomData.players || [];
  const solution = game.solution || {};
  const lastAccusation = game.lastAccusation;

  const role = myPlayer?.role || 'investigator';
  const isScientist = role === 'scientist';
  const isMurderer = role === 'murderer';
  const hasBadge = (myPlayer?.badgeRemaining || 0) > 0;

  // Мои карты
  const myMeans = myPlayer?.meansCards || [];
  const myClues = myPlayer?.clueCards || [];

  // Остальные подозреваемые (все кроме меня и криминалиста)
  const suspects = players.filter(p => p.id !== myPlayer?.id && p.role !== 'scientist');

  const handleMakeAccusation = (accusationData) => {
    setShowAccusationModal(false);
    sounds.playTap();
    deceptionSocket.emit('make_accusation', accusationData);
  };

  const handleNextRound = () => {
    sounds.playTap();
    deceptionSocket.emit('next_round');
  };

  const handleOpenReplaceTile = (tileId) => {
    sounds.playTap();
    setTileToReplaceId(tileId);
    setNewTileOptionId(null);
    setShowReplaceModal(true);
  };

  const handleConfirmReplace = () => {
    if (!tileToReplaceId || !newTileOptionId) return;
    sounds.playTap();
    deceptionSocket.emit('scientist_replace_tile', {
      oldTileId: tileToReplaceId,
      newTileOptionId
    });
    setShowReplaceModal(false);
    setTileToReplaceId(null);
    setNewTileOptionId(null);
  };

  const nextUnusedTile = unusedTiles[0] || null;

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start select-none">
      {/* Шапка расследования */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-750 hover:bg-rose-950/50 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 flex items-center gap-1 text-xs font-black transition-colors active:scale-95 touch-manipulation"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Выход</span>
          </button>

          <span className="text-xs font-black uppercase tracking-wider text-amber-400 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            Раунд {currentRound}/{maxRounds}
          </span>
        </div>

        {/* Статус значка следователя */}
        {!isScientist && (
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${
              hasBadge
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
            }`}>
              <Shield className="w-3.5 h-3.5 fill-current" />
              <span>{hasBadge ? 'Жетон активен' : 'Жетон сгорел'}</span>
            </span>
          </div>
        )}

        {isScientist && (
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Эксперт 👨‍🔬
          </span>
        )}
      </header>

      <main className="max-w-md w-full mx-auto px-5 sm:px-6 py-5 pb-48 overflow-y-auto">
        {/* Баннер последнего обвинения (если произошло недавно) */}
        {lastAccusation && (
          <div className={`mb-5 p-4 rounded-3xl border shadow-lg animate-fadeIn text-xs sm:text-sm font-bold flex items-start gap-3 ${
            lastAccusation.isCorrect
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}>
            <span className="text-2xl mt-0.5">{lastAccusation.isCorrect ? '🎯' : '❌'}</span>
            <div className="leading-snug">
              <div className="font-black text-white uppercase text-xs tracking-wider mb-0.5">
                {lastAccusation.isCorrect ? 'ДЕЛО РАСКРЫТО!' : 'ОШИБКА ОБВИНЕНИЯ!'}
              </div>
              <div>
                Детектив <strong className="text-white">{lastAccusation.accuserName}</strong> обвинил{' '}
                <strong className="text-white">{lastAccusation.suspectName}</strong> с орудием «
                <span className="text-sky-300">{lastAccusation.meansTitle}</span>» и уликой «
                <span className="text-rose-300">{lastAccusation.clueTitle}</span>».
              </div>
              {!lastAccusation.isCorrect && (
                <div className="text-[11px] text-rose-400 mt-1">
                  Вердикт: НЕВЕРНО! Жетон обвинителя сгорел навсегда.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Секретная шпаргалка для криминалиста */}
        {isScientist && (
          <section className="mb-5 p-4 rounded-3xl bg-amber-500/10 border border-amber-500/40 text-xs">
            <div className="font-black text-amber-400 uppercase tracking-widest text-[10px] mb-1.5 flex items-center gap-1.5">
              <span>🤫 Секретная истина (видите только вы)</span>
            </div>
            <div className="space-y-1 text-slate-300">
              <div>Убийца: <strong className="text-white">{solution.murdererName}</strong></div>
              <div>Орудие: <strong className="text-sky-400">«{solution.meansTitle}»</strong></div>
              <div>Улика: <strong className="text-rose-400">«{solution.clueTitle}»</strong></div>
            </div>
          </section>
        )}

        {/* Навигационные вкладки: Доска улик / Мои карты / Подозреваемые */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-750 mb-5">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setActiveTab('board');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'board'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Доска</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setActiveTab('my_cards');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'my_cards'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Карты</span>
            <span className="text-[10px] opacity-75 font-mono">(8)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setActiveTab('suspects');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'suspects'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Люди</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* ВКЛАДКА 1: ДОСКА РЕКОНСТРУКЦИИ (ПЛАНШЕТЫ С МАРКЕРАМИ)             */}
        {/* ================================================================= */}
        {activeTab === 'board' && (
          <div className="space-y-4 animate-fadeIn">
            {activeTiles.map((tile, tIdx) => {
              const selectedOpt = tile.options?.find(o => o.id === tile.selectedOptionId);
              return (
                <section
                  key={tile.id}
                  className={`mobile-card transition-all ${
                    tile.isFixed
                      ? 'border-sky-500/40 bg-sky-950/10'
                      : 'border-slate-750 bg-slate-900/80'
                  }`}
                >
                  <div className="mobile-card-header">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tile.icon}</span>
                        <h3 className="font-black text-sm sm:text-base text-white">
                          {tile.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {tile.isFixed ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Базовый
                          </span>
                        ) : (
                          isScientist && (currentRound >= 2) && (
                            <button
                              type="button"
                              onClick={() => handleOpenReplaceTile(tile.id)}
                              className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Заменить</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Список пунктов планшета: выбранный пункт светится неоновым маркёром */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {tile.options.map(opt => {
                      const isMarked = opt.id === tile.selectedOptionId;
                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                            isMarked
                              ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-950/50 font-black ring-2 ring-amber-400/50'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-60'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {isMarked ? <span>🎯</span> : <span className="opacity-30">•</span>}
                            <span>{opt.label}</span>
                          </span>
                          {isMarked && (
                            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-slate-950 text-amber-400 shrink-0 ml-1">
                              Метка пули
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* ================================================================= */}
        {/* ВКЛАДКА 2: МОИ КАРТЫ (4 ОРУДИЯ + 4 УЛИКИ)                         */}
        {/* ================================================================= */}
        {activeTab === 'my_cards' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Орудия преступления */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                  Ваши Орудия убийства (4 шт):
                </span>
                <span className="text-[11px] text-slate-400">Синие карты</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {myMeans.map(m => {
                  const isMurderSecret = isMurderer && solution.meansId === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border ${
                        isMurderSecret
                          ? 'bg-sky-500/20 border-sky-400 shadow-xl shadow-sky-950/60 ring-2 ring-sky-400'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-2xl">{m.icon}</span>
                        {isMurderSecret && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500 text-white">
                            Истинное орудие 🤫
                          </span>
                        )}
                      </div>
                      <div className="font-black text-sm text-white">{m.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">{m.desc}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Улики */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                  Ваши Улики (4 шт):
                </span>
                <span className="text-[11px] text-slate-400">Красные карты</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {myClues.map(c => {
                  const isMurderSecret = isMurderer && solution.clueId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-2xl border ${
                        isMurderSecret
                          ? 'bg-rose-500/20 border-rose-400 shadow-xl shadow-rose-950/60 ring-2 ring-rose-400'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-2xl">{c.icon}</span>
                        {isMurderSecret && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500 text-white">
                            Истинная улика 🤫
                          </span>
                        )}
                      </div>
                      <div className="font-black text-sm text-white">{c.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">{c.desc}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ================================================================= */}
        {/* ВКЛАДКА 3: ДРУГИЕ ПОДОЗРЕВАЕМЫЕ (РАСКЛАДКА КАРТ СОСЕДЕЙ)          */}
        {/* ================================================================= */}
        {activeTab === 'suspects' && (
          <div className="space-y-5 animate-fadeIn">
            {suspects.map(suspect => (
              <section key={suspect.id} className="mobile-card">
                <div className="mobile-card-header">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{suspect.avatar || '🕵️'}</span>
                      <div>
                        <div className="font-black text-sm sm:text-base text-white">
                          {suspect.name}
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          (suspect.badgeRemaining || 0) > 0
                            ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}>
                          {(suspect.badgeRemaining || 0) > 0 ? 'Жетон цел' : 'Жетон сгорел'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Раскладка подозреваемого */}
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-1">
                      Орудия подозреваемого:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(suspect.meansCards || []).map(m => (
                        <div key={m.id} className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span>{m.icon}</span>
                            <span className="font-bold text-slate-200 truncate">{m.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block mb-1">
                      Улики подозреваемого:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(suspect.clueCards || []).map(c => (
                        <div key={c.id} className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span>{c.icon}</span>
                            <span className="font-bold text-slate-200 truncate">{c.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Нижняя фиксированная панель действий */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-md mx-auto shadow-2xl space-y-2.5">
        {/* Кнопка "Выдвинуть обвинение" (для всех у кого цел жетон) */}
        {!isScientist && hasBadge && (
          <button
            type="button"
            onClick={() => setShowAccusationModal(true)}
            className="w-full min-h-[56px] py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-2xl shadow-amber-950/60 active:scale-98 transition-all touch-manipulation"
          >
            <Shield className="w-5 h-5 fill-current" />
            <span>Выдвинуть обвинение (Жетон 1 шт) ⚖️</span>
          </button>
        )}

        {/* Управление раундами для Хоста / Криминалиста */}
        {(isHost || isScientist) && (
          <button
            type="button"
            onClick={handleNextRound}
            className="w-full min-h-[50px] py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-300 hover:text-white active:scale-95 transition-all touch-manipulation"
          >
            <span>Завершить дебаты и перейти к раунду {currentRound + 1}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </footer>

      {/* Модалка выдвижения обвинения */}
      <DeceptionAccusationModal
        isOpen={showAccusationModal}
        onClose={() => setShowAccusationModal(false)}
        onSubmitAccusation={handleMakeAccusation}
        players={players}
        myPlayerId={myPlayer?.id}
      />

      {/* Модалка замены планшета для криминалиста (Раунд 2 и 3) */}
      {showReplaceModal && nextUnusedTile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base text-white">Новый планшет из колоды</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-sm font-black text-amber-400 mb-2">
                <span>{nextUnusedTile.icon}</span>
                <span>{nextUnusedTile.title}</span>
              </div>
              <div className="space-y-1.5">
                {nextUnusedTile.options.map(opt => {
                  const isChosen = newTileOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNewTileOptionId(opt.id)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                        isChosen
                          ? 'bg-amber-500 border-amber-400 text-slate-950 font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isChosen && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="w-1/3 min-h-[48px] rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmReplace}
                disabled={!newTileOptionId}
                className={`w-2/3 min-h-[48px] rounded-xl font-black text-xs uppercase tracking-wider ${
                  newTileOptionId
                    ? 'bg-amber-500 text-slate-950 shadow-lg'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Установить маркер 🎯
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Безопасный выход */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => onLeaveRoom?.(isHost)}
        isHost={isHost}
        customTitle={isHost ? 'Закрыть расследование для всех?' : 'Покинуть дело?'}
        customDesc={isHost
          ? 'Вы являетесь организатором дела. Если вы выйдете, текущая игра завершится для всех игроков.'
          : 'Вы покинете активную игру и вернетесь в главное меню.'}
      />
    </div>
  );
}
