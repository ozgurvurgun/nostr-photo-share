import {parseRelayMessage} from './messages';

describe('parseRelayMessage', () => {
  it('parses NIP-01 relay messages', () => {
    expect(parseRelayMessage(['EVENT', 'sub1', {id: 'abc'}])).toEqual({
      type: 'EVENT',
      subscriptionId: 'sub1',
      event: {id: 'abc'},
    });
    expect(parseRelayMessage(['OK', 'event1', true, 'duplicate: already have this event'])).toEqual({
      type: 'OK',
      eventId: 'event1',
      accepted: true,
      message: 'duplicate: already have this event',
    });
    expect(parseRelayMessage(['EOSE', 'sub1'])).toEqual({type: 'EOSE', subscriptionId: 'sub1'});
    expect(parseRelayMessage(['CLOSED', 'sub1', 'error: shutting down'])).toEqual({
      type: 'CLOSED',
      subscriptionId: 'sub1',
      message: 'error: shutting down',
    });
    expect(parseRelayMessage(['NOTICE', 'slow down'])).toEqual({
      type: 'NOTICE',
      message: 'slow down',
    });
  });

  it('parses AUTH without treating it as fatal', () => {
    expect(parseRelayMessage(['AUTH', 'challenge-token'])).toEqual({
      type: 'AUTH',
      challenge: 'challenge-token',
    });
  });

  it('returns UNKNOWN for malformed frames', () => {
    expect(parseRelayMessage('not-an-array')).toEqual({type: 'UNKNOWN', raw: 'not-an-array'});
    expect(parseRelayMessage(['EVENT'])).toEqual({type: 'UNKNOWN', raw: ['EVENT']});
  });
});
