import {ok, type Result} from '../../../core/result/Result';
import type {NostrIdentity} from '../domain/NostrIdentity';
import type {AuthRuntime} from './AuthRuntime';

export class GetCurrentUserUseCase {
  constructor(private readonly authRuntime: AuthRuntime) {}

  execute(): Result<NostrIdentity | null, never> {
    return ok(this.authRuntime.getIdentity());
  }
}
