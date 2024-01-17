import {PlayerEvent} from './LavalinkAbstract';
import {Musicbot} from './musicbot';
import {PlayableTrack, Queue, queueItem} from './queue';

export class PlaybackManager extends Queue {
  private isPaused: boolean;
  // is the track in the player, regardess of whether its paused (finished tracks are not playing and are unloaded)
  private progress: number;
  private guildId: string;
  private musicbot: Musicbot;
  private forceSkipFlag: boolean;

  constructor(musicbot: Musicbot, guildId: string) {
    super();
    this.musicbot = musicbot;
    this.isPaused = false;
    this.progress = 0;
    this.guildId = guildId;
    this.forceSkipFlag = false;

    musicbot.lavalink.on(
      PlayerEvent.TrackEnd,
      () => {
        console.log('Starting next track for guild ' + guildId);
        const nextTrack = this.next(this.forceSkipFlag);
        this.forceSkipFlag = false;
        if (nextTrack) {
          musicbot.lavalink.playTrack(guildId, nextTrack);
        } else {
          console.log('Queue ended for guild ' + guildId);
        }
      },
      guildId
    );
  }

  public pause() {
    this.isPaused = true;
    this.musicbot.lavalink.pause(this.guildId);
  }
  public resume() {
    this.isPaused = false;
    this.musicbot.lavalink.resume(this.guildId);
  }

  public push(item: queueItem) {
    super.push(item);
    if (!this.getCurrentTrack()) {
      this.musicbot.lavalink.playTrack(
        this.guildId,
        this.next() as PlayableTrack
      );
    }
  }

  public skip(force: boolean) {
    //const nextTrack = this.next(force);
    this.forceSkipFlag = force;
    this.musicbot.lavalink.stopTrack(this.guildId);
  }
}
