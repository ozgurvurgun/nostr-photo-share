import {PublicKey} from './PublicKey';

describe('PublicKey', () => {
  const valid =
    '7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e';

  it('accepts a valid 64-char hex public key', () => {
    const result = PublicKey.fromHex(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.toHex()).toBe(valid);
  });

  it('normalizes uppercase hex to lowercase', () => {
    const result = PublicKey.fromHex(valid.toUpperCase());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.toHex()).toBe(valid);
  });

  it('rejects non-hex and wrong-length values', () => {
    expect(PublicKey.fromHex('not-a-key').ok).toBe(false);
    expect(PublicKey.fromHex(valid.slice(0, 63)).ok).toBe(false);
    expect(PublicKey.fromHex(`${valid}aa`).ok).toBe(false);
  });

  it('compares equality by hex value', () => {
    const a = PublicKey.fromHex(valid);
    const b = PublicKey.fromHex(valid);
    expect(a.ok && b.ok && a.value.equals(b.value)).toBe(true);
  });
});
