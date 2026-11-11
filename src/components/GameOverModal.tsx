import React from 'react';
import { GameRunSummary } from '../game/types';
import { RotateCcw, Wrench, Trophy, Skull, Award, Clock } from 'lucide-react';

interface GameOverModalProps {
  summary: GameRunSummary;
  onRestart: () => void;
  onOpenTechLab: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  summary,
  onRestart,
  onOpenTechLab,
  onHome,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}분 ${s}초`;
  };

  const totalDamage = summary.weapons.reduce((acc, w) => acc + w.damage, 0) || 1;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-6">
        {/* Banner */}
        <div className="flex flex-col items-center text-center">
          {summary.isVictory ? (
            <>
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 mb-2">
                <Award size={28} />
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold tracking-widest uppercase">
                임무 완수 (MISSION ACCOMPLISHED)
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-1 font-[var(--font-display)]">
                성간 작전 성공!
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                10분간의 극한 공세를 견뎌내고 아군 모선 탈출 포탈이 안전하게 확보되었습니다.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 mb-2">
                <Skull size={28} />
              </div>
              <span className="text-xs font-mono text-rose-400 font-bold tracking-widest uppercase">
                함선 완파 (SHIP DESTROYED)
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-1 font-[var(--font-display)]">
                작전 실패
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                적 군체의 압도적인 화력 앞에 선체가 붕괴되었습니다. 데이터를 회수합니다.
              </p>
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center font-mono">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">생존 시간</span>
            <span className="text-base font-bold text-slate-100 tabular-nums mt-0.5">
              {formatTime(summary.survivalTime)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">처치한 군체</span>
            <span className="text-base font-bold text-rose-400 tabular-nums mt-0.5">
              {summary.kills.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">도달 레벨</span>
            <span className="text-base font-bold text-cyan-400 tabular-nums mt-0.5">
              LV {summary.level}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">획득 크레딧</span>
            <span className="text-base font-bold text-amber-400 tabular-nums mt-0.5">
              +{summary.creditsEarned} C
            </span>
          </div>
        </div>

        {/* Weapon Performance Breakdown */}
        <div className="flex flex-col gap-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold pb-2 border-b border-slate-800">
            <span>무기별 누적 피해량 기여도</span>
            <span className="text-[11px] font-mono text-slate-400">
              총 {totalDamage.toLocaleString()} DMG
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {summary.weapons.map((w) => {
              const pct = Math.round((w.damage / totalDamage) * 100);
              return (
                <div key={w.id} className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">
                      {w.name} <span className="text-[10px] font-mono text-cyan-400">Lv.{w.level}</span>
                    </span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {w.damage.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onRestart}
            className="w-full sm:flex-1 py-3 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RotateCcw size={18} />
            <span>다시 출격하기</span>
          </button>
          <button
            onClick={onOpenTechLab}
            className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-xl border border-amber-500/30 flex items-center justify-center gap-2 transition-all text-xs"
          >
            <Wrench size={16} />
            <span>기술 연구소 ({summary.creditsEarned}C 보유)</span>
          </button>
          <button
            onClick={onHome}
            className="w-full sm:w-auto px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium rounded-xl border border-slate-800 text-xs transition-all"
          >
            메뉴로
          </button>
        </div>
      </div>
    </div>
  );
};
