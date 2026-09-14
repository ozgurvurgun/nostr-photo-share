import {appConfig, type AppConfig} from '../config/appConfig';
import {ConsoleLogSink, Logger, type LogSink} from '../../core/logging/Logger';
import type {ISigner} from '../../features/auth/application/ports/ISigner';
import {NostrGateway} from '../../infrastructure/nostr/gateway/NostrGateway';
import {RelayPool, type RelayPoolOptions} from '../../infrastructure/nostr/relay/RelayPool';
import {WebSocketRelayTransport} from '../../infrastructure/nostr/relay/WebSocketRelayTransport';
import {EventValidator} from '../../infrastructure/nostr/validation/EventValidator';
import {AuthRuntime} from '../../features/auth/application/AuthRuntime';
import {ConnectBunkerUseCase} from '../../features/auth/application/ConnectBunkerUseCase';
import {CreateIdentityUseCase} from '../../features/auth/application/CreateIdentityUseCase';
import {GetCurrentUserUseCase} from '../../features/auth/application/GetCurrentUserUseCase';
import {ImportNsecUseCase} from '../../features/auth/application/ImportNsecUseCase';
import {LogoutUseCase} from '../../features/auth/application/LogoutUseCase';
import {RestoreSessionUseCase} from '../../features/auth/application/RestoreSessionUseCase';
import type {IBunkerConnector} from '../../features/auth/application/ports/IBunkerConnector';
import type {IIdentitySessionStore} from '../../features/auth/application/ports/IIdentitySessionStore';
import type {IKeyGenerator} from '../../features/auth/application/ports/IKeyGenerator';
import type {INip19Codec} from '../../features/auth/application/ports/INip19Codec';
import {
  Nip46BunkerConnector,
  restoreNip46Signer,
} from '../../features/auth/infrastructure/Nip46BunkerConnector';
import {InMemoryIdentitySessionStore} from '../../features/auth/infrastructure/InMemoryIdentitySessionStore';
import {KeychainIdentitySessionStore} from '../../features/auth/infrastructure/KeychainIdentitySessionStore';
import {LocalSigner} from '../../features/auth/infrastructure/LocalSigner';
import {Nip19Codec} from '../../features/auth/infrastructure/Nip19Codec';
import {NostrToolsKeyGenerator} from '../../features/auth/infrastructure/NostrToolsKeyGenerator';
import {UploadImageUseCase} from '../../features/media-upload/application/UploadImageUseCase';
import type {IImageFileReader} from '../../features/media-upload/application/ports/IImageFileReader';
import type {IImagePicker} from '../../features/media-upload/application/ports/IImagePicker';
import type {IMediaUploader} from '../../features/media-upload/application/ports/IMediaUploader';
import {BlossomUploader} from '../../features/media-upload/infrastructure/BlossomUploader';
import {CompositeMediaUploader} from '../../features/media-upload/infrastructure/CompositeMediaUploader';
import {NobleBlobHasher} from '../../features/media-upload/infrastructure/NobleBlobHasher';
import {ImageFileReader} from '../../features/media-upload/infrastructure/ImageFileReader';
import {Nip96Uploader} from '../../features/media-upload/infrastructure/Nip96Uploader';
import {ReactNativeImagePicker} from '../../features/media-upload/infrastructure/ReactNativeImagePicker';
import {
  DEFAULT_IMAGE_CONSTRAINTS,
  type ImageConstraints,
} from '../../features/media-upload/domain/ImageConstraints';
import {GetProfileUseCase} from '../../features/profile/application/GetProfileUseCase';
import {UpdateProfileUseCase} from '../../features/profile/application/UpdateProfileUseCase';
import type {INip05Verifier} from '../../features/profile/application/ports/INip05Verifier';
import type {IProfileCache} from '../../features/profile/application/ports/IProfileCache';
import type {IProfileRepository} from '../../features/profile/application/ports/IProfileRepository';
import {FetchNip05Verifier} from '../../features/profile/infrastructure/FetchNip05Verifier';
import {InMemoryProfileCache} from '../../features/profile/infrastructure/InMemoryProfileCache';
import {NostrProfileRepository} from '../../features/profile/infrastructure/NostrProfileRepository';
import {GetFeedPageUseCase} from '../../features/feed/application/GetFeedPageUseCase';
import {PublishImagePostUseCase} from '../../features/feed/application/PublishImagePostUseCase';
import type {IFeedCache} from '../../features/feed/application/ports/IFeedCache';
import type {IFeedRepository} from '../../features/feed/application/ports/IFeedRepository';
import {InMemoryFeedCache} from '../../features/feed/infrastructure/InMemoryFeedCache';
import {NostrFeedRepository} from '../../features/feed/infrastructure/NostrFeedRepository';
import {CommentOnPostUseCase} from '../../features/social/application/CommentOnPostUseCase';
import {FollowUserUseCase} from '../../features/social/application/FollowUserUseCase';
import {GetCommentsUseCase} from '../../features/social/application/GetCommentsUseCase';
import {GetFollowListUseCase} from '../../features/social/application/GetFollowListUseCase';
import {GetPostReactionsUseCase} from '../../features/social/application/GetPostReactionsUseCase';
import {LikePostUseCase} from '../../features/social/application/LikePostUseCase';
import {UnfollowUserUseCase} from '../../features/social/application/UnfollowUserUseCase';
import type {ICommentCache} from '../../features/social/application/ports/ICommentCache';
import type {IFollowCache} from '../../features/social/application/ports/IFollowCache';
import type {IReactionCache} from '../../features/social/application/ports/IReactionCache';
import type {ISocialRepository} from '../../features/social/application/ports/ISocialRepository';
import {InMemoryCommentCache} from '../../features/social/infrastructure/InMemoryCommentCache';
import {InMemoryFollowCache} from '../../features/social/infrastructure/InMemoryFollowCache';
import {InMemoryReactionCache} from '../../features/social/infrastructure/InMemoryReactionCache';
import {NostrSocialRepository} from '../../features/social/infrastructure/NostrSocialRepository';
import {GetActiveStoriesUseCase} from '../../features/stories/application/GetActiveStoriesUseCase';
import {MarkStorySeenUseCase} from '../../features/stories/application/MarkStorySeenUseCase';
import {PublishStoryUseCase} from '../../features/stories/application/PublishStoryUseCase';
import type {IStoryCache} from '../../features/stories/application/ports/IStoryCache';
import type {IStoryRepository} from '../../features/stories/application/ports/IStoryRepository';
import type {IStorySeenStore} from '../../features/stories/application/ports/IStorySeenStore';
import {InMemoryStoryCache} from '../../features/stories/infrastructure/InMemoryStoryCache';
import {InMemoryStorySeenStore} from '../../features/stories/infrastructure/InMemoryStorySeenStore';
import {KeychainStorySeenStore} from '../../features/stories/infrastructure/KeychainStorySeenStore';
import {NostrStoryRepository} from '../../features/stories/infrastructure/NostrStoryRepository';
import {ApplyRelayListToPoolUseCase} from '../../features/relays/application/ApplyRelayListToPoolUseCase';
import {CachedRelayRouting} from '../../features/relays/application/CachedRelayRouting';
import {DiscoverOutboxRelaysUseCase} from '../../features/relays/application/DiscoverOutboxRelaysUseCase';
import {GetRelayHealthUseCase} from '../../features/relays/application/GetRelayHealthUseCase';
import {GetRelayListUseCase} from '../../features/relays/application/GetRelayListUseCase';
import {UpdateRelayListUseCase} from '../../features/relays/application/UpdateRelayListUseCase';
import type {IRelayListCache} from '../../features/relays/application/ports/IRelayListCache';
import type {IRelayListRepository} from '../../features/relays/application/ports/IRelayListRepository';
import type {IRelayRouting} from '../../features/relays/application/ports/IRelayRouting';
import {InMemoryRelayListCache} from '../../features/relays/infrastructure/InMemoryRelayListCache';
import {NostrRelayListRepository} from '../../features/relays/infrastructure/NostrRelayListRepository';

export type AppContainer = {
  readonly config: AppConfig;
  readonly logger: Logger;
  readonly eventValidator: EventValidator;
  readonly relayPool: RelayPool;
  readonly nostrGateway: NostrGateway;
  readonly authRuntime: AuthRuntime;
  readonly identityStore: IIdentitySessionStore;
  readonly nip19: INip19Codec;
  readonly keyGenerator: IKeyGenerator;
  readonly createIdentity: CreateIdentityUseCase;
  readonly importNsec: ImportNsecUseCase;
  readonly connectBunker: ConnectBunkerUseCase;
  readonly getCurrentUser: GetCurrentUserUseCase;
  readonly restoreSession: RestoreSessionUseCase;
  readonly logout: LogoutUseCase;
  readonly profileCache: IProfileCache;
  readonly profileRepository: IProfileRepository;
  readonly nip05Verifier: INip05Verifier;
  readonly getProfile: GetProfileUseCase;
  readonly updateProfile: UpdateProfileUseCase;
  readonly feedCache: IFeedCache;
  readonly feedRepository: IFeedRepository;
  readonly getFeedPage: GetFeedPageUseCase;
  readonly publishImagePost: PublishImagePostUseCase;
  readonly followCache: IFollowCache;
  readonly reactionCache: IReactionCache;
  readonly commentCache: ICommentCache;
  readonly socialRepository: ISocialRepository;
  readonly getFollowList: GetFollowListUseCase;
  readonly followUser: FollowUserUseCase;
  readonly unfollowUser: UnfollowUserUseCase;
  readonly likePost: LikePostUseCase;
  readonly getPostReactions: GetPostReactionsUseCase;
  readonly commentOnPost: CommentOnPostUseCase;
  readonly getComments: GetCommentsUseCase;
  readonly storyCache: IStoryCache;
  readonly storySeenStore: IStorySeenStore;
  readonly storyRepository: IStoryRepository;
  readonly getActiveStories: GetActiveStoriesUseCase;
  readonly publishStory: PublishStoryUseCase;
  readonly markStorySeen: MarkStorySeenUseCase;
  readonly relayListCache: IRelayListCache;
  readonly relayListRepository: IRelayListRepository;
  readonly relayRouting: IRelayRouting;
  readonly getRelayList: GetRelayListUseCase;
  readonly updateRelayList: UpdateRelayListUseCase;
  readonly getRelayHealth: GetRelayHealthUseCase;
  readonly applyRelayListToPool: ApplyRelayListToPoolUseCase;
  readonly discoverOutboxRelays: DiscoverOutboxRelaysUseCase;
  readonly hydrateRelayListFromSession: () => Promise<void>;
  readonly hydrateStorySeenStore: () => Promise<void>;
  readonly imagePicker: IImagePicker;
  readonly imageFileReader: IImageFileReader;
  readonly mediaUploader: IMediaUploader;
  readonly uploadImage: UploadImageUseCase;
  readonly getSigner: () => ISigner | null;
  sessionRestored: boolean;
  lastRestoreError: string | null;
  markSessionRestored: () => void;
};

export type CreateContainerOptions = {
  readonly config?: AppConfig;
  readonly logSink?: LogSink;
  readonly createTransport?: RelayPoolOptions['createTransport'];
  readonly relays?: readonly string[];
  readonly identityStore?: IIdentitySessionStore;
  readonly keyGenerator?: IKeyGenerator;
  readonly nip19?: INip19Codec;
  readonly bunkerConnector?: IBunkerConnector;
  readonly profileRepository?: IProfileRepository;
  readonly profileCache?: IProfileCache;
  readonly nip05Verifier?: INip05Verifier;
  readonly feedRepository?: IFeedRepository;
  readonly feedCache?: IFeedCache;
  readonly socialRepository?: ISocialRepository;
  readonly followCache?: IFollowCache;
  readonly reactionCache?: IReactionCache;
  readonly commentCache?: ICommentCache;
  readonly storyRepository?: IStoryRepository;
  readonly storyCache?: IStoryCache;
  readonly storySeenStore?: IStorySeenStore;
  readonly relayListRepository?: IRelayListRepository;
  readonly relayListCache?: IRelayListCache;
  readonly imagePicker?: IImagePicker;
  readonly imageFileReader?: IImageFileReader;
  readonly mediaUploader?: IMediaUploader;
  /** Use in-memory keychain for unit/UI tests. */
  readonly useInMemoryIdentityStore?: boolean;
};

function buildImageConstraints(config: AppConfig): ImageConstraints {
  return {
    allowedMimeTypes: DEFAULT_IMAGE_CONSTRAINTS.allowedMimeTypes,
    maxBytes: config.maxImageBytes,
    maxDimension: config.maxImageDimension,
  };
}

function buildMediaUploader(
  config: AppConfig,
  getSigner: () => ISigner | null,
): IMediaUploader {
  const blossom = new BlossomUploader({
    servers: config.blossomServers,
    getSigner,
  });

  if (
    config.enableNip96Fallback &&
    config.nip96Servers.length > 0
  ) {
    const nip96 = new Nip96Uploader({
      servers: config.nip96Servers,
      getSigner,
    });
    return new CompositeMediaUploader({
      primary: config.preferBlossom ? blossom : nip96,
      fallback: config.preferBlossom ? nip96 : blossom,
      enableFallback: true,
    });
  }

  if (!config.preferBlossom && config.nip96Servers.length > 0) {
    return new Nip96Uploader({
      servers: config.nip96Servers,
      getSigner,
    });
  }

  return blossom;
}

export function createContainer(options: CreateContainerOptions = {}): AppContainer {
  const config = options.config ?? appConfig;
  const logger = new Logger(options.logSink ?? new ConsoleLogSink());
  const eventValidator = new EventValidator();
  const createTransport =
    options.createTransport ??
    (url => new WebSocketRelayTransport(url, config.relayConnectTimeoutMs));

  const relayPool = new RelayPool({
    logger,
    connectTimeoutMs: config.relayConnectTimeoutMs,
    publishTimeoutMs: config.relayPublishTimeoutMs,
    reconnectDelayMs: config.relayReconnectDelayMs,
    createTransport,
  });

  const relays = options.relays ?? config.defaultRelays;
  for (const url of relays) {
    relayPool.addRelay(url);
  }

  const authRuntime = new AuthRuntime();
  const relayListCache = options.relayListCache ?? new InMemoryRelayListCache();
  const relayRouting: IRelayRouting = new CachedRelayRouting(relayListCache, () => {
    const identity = authRuntime.getIdentity();
    return identity?.publicKey.toHex() ?? null;
  });

  const nostrGateway = new NostrGateway(relayPool, eventValidator, logger, {
    getWriteRelayUrls: () => relayRouting.getWriteRelayUrls(),
  });
  const identityStore =
    options.identityStore ??
    (options.useInMemoryIdentityStore
      ? new InMemoryIdentitySessionStore()
      : new KeychainIdentitySessionStore());
  const keyGenerator = options.keyGenerator ?? new NostrToolsKeyGenerator();
  const nip19 = options.nip19 ?? new Nip19Codec();
  const bunkerConnector = options.bunkerConnector ?? new Nip46BunkerConnector();
  const createLocalSigner = () => new LocalSigner(identityStore);

  const createIdentity = new CreateIdentityUseCase(
    identityStore,
    keyGenerator,
    authRuntime,
    createLocalSigner,
  );
  const importNsec = new ImportNsecUseCase(
    identityStore,
    nip19,
    keyGenerator,
    authRuntime,
    createLocalSigner,
  );
  const connectBunker = new ConnectBunkerUseCase(identityStore, bunkerConnector, authRuntime);
  const getCurrentUser = new GetCurrentUserUseCase(authRuntime);
  const restoreSession = new RestoreSessionUseCase({
    store: identityStore,
    authRuntime,
    createLocalSigner,
    restoreBunkerSigner: restoreNip46Signer,
  });
  const profileCache = options.profileCache ?? new InMemoryProfileCache();
  const feedCache = options.feedCache ?? new InMemoryFeedCache();
  const followCache = options.followCache ?? new InMemoryFollowCache();
  const reactionCache = options.reactionCache ?? new InMemoryReactionCache();
  const commentCache = options.commentCache ?? new InMemoryCommentCache();
  const storyCache = options.storyCache ?? new InMemoryStoryCache();
  const storySeenStore =
    options.storySeenStore ??
    (options.useInMemoryIdentityStore
      ? new InMemoryStorySeenStore()
      : new KeychainStorySeenStore());
  const logout = new LogoutUseCase(identityStore, authRuntime, async () => {
    feedCache.clear();
    profileCache.clear();
    followCache.clear();
    reactionCache.clear();
    commentCache.clear();
    storyCache.clear();
    storySeenStore.clear();
    relayListCache.clear();
    await relayPool.clearOutboxRelays();
    await relayPool.syncRelays(config.defaultRelays);
  });

  const nip05Verifier = options.nip05Verifier ?? new FetchNip05Verifier();
  const profileRepository =
    options.profileRepository ??
    new NostrProfileRepository(nostrGateway, config.profileQueryTimeoutMs);
  const getProfile = new GetProfileUseCase(profileRepository, profileCache, nip05Verifier);
  const updateProfile = new UpdateProfileUseCase(
    profileRepository,
    profileCache,
    nip05Verifier,
    () => authRuntime.getSigner(),
  );

  const feedRepository =
    options.feedRepository ??
    new NostrFeedRepository(nostrGateway, config.feedQueryTimeoutMs, relayPool);
  const getFeedPage = new GetFeedPageUseCase(feedRepository, feedCache);
  const publishImagePost = new PublishImagePostUseCase(
    feedRepository,
    feedCache,
    () => authRuntime.getSigner(),
  );

  const socialRepository =
    options.socialRepository ??
    new NostrSocialRepository(nostrGateway, config.feedQueryTimeoutMs, relayPool);
  const getFollowList = new GetFollowListUseCase(socialRepository, followCache);
  const followUser = new FollowUserUseCase(
    socialRepository,
    followCache,
    () => authRuntime.getSigner(),
  );
  const unfollowUser = new UnfollowUserUseCase(
    socialRepository,
    followCache,
    () => authRuntime.getSigner(),
  );
  const likePost = new LikePostUseCase(
    socialRepository,
    reactionCache,
    () => authRuntime.getSigner(),
  );
  const getPostReactions = new GetPostReactionsUseCase(socialRepository, reactionCache);
  const commentOnPost = new CommentOnPostUseCase(
    socialRepository,
    commentCache,
    () => authRuntime.getSigner(),
  );
  const getComments = new GetCommentsUseCase(socialRepository, commentCache);

  const storyRepository =
    options.storyRepository ??
    new NostrStoryRepository(nostrGateway, config.feedQueryTimeoutMs, relayPool);
  const getActiveStories = new GetActiveStoriesUseCase(storyRepository, storyCache);
  const publishStory = new PublishStoryUseCase(
    storyRepository,
    storyCache,
    () => authRuntime.getSigner(),
  );
  const markStorySeen = new MarkStorySeenUseCase(storySeenStore);

  const relayListRepository =
    options.relayListRepository ??
    new NostrRelayListRepository(nostrGateway, config.feedQueryTimeoutMs, relayPool);
  const applyRelayListToPool = new ApplyRelayListToPoolUseCase(
    relayPool,
    relayListCache,
    config.defaultRelays,
  );
  const getRelayList = new GetRelayListUseCase(
    relayListRepository,
    relayListCache,
    config.defaultRelays,
  );
  const updateRelayList = new UpdateRelayListUseCase(
    relayListRepository,
    relayListCache,
    applyRelayListToPool,
    () => authRuntime.getSigner(),
  );
  const getRelayHealth = new GetRelayHealthUseCase(nostrGateway, relayListCache);
  const discoverOutboxRelays = new DiscoverOutboxRelaysUseCase(
    relayListRepository,
    relayListCache,
    relayPool,
  );

  const hydrateRelayListFromSession = async (): Promise<void> => {
    const identity = authRuntime.getIdentity();
    if (identity === null) {
      return;
    }
    const listResult = await getRelayList.execute(identity.publicKey.toHex());
    if (!listResult.ok) {
      logger.warn('Could not hydrate relay list after session restore', {
        code: listResult.error.code,
      });
      return;
    }
    await applyRelayListToPool.execute(listResult.value);
  };

  const hydrateStorySeenStore = async (): Promise<void> => {
    if ('hydrate' in storySeenStore && typeof storySeenStore.hydrate === 'function') {
      await storySeenStore.hydrate();
    }
  };

  const getSigner = () => authRuntime.getSigner();
  const imagePicker = options.imagePicker ?? new ReactNativeImagePicker();
  const imageFileReader = options.imageFileReader ?? new ImageFileReader();
  const mediaUploader = options.mediaUploader ?? buildMediaUploader(config, getSigner);
  const uploadImage = new UploadImageUseCase(
    imagePicker,
    imageFileReader,
    mediaUploader,
    new NobleBlobHasher(),
    buildImageConstraints(config),
  );

  const container: AppContainer = {
    config,
    logger,
    eventValidator,
    relayPool,
    nostrGateway,
    authRuntime,
    identityStore,
    nip19,
    keyGenerator,
    createIdentity,
    importNsec,
    connectBunker,
    getCurrentUser,
    restoreSession,
    logout,
    profileCache,
    profileRepository,
    nip05Verifier,
    getProfile,
    updateProfile,
    feedCache,
    feedRepository,
    getFeedPage,
    publishImagePost,
    followCache,
    reactionCache,
    commentCache,
    socialRepository,
    getFollowList,
    followUser,
    unfollowUser,
    likePost,
    getPostReactions,
    commentOnPost,
    getComments,
    storyCache,
    storySeenStore,
    storyRepository,
    getActiveStories,
    publishStory,
    markStorySeen,
    relayListCache,
    relayListRepository,
    relayRouting,
    getRelayList,
    updateRelayList,
    getRelayHealth,
    applyRelayListToPool,
    discoverOutboxRelays,
    hydrateRelayListFromSession,
    hydrateStorySeenStore,
    imagePicker,
    imageFileReader,
    mediaUploader,
    uploadImage,
    getSigner,
    sessionRestored: false,
    lastRestoreError: null,
    markSessionRestored() {
      container.sessionRestored = true;
    },
  };

  return container;
}
