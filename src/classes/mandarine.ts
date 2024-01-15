import type {Client} from 'discord.js';
import {JoinResponse, LavalinkAbstract} from './LavalinkAbstract';
import {Queue} from './queue';

export class Mandarine {
  lavalink: LavalinkAbstract;
  discordClient: Client;
  guildQueues: Map<string, Queue> = new Map();

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
}
