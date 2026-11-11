import {
  ShipConfig,
  PlayerStats,
  WeaponState,
  PassiveState,
  Enemy,
  Projectile,
  EnemyProjectile,
  DropItem,
  FloatingText,
  Particle,
  GameRunSummary,
  UpgradeChoice,
  WeaponId,
  PassiveId,
  MetaUpgrades
} from './types';
import { WEAPONS, SHIPS, generateUpgradeChoices, MAX_WEAPON_LEVEL, MAX_PASSIVE_LEVEL } from './weapons';
import { sound } from './audio';

export interface EngineCallbacks {
  onLevelUp: (choices: UpgradeChoice[]) => void;
  onStatsUpdate: (stats: PlayerStats) => void;
  onWeaponsUpdate: (weapons: WeaponState[], passives: PassiveState[]) => void;
  onBossSpawn: (name: string, maxHp: number) => void;
  onBossHpUpdate: (hp: number, maxHp: number) => void;
  onGameOver: (summary: GameRunSummary) => void;
  onVictory: (summary: GameRunSummary) => void;
  onScoreUpdate: (data: { score: number; kills: number; time: number; credits: number }) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  // Running state
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  // World & Camera
  public worldWidth: number = 3600;
  public worldHeight: number = 3600;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private screenShake: number = 0;

  // Player & Ship
  public shipConfig: ShipConfig;
  public metaUpgrades: MetaUpgrades;
  public player: PlayerStats;
  public weapons: WeaponState[] = [];
  public passives: PassiveState[] = [];

  // Entities
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private dropItems: DropItem[] = [];
  private floatingTexts: FloatingText[] = [];
  private particles: Particle[] = [];
  private stars: { x: number; y: number; size: number; speed: number; alpha: number }[] = [];

  // Counters
  private nextEntityId: number = 1;
  private survivalTime: number = 0; // seconds
  private kills: number = 0;
  private score: number = 0;
  private creditsEarned: number = 0;

  // Controls
  private keys: Record<string, boolean> = {};
  public mouseX: number = 0;
  public mouseY: number = 0;
  public isTouchActive: boolean = false;
  public touchMoveX: number = 0;
  public touchMoveY: number = 0;
  public autoAim: boolean = true;

  // Spawner & Boss
  private enemySpawnTimer: number = 0;
  private activeBoss: Enemy | null = null;
  private bossesSpawned: Record<string, boolean> = {};

  // Orbital Blades Angle
  private orbitalAngle: number = 0;

  // Drones
  private droneAngle: number = 0;

  constructor(canvas: HTMLCanvasElement, shipConfig: ShipConfig, metaUpgrades: MetaUpgrades, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not available');
    this.ctx = ctx;
    this.shipConfig = shipConfig;
    this.metaUpgrades = metaUpgrades;
    this.callbacks = callbacks;

    // Apply permanent meta upgrade boosts
    const extraHp = metaUpgrades.hullPlating * 0.20;
    const extraSpeed = metaUpgrades.thrusterTune * 0.10;
    const extraDmg = metaUpgrades.weaponMatrix * 0.12;
    const extraMag = metaUpgrades.magnetCoil * 0.25;
    const extraAtkSpeed = metaUpgrades.plasmaCore * 0.10;

    const baseMaxHp = Math.floor(shipConfig.maxHp * (1 + extraHp));
    const baseSpeed = shipConfig.speed * (1 + extraSpeed);

    this.player = {
      x: this.worldWidth / 2,
      y: this.worldHeight / 2,
      vx: 0,
      vy: 0,
      hp: baseMaxHp,
      maxHp: baseMaxHp,
      shield: 30,
      maxShield: 30,
      shieldRegenTimer: 0,
      speed: baseSpeed,
      damageMultiplier: 1.0 + extraDmg,
      attackSpeedMultiplier: 1.0 + extraAtkSpeed,
      critChance: shipConfig.critChance,
      critMultiplier: 2.0,
      magnetRadius: 130 * (1 + extraMag),
      level: 1,
      exp: 0,
      expToNext: 15,
      dashCooldown: 0,
      dashDuration: 0,
      isDashing: false,
    };

    // Starting weapon
    this.weapons = [
      {
        id: shipConfig.startingWeaponId,
        level: 1,
        cooldownTimer: 0,
        totalDamage: 0,
      },
    ];

    this.initStars();
    this.setupListeners();
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 350; i++) {
      this.stars.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        size: Math.random() * 2 + 0.7,
        speed: Math.random() * 0.6 + 0.2,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
  }

  private setupListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' && this.player.dashCooldown <= 0 && this.isRunning && !this.isPaused) {
      this.triggerDash();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  };

  public triggerDash() {
    if (this.player.dashCooldown > 0) return;
    this.player.isDashing = true;
    this.player.dashDuration = 0.22; // 0.22s dash
    this.player.dashCooldown = 3.5;
    sound.playDash();

    // Spawn burst particles behind
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 4 + 2,
        color: '#38bdf8',
        alpha: 0.9,
        lifespan: 0.3,
        maxLifespan: 0.3,
      });
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    sound.startBgm();
    this.loop(this.lastTime);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (!this.isRunning) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    sound.stopBgm();
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;
    if (this.isPaused) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // clamp dt to max 100ms
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // --- Upgrade Selection Handler ---
  public applyUpgrade(choice: UpgradeChoice) {
    if (choice.type === 'weapon') {
      const existing = this.weapons.find((w) => w.id === choice.id);
      if (existing) {
        existing.level = Math.min(MAX_WEAPON_LEVEL, existing.level + 1);
      } else {
        this.weapons.push({
          id: choice.id as WeaponId,
          level: 1,
          cooldownTimer: 0,
          totalDamage: 0,
        });
      }
    } else {
      const existing = this.passives.find((p) => p.id === choice.id);
      if (existing) {
        existing.level = Math.min(MAX_PASSIVE_LEVEL, existing.level + 1);
      } else {
        this.passives.push({
          id: choice.id as PassiveId,
          level: 1,
        });
      }
      this.recalculatePassiveStats();
    }

    sound.playLevelUp();
    this.callbacks.onWeaponsUpdate([...this.weapons], [...this.passives]);
    this.resume();
  }

  private recalculatePassiveStats() {
    // Reset base stats
    const extraHp = this.metaUpgrades.hullPlating * 0.20;
    const extraSpeed = this.metaUpgrades.thrusterTune * 0.10;
    const extraDmg = this.metaUpgrades.weaponMatrix * 0.12;
    const extraMag = this.metaUpgrades.magnetCoil * 0.25;
    const extraAtkSpeed = this.metaUpgrades.plasmaCore * 0.10;

    let dmgBonus = extraDmg;
    let atkSpeedBonus = extraAtkSpeed;
    let speedBonus = extraSpeed;
    let magnetBonus = extraMag;
    let maxHpBonus = extraHp;
    let critBonus = 0;
    let shieldBonus = 0;

    this.passives.forEach((p) => {
      if (p.id === 'boost_damage') dmgBonus += p.level * 0.15;
      if (p.id === 'boost_attackspeed') atkSpeedBonus += p.level * 0.12;
      if (p.id === 'boost_speed') speedBonus += p.level * 0.10;
      if (p.id === 'boost_magnet') magnetBonus += p.level * 0.35;
      if (p.id === 'boost_maxhp') maxHpBonus += p.level * 0.20;
      if (p.id === 'boost_crit') critBonus += p.level * 0.10;
      if (p.id === 'boost_shield') shieldBonus += p.level * 30;
    });

    const newMaxHp = Math.floor(this.shipConfig.maxHp * (1 + maxHpBonus));
    if (newMaxHp > this.player.maxHp) {
      this.player.hp += newMaxHp - this.player.maxHp;
    }
    this.player.maxHp = newMaxHp;
    this.player.speed = this.shipConfig.speed * (1 + speedBonus);
    this.player.damageMultiplier = 1.0 + dmgBonus;
    this.player.attackSpeedMultiplier = 1.0 + atkSpeedBonus;
    this.player.critChance = this.shipConfig.critChance + critBonus;
    this.player.magnetRadius = 130 * (1 + magnetBonus);
    this.player.maxShield = 30 + shieldBonus;
  }

  // --- Main Update Loop ---
  private update(dt: number) {
    this.survivalTime += dt;

    // Victory check at 10 minutes (600s)
    if (this.survivalTime >= 600) {
      this.triggerVictory();
      return;
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 15);
    }

    // Update Player Movement & Dash
    this.updatePlayerMovement(dt);

    // Update Shield Regen
    this.player.shieldRegenTimer += dt;
    if (this.player.shieldRegenTimer >= 1.5 && this.player.shield < this.player.maxShield) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + 20 * dt);
    }

    // Update Camera
    this.cameraX = this.player.x - this.canvas.width / 2;
    this.cameraY = this.player.y - this.canvas.height / 2;

    // Clamp camera within world
    this.cameraX = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.cameraX));
    this.cameraY = Math.max(0, Math.min(this.worldHeight - this.canvas.height, this.cameraY));

    // Update Spawning & Bosses
    this.updateSpawning(dt);

    // Update Weapons
    this.updateWeapons(dt);

    // Update Projectiles
    this.updateProjectiles(dt);

    // Update Enemies
    this.updateEnemies(dt);

    // Update Drops
    this.updateDrops(dt);

    // Update Particles & Floating text
    this.updateEffects(dt);

    // Periodic updates to React UI
    this.callbacks.onStatsUpdate({ ...this.player });
    this.callbacks.onScoreUpdate({
      score: this.score,
      kills: this.kills,
      time: Math.floor(this.survivalTime),
      credits: this.creditsEarned,
    });
  }

  private updatePlayerMovement(dt: number) {
    let moveX = 0;
    let moveY = 0;

    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    // Touch joystick support
    if (this.isTouchActive) {
      moveX += this.touchMoveX;
      moveY += this.touchMoveY;
    }

    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
      moveX /= len;
      moveY /= len;
    }

    // Dash handling
    if (this.player.dashDuration > 0) {
      this.player.dashDuration -= dt;
      if (this.player.dashDuration <= 0) {
        this.player.isDashing = false;
      }
    }
    if (this.player.dashCooldown > 0) {
      this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
    }

    const currentSpeed = (this.player.isDashing ? this.player.speed * 2.5 : this.player.speed) * 60;
    this.player.vx = moveX * currentSpeed;
    this.player.vy = moveY * currentSpeed;

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // World bounds
    this.player.x = Math.max(40, Math.min(this.worldWidth - 40, this.player.x));
    this.player.y = Math.max(40, Math.min(this.worldHeight - 40, this.player.y));

    // Thruster engine particles
    if (len > 0.1 || this.player.isDashing) {
      for (let i = 0; i < (this.player.isDashing ? 3 : 1); i++) {
        this.particles.push({
          x: this.player.x - moveX * 20 + (Math.random() - 0.5) * 8,
          y: this.player.y - moveY * 20 + (Math.random() - 0.5) * 8,
          vx: -moveX * 40 + (Math.random() - 0.5) * 20,
          vy: -moveY * 40 + (Math.random() - 0.5) * 20,
          size: Math.random() * 3 + 1.5,
          color: this.player.isDashing ? '#38bdf8' : this.shipConfig.accentColor,
          alpha: 0.8,
          lifespan: 0.25,
          maxLifespan: 0.25,
        });
      }
    }
  }

  // --- Spawning System ---
  private updateSpawning(dt: number) {
    this.enemySpawnTimer += dt;

    // Difficulty curve based on survival time
    const spawnInterval = Math.max(0.18, 1.2 - (this.survivalTime / 300) * 0.9);
    const maxEnemies = Math.min(350, 40 + Math.floor(this.survivalTime * 0.6));

    if (this.enemySpawnTimer >= spawnInterval && this.enemies.length < maxEnemies) {
      this.enemySpawnTimer = 0;
      this.spawnWaveBatch();
    }

    // Boss Timers
    // 3 Minutes (180s) -> Boss Hive Mind
    if (this.survivalTime >= 180 && !this.bossesSpawned['boss_hive']) {
      this.bossesSpawned['boss_hive'] = true;
      this.spawnBoss('boss_hive');
    }
    // 6 Minutes (360s) -> Boss Titan
    if (this.survivalTime >= 360 && !this.bossesSpawned['boss_titan']) {
      this.bossesSpawned['boss_titan'] = true;
      this.spawnBoss('boss_titan');
    }
  }

  private spawnWaveBatch() {
    const time = this.survivalTime;
    let types: Enemy['type'][] = ['swarm'];

    if (time > 45) types.push('stalker');
    if (time > 90) types.push('spitter');
    if (time > 150) types.push('juggernaut');

    const count = time > 180 ? Math.floor(Math.random() * 3) + 2 : 1;

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      this.createEnemy(type);
    }
  }

  private createEnemy(type: Enemy['type']) {
    // Spawn just outside viewport
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(this.canvas.width, this.canvas.height) * 0.75 + 50;
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    const timeScale = 1 + this.survivalTime / 180;

    let enemy: Enemy;
    if (type === 'swarm') {
      enemy = {
        id: this.nextEntityId++,
        type: 'swarm',
        name: '외계 크롤러',
        x,
        y,
        vx: 0,
        vy: 0,
        hp: Math.floor(25 * timeScale),
        maxHp: Math.floor(25 * timeScale),
        speed: 130 + Math.random() * 30,
        size: 14,
        color: '#4ade80', // bright green
        damage: 10,
        expValue: 1,
        scoreValue: 15,
        isBoss: false,
      };
    } else if (type === 'stalker') {
      enemy = {
        id: this.nextEntityId++,
        type: 'stalker',
        name: '고속 스토커',
        x,
        y,
        vx: 0,
        vy: 0,
        hp: Math.floor(55 * timeScale),
        maxHp: Math.floor(55 * timeScale),
        speed: 180 + Math.random() * 40,
        size: 18,
        color: '#f87171', // red
        damage: 18,
        expValue: 3,
        scoreValue: 40,
        isBoss: false,
      };
    } else if (type === 'spitter') {
      enemy = {
        id: this.nextEntityId++,
        type: 'spitter',
        name: '산성 슈터',
        x,
        y,
        vx: 0,
        vy: 0,
        hp: Math.floor(70 * timeScale),
        maxHp: Math.floor(70 * timeScale),
        speed: 80,
        size: 22,
        color: '#c084fc', // purple
        damage: 14,
        expValue: 5,
        scoreValue: 60,
        isBoss: false,
        shootCooldown: 2.2,
        shootTimer: Math.random() * 2,
      };
    } else {
      // Juggernaut
      enemy = {
        id: this.nextEntityId++,
        type: 'juggernaut',
        name: '중장갑 골리앗',
        x,
        y,
        vx: 0,
        vy: 0,
        hp: Math.floor(260 * timeScale),
        maxHp: Math.floor(260 * timeScale),
        speed: 55,
        size: 34,
        color: '#fb923c', // orange
        damage: 28,
        expValue: 15,
        scoreValue: 150,
        isBoss: false,
      };
    }

    this.enemies.push(enemy);
  }

  private spawnBoss(type: 'boss_hive' | 'boss_titan') {
    const angle = Math.random() * Math.PI * 2;
    const distance = 600;
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    let boss: Enemy;
    if (type === 'boss_hive') {
      boss = {
        id: this.nextEntityId++,
        type: 'boss_hive',
        name: '하이브 퀸 오버마인드',
        x,
        y,
        vx: 0,
        vy: 0,
        hp: 3800,
        maxHp: 3800,
        speed: 70,
        size: 55,
        color: '#ec4899', // pink/magenta
        damage: 35,
        expValue: 150,
        scoreValue: 2000,
        isBoss: true,
        shootCooldown: 1.8,
        shootTimer: 0,
      };
    } else {
      boss = {
        id: this.nextEntityId++,
        type: 'boss_titan',
        name: '고대 우주 타이탄',
        x,
        y,
        vx: 0,
        vy: 0,
        hp: 8500,
        maxHp: 8500,
        speed: 60,
        size: 70,
        color: '#e11d48', // crimson
        damage: 50,
        expValue: 350,
        scoreValue: 5000,
        isBoss: true,
        shootCooldown: 1.4,
        shootTimer: 0,
      };
    }

    this.enemies.push(boss);
    this.activeBoss = boss;
    this.screenShake = 12;
    sound.playBossAlarm();
    this.callbacks.onBossSpawn(boss.name, boss.maxHp);
  }

  // --- Weapon Systems ---
  private updateWeapons(dt: number) {
    this.orbitalAngle += dt * 3.2;
    this.droneAngle += dt * 1.8;

    this.weapons.forEach((weaponState) => {
      const def = WEAPONS[weaponState.id];
      const cooldown = Math.max(0.08, def.baseCooldown / (this.player.attackSpeedMultiplier * (1 + weaponState.level * 0.08)));

      weaponState.cooldownTimer -= dt;
      if (weaponState.cooldownTimer <= 0) {
        weaponState.cooldownTimer = cooldown;
        this.fireWeapon(weaponState);
      }
    });
  }

  private fireWeapon(wState: WeaponState) {
    const def = WEAPONS[wState.id];
    const dmg = Math.floor(def.baseDamage * (1 + (wState.level - 1) * 0.35) * this.player.damageMultiplier);
    const isCrit = Math.random() < this.player.critChance;
    const finalDmg = isCrit ? Math.floor(dmg * this.player.critMultiplier) : dmg;

    if (wState.id === 'plasma_blaster') {
      const count = 1 + Math.floor(wState.level / 2);
      const target = this.findNearestEnemy(this.player.x, this.player.y, def.range || 550);
      let baseAngle = 0;
      if (target) {
        baseAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
      } else if (!this.autoAim) {
        baseAngle = Math.atan2(this.mouseY + this.cameraY - this.player.y, this.mouseX + this.cameraX - this.player.x);
      } else {
        baseAngle = Math.atan2(this.player.vy, this.player.vx) || 0;
      }

      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.15;
        const angle = baseAngle + spread;
        const speed = (def.projectileSpeed || 11) * 60;
        this.projectiles.push({
          id: this.nextEntityId++,
          weaponId: 'plasma_blaster',
          x: this.player.x,
          y: this.player.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          damage: finalDmg,
          isCrit,
          penetration: 1 + Math.floor(wState.level / 3),
          lifespan: 1.2,
          size: 7 + wState.level,
          color: '#38bdf8',
        });
      }
      sound.playLaser();
    } else if (wState.id === 'orbital_slicers') {
      // Orbital slicers do continuous contact damage
      const bladeCount = 2 + Math.floor(wState.level / 2);
      const distance = 95 + wState.level * 8;
      for (let i = 0; i < bladeCount; i++) {
        const angle = this.orbitalAngle + (i * (Math.PI * 2)) / bladeCount;
        const bx = this.player.x + Math.cos(angle) * distance;
        const by = this.player.y + Math.sin(angle) * distance;
        const hitRadius = 22;

        this.enemies.forEach((enemy) => {
          const dist = Math.hypot(enemy.x - bx, enemy.y - by);
          if (dist < enemy.size + hitRadius) {
            this.hitEnemy(enemy, finalDmg, 'orbital_slicers', isCrit);
            // push enemy slightly
            enemy.x += Math.cos(angle) * 12;
            enemy.y += Math.sin(angle) * 12;
          }
        });
      }
    } else if (wState.id === 'chain_lightning') {
      const maxBounces = 2 + wState.level;
      const target = this.findNearestEnemy(this.player.x, this.player.y, def.range || 480);
      if (target) {
        sound.playLightning();
        let currentTarget: Enemy | null = target;
        let prevX = this.player.x;
        let prevY = this.player.y;
        const hitIds = new Set<number>();

        for (let b = 0; b < maxBounces && currentTarget; b++) {
          hitIds.add(currentTarget.id);
          this.hitEnemy(currentTarget, finalDmg, 'chain_lightning', isCrit);

          // Spawn lightning spark particle line
          this.createLightningEffect(prevX, prevY, currentTarget.x, currentTarget.y);

          prevX = currentTarget.x;
          prevY = currentTarget.y;

          // Next bounce target
          currentTarget = this.findNearestEnemyExcluding(prevX, prevY, 260, hitIds);
        }
      }
    } else if (wState.id === 'homing_missiles') {
      const missileCount = 1 + Math.floor(wState.level / 2);
      for (let i = 0; i < missileCount; i++) {
        const target = this.findHighestHpEnemy(this.player.x, this.player.y, def.range || 650);
        const angle = Math.random() * Math.PI * 2;
        const speed = (def.projectileSpeed || 7) * 60;
        this.projectiles.push({
          id: this.nextEntityId++,
          weaponId: 'homing_missiles',
          x: this.player.x,
          y: this.player.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          damage: finalDmg,
          isCrit,
          penetration: 1,
          lifespan: 3.0,
          size: 8,
          color: '#f97316',
          homingTargetId: target ? target.id : undefined,
        });
      }
    } else if (wState.id === 'frost_aura') {
      const radius = (def.range || 200) + wState.level * 20;
      this.enemies.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (dist <= radius) {
          // Slow down enemy
          enemy.speed = Math.max(30, enemy.speed * 0.7);
          this.hitEnemy(enemy, Math.floor(finalDmg * 0.6), 'frost_aura', false);
        }
      });
      // Ring particle
      for (let i = 0; i < 12; i++) {
        const ang = Math.random() * Math.PI * 2;
        this.particles.push({
          x: this.player.x + Math.cos(ang) * radius,
          y: this.player.y + Math.sin(ang) * radius,
          vx: Math.cos(ang) * 15,
          vy: Math.sin(ang) * 15,
          size: 3,
          color: '#a5f3fc',
          alpha: 0.6,
          lifespan: 0.4,
          maxLifespan: 0.4,
        });
      }
    } else if (wState.id === 'combat_drone') {
      const droneCount = 1 + Math.floor(wState.level / 3);
      for (let d = 0; d < droneCount; d++) {
        const dAng = this.droneAngle + (d * Math.PI * 2) / droneCount;
        const dx = this.player.x + Math.cos(dAng) * 75;
        const dy = this.player.y + Math.sin(dAng) * 75;
        const target = this.findNearestEnemy(dx, dy, def.range || 400);
        if (target) {
          const aimAng = Math.atan2(target.y - dy, target.x - dx);
          const speed = 750;
          this.projectiles.push({
            id: this.nextEntityId++,
            weaponId: 'combat_drone',
            x: dx,
            y: dy,
            vx: Math.cos(aimAng) * speed,
            vy: Math.sin(aimAng) * speed,
            damage: finalDmg,
            isCrit,
            penetration: 1,
            lifespan: 0.8,
            size: 5,
            color: '#a855f7',
          });
        }
      }
    }
  }

  private createLightningEffect(x1: number, y1: number, x2: number, y2: number) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(3, Math.floor(dist / 35));
    let curX = x1;
    let curY = y1;

    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const targetX = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 25;
      const targetY = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 25;

      this.particles.push({
        x: (curX + targetX) / 2,
        y: (curY + targetY) / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: 3,
        color: '#67e8f9',
        alpha: 1.0,
        lifespan: 0.12,
        maxLifespan: 0.12,
      });

      curX = targetX;
      curY = targetY;
    }
  }

  // --- Projectile Update ---
  private updateProjectiles(dt: number) {
    // Player projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifespan -= dt;

      // Homing missile logic
      if (p.weaponId === 'homing_missiles' && p.homingTargetId) {
        const target = this.enemies.find((e) => e.id === p.homingTargetId);
        if (target) {
          const desiredAngle = Math.atan2(target.y - p.y, target.x - p.x);
          const currentAngle = Math.atan2(p.vy, p.vx);
          let diff = desiredAngle - currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          const turnRate = 6.0 * dt;
          const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnRate);
          const speed = Math.hypot(p.vx, p.vy);
          p.vx = Math.cos(newAngle) * speed;
          p.vy = Math.sin(newAngle) * speed;

          // Smoke trail
          this.particles.push({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: 3,
            color: '#fdba74',
            alpha: 0.7,
            lifespan: 0.2,
            maxLifespan: 0.2,
          });
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Check collision with enemies
      let hit = false;
      for (const enemy of this.enemies) {
        const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (dist < enemy.size + p.size) {
          hit = true;
          this.hitEnemy(enemy, p.damage, p.weaponId, p.isCrit);
          p.penetration--;

          // Missile AoE
          if (p.weaponId === 'homing_missiles') {
            sound.playExplosion(false);
            this.screenShake = 4;
            const aoeRadius = 90;
            this.enemies.forEach((other) => {
              if (other.id !== enemy.id) {
                const oDist = Math.hypot(other.x - p.x, other.y - p.y);
                if (oDist <= aoeRadius) {
                  this.hitEnemy(other, Math.floor(p.damage * 0.75), p.weaponId, false);
                }
              }
            });
            p.penetration = 0; // explode once
          }

          if (p.penetration <= 0) break;
        }
      }

      if (p.lifespan <= 0 || p.penetration <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // Enemy projectiles
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.lifespan -= dt;
      ep.x += ep.vx * dt;
      ep.y += ep.vy * dt;

      // Check collision with player
      const dist = Math.hypot(this.player.x - ep.x, this.player.y - ep.y);
      if (dist < 22 + ep.size && !this.player.isDashing) {
        this.damagePlayer(ep.damage);
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      if (ep.lifespan <= 0) {
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  // --- Enemies Update ---
  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Move towards player
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0) {
        enemy.vx = (dx / dist) * enemy.speed;
        enemy.vy = (dy / dist) * enemy.speed;
      }

      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;

      // Spitter & Boss shooting logic
      if (enemy.shootCooldown) {
        enemy.shootTimer = (enemy.shootTimer || 0) + dt;
        if (enemy.shootTimer >= enemy.shootCooldown) {
          enemy.shootTimer = 0;
          if (dist < 700) {
            this.enemyShoot(enemy);
          }
        }
      }

      // Contact damage with player
      if (dist < enemy.size + 20) {
        if (!this.player.isDashing) {
          this.damagePlayer(enemy.damage * dt * 2.2);
        }
      }

      // Check death
      if (enemy.hp <= 0) {
        this.killEnemy(enemy);
        this.enemies.splice(i, 1);
      }
    }
  }

  private enemyShoot(enemy: Enemy) {
    const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);

    if (enemy.isBoss) {
      // Boss fires bullet spread or radial burst
      const count = 7;
      for (let b = 0; b < count; b++) {
        const spread = (b - (count - 1) / 2) * 0.25;
        const bAng = angle + spread;
        const speed = 280;
        this.enemyProjectiles.push({
          id: this.nextEntityId++,
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(bAng) * speed,
          vy: Math.sin(bAng) * speed,
          damage: 18,
          size: 7,
          color: '#f43f5e',
          lifespan: 3.5,
        });
      }
    } else {
      // Single spitter shot
      const speed = 220;
      this.enemyProjectiles.push({
        id: this.nextEntityId++,
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: enemy.damage,
        size: 5,
        color: '#c084fc',
        lifespan: 3.0,
      });
    }
  }

  private hitEnemy(enemy: Enemy, dmg: number, weaponId: WeaponId, isCrit: boolean) {
    enemy.hp -= dmg;

    // Track weapon stats
    const w = this.weapons.find((item) => item.id === weaponId);
    if (w) w.totalDamage += dmg;

    // Floating damage text
    this.floatingTexts.push({
      id: this.nextEntityId++,
      x: enemy.x + (Math.random() - 0.5) * 20,
      y: enemy.y - enemy.size,
      text: `${dmg}${isCrit ? '!' : ''}`,
      color: isCrit ? '#facc15' : '#ffffff',
      isCrit,
      lifespan: 0.6,
      maxLifespan: 0.6,
    });

    // Blood / spark particles
    for (let p = 0; p < (isCrit ? 6 : 3); p++) {
      this.particles.push({
        x: enemy.x,
        y: enemy.y,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        size: Math.random() * 2.5 + 1,
        color: enemy.color,
        alpha: 0.8,
        lifespan: 0.2,
        maxLifespan: 0.2,
      });
    }

    sound.playHit();

    if (enemy.isBoss && this.activeBoss?.id === enemy.id) {
      this.callbacks.onBossHpUpdate(Math.max(0, enemy.hp), enemy.maxHp);
    }
  }

  private killEnemy(enemy: Enemy) {
    this.kills++;
    this.score += enemy.scoreValue;
    this.creditsEarned += enemy.isBoss ? 50 : Math.random() < 0.3 ? 2 : 0;

    // Explosion particles
    const particleCount = enemy.isBoss ? 60 : 12;
    for (let i = 0; i < particleCount; i++) {
      const pAngle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (enemy.isBoss ? 250 : 120);
      this.particles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        size: Math.random() * (enemy.isBoss ? 7 : 4) + 1.5,
        color: enemy.color,
        alpha: 1.0,
        lifespan: enemy.isBoss ? 0.7 : 0.35,
        maxLifespan: enemy.isBoss ? 0.7 : 0.35,
      });
    }

    sound.playExplosion(enemy.isBoss);
    if (enemy.isBoss) {
      this.screenShake = 15;
      this.activeBoss = null;
    }

    // Drops
    this.spawnDrops(enemy);
  }

  private spawnDrops(enemy: Enemy) {
    // EXP Gem
    let gemColor = '#38bdf8'; // blue 1
    if (enemy.expValue >= 50) gemColor = '#ef4444'; // red
    else if (enemy.expValue >= 10) gemColor = '#eab308'; // gold
    else if (enemy.expValue >= 3) gemColor = '#22c55e'; // green

    this.dropItems.push({
      id: this.nextEntityId++,
      type: 'exp_gem',
      x: enemy.x,
      y: enemy.y,
      value: enemy.expValue,
      color: gemColor,
      size: enemy.expValue >= 10 ? 8 : 6,
    });

    // Occasional special items
    const rand = Math.random();
    if (rand < 0.03) {
      // Health Pack
      this.dropItems.push({
        id: this.nextEntityId++,
        type: 'health_pack',
        x: enemy.x + 10,
        y: enemy.y,
        value: 30,
        color: '#10b981',
        size: 10,
      });
    } else if (rand < 0.045) {
      // Magnet
      this.dropItems.push({
        id: this.nextEntityId++,
        type: 'magnet',
        x: enemy.x - 10,
        y: enemy.y,
        value: 1,
        color: '#6366f1',
        size: 10,
      });
    } else if (rand < 0.052) {
      // Nuke Bomb
      this.dropItems.push({
        id: this.nextEntityId++,
        type: 'nuke',
        x: enemy.x,
        y: enemy.y + 10,
        value: 1,
        color: '#f59e0b',
        size: 11,
      });
    }
  }

  // --- Drops Update & Magnet Absorption ---
  private updateDrops(dt: number) {
    for (let i = this.dropItems.length - 1; i >= 0; i--) {
      const drop = this.dropItems[i];
      const dx = this.player.x - drop.x;
      const dy = this.player.y - drop.y;
      const dist = Math.hypot(dx, dy);

      // Within player magnet range
      if (dist < this.player.magnetRadius) {
        const pullSpeed = Math.min(650, (this.player.magnetRadius - dist) * 7 + 250);
        drop.x += (dx / dist) * pullSpeed * dt;
        drop.y += (dy / dist) * pullSpeed * dt;
      }

      // Picked up
      if (dist < 26) {
        this.collectDrop(drop);
        this.dropItems.splice(i, 1);
      }
    }
  }

  private collectDrop(drop: DropItem) {
    if (drop.type === 'exp_gem') {
      sound.playGem();
      this.addExp(drop.value);
    } else if (drop.type === 'health_pack') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + drop.value);
      this.floatingTexts.push({
        id: this.nextEntityId++,
        x: this.player.x,
        y: this.player.y - 20,
        text: `+${drop.value} HP`,
        color: '#34d399',
        lifespan: 0.8,
        maxLifespan: 0.8,
      });
      sound.playLevelUp();
    } else if (drop.type === 'magnet') {
      // Pull all gems immediately
      this.dropItems.forEach((d) => {
        if (d.type === 'exp_gem') {
          d.x = this.player.x;
          d.y = this.player.y;
        }
      });
      sound.playLightning();
    } else if (drop.type === 'nuke') {
      sound.playExplosion(true);
      this.screenShake = 20;
      this.enemies.forEach((enemy) => {
        if (!enemy.isBoss) {
          enemy.hp = 0;
        } else {
          enemy.hp -= 400;
        }
      });
    }
  }

  private addExp(amount: number) {
    this.player.exp += amount;
    if (this.player.exp >= this.player.expToNext) {
      this.player.exp -= this.player.expToNext;
      this.player.level++;
      this.player.expToNext = Math.floor(this.player.expToNext * 1.35 + 8);

      // Trigger Level-up modal
      this.pause();
      const choices = generateUpgradeChoices(this.weapons, this.passives);
      this.callbacks.onLevelUp(choices);
    }
  }

  private damagePlayer(rawDmg: number) {
    const finalDmg = Math.max(1, rawDmg - this.shipConfig.armor * 0.35);

    // Absorb with shield first
    if (this.player.shield > 0) {
      if (this.player.shield >= finalDmg) {
        this.player.shield -= finalDmg;
      } else {
        const remaining = finalDmg - this.player.shield;
        this.player.shield = 0;
        this.player.hp = Math.max(0, this.player.hp - remaining);
      }
    } else {
      this.player.hp = Math.max(0, this.player.hp - finalDmg);
    }

    this.player.shieldRegenTimer = 0;
    this.screenShake = 6;

    if (this.player.hp <= 0) {
      this.triggerGameOver();
    }
  }

  private triggerGameOver() {
    this.stop();
    const summary: GameRunSummary = {
      survivalTime: Math.floor(this.survivalTime),
      kills: this.kills,
      level: this.player.level,
      creditsEarned: this.creditsEarned,
      score: this.score,
      weapons: this.weapons.map((w) => ({
        id: w.id,
        name: WEAPONS[w.id].name,
        level: w.level,
        damage: Math.floor(w.totalDamage),
      })),
      isVictory: false,
      shipId: this.shipConfig.id,
    };
    this.callbacks.onGameOver(summary);
  }

  private triggerVictory() {
    this.stop();
    const summary: GameRunSummary = {
      survivalTime: Math.floor(this.survivalTime),
      kills: this.kills,
      level: this.player.level,
      creditsEarned: this.creditsEarned + 200, // victory bonus
      score: this.score + 10000,
      weapons: this.weapons.map((w) => ({
        id: w.id,
        name: WEAPONS[w.id].name,
        level: w.level,
        damage: Math.floor(w.totalDamage),
      })),
      isVictory: true,
      shipId: this.shipConfig.id,
    };
    this.callbacks.onVictory(summary);
  }

  // --- Effects Update ---
  private updateEffects(dt: number) {
    // Floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.lifespan -= dt;
      ft.y -= 30 * dt;
      if (ft.lifespan <= 0) this.floatingTexts.splice(i, 1);
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifespan -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.lifespan / p.maxLifespan);
      if (p.lifespan <= 0) this.particles.splice(i, 1);
    }
  }

  // --- Rendering Loop ---
  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Apply Screen Shake
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Clear Screen & Draw Space Background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Parallax Stars
    this.renderStars(ctx);

    // Render World Elements
    ctx.save();
    ctx.translate(-this.cameraX, -this.cameraY);

    // Render World Boundaries
    this.renderWorldGrid(ctx);

    // Render Drops
    this.renderDrops(ctx);

    // Render Enemies
    this.renderEnemies(ctx);

    // Render Player Projectiles
    this.renderProjectiles(ctx);

    // Render Enemy Projectiles
    this.renderEnemyProjectiles(ctx);

    // Render Player Ship & Orbitals
    this.renderPlayer(ctx);

    // Render Particles
    this.renderParticles(ctx);

    // Render Floating Damage Texts
    this.renderFloatingTexts(ctx);

    ctx.restore();
    ctx.restore(); // end screen shake
  }

  private renderStars(ctx: CanvasRenderingContext2D) {
    this.stars.forEach((star) => {
      // Parallax scroll relative to camera
      const sx = ((star.x - this.cameraX * star.speed) % this.canvas.width + this.canvas.width) % this.canvas.width;
      const sy = ((star.y - this.cameraY * star.speed) % this.canvas.height + this.canvas.height) % this.canvas.height;

      ctx.fillStyle = `rgba(224, 231, 255, ${star.alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private renderWorldGrid(ctx: CanvasRenderingContext2D) {
    // Subtle cosmic grid lines
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    const gridSize = 150;
    const startX = Math.floor(this.cameraX / gridSize) * gridSize;
    const endX = this.cameraX + this.canvas.width;
    const startY = Math.floor(this.cameraY / gridSize) * gridSize;
    const endY = this.cameraY + this.canvas.height;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // World Boundary Border
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;

    // Calculate facing angle towards target or mouse
    let angle = 0;
    if (this.autoAim) {
      const nearest = this.findNearestEnemy(p.x, p.y, 600);
      if (nearest) {
        angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
      } else if (Math.hypot(p.vx, p.vy) > 0) {
        angle = Math.atan2(p.vy, p.vx);
      }
    } else {
      angle = Math.atan2(this.mouseY + this.cameraY - p.y, this.mouseX + this.cameraX - p.x);
    }

    ctx.save();
    ctx.translate(p.x, p.y);

    // Energy Shield Aura
    if (p.shield > 0) {
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + (p.shield / p.maxShield) * 0.4})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Frost Aura
    const frostWeapon = this.weapons.find((w) => w.id === 'frost_aura');
    if (frostWeapon) {
      const radius = 200 + frostWeapon.level * 20;
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ship Rotation
    ctx.rotate(angle + Math.PI / 2);

    // Draw Vector Starship Sprite
    const color = p.isDashing ? '#38bdf8' : this.shipConfig.accentColor;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    // Triangle / Fighter silhouette
    ctx.beginPath();
    ctx.moveTo(0, -26); // nose
    ctx.lineTo(20, 18);  // right wing tip
    ctx.lineTo(8, 12);   // right inner
    ctx.lineTo(0, 16);   // engine center
    ctx.lineTo(-8, 12);  // left inner
    ctx.lineTo(-20, 18); // left wing tip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(0, -8, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Render Orbital Slicers
    const slicerWeapon = this.weapons.find((w) => w.id === 'orbital_slicers');
    if (slicerWeapon) {
      const bladeCount = 2 + Math.floor(slicerWeapon.level / 2);
      const distance = 95 + slicerWeapon.level * 8;
      for (let i = 0; i < bladeCount; i++) {
        const bladeAngle = this.orbitalAngle + (i * (Math.PI * 2)) / bladeCount;
        const bx = p.x + Math.cos(bladeAngle) * distance;
        const by = p.y + Math.sin(bladeAngle) * distance;

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(this.orbitalAngle * 3);

        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(16, 0);
        ctx.moveTo(0, -16);
        ctx.lineTo(0, 16);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Render Combat Drones
    const droneWeapon = this.weapons.find((w) => w.id === 'combat_drone');
    if (droneWeapon) {
      const droneCount = 1 + Math.floor(droneWeapon.level / 3);
      for (let d = 0; d < droneCount; d++) {
        const dAng = this.droneAngle + (d * Math.PI * 2) / droneCount;
        const dx = p.x + Math.cos(dAng) * 75;
        const dy = p.y + Math.sin(dAng) * 75;

        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(dAng);
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    this.enemies.forEach((enemy) => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);

      // Enemy Body
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = enemy.isBoss ? 16 : 6;

      ctx.beginPath();
      if (enemy.type === 'swarm') {
        // Insectoid diamond
        ctx.moveTo(0, -enemy.size);
        ctx.lineTo(enemy.size * 0.8, 0);
        ctx.lineTo(0, enemy.size);
        ctx.lineTo(-enemy.size * 0.8, 0);
      } else if (enemy.type === 'stalker') {
        // Sharp triangle
        const ang = Math.atan2(enemy.vy, enemy.vx) + Math.PI / 2;
        ctx.rotate(ang);
        ctx.moveTo(0, -enemy.size);
        ctx.lineTo(enemy.size * 0.7, enemy.size);
        ctx.lineTo(-enemy.size * 0.7, enemy.size);
      } else if (enemy.type === 'spitter') {
        // Hexagon
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = Math.cos(a) * enemy.size;
          const py = Math.sin(a) * enemy.size;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      } else {
        // Juggernaut or Boss: Heavy Octagon
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const px = Math.cos(a) * enemy.size;
          const py = Math.sin(a) * enemy.size;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fill();

      // Enemy Outline & Eye
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // HP Bar for tough enemies & bosses
      if (enemy.maxHp > 50 && enemy.hp < enemy.maxHp && !enemy.isBoss) {
        const barW = enemy.size * 1.6;
        const barH = 4;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barW / 2, -enemy.size - 10, barW, barH);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-barW / 2, -enemy.size - 10, barW * (enemy.hp / enemy.maxHp), barH);
      }

      ctx.restore();
    });
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D) {
    this.projectiles.forEach((p) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private renderEnemyProjectiles(ctx: CanvasRenderingContext2D) {
    this.enemyProjectiles.forEach((ep) => {
      ctx.save();
      ctx.fillStyle = ep.color;
      ctx.shadowColor = ep.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ep.x, ep.y, ep.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private renderDrops(ctx: CanvasRenderingContext2D) {
    this.dropItems.forEach((drop) => {
      ctx.save();
      ctx.translate(drop.x, drop.y);
      ctx.fillStyle = drop.color;
      ctx.shadowColor = drop.color;
      ctx.shadowBlur = 8;

      if (drop.type === 'exp_gem') {
        // Diamond crystal
        ctx.beginPath();
        ctx.moveTo(0, -drop.size);
        ctx.lineTo(drop.size * 0.7, 0);
        ctx.lineTo(0, drop.size);
        ctx.lineTo(-drop.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        // Special sphere
        ctx.beginPath();
        ctx.arc(0, 0, drop.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((p) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.lifespan / ft.maxLifespan;
      ctx.font = ft.isCrit ? 'bold 18px Outfit, sans-serif' : '14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  // --- Targeting Helpers ---
  private findNearestEnemy(x: number, y: number, maxRange: number): Enemy | null {
    let bestDist = maxRange;
    let bestEnemy: Enemy | null = null;
    for (const enemy of this.enemies) {
      const d = Math.hypot(enemy.x - x, enemy.y - y);
      if (d < bestDist) {
        bestDist = d;
        bestEnemy = enemy;
      }
    }
    return bestEnemy;
  }

  private findNearestEnemyExcluding(x: number, y: number, maxRange: number, excludedIds: Set<number>): Enemy | null {
    let bestDist = maxRange;
    let bestEnemy: Enemy | null = null;
    for (const enemy of this.enemies) {
      if (excludedIds.has(enemy.id)) continue;
      const d = Math.hypot(enemy.x - x, enemy.y - y);
      if (d < bestDist) {
        bestDist = d;
        bestEnemy = enemy;
      }
    }
    return bestEnemy;
  }

  private findHighestHpEnemy(x: number, y: number, maxRange: number): Enemy | null {
    let maxHp = 0;
    let bestEnemy: Enemy | null = null;
    for (const enemy of this.enemies) {
      const d = Math.hypot(enemy.x - x, enemy.y - y);
      if (d <= maxRange && enemy.hp > maxHp) {
        maxHp = enemy.hp;
        bestEnemy = enemy;
      }
    }
    return bestEnemy;
  }
}
