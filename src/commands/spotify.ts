import {
  ChatInputCommandInteraction,
  GuildMember,
  Message,
  SlashCommandBuilder,
} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';
import type {SpotifyActivity} from '../classes/SpotifyActivityTracker';

import {
  JoinResponse,
  LoadResultType,
  ResolveResponse,
} from '../classes/LavalinkAbstract';
import {
  buildQueueItemEmbed,
  addToQueueCommandEntry,
  addToQueue,
} from '../classes/utility';

const SPOTIFY_URL = 'https://open.spotify.com/track/';

// map of guildid to listener function
type PresenceListener = (activity: SpotifyActivity) => void | Promise<void>;
const listeners = new Map<string, PresenceListener>();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spotify')
    .setDescription('Listen along to someone whose spotify is linked.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user you want to listen along to')
        .setRequired(true),
    )
    .addBooleanOption(option =>
      option
        .setName('stop')
        .setDescription('Stop following Spotify for this server'),
    ),
  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'Server only command.',
        ephemeral: true,
      });
      return;
    }

    const targetUser = interaction.options.getUser('user');
    if (!targetUser) {
      await interaction.reply({
        content: 'User was not provided.',
        ephemeral: true,
      });
      return;
    }

    const stopFollowing = interaction.options.getBoolean('stop');

    if (stopFollowing) {
      const guildId: string = interaction.guild.id;
      const listener = listeners.get(guildId);
      if (listener) {
        musicbot.presenceTracker.off(targetUser.id, listener);
        listeners.delete(guildId);
        await interaction.reply({
          content: `Stopped following ${targetUser.username}'s Spotify.`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "Not following anyone's Spotify in this server.",
          ephemeral: true,
        });
      }
      return;
    }

    await interaction.deferReply({ephemeral: true});

    const spotifyActivity: SpotifyActivity | undefined =
      await musicbot.presenceTracker.getSpotifyActivity(
        targetUser.id,
        interaction.guild.id,
      );
    console.log('Fetched presence from PresenceTracker:', spotifyActivity);

    if (!spotifyActivity) {
      await interaction.editReply({
        content:
          "No spotify activity found for that user (discord sometimes doesn't tell me..), ask them pause and resume on spotify or wait for their next track to play!",
      });
      return;
    }

    // i have spotify activity now, take over queue and start following
    // clear queue
    musicbot.getPlaybackManager(interaction.guild.id).clearQueue();
    // force skip current track
    musicbot.getPlaybackManager(interaction.guild.id).skip(true);
    // add song they're listening to
    let result = null;
    try {
      result = await addToQueue(
        'spotify',
        SPOTIFY_URL + spotifyActivity.trackId,
        false,
        musicbot,
        (interaction.member as GuildMember).voice.channelId as string,
        interaction.guild.members.me?.voice.channelId || null,
        interaction.guild.id,
      );
    } catch (err) {
      await interaction.editReply({
        content: `${err}`,
      });
      return;
    }
    await interaction.editReply({
      content: 'Listening along!',
    });

    const followupMessage: Message = await interaction.followUp({
      content: 'Listening along to ' + targetUser.username,
      embeds: [
        buildQueueItemEmbed(result.data, 'Added To Queue', {
          queuePosition: result.queuePosition,
          requesterName: interaction.member?.user.username,
          requesterAvatarURL: (
            interaction.member as GuildMember
          ).displayAvatarURL(),
        }),
      ],
      ephemeral: false,
    });

    const guildId: string = interaction.guild.id;
    const targetUsername = targetUser.username;

    async function newTrack(spotifyActivity: SpotifyActivity) {
      let result = null;
      const guild = await musicbot.discordClient.guilds.fetch(guildId);
      // clear queue
      musicbot.getPlaybackManager(guildId).clearQueue();
      // force skip current track
      musicbot.getPlaybackManager(guildId).skip(true);
      // add song they're listening to
      try {
        result = await addToQueue(
          'spotify',
          SPOTIFY_URL + spotifyActivity.trackId,
          false,
          musicbot,
          (interaction.member as GuildMember).voice.channelId as string,
          guild.members.me?.voice.channelId || null,
          guildId,
        );
        await followupMessage.edit({
          content: 'Listening along to ' + targetUsername,
          embeds: [
            buildQueueItemEmbed(result.data, 'Added To Queue', {
              queuePosition: result.queuePosition,
              requesterName: interaction.member?.user.username,
              requesterAvatarURL: (
                interaction.member as GuildMember
              ).displayAvatarURL(),
            }),
          ],
        });
      } catch (err) {
        followupMessage.edit(`${err}`);
        return;
      }
    }

    musicbot.presenceTracker.on(targetUser.id, newTrack);
    listeners.set(guildId, newTrack);
  },
};
