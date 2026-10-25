// src/components/bunker/BunkerFinaleScreen.jsx - Эргономичный экран финала Бункера
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { bunkerSocket } from '../../utils/bunkerSocket';
import { sounds } from '../../utils/soundEffects';
import GameHeader from '../common/GameHeader';
import { Shield, Sparkles, AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function BunkerFinaleScreen({ roomData, myPlayer, isHost, onExitToHome }) {
  const game = roomData.game || {};
  const disaster = game.disaster || {};
  const threats = game.threats || [];
  const players = roomData.players || [];

  const survivors = players.filter(p => p.status === 'in_bunker' || p.status === 'alive');
  const exiled = players.filter(p => p.status === 'exiled');

  const isSurvivor = survivors.some(s => s.id === myPlayer?.id);

  // Проверка угроз по ключевым словам в характеристиках выживших
  const threatOutcomes = threats.map(threat => {
    const required = threat.requiredKeywords || [];
    let matchedPlayer = null;
    let matchedReason = '';

    for (const p of survivors) {
      const char = p.character || {};
      const allText = [
        char.profession?.name,
        char.profession?.desc,
        char.hobby?.text,
        char.baggage?.text,
        char.fact?.text
      ].filter(Boolean).join(' ').toLowerCase();

      for (const kw of required) {
        if (allText.includes(kw.toLowerCase())) {
          matchedPlayer = p;
          matchedReason = `Благодаря опыту / предмету игрока ${p.name}`;
          break;
        }
      }
      if (matchedPlayer) break;
    }

    return {
      ...threat,
      isOvercome: !!matchedPlayer,
      reason: matchedReason || 'В бункере не оказалось нужных специалистов или инструментов!'
    };
  });

  const totalOvercome = threatOutcomes.filter(t => t.isOvercome).length;
  const isCompleteSuccess = totalOvercome === threats.length;

  useEffect(() => {
    if (isCompleteSuccess) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      sounds.playSuccess();
    } else {
      sounds.playExplosion();
    }
  }, [isCompleteSuccess]);

  const handleRematch = () => {
    sounds.playTap();
    bunkerSocket.emit('reset_to_lobby');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto select-none overflow-y-auto">
      {/* Универсальный крупный мобильный хедер */}
      <GameHeader
        onBack={onExitToHome}
        backLabel="В меню"
        title="ФИНАЛ"
        icon="🏆"
        badge={isCompleteSuccess ? 'Победа' : 'Выживание'}
      />

      <main className="p-4 space-y-4 pb-44">
        {/* Шапка триумфа */}
        <header className="text-center py-2 space-y-2">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-2xl shadow-amber-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-5xl">
              {isCompleteSuccess ? '🏆' : '☣️'}
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>Гермодвери запечатаны</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            {isCompleteSuccess ? 'Бункер выжил и возродил мир!' : 'Борьба за выживание продолжается'}
          </h1>

          <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed font-medium">
            {isSurvivor
              ? 'Поздравляем! Вы прошли через строгий отбор и заняли спасительное место в убежище!'
              : 'Вы остались снаружи, но ваша жертва позволила укомплектовать убежище нужными кадрами.'}
          </p>
        </header>

        {/* Команда выживших внутри бункера */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="text-sm font-black text-emerald-400 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span>Состав убежища ({survivors.length} чел.):</span>
          </div>

          <div className="space-y-2">
            {survivors.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{p.avatar || '🦺'}</span>
                  <span className="font-extrabold text-white">{p.name}</span>
                  {p.id === myPlayer?.id && (
                    <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">(Вы)</span>
                  )}
                </div>
                <span className="text-slate-400 text-xs font-bold">
                  {p.character?.profession?.name || 'Выживший'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Проверка угроз финала */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="text-sm font-black text-slate-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Испытания бункера ({totalOvercome} из {threats.length} отражено):</span>
          </div>

          <div className="space-y-2.5">
            {threatOutcomes.map(threat => (
              <div
                key={threat.id}
                className={`p-4 rounded-2xl border text-sm space-y-1.5 ${
                  threat.isOvercome
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-black">
                  <span>{threat.title}</span>
                  <span>{threat.isOvercome ? '✅ Отражена' : '❌ Провал'}</span>
                </div>
                <p className="text-xs opacity-85 leading-relaxed font-medium">
                  {threat.reason}
                </p>
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
