import {ok} from '../../../core/result/Result';
import type {ISigner, SignedEvent} from '../../auth/application/ports/ISigner';
import {FollowList} from '../domain/FollowList';
import {FollowUserUseCase} from './FollowUserUseCase';
import {UnfollowUserUseCase} from './UnfollowUserUseCase';
import {InMemoryFollowCache} from '../infrastructure/InMemoryFollowCache';
import type {ISocialRepository} from './ports/ISocialRepository';
import {FOLLOW_LIST_KIND} from '../domain/kinds';

const OWNER = 'a'.repeat(64);
const TARGET = 'b'.repeat(64);
const OTHER = 'c'.repeat(64);
const ID = '1'.repeat(64);
const SIG = '2'.repeat(128);

function fakeSigner(pubkey = OWNER): ISigner {
  return {
    getPublicKey: async () => ok(pubkey),
    signEvent: async event =>
      ok({
        id: ID,
        pubkey,
        created_at: event.created_at,
        kind: event.kind,
        tags: event.tags,
        content: event.content,
        sig: SIG,
      } satisfies SignedEvent),
  };
}

describe('FollowUserUseCase / UnfollowUserUseCase', () => {
  it('appends a follow and republishes kind 3', async () => {
    const empty = FollowList.empty(OWNER);
    expect(empty.ok).toBe(true);
    if (!empty.ok) {
      return;
    }

    let remoteList = empty.value;
    let publishedTags: readonly (readonly string[])[] | null = null;
    const repository: ISocialRepository = {
      fetchFollowList: async () => ok(remoteList),
      fetchReactionsForEvents: async () => ok([]),
      fetchCommentsForRoot: async () => ok([]),
      publish: async event => {
        publishedTags = event.tags;
        expect(event.kind).toBe(FOLLOW_LIST_KIND);
        return ok(undefined);
      },
    };

    const cache = new InMemoryFollowCache();
    const follow = new FollowUserUseCase(repository, cache, () => fakeSigner());
    const result = await follow.execute({targetPubkeyHex: TARGET});
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.isFollowing(TARGET)).toBe(true);
    expect(publishedTags).toEqual([['p', TARGET]]);
    remoteList = result.value;

    const result2 = await follow.execute({targetPubkeyHex: OTHER});
    expect(result2.ok).toBe(true);
    if (!result2.ok) {
      return;
    }
    expect(result2.value.followedPubkeys()).toEqual([TARGET, OTHER]);
  });

  it('removes a follow and republishes kind 3', async () => {
    const list = FollowList.create({
      ownerPubkeyHex: OWNER,
      contacts: [{pubkeyHex: TARGET}, {pubkeyHex: OTHER}],
      eventId: null,
      createdAt: null,
    });
    expect(list.ok).toBe(true);
    if (!list.ok) {
      return;
    }

    let remoteList = list.value;
    let publishedTags: readonly (readonly string[])[] | null = null;
    const repository: ISocialRepository = {
      fetchFollowList: async () => ok(remoteList),
      fetchReactionsForEvents: async () => ok([]),
      fetchCommentsForRoot: async () => ok([]),
      publish: async event => {
        publishedTags = event.tags;
        return ok(undefined);
      },
    };

    const cache = new InMemoryFollowCache();
    const unfollow = new UnfollowUserUseCase(repository, cache, () => fakeSigner());
    const result = await unfollow.execute(TARGET);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.isFollowing(TARGET)).toBe(false);
    expect(result.value.followedPubkeys()).toEqual([OTHER]);
    expect(publishedTags).toEqual([['p', OTHER]]);
  });
});
