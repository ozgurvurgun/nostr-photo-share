import {err, isErr, isOk, ok} from './Result';

describe('Result', () => {
  it('wraps a successful value', () => {
    const result = ok(21);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe(21);
    }
  });

  it('wraps a failure without throwing', () => {
    const result = err(new Error('nope'));

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('nope');
    }
  });
});
