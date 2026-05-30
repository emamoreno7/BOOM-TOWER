// ============================================
// COMMAND — Interfaz base para Command Pattern
// ============================================

export interface CommandResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export interface Command {
  readonly id: string;
  readonly type: string;
  readonly timestamp: number;
  execute(): CommandResult;
  undo?(): CommandResult;
  serialize(): CommandData;
}

export interface CommandData {
  id: string;
  type: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

// Base abstracta para comandos
export abstract class BaseCommand implements Command {
  readonly id: string;
  abstract readonly type: string;
  readonly timestamp: number;

  constructor() {
    this.id = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = Date.now();
  }

  abstract execute(): CommandResult;
  abstract serialize(): CommandData;

  undo?(): CommandResult {
    return { success: false, error: 'Undo not implemented' };
  }
}

// Helper para crear comandos tipados
export function createCommand<TPayload extends Record<string, unknown>>(
  type: string,
  payload: TPayload,
  executor: (payload: TPayload) => CommandResult
): BaseCommand & { payload: TPayload } {
  return new (class extends BaseCommand {
    readonly type = type;
    payload = payload;
    
    execute(): CommandResult {
      return executor(this.payload);
    }

    serialize(): CommandData {
      return {
        id: this.id,
        type: this.type,
        timestamp: this.timestamp,
        payload: this.payload as Record<string, unknown>,
      };
    }
  })();
}
