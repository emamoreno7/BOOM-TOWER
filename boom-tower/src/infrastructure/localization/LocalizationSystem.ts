import { Logger } from '../../core/Logger';

type LocaleStrings = Record<string, string>;

export class LocalizationSystem {
  private strings: Map<string, LocaleStrings> = new Map();
  private activeLocale = 'en';

  constructor() {
    this.loadDefault();
    Logger.info('[LocalizationSystem] Initialized');
  }

  private loadDefault(): void {
    this.strings.set('en', {
      'menu.play': 'PLAY',
      'menu.settings': 'SETTINGS',
      'menu.shop': 'SHOP',
      'game.score': 'SCORE',
      'game.combo': 'COMBO',
      'game.depth': 'DEPTH',
      'game.pause': 'PAUSED',
      'game.resume': 'RESUME',
      'game.restart': 'RESTART',
      'game.gameover': 'GAME OVER',
      'game.playagain': 'PLAY AGAIN',
      'game.mainmenu': 'MAIN MENU',
      'daily.title': 'DAILY REWARD',
      'daily.claim': 'CLAIM REWARD',
      'daily.streak': 'LOGIN STREAK',
      'levelup.title': 'LEVEL UP!',
      'achievement.unlocked': 'Achievement Unlocked!',
    });

    this.strings.set('es', {
      'menu.play': 'JUGAR',
      'menu.settings': 'AJUSTES',
      'menu.shop': 'TIENDA',
      'game.score': 'PUNTOS',
      'game.combo': 'COMBO',
      'game.depth': 'NIVEL',
      'game.pause': 'PAUSA',
      'game.resume': 'CONTINUAR',
      'game.restart': 'REINICIAR',
      'game.gameover': 'FIN DEL JUEGO',
      'game.playagain': 'JUGAR DE NUEVO',
      'game.mainmenu': 'MENU PRINCIPAL',
      'daily.title': 'RECOMPENSA DIARIA',
      'daily.claim': 'RECLAMAR',
      'daily.streak': 'RACHA DE LOGIN',
      'levelup.title': 'SUBISTE DE NIVEL!',
      'achievement.unlocked': 'Logro Desbloqueado!',
    });
  }

  setLocale(locale: string): void {
    if (!this.strings.has(locale)) {
      Logger.warn(`[Localization] Locale not found: ${locale}`);
      return;
    }
    this.activeLocale = locale;
    Logger.info(`[Localization] Active locale: ${locale}`);
  }

  t(key: string, fallback?: string): string {
    const localeStrings = this.strings.get(this.activeLocale);
    return localeStrings?.[key] ?? fallback ?? key;
  }

  getAvailableLocales(): string[] {
    return [...this.strings.keys()];
  }

  addLocale(locale: string, strings: LocaleStrings): void {
    this.strings.set(locale, strings);
  }
}
