import React from 'react';
import { GameState } from '../game/types';
import { Volume2, VolumeX, Music, Shield } from 'lucide-react';
import { sound } from '../game/audio';

interface HeaderProps {
  gameState: GameState;
  onNavigate: (state: GameState) => void;
  sfxMuted: boolean;
  bgmMuted: boolean;
  onToggleSfx: () => void;
  onToggleBgm: () => void;
  totalCredits: number;
}

export const Header: React.FC<HeaderProps> = ({
  gameState,
  onNavigate,
  sfxMuted,
  bgmMuted,
  onToggleSfx,
  onToggleBgm,
  totalCredits,
}) => {
  return (
    <header className="w-full flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md z-40 relative">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onNavigate('TITLE_MENU')}
        className="text-lg font-bold tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 font-[var(--font-display)]"
      >
        <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm rotate-45 inline-block"></span>
        STELLAR SURVIVOR
      </button>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onNavigate('TITLE_MENU')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            gameState === 'TITLE_MENU' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          함선 격납고
        </button>
        <button
          onClick={() => onNavigate('TECH_LAB')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            gameState === 'TECH_LAB' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          <span>기술 연구소</span>
          <span className="text-xs font-mono text-amber-400/90 tabular-nums">({totalCredits}C)</span>
        </button>
        <button
          onClick={() => onNavigate('CONTROLS')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            gameState === 'CONTROLS' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          조작 가이드
        </button>
        <button
          onClick={onToggleBgm}
          className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-xs"
        >
          <Music size={14} className={bgmMuted ? 'text-slate-600' : 'text-cyan-400'} />
          <span>BGM {bgmMuted ? 'OFF' : 'ON'}</span>
        </button>
        <button
          onClick={onToggleSfx}
          className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-xs"
        >
          {sfxMuted ? <VolumeX size={14} className="text-slate-600" /> : <Volume2 size={14} className="text-cyan-400" />}
          <span>SFX {sfxMuted ? 'OFF' : 'ON'}</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        {gameState === 'PLAYING' ? (
          <button
            onClick={() => onNavigate('PAUSED')}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            일시정지 (ESC)
          </button>
        ) : (
          <button
            onClick={() => onNavigate('PLAYING')}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-lg hover:from-cyan-300 hover:to-teal-300 shadow-md shadow-cyan-500/20 transition-all whitespace-nowrap shrink-0"
          >
            출격 시작
          </button>
        )}
      </div>
    </header>
  );
};
