import type {Client} from 'discord.js';
import {JoinResponse, LavalinkAbstract} from './LavalinkAbstract';
import {PlaybackManager} from './PlaybackManager';

export class Musicbot {
  public lavalink: LavalinkAbstract;
  public discordClient: Client;
  private guildPlaybackManagers: Map<string, PlaybackManager> = new Map();

  constructor(lavalink: LavalinkAbstract, client: Client) {
    this.lavalink = lavalink;
    this.discordClient = client;
  }
  // channelid/guildid from interaction
  // force, call disconnect before joining
  public async joinVoiceChannel(
    guildId: string,
    channelId: string,
    force: boolean
  ): Promise<JoinResponse> {
    if (force) {
      try {
        this.leaveVoiceChannel(guildId);
      } catch (err) {
        console.error('Error while leaving voice channel:', err);
      }
    }

    return await this.lavalink.joinVoiceChannel(guildId, channelId);
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
