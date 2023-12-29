export class Queue {
  private queue: queueItem[];
  private loopingTrack = false;
  private loopingQueue = false;

  private currentTrack: PlayableTrack | undefined;

  public get getLength(): number {
    return this.queue.length;
  }

  public get isTrackLooping(): boolean {
    return this.loopingTrack;
  }
  public get isQueueLooping(): boolean {
    return this.loopingQueue;
  }

  public get getCurrentTrack(): PlayableTrack | undefined {
    return this.currentTrack;
  }

  // skip regardless of looping
  public forceSkip(): PlayableTrack | undefined {
    return this.next(true);
  }

  // shift if not looping
  public next(force = false): PlayableTrack | undefined {
    if (!this.loopingTrack || force === true) {
      this.currentTrack = this.queue[0].upNext(this.queue, this.loopingQueue);
    }

    return this.currentTrack;
  }

  constructor() {
    this.queue = [];
  }
}

export abstract class queueItem {
  public readonly title: string;
  public readonly author: string;
  public readonly artwork: string;
  public readonly duration: number;
  abstract upNext(
    queue: queueItem[],
    queueLooping: boolean
  ): PlayableTrack | undefined;
  constructor(title: string, author: string, artwork: string, duration = 0) {
    this.title = title;
    this.author = author;
    this.artwork = artwork;
    this.duration = duration;
  }
}

export class PlayableTrack extends queueItem {
  public readonly lavalinkEncoded: string;
  public readonly isLiveStream: boolean;

  public upNext(
    queue: queueItem[],
    queueLooping: boolean
  ): PlayableTrack | undefined {
    if (queueLooping) {
      queue.push(this);
    }
    queue.shift();
    return this;
  }

  constructor(
    title: string,
    author: string,
    artwork: string,
    duration = 0,
    encoded: string,
    isLiveStream: boolean
  ) {
    super(title, author, artwork, duration);
    this.lavalinkEncoded = encoded;
    this.isLiveStream = isLiveStream;
  }
}

export class PlaylistTrack extends PlayableTrack {
  public upNext(
    queue: queueItem[]
    //queueLooping: boolean // need not use this, as playlist will handle queue looping
  ): PlayableTrack | undefined {
    queue.shift();
    return this;
  }

  constructor(
    title: string,
    author: string,
    artwork: string,
    duration = 0,
    encoded: string,
    isLiveStream: boolean
  ) {
    super(title, author, artwork, duration, encoded, isLiveStream);
  }
}

export class Playlist extends queueItem {
  public readonly tracks: PlayableTrack[];
  public readonly length: number;

  private expandPlaylist(queue: queueItem[]) {
    // unshift all tracks to the front of the queue
    queue.unshift(...this.tracks);
  }
  public upNext(
    queue: queueItem[],
    queueLooping: boolean
  ): PlayableTrack | undefined {
    if (queueLooping) {
      queue.push(this);
    }
    const toBeCurrentTrack = this.tracks[0];
    // remove the playlist
    queue.shift();
    // add all tracks to the front of the queue
    this.expandPlaylist(queue);
    // remove our to be current track
    queue.shift();
    // return current track

    return toBeCurrentTrack;
  }

  constructor(
    title: string,
    author: string,
    artwork: string,
    tracks: PlayableTrack[],
    duration?: number
  ) {
    if (!duration) {
      duration = 0;
      for (const track of tracks) {
        duration += track.duration;
      }
    }
    super(title, author, artwork, duration);
    this.tracks = tracks;
    this.length = tracks.length;
  }
}
