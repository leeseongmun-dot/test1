import React, { useEffect } from 'react';
import { UpgradeChoice } from '../game/types';
import { ArrowUpCircle, Sparkles } from 'lucide-react';

interface LevelUpModalProps {
  choices: UpgradeChoice[];
  onSelect: (choice: UpgradeChoice) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ choices, onSelect }) => {
  // Support keyboard 1, 2, 3 shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && choices[0]) onSelect(choices[0]);
      if (e.key === '2' && choices[1]) onSelect(choices[1]);
      if (e.key === '3' && choices[2]) onSelect(choices[2]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [choices, onSelect]);

  const getRarityBadge = (rarity: UpgradeChoice['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return { text: '전설 (Legendary)', border: 'border-amber-400', bg: 'bg-amber-950/40 text-amber-300' };
      case 'epic':
        return { text: '영웅 (Epic)', border: 'border-purple-500', bg: 'bg-purple-950/40 text-purple-300' };
      case 'rare':
        return { text: '희귀 (Rare)', border: 'border-sky-500', bg: 'bg-sky-950/40 text-sky-300' };
      default:
        return { text: '일반 (Common)', border: 'border-slate-600', bg: 'bg-slate-800 text-slate-300' };
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl flex flex-col items-center gap-6">
        {/* Title & Level Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase">
            <Sparkles size={16} />
            <span>시스템 오버차지 활성화</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white mt-1 font-[var(--font-display)] flex items-center gap-2">
            <ArrowUpCircle className="text-cyan-400" />
            <span>함선 레벨 업 (Level Up)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            원하는 업그레이드 카드를 클릭하거나 숫자 키 (1, 2, 3)를 누르십시오.
          </p>
        </div>

        {/* 3 Upgrade Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {choices.map((choice, index) => {
            const badge = getRarityBadge(choice.rarity);
            return (
              <button
                key={`${choice.id}-${index}`}
                onClick={() => onSelect(choice)}
                className={`flex flex-col justify-between text-left p-5 rounded-2xl bg-slate-900/90 border-2 ${badge.border} hover:scale-102 hover:bg-slate-800/90 transition-all duration-150 shadow-xl group relative overflow-hidden`}
              >
                {/* Top: Icon, Key Hint, Rarity */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-3xl p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {choice.icon}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${badge.bg}`}>
                        {badge.text}
                      </span>
                      <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center border border-slate-700">
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Title & Type */}
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {choice.name}
                  </h3>
                  <div className="text-xs font-mono text-cyan-400 mt-0.5">
                    {choice.isNew ? '신규 시스템 획득' : `레벨 ${choice.level} 진화`}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {choice.description}
                  </p>
                </div>

                {/* Bottom CTA hint */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>선택 확인</span>
                  <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">
                    장착하기 →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
