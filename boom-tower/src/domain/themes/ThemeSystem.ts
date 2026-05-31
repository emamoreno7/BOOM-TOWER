import { ThemeDefinition, DEFAULT_THEMES } from './ThemeDefinition';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';

export class ThemeSystem {
  private themes: Map<string, ThemeDefinition> = new Map();
  private activeThemeId = 'dark';

  constructor() {
    for (const theme of DEFAULT_THEMES) {
      this.themes.set(theme.id, { ...theme });
    }
    Logger.info('[ThemeSystem] Initialized');
  }

  getActiveTheme(): ThemeDefinition {
    return this.themes.get(this.activeThemeId) ?? DEFAULT_THEMES[0];
  }

  setActiveTheme(id: string): boolean {
    if (!this.themes.has(id)) {
      Logger.warn(`[ThemeSystem] Theme not found: ${id}`);
      return false;
    }
    this.activeThemeId = id;
    EventBus.emit('theme:changed', { themeId: id });
    Logger.info(`[ThemeSystem] Active theme: ${id}`);
    return true;
  }

  getAll(): ThemeDefinition[] {
    return [...this.themes.values()];
  }

  serialize(): { activeThemeId: string } {
    return { activeThemeId: this.activeThemeId };
  }

  restore(data: { activeThemeId: string }): void {
    this.activeThemeId = data.activeThemeId;
  }
}
