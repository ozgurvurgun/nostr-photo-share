import type {NavigatorScreenParams} from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  CreateIdentity: undefined;
  ImportNsec: undefined;
  ConnectBunker: {uri?: string} | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: {query?: string} | undefined;
  Create: undefined;
  Activity: undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CreatePost: undefined;
  CreateStory: undefined;
  StoryViewer: {
    authorPubkeyHex: string;
    storyId?: string;
    /** Ordered author pubkeys for horizontal swipe between story stacks. */
    authorQueue?: string[];
  };
  Account: undefined;
  Security: undefined;
  Profile: {pubkeyHex?: string} | undefined;
  EditProfile: {pictureUrl?: string} | undefined;
  MediaUpload: {purpose?: 'general' | 'avatar'} | undefined;
  PostDetail: {
    eventId: string;
    authorPubkeyHex: string;
    /** Optional snapshot so profile/search open Instagram-style full post, not comments-only. */
    mediaUrl?: string;
    blurhash?: string;
    mediaAlt?: string;
    title?: string;
    caption?: string;
    aspectRatio?: number;
    createdAt?: number;
    openComments?: boolean;
    /** When true, vertical detail feed is limited to this post's author (profile open). */
    authorFeed?: boolean;
  };
  Relays: undefined;
  Messages: undefined;
  SearchLookup: {query?: string} | undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};
