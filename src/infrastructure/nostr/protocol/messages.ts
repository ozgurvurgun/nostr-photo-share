import {toWireFilter, type NostrFilter} from './filter';
import type {SignedNostrEvent} from './event';

export type ClientToRelayMessage =
  | readonly ['EVENT', SignedNostrEvent]
  | readonly ['REQ', string, ...NostrFilter[]]
  | readonly ['CLOSE', string];

export type ParsedRelayMessage =
  | {readonly type: 'EVENT'; readonly subscriptionId: string; readonly event: unknown}
  | {readonly type: 'OK'; readonly eventId: string; readonly accepted: boolean; readonly message: string}
  | {readonly type: 'EOSE'; readonly subscriptionId: string}
  | {readonly type: 'CLOSED'; readonly subscriptionId: string; readonly message: string}
  | {readonly type: 'NOTICE'; readonly message: string}
  | {readonly type: 'AUTH'; readonly challenge: string}
  | {readonly type: 'UNKNOWN'; readonly raw: unknown};

export function toWireClientMessage(message: ClientToRelayMessage): unknown[] {
  if (message[0] === 'REQ') {
    const [, subscriptionId, ...filters] = message;
    return ['REQ', subscriptionId, ...filters.map(toWireFilter)];
  }
  return [...message];
}

export function parseRelayMessage(raw: unknown): ParsedRelayMessage {
  if (!Array.isArray(raw) || raw.length === 0 || typeof raw[0] !== 'string') {
    return {type: 'UNKNOWN', raw};
  }

  const type = raw[0];

  switch (type) {
    case 'EVENT': {
      if (raw.length < 3 || typeof raw[1] !== 'string') {
        return {type: 'UNKNOWN', raw};
      }
      return {type: 'EVENT', subscriptionId: raw[1], event: raw[2]};
    }
    case 'OK': {
      if (raw.length < 3 || typeof raw[1] !== 'string' || typeof raw[2] !== 'boolean') {
        return {type: 'UNKNOWN', raw};
      }
      const message = typeof raw[3] === 'string' ? raw[3] : '';
      return {type: 'OK', eventId: raw[1], accepted: raw[2], message};
    }
    case 'EOSE': {
      if (typeof raw[1] !== 'string') {
        return {type: 'UNKNOWN', raw};
      }
      return {type: 'EOSE', subscriptionId: raw[1]};
    }
    case 'CLOSED': {
      if (typeof raw[1] !== 'string') {
        return {type: 'UNKNOWN', raw};
      }
      const message = typeof raw[2] === 'string' ? raw[2] : '';
      return {type: 'CLOSED', subscriptionId: raw[1], message};
    }
    case 'NOTICE': {
      if (typeof raw[1] !== 'string') {
        return {type: 'UNKNOWN', raw};
      }
      return {type: 'NOTICE', message: raw[1]};
    }
    case 'AUTH': {
      if (typeof raw[1] !== 'string') {
        return {type: 'UNKNOWN', raw};
      }
      return {type: 'AUTH', challenge: raw[1]};
    }
    default:
      return {type: 'UNKNOWN', raw};
  }
}
