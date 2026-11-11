import React, { useState } from 'react';
import { ShipId, MetaUpgrades } from '../game/types';
import { SHIPS } from '../game/weapons';
import { Play, Shield, Gauge, Crosshair, Wrench, BookOpen, Trophy } from 'lucide-react';

interface TitleMenuProps {
  selectedShip: ShipId;
  onSelectShip: (id: ShipId) => void;
  onStartGame: () => void;
  onOpenTechLab: () => void;
  onOpenControls: () => void;
  meta: MetaUpgrades;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  selectedShip,
  onSelectShip,
  onStartGame,
  onOpenTechLab,
  onOpenControls,
  meta,
}) => {
  const currentShip = SHIPS[selectedShip];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}분 ${s}초`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 py-6 px-4">
      {/* Hero Visual Banner */}
      <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
        <img
          src="/src/assets/images/stellar_survivor_cover_1794375666792.jpg"
          alt="스텔라 서바이버 우주 전투"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex flex-col justify-end p-6 md:p-8">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold tracking-wider">
            <span>SF 로그라이크 액션 서바이벌</span>
            <span aria-hidden="true">·</span>
            <span>성간 외계 침공 저지 작전</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-[var(--font-display)] mt-2">
            스텔라 서바이버
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl mt-2 font-normal">
            무한히 밀려오는 외계 군체와 타이탄 보스를 섬멸하고, 함선의 무기 체계와 에너지 코어를 진화시켜 10분간 살아남으십시오.
          </p>
        </div>
      </div>

      {/* Main Grid: Ship Selection & Mission Brief */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ship Selection */}
        <div className="lg:col-span-2 flex flex-col gap-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>함선 선택 (Starship Selection)</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">3척의 프로토타입</span>
          </div>

          {/* Ship Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(Object.keys(SHIPS) as ShipId[]).map((shipId) => {
              const ship = SHIPS[shipId];
              const isSelected = selectedShip === shipId;
              return (
                <div
                  key={shipId}
                  onClick={() => onSelectShip(shipId)}
                  className={`flex flex-col rounded-xl p-4 border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/30 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Ship Preview Avatar */}
                  <div className="w-full aspect-square rounded-lg bg-slate-950 border border-slate-800/80 overflow-hidden mb-3 relative">
                    <img
                      src={ship.imagePath}
                      alt={ship.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                    {isSelected && (
                      <span className="absolute top-2 right-2 text-[10px] font-mono font-bold bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full">
                        선택됨
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-100">{ship.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{ship.subname}</p>

                  {/* Stat Meters */}
                  <div className="flex flex-col gap-1.5 mt-3 text-[11px] font-mono text-slate-400 border-t border-slate-800/60 pt-2.5">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Shield size={12} className="text-emerald-400" /> 체력
                      </span>
                      <span className="text-slate-200 font-bold tabular-nums">{ship.maxHp}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Gauge size={12} className="text-sky-400" /> 속도
                      </span>
                      <span className="text-slate-200 font-bold tabular-nums">{ship.speed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Crosshair size={12} className="text-amber-400" /> 치명타
                      </span>
                      <span className="text-slate-200 font-bold tabular-nums">
                        {(ship.critChance * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Ship Detail Box */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-cyan-400 font-mono font-semibold">선택 함선 특성</span>
              <p className="text-sm text-slate-300 mt-1">{currentShip.description}</p>
            </div>
            <button
              onClick={onStartGame}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0"
            >
              <Play size={18} fill="currentColor" />
              <span>함선 출격 (출발)</span>
            </button>
          </div>
        </div>

        {/* Right Col: Personal Best Records & Quick Tech Lab */}
        <div className="flex flex-col gap-6">
          {/* Records Card */}
          <div className="flex flex-col gap-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" />
                <span>임무 작전 기록 (Records)</span>
              </h3>
            </div>

            <div className="flex flex-col gap-2.5 text-xs font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">최고 생존 시간</span>
                <span className="text-slate-100 font-bold tabular-nums">
                  {meta.bestSurvivalTime > 0 ? formatTime(meta.bestSurvivalTime) : '기록 없음'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">최고 기록 점수</span>
                <span className="text-cyan-400 font-bold tabular-nums">
                  {meta.highScore.toLocaleString()} PTS
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">누적 격파 군체</span>
                <span className="text-rose-400 font-bold tabular-nums">
                  {meta.totalKills.toLocaleString()} 마리
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">보유 크레딧</span>
                <span className="text-amber-400 font-bold tabular-nums">{meta.totalCredits} C</span>
              </div>
            </div>
          </div>

          {/* Quick Hub Navigation */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOpenTechLab}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-900 transition-all text-slate-200 group"
            >
              <Wrench size={22} className="text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">기술 연구소</span>
              <span className="text-[10px] text-slate-400 font-mono">영구 업그레이드</span>
            </button>
            <button
              onClick={onOpenControls}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900 transition-all text-slate-200 group"
            >
              <BookOpen size={22} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">조작 가이드</span>
              <span className="text-[10px] text-slate-400 font-mono">키보드 & 조준</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
