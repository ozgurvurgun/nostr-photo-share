import {Logger, MemoryLogSink} from './Logger';
import {redact} from './redact';

describe('redact', () => {
  it('redacts nsec bech32 values anywhere in a string', () => {
    const nsec = 'nsec1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
    expect(redact(`imported ${nsec}`)).toBe('imported [REDACTED]');
  });

  it('redacts private-key fields even when the value is hex', () => {
    const secret = 'aa'.repeat(32);
    expect(redact({privateKey: secret, id: 'public-event-id'})).toEqual({
      privateKey: '[REDACTED]',
      id: 'public-event-id',
    });
  });
});

describe('Logger', () => {
  it('never writes nsec or private key material to the sink', () => {
    const sink = new MemoryLogSink();
    const logger = new Logger(sink);
    const nsec = 'nsec1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';

    logger.info('import failed', {
      nsec,
      privateKey: 'ff'.repeat(32),
      pubkey: 'aa'.repeat(32),
    });

    const record = sink.records[0];
    expect(record).toBeDefined();
    expect(JSON.stringify(record)).not.toContain('nsec1');
    expect(JSON.stringify(record)).not.toContain('ff'.repeat(32));
    expect(record?.fields?.nsec).toBe('[REDACTED]');
    expect(record?.fields?.privateKey).toBe('[REDACTED]');
    expect(record?.fields?.pubkey).toBe('aa'.repeat(32));
  });

  it('redacts token fields', () => {
    const sink = new MemoryLogSink();
    const logger = new Logger(sink);

    logger.info('auth', {token: 'super-secret', accessToken: 'also-secret'});

    expect(sink.records[0]?.fields).toEqual({
      token: '[REDACTED]',
      accessToken: '[REDACTED]',
    });
  });

  it('redacts URL userinfo and Error causes', () => {
    expect(redact('wss://user:secret@relay.example')).toBe('wss://[REDACTED]@relay.example');
    const nested = new Error('outer', {cause: new Error('nsec1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq')});
    const redacted = redact(nested) as {message: string; cause: {message: string}};
    expect(redacted.cause.message).toBe('[REDACTED]');
  });
});
