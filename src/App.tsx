import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  ShipId,
  PlayerStats,
  WeaponState,
  PassiveState,
  UpgradeChoice,
  GameRunSummary,
  MetaUpgrades,
} from './game/types';
import { SHIPS } from './game/weapons';
import { GameEngine } from './game/engine';
import { sound } from './game/audio';
import { loadMetaUpgrades, saveMetaUpgrades, UPGRADE_TIERS, calculateUpgradeCost } from './game/storage';

import { Header } from './components/Header';
import { TitleMenu } from './components/TitleMenu';
import { GameHUD } from './components/GameHUD';
import { LevelUpModal } from './components/LevelUpModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { TechLabModal } from './components/TechLabModal';
import { ControlsGuideModal } from './components/ControlsGuideModal';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App Navigation & States
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [selectedShip, setSelectedShip] = useState<ShipId>('interceptor');
  const [meta, setMeta] = useState<MetaUpgrades>(loadMetaUpgrades());

  // In-Game Live HUD States
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [weapons, setWeapons] = useState<WeaponState[]>([]);
  const [passives, setPassives] = useState<PassiveState[]>([]);
  const [scoreData, setScoreData] = useState({ score: 0, kills: 0, time: 0, credits: 0 });
  const [activeBoss, setActiveBoss] = useState<{ name: string; hp: number; maxHp: number } | null>(null);
  const [levelUpChoices, setLevelUpChoices] = useState<UpgradeChoice[]>([]);
  const [runSummary, setRunSummary] = useState<GameRunSummary | null>(null);
  const [autoAim, setAutoAim] = useState<boolean>(true);

  // Audio settings
  const [sfxMuted, setSfxMuted] = useState<boolean>(false);
  const [bgmMuted, setBgmMuted] = useState<boolean>(false);
  const [sfxVolume, setSfxVolume] = useState<number>(0.5);
  const [bgmVolume, setBgmVolume] = useState<number>(0.35);

  // Touch joystick tracking
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Sync canvas size to container
  const updateCanvasDimensions = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, [updateCanvasDimensions]);

  // Global ESC key for pause/resume
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === 'PLAYING') {
          handlePause();
        } else if (gameState === 'PAUSED') {
          handleResume();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Audio Controls Handlers
  const handleToggleSfx = () => {
    const next = !sfxMuted;
    setSfxMuted(next);
    sound.setSfxMuted(next);
  };

  const handleToggleBgm = () => {
    const next = !bgmMuted;
    setBgmMuted(next);
    sound.setBgmMuted(next);
  };

  const handleChangeSfxVolume = (vol: number) => {
    setSfxVolume(vol);
    sound.setSfxVolume(vol);
  };

  const handleChangeBgmVolume = (vol: number) => {
    setBgmVolume(vol);
    sound.setBgmVolume(vol);
  };

  const handleToggleAutoAim = () => {
    setAutoAim((prev) => {
      const next = !prev;
      if (engineRef.current) engineRef.current.autoAim = next;
      return next;
    });
  };

  // Start new run
  const handleStartGame = () => {
    sound.unlockAudio();
    updateCanvasDimensions();
    if (!canvasRef.current) return;

    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }

    const ship = SHIPS[selectedShip];
    const engine = new GameEngine(canvasRef.current, ship, meta, {
      onLevelUp: (choices) => {
        setLevelUpChoices(choices);
        setGameState('LEVEL_UP');
      },
      onStatsUpdate: (stats) => {
        setPlayerStats(stats);
      },
      onWeaponsUpdate: (wList, pList) => {
        setWeapons(wList);
        setPassives(pList);
      },
      onBossSpawn: (name, maxHp) => {
        setActiveBoss({ name, hp: maxHp, maxHp });
      },
      onBossHpUpdate: (hp, maxHp) => {
        setActiveBoss((prev) => (prev ? { ...prev, hp, maxHp } : null));
        if (hp <= 0) {
          setTimeout(() => setActiveBoss(null), 1000);
        }
      },
      onGameOver: (summary) => {
        handleEndRun(summary);
      },
      onVictory: (summary) => {
        handleEndRun(summary);
      },
      onScoreUpdate: (data) => {
        setScoreData(data);
      },
    });

    engine.autoAim = autoAim;
    engineRef.current = engine;
    setWeapons(engine.weapons);
    setPassives(engine.passives);
    setActiveBoss(null);

    setGameState('PLAYING');
    engine.start();
  };

  const handleEndRun = (summary: GameRunSummary) => {
    setRunSummary(summary);
    setGameState(summary.isVictory ? 'VICTORY' : 'GAME_OVER');

    // Update persistent meta
    const updatedMeta: MetaUpgrades = {
      ...meta,
      totalCredits: meta.totalCredits + summary.creditsEarned,
      highScore: Math.max(meta.highScore, summary.score),
      bestSurvivalTime: Math.max(meta.bestSurvivalTime, summary.survivalTime),
      totalKills: meta.totalKills + summary.kills,
    };
    setMeta(updatedMeta);
    saveMetaUpgrades(updatedMeta);
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
    setGameState('PAUSED');
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
    setGameState('PLAYING');
  };

  const handleSelectUpgrade = (choice: UpgradeChoice) => {
    if (engineRef.current) {
      engineRef.current.applyUpgrade(choice);
    }
    setGameState('PLAYING');
  };

  const handleDash = () => {
    if (engineRef.current) {
      engineRef.current.triggerDash();
    }
  };

  // Tech Lab Upgrade purchase
  const handleUpgradeMeta = (key: keyof typeof UPGRADE_TIERS) => {
    const currentLvl = meta[key];
    const cost = calculateUpgradeCost(key, currentLvl);
    if (meta.totalCredits >= cost && currentLvl < UPGRADE_TIERS[key].max) {
      const updated: MetaUpgrades = {
        ...meta,
        totalCredits: meta.totalCredits - cost,
        [key]: currentLvl + 1,
      };
      setMeta(updated);
      saveMetaUpgrades(updated);
    }
  };

  // Touch handlers for mobile virtual joystick
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    if (engineRef.current) {
      engineRef.current.isTouchActive = true;
      engineRef.current.touchMoveX = 0;
      engineRef.current.touchMoveY = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !engineRef.current || gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 50;

    if (dist > 5) {
      engineRef.current.touchMoveX = dx / Math.max(dist, maxRadius);
      engineRef.current.touchMoveY = dy / Math.max(dist, maxRadius);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    if (engineRef.current) {
      engineRef.current.isTouchActive = false;
      engineRef.current.touchMoveX = 0;
      engineRef.current.touchMoveY = 0;
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-[var(--font-body)]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar Header */}
      <Header
        gameState={gameState}
        onNavigate={(target) => {
          if (target === 'PLAYING') {
            handleStartGame();
          } else {
            if (engineRef.current) engineRef.current.stop();
            setGameState(target);
          }
        }}
        sfxMuted={sfxMuted}
        bgmMuted={bgmMuted}
        onToggleSfx={handleToggleSfx}
        onToggleBgm={handleToggleBgm}
        totalCredits={meta.totalCredits}
      />

      {/* Main View Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Canvas for Game Rendering (always mounted for zero flicker) */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full ${
            gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'LEVEL_UP'
              ? 'opacity-100'
              : 'opacity-20 pointer-events-none'
          }`}
        />

        {/* In-Game Active HUD */}
        {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'LEVEL_UP') && playerStats && (
          <GameHUD
            player={playerStats}
            weapons={weapons}
            passives={passives}
            score={scoreData.score}
            kills={scoreData.kills}
            survivalTime={scoreData.time}
            credits={scoreData.credits}
            activeBoss={activeBoss}
            autoAim={autoAim}
            onToggleAutoAim={handleToggleAutoAim}
            onPause={handlePause}
            onDash={handleDash}
          />
        )}

        {/* Title Menu / Hangar */}
        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 overflow-y-auto z-30">
            <TitleMenu
              selectedShip={selectedShip}
              onSelectShip={setSelectedShip}
              onStartGame={handleStartGame}
              onOpenTechLab={() => setGameState('TECH_LAB')}
              onOpenControls={() => setGameState('CONTROLS')}
              meta={meta}
            />
          </div>
        )}

        {/* Tech Lab */}
        {gameState === 'TECH_LAB' && (
          <div className="absolute inset-0 overflow-y-auto z-30">
            <TechLabModal
              meta={meta}
              onUpgrade={handleUpgradeMeta}
              onBack={() => setGameState('TITLE_MENU')}
            />
          </div>
        )}

        {/* Controls Guide */}
        {gameState === 'CONTROLS' && (
          <div className="absolute inset-0 overflow-y-auto z-30">
            <ControlsGuideModal onBack={() => setGameState('TITLE_MENU')} />
          </div>
        )}

        {/* Level Up Upgrade Selection Modal */}
        {gameState === 'LEVEL_UP' && (
          <LevelUpModal choices={levelUpChoices} onSelect={handleSelectUpgrade} />
        )}

        {/* Pause Modal */}
        {gameState === 'PAUSED' && (
          <PauseModal
            onResume={handleResume}
            onRestart={handleStartGame}
            onHome={() => {
              if (engineRef.current) engineRef.current.stop();
              setGameState('TITLE_MENU');
            }}
            autoAim={autoAim}
            onToggleAutoAim={handleToggleAutoAim}
            sfxMuted={sfxMuted}
            bgmMuted={bgmMuted}
            onToggleSfx={handleToggleSfx}
            onToggleBgm={handleToggleBgm}
            sfxVolume={sfxVolume}
            bgmVolume={bgmVolume}
            onChangeSfxVolume={handleChangeSfxVolume}
            onChangeBgmVolume={handleChangeBgmVolume}
          />
        )}

        {/* Game Over / Victory Modal */}
        {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && runSummary && (
          <GameOverModal
            summary={runSummary}
            onRestart={handleStartGame}
            onOpenTechLab={() => setGameState('TECH_LAB')}
            onHome={() => setGameState('TITLE_MENU')}
          />
        )}
      </div>
    </div>
  );
}
