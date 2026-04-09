/**
 * Structured Logger
 * Production-grade logging for MCP Intent Router
 *
 * @module logger
 * @version 1.0.0
 */

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  module: string;
  data?: Record<string, unknown>;
  error?: Error;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
}

/**
 * Logger class
 */
export class Logger {
  private config: LoggerConfig;
  private module: string;

  constructor(module: string, config?: Partial<LoggerConfig>) {
    this.module = module;
    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      enableConsole: true,
      enableFile: false,
      ...config,
    };
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('error', message, data, error);
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    // Check if level is enabled
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      module: this.module,
      data,
      error,
    };

    // Output to console
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }

    // Could also output to file here
    if (this.config.enableFile && this.config.filePath) {
      this.outputToFile(entry);
    }
  }

  /**
   * Check if log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.config.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  /**
   * Output to console
   */
  private outputToConsole(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';

    const color = colors[entry.level];
    const output = `${color}[${entry.level.toUpperCase()}]${reset} [${entry.module}] ${entry.message}`;

    if (entry.level === 'error') {
      console.error(output);
      if (entry.error) {
        console.error(entry.error);
      }
    } else if (entry.level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }

    if (entry.data) {
      console.log('  Data:', JSON.stringify(entry.data, null, 2));
    }
  }

  /**
   * Output to file (stub implementation)
   */
  private outputToFile(_entry: LogEntry): void {
    // File logging implementation would go here
    // For now, we only support console logging
  }
}

/**
 * Create logger instance
 */
export function createLogger(module: string): Logger {
  return new Logger(module);
}
