import {err, ok, type Result} from '../../../core/result/Result';
import {InvalidNip05Error} from './errors';

const LOCAL_PART = /^[a-z0-9-_.]+$/;

/**
 * NIP-05 identifier: local@domain (identification, not authentication).
 * Local part must match a-z0-9-_. ; `_@domain` displays as bare domain.
 */
export class Nip05Identifier {
  private constructor(
    readonly local: string,
    readonly domain: string,
  ) {}

  static parse(raw: string): Result<Nip05Identifier, InvalidNip05Error> {
    const trimmed = raw.trim();
    const at = trimmed.lastIndexOf('@');
    if (at <= 0 || at === trimmed.length - 1) {
      return err(
        new InvalidNip05Error(
          'Doğrulanmış kullanıcı adı isim@alanadi.com biçiminde olmalı',
        ),
      );
    }

    const local = trimmed.slice(0, at).toLowerCase();
    const domain = trimmed.slice(at + 1).toLowerCase();

    if (!LOCAL_PART.test(local)) {
      return err(
        new InvalidNip05Error(
          'Kullanıcı adı kısmı yalnızca a-z, 0-9, - ve _ içerebilir',
        ),
      );
    }
    if (domain.length === 0 || domain.includes('@') || domain.includes(' ')) {
      return err(new InvalidNip05Error('Alan adı geçersiz'));
    }
    if (domain.includes('/') || domain.includes(':')) {
      return err(new InvalidNip05Error('Alan adı yol veya port içermemeli'));
    }

    return ok(new Nip05Identifier(local, domain));
  }

  toString(): string {
    return `${this.local}@${this.domain}`;
  }

  /** UI label: `_@domain` -> `domain`, otherwise `local@domain`. */
  displayLabel(): string {
    if (this.local === '_') {
      return this.domain;
    }
    return this.toString();
  }

  wellKnownUrl(): string {
    return `https://${this.domain}/.well-known/nostr.json?name=${encodeURIComponent(this.local)}`;
  }
}
