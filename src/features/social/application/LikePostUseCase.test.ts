import {ok} from '../../../core/result/Result';
import type {ISigner, SignedEvent} from '../../auth/application/ports/ISigner';
import {LikePostUseCase} from './LikePostUseCase';
import {CommentOnPostUseCase} from './CommentOnPostUseCase';
import type {ISocialRepository} from './ports/ISocialRepository';
import {COMMENT_KIND, REACTION_KIND} from '../domain/kinds';
import {FollowList} from '../domain/FollowList';

const VIEWER = 'a'.repeat(64);
const POST_ID = 'b'.repeat(64);
const POST_AUTHOR = 'c'.repeat(64);
const ID = '1'.repeat(64);
const SIG = '2'.repeat(128);

function fakeSigner(): ISigner {
  return {
    getPublicKey: async () => ok(VIEWER),
    signEvent: async event =>
      ok({
        id: ID,
        pubkey: VIEWER,
        created_at: event.created_at,
        kind: event.kind,
        tags: event.tags,
        content: event.content,
        sig: SIG,
      } satisfies SignedEvent),
  };
}

function emptyRepo(publish: ISocialRepository['publish']): ISocialRepository {
  const empty = FollowList.empty(VIEWER);
  if (!empty.ok) {
    throw empty.error;
  }
  return {
    fetchFollowList: async () => ok(empty.value),
    fetchReactionsForEvents: async () => ok([]),
    fetchCommentsForRoot: async () => ok([]),
    publish,
  };
}

describe('LikePostUseCase', () => {
  it('publishes a kind 7 like and returns Reaction', async () => {
    let publishedKind: number | null = null;
    let publishedContent: string | null = null;
    const repository = emptyRepo(async event => {
      publishedKind = event.kind;
      publishedContent = event.content;
      return ok(undefined);
    });

    const useCase = new LikePostUseCase(repository, null, () => fakeSigner());
    const result = await useCase.execute({
      eventId: POST_ID,
      authorPubkeyHex: POST_AUTHOR,
      targetKind: 20,
    });

    expect(result.ok).toBe(true);
    expect(publishedKind).toBe(REACTION_KIND);
    expect(publishedContent).toBe('+');
    if (!result.ok) {
      return;
    }
    expect(result.value.targetEventId).toBe(POST_ID);
    expect(result.value.isLike).toBe(true);
  });
});

describe('CommentOnPostUseCase', () => {
  it('publishes a top-level kind 1111 comment', async () => {
    let publishedKind: number | null = null;
    let publishedTags: readonly (readonly string[])[] | null = null;
    const repository = emptyRepo(async event => {
      publishedKind = event.kind;
      publishedTags = event.tags;
      return ok(undefined);
    });

    const useCase = new CommentOnPostUseCase(repository, null, () => fakeSigner());
    const result = await useCase.execute({
      content: 'Great photo',
      rootEventId: POST_ID,
      rootAuthorPubkeyHex: POST_AUTHOR,
    });

    expect(result.ok).toBe(true);
    expect(publishedKind).toBe(COMMENT_KIND);
    expect(publishedTags).toEqual([
      ['E', POST_ID, '', POST_AUTHOR],
      ['K', '20'],
      ['P', POST_AUTHOR],
      ['e', POST_ID, '', POST_AUTHOR],
      ['k', '20'],
      ['p', POST_AUTHOR],
    ]);
    if (!result.ok) {
      return;
    }
    expect(result.value.content).toBe('Great photo');
    expect(result.value.isTopLevel).toBe(true);
  });
});
