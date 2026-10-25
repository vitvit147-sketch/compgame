// src/components/common/ExitConfirmModal.jsx - Защищенное модальное окно выхода с двойным нажатием (2 тапа)
import React, { useState, useEffect } from 'react';
import { AlertTriangle, LogOut, X, Check } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

export default function ExitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isHost = false,
  customTitle,
  customDesc
}) {
  const [tapCount, setTapCount] = useState(0);

  // Сброс счетчика тапов при закрытии или открытии
  useEffect(() => {
    if (!isOpen) {
      setTapCount(0);
    }
  }, [isOpen]);

  // Таймер авто-сброса второго нажатия (через 4 секунды)
  useEffect(() => {
    if (tapCount === 1) {
      const timer = setTimeout(() => {
        setTapCount(0);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [tapCount]);

  if (!isOpen) return null;

  const handleFirstTap = () => {
    sounds.playTap();
    setTapCount(1);
  };

  const handleSecondTap = () => {
    sounds.playTap();
    setTapCount(0);
    onConfirm();
  };

  const title = customTitle || (isHost ? 'Закрыть комнату для всех?' : 'Покинуть игру?');
  const desc = customDesc || (isHost
    ? 'Вы являетесь организатором (хостом). Если вы выйдете, комната будет полностью закрыта и удалена для всех игроков.'
    : 'Вы выйдете из текущей партии и вернетесь в меню. Ваш игровой прогресс будет сброшен.');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-rose-500/60 p-6 shadow-2xl shadow-rose-950/60 text-center space-y-5 animate-scaleUp">
        {/* Иконка предупреждения */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 text-3xl shadow-inner">
          {isHost ? <AlertTriangle className="w-8 h-8 stroke-[2.5]" /> : <LogOut className="w-8 h-8 stroke-[2.5]" />}
        </div>

        {/* Заголовок и описание */}
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium px-1">
            {desc}
          </p>
        </div>

        {/* Плашка защиты от случайного нажатия */}
        <div className="py-2 px-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-bold text-slate-400">
          🛡️ Защита от случайного выхода: подтвердите двойным нажатием
        </div>

        {/* Кнопки подтверждения и отмены */}
        <div className="space-y-3 pt-1">
          {tapCount === 0 ? (
            <button
              type="button"
              onClick={handleFirstTap}
              className="w-full min-h-[54px] py-3.5 px-4 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border-2 border-rose-600/70 text-rose-300 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md touch-manipulation"
            >
              <LogOut className="w-4 h-4" />
              <span>Нажмите для выхода (1/2) ⚠️</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSecondTap}
              className="w-full min-h-[56px] py-4 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xl shadow-rose-950/80 animate-pulse touch-manipulation"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>ПОДТВЕРДИТЬ ВЫХОД (2/2)! 🚪</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setTapCount(0);
              onClose();
            }}
            className="w-full min-h-[50px] py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow touch-manipulation"
          >
            <X className="w-4 h-4" />
            <span>Отмена, остаться в игре</span>
          </button>
        </div>
      </div>
    </div>
  );
}
