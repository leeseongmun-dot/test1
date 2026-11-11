import React from 'react';
import { PlayerStats, WeaponState, PassiveState } from '../game/types';
import { WEAPONS, PASSIVES } from '../game/weapons';
import { Pause, Zap, Crosshair } from 'lucide-react';

interface GameHUDProps {
  player: PlayerStats;
  weapons: WeaponState[];
  passives: PassiveState[];
  score: number;
  kills: number;
  survivalTime: number;
  credits: number;
  activeBoss: { name: string; hp: number; maxHp: number } | null;
  autoAim: boolean;
  onToggleAutoAim: () => void;
  onPause: () => void;
  onDash: () => void;
  onTouchJoystickMove?: (dx: number, dy: number) => void;
  onTouchJoystickEnd?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  weapons,
  passives,
  kills,
  survivalTime,
  credits,
  activeBoss,
  autoAim,
  onToggleAutoAim,
  onPause,
  onDash,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const shieldPercent = player.maxShield > 0 ? Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100)) : 0;
  const expPercent = Math.max(0, Math.min(100, (player.exp / player.expToNext) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20 select-none">
      {/* Top Bar Area */}
      <div className="w-full flex flex-col gap-2 pointer-events-auto">
        {/* EXP Bar full width */}
        <div className="w-full bg-slate-900/90 h-3 rounded-full overflow-hidden border border-slate-700/60 p-0.5 flex">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-400 rounded-full transition-all duration-150"
            style={{ width: `${expPercent}%` }}
          />
        </div>

        {/* Status Strip */}
        <div className="flex items-center justify-between gap-4 bg-slate-950/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 shadow-lg">
          {/* Left: Player HP & Shield */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1 min-w-[140px] md:min-w-[190px]">
              <div className="flex justify-between items-center text-xs font-mono text-slate-300">
                <span className="font-semibold text-emerald-400">HP</span>
                <span className="tabular-nums">
                  {Math.ceil(player.hp)} / {player.maxHp}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-100"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>

              {/* Shield Bar */}
              {player.maxShield > 0 && (
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-100"
                    style={{ width: `${shieldPercent}%` }}
                  />
                </div>
              )}
            </div>

            {/* Level Badge */}
            <div className="flex items-center justify-center px-3 py-1 bg-cyan-950/80 border border-cyan-800 rounded-lg text-cyan-300 text-xs font-mono font-bold">
              LV {player.level}
            </div>
          </div>

          {/* Center: Mission Clock & Target Time */}
          <div className="flex flex-col items-center">
            <div className="text-xl md:text-2xl font-bold font-mono text-slate-100 tracking-wider tabular-nums">
              {formatTime(survivalTime)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">탈출 목표: 10:00</div>
          </div>

          {/* Right: Kills, Credits, Auto-Aim & Pause */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right font-mono text-xs">
              <span className="text-rose-400 font-semibold tabular-nums">{kills} KILLS</span>
              <span className="text-amber-400 font-medium tabular-nums">+{credits} CREDITS</span>
            </div>

            <button
              onClick={onToggleAutoAim}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                autoAim
                  ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
              title="자동 조준 켜기/끄기"
            >
              <Crosshair size={16} />
              <span className="hidden lg:inline">{autoAim ? '자동 조준' : '수동 조준'}</span>
            </button>

            <button
              onClick={onPause}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="일시정지 (ESC)"
            >
              <Pause size={16} />
            </button>
          </div>
        </div>

        {/* Boss Health Bar if active */}
        {activeBoss && (
          <div className="w-full max-w-xl mx-auto bg-slate-950/90 border border-rose-900/80 rounded-xl p-2.5 shadow-xl shadow-rose-950/40 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-rose-400 font-bold tracking-wide flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                경고: {activeBoss.name}
              </span>
              <span className="text-slate-300 tabular-nums">
                {Math.ceil(activeBoss.hp)} / {activeBoss.maxHp}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-rose-800/50">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-100"
                style={{ width: `${Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Area: Inventory Deck & Mobile Dash Button */}
      <div className="w-full flex items-end justify-between gap-4">
        {/* Active Weapons & Passives Inventory Rack */}
        <div className="flex flex-col gap-1.5 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 pointer-events-auto">
          {/* Weapons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-mono w-10">무기</span>
            {weapons.map((w) => {
              const def = WEAPONS[w.id];
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-cyan-800/60 text-sm relative group cursor-pointer"
                  title={`${def.name} Lv.${w.level}`}
                >
                  <span>{def.icon}</span>
                  <span className="absolute -bottom-1 -right-1 text-[9px] font-mono bg-cyan-900 text-cyan-200 px-1 rounded font-bold">
                    {w.level}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Passives */}
          {passives.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-mono w-10">패시브</span>
              {passives.map((p) => {
                const def = PASSIVES[p.id];
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-sm relative group cursor-pointer"
                    title={`${def.name} Lv.${p.level}`}
                  >
                    <span>{def.icon}</span>
                    <span className="absolute -bottom-1 -right-1 text-[9px] font-mono bg-indigo-900 text-indigo-200 px-1 rounded font-bold">
                      {p.level}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button: Dash (Space) */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={onDash}
            disabled={player.dashCooldown > 0}
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 transition-all shadow-lg ${
              player.dashCooldown > 0
                ? 'bg-slate-900/80 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-600/90 hover:bg-cyan-500 border-cyan-400 text-white shadow-cyan-500/30 active:scale-95'
            }`}
          >
            <Zap size={22} />
            <span className="text-[10px] font-mono font-bold">
              {player.dashCooldown > 0 ? `${player.dashCooldown.toFixed(1)}s` : '대시'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
