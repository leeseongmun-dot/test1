export type GameState = 
  | 'TITLE_MENU' 
  | 'PLAYING' 
  | 'PAUSED' 
  | 'LEVEL_UP' 
  | 'GAME_OVER' 
  | 'VICTORY' 
  | 'TECH_LAB' 
  | 'CONTROLS';

export type ShipId = 'interceptor' | 'dreadnought' | 'vanguard';

export interface ShipConfig {
  id: ShipId;
  name: string;
  subname: string;
  description: string;
  maxHp: number;
  armor: number;
  speed: number;
  critChance: number;
  startingWeaponId: WeaponId;
  imagePath: string;
  accentColor: string;
}

export type WeaponId = 
  | 'plasma_blaster'
  | 'orbital_slicers'
  | 'chain_lightning'
  | 'homing_missiles'
  | 'frost_aura'
  | 'combat_drone';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  category: 'weapon';
  description: string;
  icon: string;
  baseDamage: number;
  baseCooldown: number;
  projectileSpeed?: number;
  projectileCount?: number;
  range?: number;
  evolutionHint: string;
}

export type PassiveId = 
  | 'boost_damage'
  | 'boost_attackspeed'
  | 'boost_speed'
  | 'boost_magnet'
  | 'boost_maxhp'
  | 'boost_crit'
  | 'boost_shield';

export interface PassiveDef {
  id: PassiveId;
  name: string;
  category: 'passive';
  description: string;
  icon: string;
  statBonus: string;
}

export interface UpgradeChoice {
  type: 'weapon' | 'passive';
  id: WeaponId | PassiveId;
  name: string;
  level: number;
  isNew: boolean;
  isMaxLevel?: boolean;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
}

export interface WeaponState {
  id: WeaponId;
  level: number;
  cooldownTimer: number;
  totalDamage: number;
}

export interface PassiveState {
  id: PassiveId;
  level: number;
}

export interface PlayerStats {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shieldRegenTimer: number;
  speed: number;
  damageMultiplier: number;
  attackSpeedMultiplier: number;
  critChance: number;
  critMultiplier: number;
  magnetRadius: number;
  level: number;
  exp: number;
  expToNext: number;
  dashCooldown: number;
  dashDuration: number;
  isDashing: boolean;
}

export type EnemyType = 'swarm' | 'stalker' | 'spitter' | 'juggernaut' | 'boss_hive' | 'boss_titan';

export interface Enemy {
  id: number;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  size: number;
  color: string;
  damage: number;
  expValue: number;
  scoreValue: number;
  isBoss: boolean;
  shootCooldown?: number;
  shootTimer?: number;
}

export interface Projectile {
  id: number;
  weaponId: WeaponId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isCrit: boolean;
  penetration: number;
  lifespan: number;
  size: number;
  color: string;
  homingTargetId?: number;
}

export interface EnemyProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  size: number;
  color: string;
  lifespan: number;
}

export interface OrbitalBlade {
  angle: number;
  distance: number;
  damage: number;
}

export interface DropItem {
  id: number;
  type: 'exp_gem' | 'health_pack' | 'magnet' | 'nuke';
  x: number;
  y: number;
  value: number;
  color: string;
  size: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  isCrit?: boolean;
  lifespan: number;
  maxLifespan: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  lifespan: number;
  maxLifespan: number;
}

export interface MetaUpgrades {
  hullPlating: number;   // +HP
  thrusterTune: number;  // +Speed
  weaponMatrix: number;  // +Damage
  magnetCoil: number;    // +Magnet radius
  plasmaCore: number;    // +Attack speed
  totalCredits: number;
  highScore: number;
  bestSurvivalTime: number; // in seconds
  totalKills: number;
}

export interface GameRunSummary {
  survivalTime: number;
  kills: number;
  level: number;
  creditsEarned: number;
  score: number;
  weapons: { id: WeaponId; name: string; level: number; damage: number }[];
  isVictory: boolean;
  shipId: ShipId;
}
