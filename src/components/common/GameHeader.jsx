// src/components/common/GameHeader.jsx - Единый эргономичный мобильный хедер для всех игр
import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function GameHeader({
  onBack,
  backLabel = 'В меню',
  title,
  icon,
  badge,
  rightAction
}) {
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] flex items-center justify-between gap-3 shadow-md select-none">
      {/* Крупная, удобная кнопка "Назад" (высота 46px+, отличный тач-таргет) */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-amber-400/60 active:scale-95 active:bg-slate-800 text-amber-400 hover:text-amber-300 font-extrabold text-sm shadow-md transition-all touch-manipulation min-h-[46px]"
        aria-label={backLabel}
      >
        <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        <span>{backLabel}</span>
      </button>

      {/* Правая часть: Название игры или дополнительные действия */}
      <div className="flex items-center gap-2">
        {rightAction}

        {(title || icon || badge) && !rightAction && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold">
            {icon && <span className="text-base">{icon}</span>}
            {title && <span className="uppercase tracking-wider">{title}</span>}
            {badge && (
              <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-[11px] font-extrabold">
                {badge}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
