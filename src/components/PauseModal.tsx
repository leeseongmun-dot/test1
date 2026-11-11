import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Music, Crosshair } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  autoAim: boolean;
  onToggleAutoAim: () => void;
  sfxMuted: boolean;
  bgmMuted: boolean;
  onToggleSfx: () => void;
  onToggleBgm: () => void;
  sfxVolume: number;
  bgmVolume: number;
  onChangeSfxVolume: (vol: number) => void;
  onChangeBgmVolume: (vol: number) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  autoAim,
  onToggleAutoAim,
  sfxMuted,
  bgmMuted,
  onToggleSfx,
  onToggleBgm,
  sfxVolume,
  bgmVolume,
  onChangeSfxVolume,
  onChangeBgmVolume,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
            전투 일시정지 (PAUSED)
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">작전 정지</h2>
        </div>

        {/* Settings Block */}
        <div className="flex flex-col gap-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs">
          {/* Auto Aim Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-2">
              <Crosshair size={15} className="text-cyan-400" />
              <span>무기 자동 조준</span>
            </span>
            <button
              onClick={onToggleAutoAim}
              className={`px-3 py-1 rounded-lg border font-mono transition-colors ${
                autoAim
                  ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {autoAim ? '활성화 (ON)' : '수동 조준 (OFF)'}
            </button>
          </div>

          {/* SFX Volume */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-slate-300">
              <button
                onClick={onToggleSfx}
                className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
              >
                {sfxMuted ? <VolumeX size={15} className="text-slate-500" /> : <Volume2 size={15} className="text-cyan-400" />}
                <span>효과음 (SFX)</span>
              </button>
              <span className="font-mono text-slate-400">
                {sfxMuted ? '음소거' : `${Math.round(sfxVolume * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxMuted ? 0 : sfxVolume}
              onChange={(e) => onChangeSfxVolume(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* BGM Volume */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-slate-300">
              <button
                onClick={onToggleBgm}
                className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
              >
                <Music size={15} className={bgmMuted ? 'text-slate-500' : 'text-cyan-400'} />
                <span>배경음악 (BGM)</span>
              </button>
              <span className="font-mono text-slate-400">
                {bgmMuted ? '음소거' : `${Math.round(bgmVolume * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bgmMuted ? 0 : bgmVolume}
              onChange={(e) => onChangeBgmVolume(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Play size={18} fill="currentColor" />
            <span>작전 속행 (계속하기)</span>
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
          >
            <RotateCcw size={16} />
            <span>작전 재시작</span>
          </button>
          <button
            onClick={onHome}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium rounded-xl flex items-center justify-center gap-2 transition-all text-xs border border-slate-800"
          >
            <Home size={16} />
            <span>함선 격납고로 복귀</span>
          </button>
        </div>
      </div>
    </div>
  );
};
