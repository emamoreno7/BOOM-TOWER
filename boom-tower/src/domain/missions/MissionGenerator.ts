import { Random } from '../../core/Random';

export type MissionType = 'score' | 'combo' | 'blocks' | 'special' | 'games';

export interface Mission {
  id: string;
  type: MissionType;
  description: string;
  target: number;
  current: number;
  reward: { coins: number; gems?: number };
  completed: boolean;
  expiresAt: number;
}

interface MissionTemplate {
  type: MissionType;
  descriptions: string[];
  targets: number[];
  rewards: Array<{ coins: number; gems?: number }>;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    type: 'score',
    descriptions: ['Consigue TARGET puntos', 'Alcanza TARGET puntos en una partida'],
    targets: [500, 1000, 2000, 5000],
    rewards: [{ coins: 50 }, { coins: 100 }, { coins: 200 }, { coins: 500, gems: 5 }],
  },
  {
    type: 'combo',
    descriptions: ['Haz un combo de TARGET', 'Consigue un combo xTARGET'],
    targets: [3, 5, 8, 10],
    rewards: [{ coins: 40 }, { coins: 80 }, { coins: 150 }, { coins: 300, gems: 3 }],
  },
  {
    type: 'blocks',
    descriptions: ['Destruye TARGET bloques', 'Elimina TARGET bloques'],
    targets: [20, 50, 100, 200],
    rewards: [{ coins: 30 }, { coins: 70 }, { coins: 150 }, { coins: 300 }],
  },
  {
    type: 'special',
    descriptions: ['Activa TARGET bloque especial', 'Usa TARGET bloques especiales'],
    targets: [1, 2, 3, 5],
    rewards: [{ coins: 60 }, { coins: 120 }, { coins: 200 }, { coins: 400, gems: 5 }],
  },
  {
    type: 'games',
    descriptions: ['Juega TARGET partida', 'Completa TARGET partidas'],
    targets: [1, 2, 3, 5],
    rewards: [{ coins: 25 }, { coins: 50 }, { coins: 80 }, { coins: 150 }],
  },
];

export class MissionGenerator {
  generate(count = 3, durationMs = 86400000): Mission[] {
    const missions: Mission[] = [];
    const expiresAt = Date.now() + durationMs;
    const usedTypes = new Set<MissionType>();

    while (missions.length < count) {
      const template = Random.pick(MISSION_TEMPLATES);
      if (usedTypes.has(template.type)) continue;
      usedTypes.add(template.type);

      const idx = Random.integer(0, template.targets.length - 1);
      const description = Random.pick(template.descriptions)
        .replace('TARGET', String(template.targets[idx]));

      missions.push({
        id: template.type + '_' + Date.now() + '_' + missions.length,
        type: template.type,
        description,
        target: template.targets[idx],
        current: 0,
        reward: template.rewards[idx],
        completed: false,
        expiresAt,
      });
    }

    return missions;
  }
}
