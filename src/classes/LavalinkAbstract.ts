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

export enum PlayerEvent {
  TrackEnd = 'end',
  TrackStuck = 'stuck',
  TrackStart = 'start',
  TrackException = 'exception',
  Resumed = 'resumed',
  WsClosed = 'closed',
  Update = 'update',
}

export abstract class LavalinkAbstract {
  // object matching Lavalink REST docs https://lavalink.dev/api/rest.html#get-lavalink-info
  abstract getInfo(): Promise<object | undefined>;
  // array of available filter names
  abstract getFilters(): Promise<Array<string>>;
  // array of available sources names
  abstract getSources(): Promise<Array<string>>;
  // pause playback
  abstract pause(guildiId: string): Promise<boolean>;
  // resume playback
  abstract resume(guildId: string): Promise<boolean>;
  // join the voice channel
  abstract joinVoiceChannel(
    guildid: string,
    channelid: string,
    shardId?: number
  ): Promise<JoinResponse>;
  abstract leaveVoiceChannel(guildId: string): Promise<void>;
  // return playable track / playlist
  abstract resolve(query: string): Promise<ResolveResponse>;

  // play specified track in guild
  abstract playTrack(
    guildid: string,
    track: PlayableTrack
  ): Promise<PlayResponse>;

  abstract on(event: PlayerEvent, func: Function, guildid: string): boolean;
}
