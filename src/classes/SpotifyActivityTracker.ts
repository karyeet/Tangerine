// track the presence updates since discordjs wont track properly for us, at least for the spotify activity

import type {Activity, Client} from 'discord.js';
import {EventEmitter} from 'node:events';

export interface SpotifyActivity {
  trackName: string; // activity.details
  artistName: string; // activity.state
  trackId: string; // activity.syncid
}

// emitter will emit on the userid that was updated
export class SpotifyActivityTracker extends EventEmitter {
  // map of member ID to activity data
  private activities: Map<string, SpotifyActivity>;
  private client: Client;
  constructor(client: Client) {
    super();
    this.activities = new Map<string, SpotifyActivity>();
    this.client = client;

    this.client.on('presenceUpdate', (oldPresence, newPresence) => {
      // emitter will emit on the userid that was updated
      const spotifyActivity = this.processActivities(newPresence.activities);
      if (
        spotifyActivity &&
        newPresence.member &&
        spotifyActivity.trackId !==
          this.activities.get(newPresence.member.id)?.trackId
      ) {
        this.emit(newPresence.member.id, spotifyActivity);
        this.activities.set(newPresence.member.id, spotifyActivity);
        console.log(
          'Updated Spotify activity for user:',
          newPresence.member.id,
          spotifyActivity,
        );
      } else if (oldPresence) {
        this.activities.delete(oldPresence.member!.id);
      }
    });
  }

  public processActivities(
    activities: Activity[],
  ): SpotifyActivity | undefined {
    const spotifyActivityRaw: Activity | undefined = activities.find(
      activity => activity.name === 'Spotify',
    );
    if (
      spotifyActivityRaw?.syncId &&
      spotifyActivityRaw.details &&
      spotifyActivityRaw.state
    ) {
      const spotifyActivity: SpotifyActivity = {
        trackName: spotifyActivityRaw.details,
        artistName: spotifyActivityRaw.state,
        trackId: spotifyActivityRaw.syncId,
      };
      return spotifyActivity;
    }
    return undefined;
  }

  async getSpotifyActivity(
    userId: string,
    guildId: string,
  ): Promise<SpotifyActivity | undefined> {
    const activity = this.activities.get(userId);
    if (activity) {
      return activity;
    } else {
      // no spotify activity stored for that user, maybe discord will give us one..?
      const member = await this.client.guilds.cache
        .get(guildId)
        ?.members.fetch({
          user: userId,
          force: true,
          withPresences: true,
        });
      const spotifyActivity = this.processActivities(
        member?.presence?.activities || [],
      );
      if (spotifyActivity) {
        // discord gave us a spotify activity, store it and return it
        this.activities.set(userId, spotifyActivity);
        return spotifyActivity;
      } else {
        // no activity found
        return undefined;
      }
    }
  }
}
