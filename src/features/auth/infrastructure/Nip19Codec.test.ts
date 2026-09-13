import {bytesToHex, hexToBytes} from '../../../core/utilities/hex';
import {Nip19Codec} from './Nip19Codec';

describe('Nip19Codec', () => {
  const codec = new Nip19Codec();

  it('roundtrips the official NIP-19 npub vector', () => {
    const hex = '7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e';
    const npub =
      'npub10elfcs4fr0l0r8af98jlmgdh9c8tcxjvz9qkw038js35mp4dma8qzvjptg';

    const encoded = codec.encodeNpub(hex);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) {
      return;
    }
    expect(encoded.value).toBe(npub);

    const decoded = codec.decode(npub);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) {
      return;
    }
    expect(decoded.value).toEqual({type: 'npub', data: hex});
  });

  it('roundtrips the official NIP-19 nsec vector', () => {
    const hex = '67dea2ed018072d675f5415ecfaed7d2597555e202d85b3d65ea4e58d2d92ffa';
    const nsec =
      'nsec1vl029mgpspedva04g90vltkh6fvh240zqtv9k0t9af8935ke9laqsnlfe5';

    const encoded = codec.encodeNsec(hexToBytes(hex));
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) {
      return;
    }
    expect(encoded.value).toBe(nsec);

    const decoded = codec.decode(nsec);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok || decoded.value.type !== 'nsec') {
      return;
    }
    expect(bytesToHex(decoded.value.data)).toBe(hex);
  });

  it('roundtrips nprofile with relays (NIP-19 example pubkey)', () => {
    const pubkey = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
    const relays = ['wss://r.x.com', 'wss://djbas.sadkb.com'] as const;

    const encoded = codec.encodeNprofile({pubkey, relays});
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) {
      return;
    }

    const decoded = codec.decode(encoded.value);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok || decoded.value.type !== 'nprofile') {
      return;
    }
    expect(decoded.value.data.pubkey).toBe(pubkey);
    expect(decoded.value.data.relays).toEqual(expect.arrayContaining([...relays]));
  });

  it('encodes and decodes note / nevent / naddr foundations', () => {
    const id = '6f70be9f26fcaf4d6cfc6898ba7765172f00b62e6a9c8ed1ae462a1829a2b845';
    const pubkey = '7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e';

    const note = codec.encodeNote(id);
    expect(note.ok).toBe(true);
    if (note.ok) {
      const decodedNote = codec.decode(note.value);
      expect(decodedNote.ok && decodedNote.value.type === 'note' && decodedNote.value.data).toBe(
        id,
      );
    }

    const nevent = codec.encodeNevent({id, author: pubkey, kind: 1, relays: ['wss://relay.example']});
    expect(nevent.ok).toBe(true);
    if (nevent.ok) {
      const decoded = codec.decode(nevent.value);
      expect(decoded.ok && decoded.value.type === 'nevent').toBe(true);
    }

    const naddr = codec.encodeNaddr({
      identifier: 'still',
      pubkey,
      kind: 30023,
      relays: ['wss://relay.example'],
    });
    expect(naddr.ok).toBe(true);
    if (naddr.ok) {
      const decoded = codec.decode(naddr.value);
      expect(decoded.ok && decoded.value.type === 'naddr').toBe(true);
    }
  });

  it('rejects invalid bech32 input', () => {
    const decoded = codec.decode('not-a-nip19-string');
    expect(decoded.ok).toBe(false);
  });
});
