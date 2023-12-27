export class Queue {
  private queue: PlayableTrack[];
  private looping = false;

  private currentTrack: PlayableTrack | undefined;

  public get getLength() {
    return this.queue.length;
  }

  public get isLooping() {
    return this.looping;
  }

  public get getCurrentTrack() {
    return this.currentTrack;
  }

  public forceSkip() {
    this.currentTrack = this.queue.shift();
    return this.currentTrack;
  }

  // shift if not looping
  public next() {
    if (!this.looping) {
      this.currentTrack = this.queue.shift();
    }
    return this.currentTrack;
  }

  constructor() {
    this.queue = [];
  }
}

export class PlayableTrack {
  public readonly lavalinkEncoded: string;
  public readonly title: string;
  public readonly author: string;
  public readonly artwork: string;
  public readonly isLiveStream: boolean;
  public readonly trackDuration: Number;

  constructor(
    encoded: string,
    title: string,
    author: string,
    artwork: string,
    isLiveStream = false,
    trackDuration = 0
  ) {
    this.lavalinkEncoded = encoded;
    this.title = title;
    this.author = author;
    this.artwork = artwork;
    this.isLiveStream = isLiveStream;
    this.trackDuration = trackDuration;
  }
}
