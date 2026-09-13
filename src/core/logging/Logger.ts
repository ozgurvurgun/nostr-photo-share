import {redact} from './redact';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogFields = Readonly<Record<string, unknown>>;

export type LogRecord = {
  readonly level: LogLevel;
  readonly message: string;
  readonly fields?: LogFields;
};

export interface LogSink {
  write(record: LogRecord): void;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class MemoryLogSink implements LogSink {
  readonly records: LogRecord[] = [];

  write(record: LogRecord): void {
    this.records.push(record);
  }
}

export class ConsoleLogSink implements LogSink {
  write(record: LogRecord): void {
    const payload = record.fields === undefined ? record.message : [record.message, record.fields];
    switch (record.level) {
      case 'debug':
        console.debug(payload);
        break;
      case 'info':
        console.info(payload);
        break;
      case 'warn':
        console.warn(payload);
        break;
      case 'error':
        console.error(payload);
        break;
    }
  }
}

export class Logger {
  constructor(
    private readonly sink: LogSink,
    private readonly minLevel: LogLevel = 'debug',
  ) {}

  debug(message: string, fields?: LogFields): void {
    this.write('debug', message, fields);
  }

  info(message: string, fields?: LogFields): void {
    this.write('info', message, fields);
  }

  warn(message: string, fields?: LogFields): void {
    this.write('warn', message, fields);
  }

  error(message: string, fields?: LogFields): void {
    this.write('error', message, fields);
  }

  private write(level: LogLevel, message: string, fields?: LogFields): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) {
      return;
    }

    const safeMessage = String(redact(message));
    const safeFields =
      fields === undefined ? undefined : (redact(fields) as Record<string, unknown>);

    this.sink.write({
      level,
      message: safeMessage,
      fields: safeFields,
    });
  }
}
