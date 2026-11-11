import React from 'react';
import { ArrowLeft, Crosshair, Zap, Navigation, Award } from 'lucide-react';

interface ControlsGuideModalProps {
  onBack: () => void;
}

export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({ onBack }) => {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="격납고로 돌아가기"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
            시스템 지침서
          </span>
          <h1 className="text-2xl font-bold text-white mt-0.5 font-[var(--font-display)]">
            조작법 및 생존 가이드
          </h1>
        </div>
      </div>

      {/* Guide Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Movement */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Navigation size={18} />
            <span>함선 기동 (이동 조작)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono text-xs">W</kbd>{' '}
            <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono text-xs">A</kbd>{' '}
            <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono text-xs">S</kbd>{' '}
            <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono text-xs">D</kbd>{' '}
            또는 키보드 <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono text-xs">방향키</kbd>를 사용하여 함선을 360도 자유롭게 비행할 수 있습니다. 모바일 환경에서는 화면을 터치 드래그하여 조종할 수 있습니다.
          </p>
        </div>

        {/* Dash */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
            <Zap size={18} />
            <span>긴급 위상 대시 (순간 회피)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <kbd className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-sky-300 font-mono text-xs">Spacebar</kbd>{' '}
            또는 우하단의 <strong className="text-white">대시 버튼</strong>을 누르면 0.2초간 무적 상태로 전방으로 도약합니다. 군체에 포위되었을 때 탈출기로 활용하십시오. (쿨다운 3.5초)
          </p>
        </div>

        {/* Weapon Aiming */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Crosshair size={18} />
            <span>무기 사격 & 자동 조준</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            기본적으로 모든 장착 무기는 사정거리 내 가장 가까운 적을 <strong className="text-cyan-400">자동 조준</strong>하여 연속 사격합니다. 상단 HUD의 조준 버튼을 눌러 마우스 커서 방향으로 수동 조준하도록 전환할 수도 있습니다.
          </p>
        </div>

        {/* Level Up & Objectives */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Award size={18} />
            <span>목표: 10분 생존 & 탈출</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            격파된 적이 떨어뜨리는 <strong className="text-cyan-300">청색/녹색 에너지 젬</strong>을 흡수해 레벨업하고 카드를 선택하십시오. 3분과 6분에 초거대 보스가 등장하며, 10분을 버텨내면 최종 승리합니다!
          </p>
        </div>
      </div>
    </div>
  );
};
