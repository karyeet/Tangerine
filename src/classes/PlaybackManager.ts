import {PlayerEvent} from './LavalinkAbstract';
import {Musicbot} from './musicbot';
import {PlayableTrack, Queue, queueItem} from './queue';

export class PlaybackManager extends Queue {
  private isPaused: boolean;
  // is the track in the player, regardess of whether its paused (finished tracks are not playing and are unloaded)
  private guildId: string;
  private musicbot: Musicbot;
  private forceSkipFlag: boolean;

  constructor(musicbot: Musicbot, guildId: string) {
    super();
    this.musicbot = musicbot;
    this.isPaused = false;
    this.guildId = guildId;
    this.forceSkipFlag = false;

    // FIXME: only works when defined here
    this.trackEnded = () => {
      console.log('Starting next track for guild ' + this.guildId);
      let nextTrack: PlayableTrack | undefined;
      try {
        nextTrack = this.next(this.forceSkipFlag);
      } catch (err) {
        console.error('Error while getting next track:', err);
      }
      // console.log(this.queue);
      this.forceSkipFlag = false;
      if (nextTrack) {
        this.musicbot.lavalink.playTrack(this.guildId, nextTrack);
      } else {
        console.log('Queue ended for guild ' + this.guildId);
      }
    };
  }

  // for event
  private trackEnded;

  public updateListener() {
    console.log('Updating listener for guild ' + this.guildId);
    this.musicbot.lavalink.on(
      PlayerEvent.TrackEnd,
      this.trackEnded,
      this.guildId
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

  public paused() {
    return this.isPaused;
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

  public getPlaybackProgress() {
    return this.musicbot.lavalink.getPlaybackProgress(this.guildId);
  }
}
