import type {Client} from 'discord.js';
import {JoinResponse, LavalinkAbstract} from './LavalinkAbstract';
import {PlaybackManager} from './PlaybackManager';
import {SpotifyActivityTracker} from './SpotifyActivityTracker';

export class Musicbot {
  public lavalink: LavalinkAbstract;
  public discordClient: Client;
  public presenceTracker: SpotifyActivityTracker;
  private guildPlaybackManagers: Map<string, PlaybackManager> = new Map();

  constructor(lavalink: LavalinkAbstract, client: Client) {
    this.lavalink = lavalink;
    this.discordClient = client;
    this.presenceTracker = new SpotifyActivityTracker(client);
  }
  // channelid/guildid from interaction
  // force, call disconnect before joining
  public async joinVoiceChannel(
    guildId: string,
    channelId: string,
    force: boolean,
  ): Promise<JoinResponse> {
    if (force) {
      try {
        this.leaveVoiceChannel(guildId);
      } catch (err) {
        console.error('Error while leaving voice channel:', err);
      }
    }
    // join voice channel
    const joinRes = await this.lavalink.joinVoiceChannel(guildId, channelId);
    // if join is successful, resume track playing (and pause state)
    if (joinRes === JoinResponse.OK) {
      const PBM = this.getPlaybackManager(guildId);
      // on join, end event is fired so we dont manually need to resume, just listen
      PBM.updateListener();
      // set pause state
      if (PBM.paused()) {
        this.lavalink.pause(guildId);
      }
    }

    return joinRes;
  }

  public async leaveVoiceChannel(guildId: string): Promise<void> {
    return await this.lavalink.leaveVoiceChannel(guildId);
  }

  public getPlaybackManager(guildId: string) {
    const playbackManager = this.guildPlaybackManagers.get(guildId);
    if (playbackManager) {
      return playbackManager;
    } else {
      const newPlaybackManager = new PlaybackManager(this, guildId);
      this.guildPlaybackManagers.set(guildId, newPlaybackManager);
      return newPlaybackManager;
    }
  }
}
