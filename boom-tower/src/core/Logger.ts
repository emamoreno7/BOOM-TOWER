import type { LogLevel } from '../types';
import { CONFIG } from '../config';

// ============================================
// LOGGER — Sistema de logs centralizado
// ============================================

class Logger_ {
  private static instance: Logger_;
  private level: LogLevel = 'DEBUG';
  private prefix = CONFIG.LOG.PREFIX;
  private history: LogEntry[] = [];
  private maxHistory = 500;

  private constructor() {
    this.setLevel(CONFIG.LOG.LEVEL);
  }

  static getInstance(): Logger_ {
    if (!Logger_.instance) {
      Logger_.instance = new Logger_();
    }
    return Logger_.instance;
  }

  setLevel(level: LogLevel): void {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const targetIndex = levels.indexOf(level);
    this.level = level;
    this.debug(`Logger level set to: ${level}`);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private format(level: LogLevel, message: string, context?: object): string {
    const timestamp = new Date().toISOString().substr(11, 12);
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `${this.prefix}[${timestamp}][${level}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: Date.now(),
    };
    this.history.push(entry);

    // Limitar historial
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const formatted = this.format(level, message, context);

    if (CONFIG.LOG.ENABLE_CONSOLE) {
      switch (level) {
        case 'DEBUG':
          console.debug(formatted);
          break;
        case 'INFO':
          console.info(formatted);
          break;
        case 'WARN':
          console.warn(formatted);
          break;
        case 'ERROR':
          console.error(formatted);
          break;
      }
    }
  }

  debug(message: string, context?: object): void {
    this.log('DEBUG', message, context);
  }

  info(message: string, context?: object): void {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: object): void {
    this.log('WARN', message, context);
  }

  error(message: string, context?: object): void {
    this.log('ERROR', message, context);
  }

  // Logs especiales para game events
  game(message: string, data?: object): void {
    this.info(`🎮 ${message}`, data);
  }

  ui(message: string, data?: object): void {
    this.debug(`🖥️  ${message}`, data);
  }

  system(message: string, data?: object): void {
    this.info(`⚙️  ${message}`, data);
  }

  perf(message: string, data?: object): void {
    this.debug(`⚡ ${message}`, data);
  }

  // Obtener historial para debug
  getHistory(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.history.filter(e => e.level === level);
    }
    return [...this.history];
  }

  clear(): void {
    this.history = [];
  }
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: object;
  timestamp: number;
}

// Singleton export
export const Logger = Logger_.getInstance();
