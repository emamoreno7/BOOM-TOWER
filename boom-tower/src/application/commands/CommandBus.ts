import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { Command, CommandResult, CommandData } from './Command';

// ============================================
// COMMAND BUS — Despachador de comandos
// ============================================

type CommandHandler<T = unknown> = (payload: T) => CommandResult;

class CommandBus {
  private static instance: CommandBus;
  
  private handlers = new Map<string, CommandHandler>();
  private middleware: CommandMiddleware[] = [];
  private executedCommands: CommandData[] = [];
  private maxHistory = 1000;

  private constructor() {
    Logger.system('CommandBus initialized');
  }

  static getInstance(): CommandBus {
    if (!CommandBus.instance) {
      CommandBus.instance = new CommandBus();
    }
    return CommandBus.instance;
  }

  // Registrar handler
  register<T = unknown>(commandType: string, handler: CommandHandler<T>): void {
    if (this.handlers.has(commandType)) {
      Logger.warn(`[CommandBus] Handler already registered for "${commandType}", overwriting`);
    }
    this.handlers.set(commandType, handler as CommandHandler);
    Logger.debug(`[CommandBus] Registered handler: ${commandType}`);
  }

  // Desregistrar handler
  unregister(commandType: string): boolean {
    return this.handlers.delete(commandType);
  }

  // Ejecutar comando
  execute(command: Command): CommandResult {
    const handler = this.handlers.get(command.type);
    
    if (!handler) {
      const error = `No handler registered for command type: ${command.type}`;
      Logger.error(`[CommandBus] ${error}`);
      return { success: false, error };
    }

    // Ejecutar middleware
    const context = this.createContext(command);
    for (const mw of this.middleware) {
      const result = mw.before(context);
      if (!result.success) {
        Logger.warn(`[CommandBus] Middleware rejected: ${command.type}`, { reason: result.error });
        return result;
      }
    }

    // Ejecutar comando
    try {
      Logger.debug(`[CommandBus] Executing: ${command.type}`, { id: command.id });
      
      const result = handler(command.serialize().payload);
      
      // Post middleware
      for (const mw of this.middleware) {
        mw.after(context, result);
      }

      // Guardar en historial
      this.executedCommands.push(command.serialize());
      if (this.executedCommands.length > this.maxHistory) {
        this.executedCommands.shift();
      }

      // Emitir evento
      EventBus.emit(`command:executed`, { type: command.type, result, id: command.id });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`[CommandBus] Execution failed: ${command.type}`, { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  // Ejecutar por tipo y payload (sin crear clase)
  executeType<T = unknown>(commandType: string, payload: T): CommandResult {
    const handler = this.handlers.get(commandType);
    
    if (!handler) {
      return { success: false, error: `No handler for ${commandType}` };
    }

    try {
      const result = handler(payload);
      EventBus.emit(`command:executed`, { type: commandType, result });
      return result;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Agregar middleware
  use(middleware: CommandMiddleware): void {
    this.middleware.push(middleware);
    Logger.debug(`[CommandBus] Middleware added: ${middleware.constructor.name}`);
  }

  // Historial
  getHistory(): readonly CommandData[] {
    return [...this.executedCommands];
  }

  // Limpiar historial
  clearHistory(): void {
    this.executedCommands = [];
    Logger.info('[CommandBus] History cleared');
  }

  // Verificar si hay handler
  hasHandler(commandType: string): boolean {
    return this.handlers.has(commandType);
  }

  // Listar handlers
  getRegisteredCommands(): string[] {
    return [...this.handlers.keys()];
  }

  // Debug info
  getDebugInfo(): object {
    return {
      registeredCommands: this.handlers.size,
      middlewareCount: this.middleware.length,
      historySize: this.executedCommands.length,
    };
  }

  private createContext(command: Command): CommandContext {
    return {
      commandId: command.id,
      commandType: command.type,
      timestamp: command.timestamp,
    };
  }
}

interface CommandContext {
  commandId: string;
  commandType: string;
  timestamp: number;
}

export interface CommandMiddleware {
  before(context: CommandContext): CommandResult;
  after?(context: CommandContext, result: CommandResult): void;
}

// Singleton export
export const CommandBus = CommandBus.getInstance();
