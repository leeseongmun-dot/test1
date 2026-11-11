import { MetaUpgrades } from './types';

const STORAGE_KEY = 'stellar_survivor_meta_v1';

export const DEFAULT_META: MetaUpgrades = {
  hullPlating: 0,
  thrusterTune: 0,
  weaponMatrix: 0,
  magnetCoil: 0,
  plasmaCore: 0,
  totalCredits: 100, // starting bonus credits to get players excited!
  highScore: 0,
  bestSurvivalTime: 0,
  totalKills: 0,
};

export const UPGRADE_TIERS = {
  hullPlating: { max: 5, costBase: 100, costMult: 1.8, label: '선체 장갑 보강', desc: '기본 최대 체력 +20%' },
  thrusterTune: { max: 5, costBase: 100, costMult: 1.8, label: '이온 추진기 개조', desc: '기동 속도 +10%' },
  weaponMatrix: { max: 5, costBase: 120, costMult: 2.0, label: '플라즈마 오버클럭', desc: '전체 공격력 +12%' },
  magnetCoil: { max: 5, costBase: 80, costMult: 1.6, label: '고주파 자력 코일', desc: '자원 흡수 반경 +25%' },
  plasmaCore: { max: 5, costBase: 150, costMult: 2.0, label: '동력로 고속 순환', desc: '공격 속도 +10%' },
};

export function loadMetaUpgrades(): MetaUpgrades {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_META;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_META, ...parsed };
  } catch {
    return DEFAULT_META;
  }
}

export function saveMetaUpgrades(meta: MetaUpgrades): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

export function calculateUpgradeCost(
  upgradeKey: keyof typeof UPGRADE_TIERS,
  currentLevel: number
): number {
  const cfg = UPGRADE_TIERS[upgradeKey];
  return Math.floor(cfg.costBase * Math.pow(cfg.costMult, currentLevel));
}
