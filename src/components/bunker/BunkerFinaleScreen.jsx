// src/components/bunker/BunkerFinaleScreen.jsx - Эргономичный экран финала Бункера
import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { bunkerSocket } from '../../utils/bunkerSocket';
import { sounds } from '../../utils/soundEffects';
import GameHeader from '../common/GameHeader';
import {
  Shield,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Home,
  Heart,
  Users,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Gavel,
  Dna,
  Zap
} from 'lucide-react';
import {
  evaluateDemographics,
  evaluateHealthStatus,
  evaluateDisasterSurvival,
  evaluateThreatsWithOverrides,
  BUNKER_GAME_MODES
} from '../../data/bunkerData';

export default function BunkerFinaleScreen({ roomData, myPlayer, isHost, onExitToHome }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'demographics' | 'threats' | 'pillars'

  const game = roomData.game || {};
  const disaster = game.disaster || {};
  const threats = game.threats || [];
  const players = roomData.players || [];
  const gameMode = game.gameMode || 'threats';
  const modeConfig = BUNKER_GAME_MODES[gameMode] || BUNKER_GAME_MODES.threats;

  const survivors = players.filter(p => p.status === 'in_bunker' || p.status === 'alive');
  const exiled = players.filter(p => p.status === 'exiled');
  const isSurvivor = survivors.some(s => s.id === myPlayer?.id);

  // Оценка критериев финала
  const demographics = evaluateDemographics(survivors);
  const healthStatus = evaluateHealthStatus(survivors);
  const disasterFit = evaluateDisasterSurvival(survivors, disaster);
  const threatOutcomes = evaluateThreatsWithOverrides(survivors, threats, game.threatOverrides || {});

  const totalOvercome = threatOutcomes.filter(t => t.isOvercome).length;

  // Расчет общей победы
  let isCompleteSuccess = false;
  if (gameMode === 'classic') {
    isCompleteSuccess = demographics.canReproduce && healthStatus.status !== 'critical' && disasterFit.coveredCount >= 2;
  } else {
    isCompleteSuccess = totalOvercome === threats.length && demographics.canReproduce;
  }

  const isPartialSuccess = !isCompleteSuccess && (demographics.canReproduce || totalOvercome > 0 || disasterFit.coveredCount >= 2);

  useEffect(() => {
    if (isCompleteSuccess) {
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.45 } });
      sounds.playSuccess();
    } else if (isPartialSuccess) {
      sounds.playTap();
    } else {
      sounds.playExplosion();
    }
  }, [isCompleteSuccess]);

  const handleRematch = () => {
    sounds.playTap();
    bunkerSocket.emit('reset_to_lobby');
  };

  const handleToggleThreatOverride = (threatId, currentStatus) => {
    sounds.playTap();
    bunkerSocket.emit('toggle_threat_override', {
      threatId,
      isOvercome: !currentStatus
    });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-lg w-full mx-auto select-none overflow-y-auto">
      {/* Универсальный хедер */}
      <GameHeader
        onBack={() => onExitToHome?.(isHost)}
        backLabel="В меню"
        title="ФИНАЛ"
        icon="🏆"
        badge={modeConfig.badge}
      />

      <main className="px-5 sm:px-6 py-6 pb-48">
        {/* Шапка триумфа или поражения */}
        <header className="text-center py-2 mb-6">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-2xl shadow-amber-500/30 flex items-center justify-center mb-3">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-5xl">
              {isCompleteSuccess ? '🏆' : isPartialSuccess ? '⚠️' : '💀'}
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Срок изоляции: {disaster.durationYears || 5} лет</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            {isCompleteSuccess
              ? 'Бункер спасён: Человечество возрождено!'
              : isPartialSuccess
              ? 'Борьба за выживание: Тяжёлые потери'
              : 'Бункер пал: Убежище не справилось'}
          </h1>

          <p className="text-sm text-slate-300 max-w-sm mx-auto mt-2 leading-relaxed font-medium">
            {isSurvivor
              ? 'Вы пережили отбор и закрыли гермодвери. Вот как сложилась судьба убежища:'
              : 'Вы остались снаружи, но ваша жертва сформировала команду убежища.'}
          </p>
        </header>

        {/* Сводка 3 ключевых столпов */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {/* Демография */}
          <div className={`p-3 rounded-2xl border text-center ${
            demographics.status === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
              : demographics.status === 'warning'
              ? 'bg-amber-950/30 border-amber-500/50 text-amber-300'
              : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
          }`}>
            <span className="text-2xl block mb-1">👶</span>
            <span className="text-[10px] font-black uppercase tracking-wider block">Дети / Род</span>
            <span className="text-xs font-bold font-mono">
              {demographics.status === 'success' ? 'Продолжен' : demographics.status === 'warning' ? 'Под угрозой' : 'Вымирание'}
            </span>
          </div>

          {/* Здоровье */}
          <div className={`p-3 rounded-2xl border text-center ${
            healthStatus.status === 'excellent' || healthStatus.status === 'good'
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
          }`}>
            <span className="text-2xl block mb-1">🩺</span>
            <span className="text-[10px] font-black uppercase tracking-wider block">Здоровье</span>
            <span className="text-xs font-bold font-mono">
              {healthStatus.hasDoctor ? 'Врач есть' : 'Без врача'}
            </span>
          </div>

          {/* Угрозы или Обеспечение */}
          <div className={`p-3 rounded-2xl border text-center ${
            gameMode === 'classic'
              ? disasterFit.coveredCount >= 2 ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
              : totalOvercome === threats.length ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
          }`}>
            <span className="text-2xl block mb-1">{gameMode === 'classic' ? '⚙️' : '🛡'}</span>
            <span className="text-[10px] font-black uppercase tracking-wider block">
              {gameMode === 'classic' ? 'База' : 'Угрозы'}
            </span>
            <span className="text-xs font-bold font-mono">
              {gameMode === 'classic' ? `${disasterFit.coveredCount}/3 закрыто` : `${totalOvercome}/${threats.length} отбито`}
            </span>
          </div>
        </div>

        {/* Команда выживших внутри бункера */}
        <section className="mobile-card border-emerald-500/40 mb-5">
          <div className="mobile-card-header">
            <div className="text-base font-black text-emerald-400 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Состав убежища ({survivors.length} чел.):</span>
            </div>
          </div>

          <div className="space-y-2">
            {survivors.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{p.avatar || '🦺'}</span>
                  <div>
                    <div className="font-extrabold text-white flex items-center gap-2">
                      <span>{p.name}</span>
                      {p.id === myPlayer?.id && (
                        <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">(Вы)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {p.character?.biology?.text || 'Биология не раскрыта'}
                    </div>
                  </div>
                </div>
                <span className="text-amber-400 text-xs font-bold text-right shrink-0">
                  {p.character?.profession?.name || 'Выживший'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* РАЗДЕЛ 1: ДЕМОГРАФИЯ И РОЖДЕНИЕ ДЕТЕЙ */}
        <section className={`mobile-card mb-5 border-2 ${
          demographics.status === 'success' ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-rose-500/40 bg-rose-950/10'
        }`}>
          <div className="mobile-card-header">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👶</span>
              <h3 className="font-black text-base text-white">
                Демография: {demographics.title}
              </h3>
            </div>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
              demographics.status === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}>
              {demographics.canReproduce ? '✓ Род спасён' : '✕ Тупик'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-3 font-medium">
            {demographics.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div>Мужчин фертильных: <strong className="text-amber-400">{demographics.fertileMales}</strong> из {demographics.males}</div>
            <div>Женщин фертильных: <strong className="text-amber-400">{demographics.fertileFemales}</strong> из {demographics.females}</div>
          </div>
        </section>

        {/* РАЗДЕЛ 2: ЗДОРОВЬЕ И ВРАЧИ */}
        <section className={`mobile-card mb-5 border-2 ${
          healthStatus.status === 'excellent' || healthStatus.status === 'good'
            ? 'border-emerald-500/40 bg-emerald-950/10'
            : 'border-rose-500/40 bg-rose-950/10'
        }`}>
          <div className="mobile-card-header">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🩺</span>
              <h3 className="font-black text-base text-white">
                Санитария: {healthStatus.title}
              </h3>
            </div>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
              healthStatus.hasDoctor
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}>
              {healthStatus.hasDoctor ? 'Врач в штате' : 'Без медицины'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            {healthStatus.description}
          </p>
        </section>

        {/* РАЗДЕЛ 3: УГРОЗЫ БУНКЕРА (С ПРАВОМ КОМАНДНОГО ВЕРДИКТА) */}
        {threats.length > 0 && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5 mb-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Испытания бункера ({totalOvercome} из {threats.length} отражено):</span>
              </div>
            </div>

            <div className="space-y-3">
              {threatOutcomes.map(threat => (
                <div
                  key={threat.id}
                  className={`p-4 rounded-2xl border text-sm space-y-2 transition-all ${
                    threat.isOvercome
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-black">
                    <span className="text-base">{threat.title}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      threat.isOvercome
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    }`}>
                      {threat.isOvercome ? '✅ Отражена' : '❌ Провал'}
                    </span>
                  </div>

                  <p className="text-xs opacity-90 leading-relaxed font-medium">
                    {threat.reason}
                  </p>

                  {/* Кнопка командного вердикта / оспаривания */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[11px] opacity-75">
                      Игрок доказал спасение смекалкой или багажом?
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleThreatOverride(threat.id, threat.isOvercome)}
                      className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all active:scale-95 ${
                        threat.isOvercome
                          ? 'bg-slate-900 border-slate-700 hover:border-rose-500/50 text-slate-300'
                          : 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      }`}
                      title="Командное решение: признать или отменить победу над угрозой"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      <span>{threat.isOvercome ? 'Оспорить' : 'Засчитать решение!'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* РАЗДЕЛ 4: СТОЛПЫ ВЫЖИВАНИЯ ПОД КАТАСТРОФУ */}
        <section className="mobile-card border-slate-800">
          <div className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2">
            Автономия убежища ({disasterFit.coveredCount} из 3 сфер закрыто):
          </div>
          <div className="space-y-2">
            {disasterFit.pillars.map(pil => (
              <div
                key={pil.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{pil.icon}</span>
                  <span className="font-bold text-white">{pil.title}</span>
                </div>
                <div>
                  {pil.covered ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span>✓ {pil.by}</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold">Дефицит специалистов</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Нижняя панель действий */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 z-40 max-w-md mx-auto shadow-2xl space-y-2.5">
        {isHost ? (
          <button
            type="button"
            onClick={handleRematch}
            className="w-full min-h-[58px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-2xl shadow-amber-950/60 active:scale-98 transition-all touch-manipulation"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Сыграть новую партию (Реванш)</span>
          </button>
        ) : (
          <div className="min-h-[56px] p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-sm text-slate-300 flex items-center justify-center font-bold shadow-lg">
            Ожидаем, пока командир запустит новую партию...
          </div>
        )}
      </footer>
    </div>
  );
}
