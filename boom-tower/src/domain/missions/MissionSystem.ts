import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/Logger';
import { Mission, MissionGenerator, MissionType } from './MissionGenerator';

class MissionSystem_ {
  private static instance: MissionSystem_;
  private missions: Mission[] = [];
  private generator: MissionGenerator = new MissionGenerator();

  private constructor() {
    Logger.system('MissionSystem initialized');
    this.setupListeners();
  }

  static getInstance(): MissionSystem_ {
    if (!MissionSystem_.instance) {
      MissionSystem_.instance = new MissionSystem_();
    }
    return MissionSystem_.instance;
  }

  init(): void {
    if (this.missions.length === 0 || this.areExpired()) {
      this.refresh();
    }
  }

  private areExpired(): boolean {
    return this.missions.some(m => Date.now() > m.expiresAt);
  }

  refresh(): void {
    this.missions = this.generator.generate(3);
    EventBus.emit('missions:refreshed', { missions: this.missions });
    Logger.info('[MissionSystem] Missions refreshed');
  }

  progress(type: MissionType, amount = 1): void {
    for (const mission of this.missions) {
      if (mission.completed || mission.type !== type) continue;
      if (Date.now() > mission.expiresAt) continue;
      mission.current = Math.min(mission.target, mission.current + amount);
      if (mission.current >= mission.target) {
        mission.completed = true;
        Logger.info('[MissionSystem] Mission completed: ' + mission.id);
        EventBus.emit('mission:completed', { mission });
        EventBus.emit('economy:reward', { ...mission.reward, reason: 'mission_' + mission.id });
      } else {
        EventBus.emit('mission:progress', { mission });
      }
    }
  }

  private setupListeners(): void {
    EventBus.on('game:ended', (data: { score: number; maxCombo: number; blocksDestroyed: number }) => {
      this.progress('games', 1);
      this.progress('score', data.score);
      this.progress('combo', data.maxCombo);
      this.progress('blocks', data.blocksDestroyed);
    });
    EventBus.on('special:activated', () => this.progress('special', 1));
  }

  getMissions(): Mission[]  { return [...this.missions]; }
  getPending(): Mission[]   { return this.missions.filter(m => !m.completed); }
  getCompleted(): Mission[] { return this.missions.filter(m => m.completed); }
  restore(missions: Mission[]): void { this.missions = missions; }
  serialize(): Mission[]             { return [...this.missions]; }
}

export const MissionSystem = MissionSystem_.getInstance();
