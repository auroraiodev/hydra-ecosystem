import { COLLECTOR_LEVELS } from '../constants';

export function getCollectorLevel(orders: number) {
  const level = COLLECTOR_LEVELS.findIndex((l) => orders >= l.min && orders <= l.max);
  const current = COLLECTOR_LEVELS[level];
  const next = COLLECTOR_LEVELS[level + 1] ?? null;
  const progress = next
    ? Math.round(((orders - current.min) / (next.min - current.min)) * 100)
    : 100;
  return { current, next, progress, levelIndex: level };
}
