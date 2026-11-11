import React from 'react';
import { MetaUpgrades } from '../game/types';
import { UPGRADE_TIERS, calculateUpgradeCost } from '../game/storage';
import { Wrench, Shield, Gauge, Zap, Magnet, Clock, ArrowLeft } from 'lucide-react';
import { sound } from '../game/audio';

interface TechLabModalProps {
  meta: MetaUpgrades;
  onUpgrade: (key: keyof typeof UPGRADE_TIERS) => void;
  onBack: () => void;
}

export const TechLabModal: React.FC<TechLabModalProps> = ({ meta, onUpgrade, onBack }) => {
  const getIcon = (key: keyof typeof UPGRADE_TIERS) => {
    switch (key) {
      case 'hullPlating':
        return <Shield className="text-emerald-400" size={20} />;
      case 'thrusterTune':
        return <Gauge className="text-sky-400" size={20} />;
      case 'weaponMatrix':
        return <Zap className="text-amber-400" size={20} />;
      case 'magnetCoil':
        return <Magnet className="text-indigo-400" size={20} />;
      case 'plasmaCore':
        return <Clock className="text-rose-400" size={20} />;
    }
  };

  const handleBuy = (key: keyof typeof UPGRADE_TIERS) => {
    sound.playLevelUp();
    onUpgrade(key);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 py-6 px-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="격납고로 돌아가기"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold tracking-wider">
              <Wrench size={14} />
              <span>함선 영구 강화 프로토콜</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-0.5 font-[var(--font-display)]">
              기술 연구소 (Tech Laboratory)
            </h1>
          </div>
        </div>

        {/* Current Credits Bank */}
        <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-800/80 px-5 py-3 rounded-xl">
          <span className="text-xs font-mono text-amber-300">보유 자원:</span>
          <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
            {meta.totalCredits.toLocaleString()} C
          </span>
        </div>
      </div>

      {/* Upgrades List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(UPGRADE_TIERS) as (keyof typeof UPGRADE_TIERS)[]).map((key) => {
          const cfg = UPGRADE_TIERS[key];
          const currentLevel = meta[key];
          const isMax = currentLevel >= cfg.max;
          const cost = isMax ? 0 : calculateUpgradeCost(key, currentLevel);
          const canAfford = !isMax && meta.totalCredits >= cost;

          return (
            <div
              key={key}
              className="flex flex-col justify-between p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      {getIcon(key)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-100">{cfg.label}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{cfg.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    Lv. {currentLevel} / {cfg.max}
                  </span>
                </div>

                {/* Level Pips */}
                <div className="flex gap-1.5 my-3">
                  {Array.from({ length: cfg.max }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full transition-all ${
                        i < currentLevel
                          ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Purchase Button */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  {isMax ? '최대 레벨 도달' : `소모: ${cost} C`}
                </span>
                <button
                  onClick={() => handleBuy(key)}
                  disabled={!canAfford}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                    isMax
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                      : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isMax ? '완료' : canAfford ? '강화 연구' : '크레딧 부족'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
