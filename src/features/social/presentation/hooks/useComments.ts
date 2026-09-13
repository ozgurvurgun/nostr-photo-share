import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import {Comment} from '../../domain/Comment';
import {COMMENT_KIND} from '../../domain/kinds';
import {commentsQueryKey} from '../socialQueryKeys';

export type CommentsQueryData = {
  readonly comments: readonly Comment[];
  readonly fromCache: boolean;
};

export function useComments(rootEventId: string) {
  const container = useAppContainer();
  const normalized = rootEventId.trim().toLowerCase();

  return useQuery({
    queryKey: commentsQueryKey(normalized),
    enabled: normalized.length > 0,
    queryFn: async (): Promise<CommentsQueryData> => {
      const result = await container.getComments.execute(normalized);
      if (!result.ok) {
        const cached = container.getComments.getCached(normalized);
        if (cached.length > 0) {
          return {comments: cached, fromCache: true};
        }
        throw result.error;
      }
      return {
        comments: result.value.comments,
        fromCache: result.value.fromCache,
      };
    },
    staleTime: 15_000,
  });
}

export type CommentMutationInput = {
  readonly content: string;
  readonly rootEventId: string;
  readonly rootAuthorPubkeyHex: string;
  readonly parentEventId?: string;
  readonly parentAuthorPubkeyHex?: string;
  readonly parentKind?: number;
};

export function useCommentOnPost() {
  const container = useAppContainer();
  const queryClient = useQueryClient();
  const {identity} = useAuthSession();

  return useMutation({
    mutationFn: async (input: CommentMutationInput): Promise<Comment> => {
      const result = await container.commentOnPost.execute(input);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    onMutate: async input => {
      const key = commentsQueryKey(input.rootEventId);
      await queryClient.cancelQueries({queryKey: key});
      const previous = queryClient.getQueryData<CommentsQueryData>(key);
      const previousComments = previous?.comments ?? [];
      const optimisticId = `optimistic-${Date.now()}`;
      const author = identity?.publicKey.toHex().trim().toLowerCase() ?? '0'.repeat(64);
      const rootEventId = input.rootEventId.trim().toLowerCase();
      const rootAuthor = input.rootAuthorPubkeyHex.trim().toLowerCase();
      const parentEventId = (input.parentEventId ?? rootEventId).trim().toLowerCase();
      const parentAuthor = (input.parentAuthorPubkeyHex ?? rootAuthor).trim().toLowerCase();
      const parentKind =
        input.parentKind ?? (parentEventId === rootEventId ? 20 : COMMENT_KIND);

      // Use a valid-looking hex id so domain create succeeds for optimistic UI.
      const hexOptimisticId = optimisticId
        .replace(/[^0-9a-f]/gi, '')
        .padEnd(64, '0')
        .slice(0, 64)
        .toLowerCase();
      const created = Comment.create({
        id: hexOptimisticId,
        authorPubkeyHex: author,
        content: input.content.trim(),
        createdAt: Math.floor(Date.now() / 1000),
        rootEventId,
        rootAuthorPubkeyHex: rootAuthor,
        rootKind: 20, // picture post; keep numeric for optimistic Comment.create
        parentEventId,
        parentAuthorPubkeyHex: parentAuthor,
        parentKind,
      });
      if (created.ok) {
        queryClient.setQueryData<CommentsQueryData>(key, {
          comments: [...previousComments, created.value],
          fromCache: previous?.fromCache ?? false,
        });
      }
      return {previous, key, optimisticId: created.ok ? created.value.id : null};
    },
    onError: (_error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSuccess: (comment, _input, context) => {
      const key = context?.key ?? commentsQueryKey(comment.rootEventId);
      const current = queryClient.getQueryData<CommentsQueryData>(key);
      const withoutOptimistic = (current?.comments ?? []).filter(
        item => item.id !== context?.optimisticId && item.id !== comment.id,
      );
      queryClient.setQueryData<CommentsQueryData>(key, {
        comments: [...withoutOptimistic, comment],
        fromCache: false,
      });
    },
  });
}
