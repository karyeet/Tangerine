import type {PlayableTrack, queueItem} from './queue';

export interface sources {
  youtube: boolean;
  soundcloud: boolean;
  bandcamp: boolean;
  twitch: boolean;
  vimeo: boolean;
  spotify: boolean;
  deezer: boolean;
  http: boolean;
}

export enum LoadResultType {
  track = 'track',
  playlist = 'playlist',
  empty = 'empty',
  error = 'error',
}

export interface ResolveResponse {
  loadType: LoadResultType;
  data: queueItem | undefined;
}

export enum PlayResponse {
  notInVoiceChannel = 'I am not in a voice channel.',
  OK = 'OK',
}

export enum JoinResponse {
  alreadyInVoiceChannel = 'I am already in a voice channel',
  errorGeneric = 'There was a problem joining the voice channel',
  OK = 'OK',
}

export abstract class LavalinkAbstract {
  // object matching Lavalink REST docs https://lavalink.dev/api/rest.html#get-lavalink-info
  abstract getInfo(): Promise<object | undefined>;
  // array of available filter names
  abstract getFilters(): Promise<Array<string>>;
  // array of available sources names
  abstract getSources(): Promise<Array<string>>;
  // join the voice channel
  abstract joinVoiceChannel(
    guildid: string,
    channelid: string,
    shardId?: number
  ): Promise<JoinResponse>;

  // return playable track / playlist
  abstract resolve(query: string): Promise<ResolveResponse>;

  // play specified track in guild
  abstract playTrack(
    guildid: string,
    track: PlayableTrack
  ): Promise<PlayResponse>;
}
