import { ShipConfig, WeaponDef, PassiveDef, WeaponId, PassiveId, UpgradeChoice, WeaponState, PassiveState } from './types';

export const SHIPS: Record<string, ShipConfig> = {
  interceptor: {
    id: 'interceptor',
    name: '시안 인터셉터',
    subname: '기동형 고속 요격투사기',
    description: '탁월한 추진 속도와 높은 치명타율로 적진을 유린합니다.',
    maxHp: 100,
    armor: 2,
    speed: 5.2,
    critChance: 0.20,
    startingWeaponId: 'plasma_blaster',
    imagePath: '/src/assets/images/ship_interceptor_1794375665930.jpg',
    accentColor: '#06b6d4',
  },
  dreadnought: {
    id: 'dreadnought',
    name: '타이탄 드레드노트',
    subname: '중장갑 결전형 순양전함',
    description: '두터운 장갑과 강력한 근접 방어 회전 톱날로 접근을 불허합니다.',
    maxHp: 180,
    armor: 8,
    speed: 3.8,
    critChance: 0.08,
    startingWeaponId: 'orbital_slicers',
    imagePath: '/src/assets/images/ship_dreadnought_1794375667738.jpg',
    accentColor: '#f59e0b',
  },
  vanguard: {
    id: 'vanguard',
    name: '아스트랄 뱅가드',
    subname: '에너지 증폭 차원순양함',
    description: '광범위한 자력 필드와 치명적인 연쇄 방전으로 대규모 군체를 소탕합니다.',
    maxHp: 130,
    armor: 4,
    speed: 4.5,
    critChance: 0.14,
    startingWeaponId: 'chain_lightning',
    imagePath: '/src/assets/images/stellar_survivor_cover_1794375666792.jpg',
    accentColor: '#a855f7',
  },
};

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  plasma_blaster: {
    id: 'plasma_blaster',
    name: '플라즈마 블래스터',
    category: 'weapon',
    description: '가장 가까운 적을 향해 고속 플라즈마 탄환을 점사합니다.',
    icon: '⚡',
    baseDamage: 22,
    baseCooldown: 0.45,
    projectileSpeed: 11,
    projectileCount: 1,
    range: 550,
    evolutionHint: '레벨업 시 탄환 수 및 관통력 증가',
  },
  orbital_slicers: {
    id: 'orbital_slicers',
    name: '궤도 에너지 슬라이서',
    category: 'weapon',
    description: '함선 주위를 회전하며 접근하는 모든 적을 갈아버립니다.',
    icon: '🌀',
    baseDamage: 18,
    baseCooldown: 0.15,
    range: 110,
    evolutionHint: '레벨업 시 톱날 수 증가 및 회전 속도 증폭',
  },
  chain_lightning: {
    id: 'chain_lightning',
    name: '연쇄 방전 테슬라',
    category: 'weapon',
    description: '고전압 전격을 방출하여 근처 적들에게 연쇄적으로 피해를 입힙니다.',
    icon: '🌩️',
    baseDamage: 34,
    baseCooldown: 1.2,
    range: 480,
    evolutionHint: '레벨업 시 연쇄 타격 횟수 및 감전 피해 대폭 증가',
  },
  homing_missiles: {
    id: 'homing_missiles',
    name: '스마트 유도 미사일',
    category: 'weapon',
    description: '체력이 높은 적을 스스로 추적하여 광역 폭발 피해를 입힙니다.',
    icon: '🚀',
    baseDamage: 45,
    baseCooldown: 1.4,
    projectileSpeed: 7,
    range: 650,
    evolutionHint: '레벨업 시 동시 발사 수 및 폭발 반경 증가',
  },
  frost_aura: {
    id: 'frost_aura',
    name: '극저온 서리 파동',
    category: 'weapon',
    description: '주변 공간을 냉각시켜 적의 이동속도를 40% 감속하고 지속 피해를 줍니다.',
    icon: '❄️',
    baseDamage: 12,
    baseCooldown: 0.8,
    range: 200,
    evolutionHint: '레벨업 시 냉기장 반경 및 틱 데미지 증가',
  },
  combat_drone: {
    id: 'combat_drone',
    name: '자율 요격 드론',
    category: 'weapon',
    description: '함선 주변을 비행하며 적을 자동으로 요격하는 지원 비행체.',
    icon: '🛸',
    baseDamage: 28,
    baseCooldown: 0.7,
    range: 400,
    evolutionHint: '레벨업 시 드론 배치 수 및 연사력 향상',
  },
};

export const PASSIVES: Record<PassiveId, PassiveDef> = {
  boost_damage: {
    id: 'boost_damage',
    name: '입자 가속 모듈',
    category: 'passive',
    description: '모든 무기의 타격 공격력을 증폭합니다.',
    icon: '🔥',
    statBonus: '공격력 +15%',
  },
  boost_attackspeed: {
    id: 'boost_attackspeed',
    name: '냉각 순환 펌프',
    category: 'passive',
    description: '무기 재장전 및 발사 쿨다운 시간을 단축합니다.',
    icon: '⏱️',
    statBonus: '공격 속도 +12%',
  },
  boost_speed: {
    id: 'boost_speed',
    name: '타키온 이온 추진기',
    category: 'passive',
    description: '함선의 이동 속도와 기동 선회력을 높입니다.',
    icon: '💨',
    statBonus: '이동 속도 +10%',
  },
  boost_magnet: {
    id: 'boost_magnet',
    name: '중력파 견인 광선',
    category: 'passive',
    description: '경험치 에너지 젬 및 아이템을 더 먼 거리에서 흡수합니다.',
    icon: '🧲',
    statBonus: '자원 흡수 반경 +35%',
  },
  boost_maxhp: {
    id: 'boost_maxhp',
    name: '나노 리페어 외골격',
    category: 'passive',
    description: '최대 선체 내구도를 늘리고 선체를 즉각 수리합니다.',
    icon: '🛡️',
    statBonus: '최대 체력 +25 & 즉시 회복',
  },
  boost_crit: {
    id: 'boost_crit',
    name: '정밀 타겟팅 센서',
    category: 'passive',
    description: '약점 조준을 활성화하여 치명타 확률과 피해를 증가시킵니다.',
    icon: '🎯',
    statBonus: '치명타 확률 +10%',
  },
  boost_shield: {
    id: 'boost_shield',
    name: '위상 왜곡 보호막',
    category: 'passive',
    description: '피해를 먼저 흡수하는 재생형 에너지 쉴드를 전개합니다.',
    icon: '💠',
    statBonus: '에너지 보호막 +30 생성',
  },
};

export const MAX_WEAPON_LEVEL = 6;
export const MAX_PASSIVE_LEVEL = 5;

export function generateUpgradeChoices(
  currentWeapons: WeaponState[],
  currentPassives: PassiveState[]
): UpgradeChoice[] {
  const choices: UpgradeChoice[] = [];
  const pool: { type: 'weapon' | 'passive'; id: WeaponId | PassiveId }[] = [];

  const weaponSlotsFull = currentWeapons.length >= 4;
  const passiveSlotsFull = currentPassives.length >= 4;

  // Available weapons
  (Object.keys(WEAPONS) as WeaponId[]).forEach((wId) => {
    const existing = currentWeapons.find((w) => w.id === wId);
    if (existing) {
      if (existing.level < MAX_WEAPON_LEVEL) {
        pool.push({ type: 'weapon', id: wId });
      }
    } else if (!weaponSlotsFull) {
      pool.push({ type: 'weapon', id: wId });
    }
  });

  // Available passives
  (Object.keys(PASSIVES) as PassiveId[]).forEach((pId) => {
    const existing = currentPassives.find((p) => p.id === pId);
    if (existing) {
      if (existing.level < MAX_PASSIVE_LEVEL) {
        pool.push({ type: 'passive', id: pId });
      }
    } else if (!passiveSlotsFull) {
      pool.push({ type: 'passive', id: pId });
    }
  });

  // Shuffle pool
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 3);

  picked.forEach((item) => {
    if (item.type === 'weapon') {
      const def = WEAPONS[item.id as WeaponId];
      const existing = currentWeapons.find((w) => w.id === item.id);
      const level = existing ? existing.level + 1 : 1;
      const isNew = !existing;
      let rarity: UpgradeChoice['rarity'] = 'common';
      if (level === MAX_WEAPON_LEVEL) rarity = 'legendary';
      else if (level >= 4) rarity = 'epic';
      else if (level >= 2) rarity = 'rare';

      choices.push({
        type: 'weapon',
        id: item.id,
        name: def.name,
        level,
        isNew,
        description: isNew ? def.description : `레벨 ${level} 업그레이드: 위력 및 성능 강화 (${def.evolutionHint})`,
        rarity,
        icon: def.icon,
      });
    } else {
      const def = PASSIVES[item.id as PassiveId];
      const existing = currentPassives.find((p) => p.id === item.id);
      const level = existing ? existing.level + 1 : 1;
      const isNew = !existing;
      let rarity: UpgradeChoice['rarity'] = 'common';
      if (level === MAX_PASSIVE_LEVEL) rarity = 'legendary';
      else if (level >= 3) rarity = 'epic';
      else if (level >= 2) rarity = 'rare';

      choices.push({
        type: 'passive',
        id: item.id,
        name: def.name,
        level,
        isNew,
        description: `${def.description} (${def.statBonus})`,
        rarity,
        icon: def.icon,
      });
    }
  });

  // Fallback if pool is empty (e.g. all maxed out): Repair / Credits reward
  while (choices.length < 3) {
    choices.push({
      type: 'passive',
      id: 'boost_maxhp',
      name: '긴급 필드 수리 키트',
      level: 1,
      isNew: false,
      description: '즉시 체력을 40 수리하고 +50 크레딧을 획득합니다.',
      rarity: 'rare',
      icon: '🔧',
    });
  }

  return choices;
}
