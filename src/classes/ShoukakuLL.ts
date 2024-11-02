import type {Client} from 'discord.js';

import {Shoukaku, Connectors, NodeOption, NodeInfo} from 'shoukaku';
import {
  JoinResponse,
  LavalinkAbstract,
  LoadResultType,
  PlayResponse,
  ResolveResponse,
  PlayerEvent,
} from './LavalinkAbstract';

import {PlayableTrack, Playlist} from './queue';

export class ShoukakuLL extends LavalinkAbstract {
  private shoukakuClient: Shoukaku;

  constructor(discordClient: Client, Nodes: NodeOption[]) {
    super(); // nothing
    this.shoukakuClient = new Shoukaku(
      new Connectors.DiscordJS(discordClient),
      Nodes
    );
    this.shoukakuClient.on('error', error => {
      console.error('Shoukaku error:', error);
    });
  }

  private getNodeWithLeastLoad() {
    const node = this.shoukakuClient.options.nodeResolver(
      this.shoukakuClient.nodes
    );
    return node;
  }

  public getInfo(): Promise<NodeInfo | undefined> {
    const node = this.getNodeWithLeastLoad();
    if (node) {
      return node.rest.getLavalinkInfo();
    } else {
      throw Error('Could not get info, no nodes available in Shoukaku');
    }
  }

  public async getFilters(): Promise<Array<string>> {
    const info = await this.getInfo();
    if (info && info.filters) {
      return info.filters;
    } else {
      throw Error('getInfo returned incomplete information');
    }
  }

  public async getSources(): Promise<Array<string>> {
    const info = await this.getInfo();
    if (info && info.sourceManagers) {
      return info.sourceManagers;
    } else {
      throw Error('getInfo returned incomplete information');
    }
  }
  public async leaveVoiceChannel(guildId: string): Promise<void> {
    return await this.shoukakuClient.leaveVoiceChannel(guildId);
  }

  public async joinVoiceChannel(
    guildId: string,
    channelId: string,
    shardId = 0 // if unsharded it will always be zero
  ): Promise<JoinResponse> {
    //    if (this.shoukakuClient.players.get(guildId)) {
    //      return JoinResponse.alreadyInVoiceChannel;
    //    }
    const player = await this.shoukakuClient.joinVoiceChannel({
      guildId,
      channelId,
      shardId,
      deaf: true,
    });
    if (player) {
      return JoinResponse.OK;
    } else {
      return JoinResponse.errorGeneric;
    }
  }

  private LLToPlayableTrack(trackdata: any): PlayableTrack {
    return new PlayableTrack(
      trackdata.info.title,
      trackdata.info.author,
      trackdata.info.artworkUrl,
      trackdata.info.length,
      trackdata.encoded,
      false || trackdata.info.isStream
    );
  }
  private LLToPlaylist(data: any): Playlist {
    const title = data.info.name;
    const author = data?.pluginInfo?.author || '';
    const artwork = data?.pluginInfo?.artworkUrl || '';
    const tracks: PlayableTrack[] = [];
    for (const trackdata of data.tracks) {
      tracks.push(this.LLToPlayableTrack(trackdata));
    }

    return new Playlist(title, author, artwork, tracks);
  }

  public async resolve(query: string): Promise<ResolveResponse> {
    const node = this.getNodeWithLeastLoad();
    if (node === undefined) {
      throw Error("'Could not resolvetrack, no nodes available in Shoukaku'");
    }

    const result = await node.rest.resolve(query);
    if (result === undefined) {
      throw Error('Shoukaku returned undefined while resolving query ' + query);
    }

    switch (result.loadType) {
      case 'track':
        return {
          loadType: LoadResultType.track,
          data: this.LLToPlayableTrack(result.data),
        };

      case 'playlist':
        return {
          loadType: LoadResultType.playlist,
          data: this.LLToPlaylist(result.data),
        };
      case 'search':
        return {
          loadType: LoadResultType.track,
          data: this.LLToPlayableTrack(result.data[0]),
        };
      case 'empty':
        return {
          loadType: LoadResultType.empty,
          data: undefined,
        };
      case 'error':
        return {
          loadType: LoadResultType.error,
          data: undefined,
        };
      default:
        throw new Error('Lavalink did not return any data.');
    }
  }

  public async playTrack(
    guildid: string,
    playableTrack: PlayableTrack
  ): Promise<PlayResponse> {
    const player = this.shoukakuClient.players.get(guildid);
    if (player) {
      await player.playTrack({track: {encoded: playableTrack.lavalinkEncoded}});
      return PlayResponse.OK;
    } else {
      return PlayResponse.notInVoiceChannel;
    }
  }

  public async pause(guildid: string): Promise<boolean> {
    const player = this.shoukakuClient.players.get(guildid);
    if (player) {
      player.setPaused(true);
      return true;
    } else {
      return false;
    }
  }

  public async resume(guildid: string): Promise<boolean> {
    const player = this.shoukakuClient.players.get(guildid);
    if (player) {
      player.setPaused(false);
      return true;
    } else {
      return false;
    }
  }

  public on(
    event: PlayerEvent,
    listener: (data: any) => void,
    guildid: string
  ): boolean {
    const player = this.shoukakuClient.players.get(guildid);
    if (player) {
      player.on(event as any, listener);
      return true;
    } else {
      console.error(
        'Could not find player for guildid ' +
          guildid +
          ' when adding event listener'
      );
      return false;
    }
  }

  public async stopTrack(guildid: string): Promise<boolean> {
    const player = this.shoukakuClient.players.get(guildid);
    if (player) {
      await player.stopTrack();
      return true;
    } else {
      return false;
    }
  }

  public getPlaybackProgress(guildid: string): number {
    const player = this.shoukakuClient.players.get(guildid);
    if (player) {
      return player.position;
    } else {
      return -1;
    }
  }

  public async seekTo(guildid: string, position: number): Promise<number> {
    const player = this.shoukakuClient.players.get(guildid);
    if (player) {
      await player.seekTo(position);
      return this.getPlaybackProgress(guildid);
    } else {
      return -1;
    }
  }
}
