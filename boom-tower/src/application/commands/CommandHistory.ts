import { Logger } from '../../core/Logger';
import { Command, CommandData } from './Command';
import { CommandBus } from './CommandBus';

// ============================================
// COMMAND HISTORY — Para undo/replay
// ============================================

interface HistoryEntry {
  command: CommandData;
  result: { success: boolean; error?: string };
  undoable: boolean;
}

class CommandHistory_ {
  private static instance: CommandHistory_;
  
  private history: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxHistory: number;
  private isUndoing = false;

  private constructor(maxHistory = 500) {
    this.maxHistory = maxHistory;
    Logger.system('CommandHistory initialized');
  }

  static getInstance(): CommandHistory_ {
    if (!CommandHistory_.instance) {
      CommandHistory_.instance = new CommandHistory_();
    }
    return CommandHistory_.instance;
  }

  // Registrar comando ejecutado
  record(command: CommandData, result: { success: boolean; error?: string }): void {
    if (this.isUndoing) return;

    this.history.push({
      command,
      result,
      undoable: !!command,
    });

    // Limpiar redo
    this.redoStack = [];

    // Limitar tamaño
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    Logger.debug(`[CommandHistory] Recorded: ${command.type}`, { id: command.id });
  }

  // Obtener último comando
  peek(): HistoryEntry | undefined {
    return this.history[this.history.length - 1];
  }

  // Hacer undo
  undo(): { success: boolean; error?: string } {
    const entry = this.history.pop();
    
    if (!entry) {
      return { success: false, error: 'No commands to undo' };
    }

    this.isUndoing = true;
    
    try {
      // Intentar undo si está soportado
      // Por ahora solo marcamos como redo
      this.redoStack.push(entry);
      
      Logger.info(`[CommandHistory] Undo: ${entry.command.type}`, { id: entry.command.id });
      return { success: true };
    } finally {
      this.isUndoing = false;
    }
  }

  // Hacer redo
  redo(): { success: boolean; error?: string } {
    const entry = this.redoStack.pop();
    
    if (!entry) {
      return { success: false, error: 'No commands to redo' };
    }

    // Re-ejecutar comando
    const result = CommandBus.executeType(entry.command.type, entry.command.payload);
    
    if (result.success) {
      this.history.push(entry);
      Logger.info(`[CommandHistory] Redo: ${entry.command.type}`, { id: entry.command.id });
    }

    return result;
  }

  // Puede hacer undo?
  canUndo(): boolean {
    return this.history.length > 0;
  }

  // Puede hacer redo?
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Limpiar todo
  clear(): void {
    this.history = [];
    this.redoStack = [];
    Logger.info('[CommandHistory] Cleared');
  }

  // Exportar para analytics/replay
  export(): HistoryEntry[] {
    return JSON.parse(JSON.stringify(this.history));
  }

  // Importar (para replay)
  import(entries: HistoryEntry[]): void {
    this.history = [...entries];
    this.redoStack = [];
    Logger.info(`[CommandHistory] Imported ${entries.length} entries`);
  }

  // Tamaño
  get size(): number {
    return this.history.length;
  }

  get redoSize(): number {
    return this.redoStack.length;
  }
}

export const CommandHistory = CommandHistory_.getInstance();
