import {
  APIEmbedField,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  type GuildMember,
} from 'discord.js';
import type {queueItem} from './queue';
import {
  type ResolveResponse,
  LoadResultType,
  JoinResponse,
} from './LavalinkAbstract';
import {PlaybackManager} from './PlaybackManager';
import {Musicbot} from './musicbot';

export function secondsToTime(seconds: number) {
  if (seconds % 60 < 10) {
    return Math.floor(seconds / 60) + ':0' + Math.floor(seconds % 60);
  } else {
    return Math.floor(seconds / 60) + ':' + Math.floor(seconds % 60);
  }
}

export interface buildQueueItemEmbedOptions {
  color?: number;
  queuePosition?: number;
  requesterName?: string | null;
  requesterAvatarURL?: string | null;
}

export function buildQueueItemEmbed(
  qItem: queueItem,
  title: string,
  options: buildQueueItemEmbedOptions,
) {
  if (!options || !options.color) {
    options.color = 0xffa500;
  }
  const fields: APIEmbedField[] = [
    {
      name: 'Artist',
      value: qItem.author,
      inline: true,
    },
    {
      name: 'Length',
      value: secondsToTime(qItem.duration / 1000),
      inline: true,
    },
  ];
  if (options.queuePosition) {
    fields.push({
      name: 'Position',
      value: String(options.queuePosition),
      inline: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(qItem.title)
    .setColor(options.color)
    .addFields(fields)
    .setThumbnail(qItem.artwork);
  if (options.requesterAvatarURL && options.requesterName) {
    embed.setFooter({
      text: options.requesterName,
      iconURL: options.requesterAvatarURL,
    });
  }
  return embed;
}

export async function addToQueueCommandEntry(
  source: string,
  interaction: ChatInputCommandInteraction,
  musicbot: Musicbot,
) {
  if (!interaction.guildId) {
    await interaction.reply('This command only works in servers');
    return false;
  }
  const query = interaction.options.getString('query');
  if (query === null) {
    await interaction.reply('Invalid query');
    return false;
  }

  const playNext = interaction.options.getBoolean('playnext') || false;

  const userChannelId = (interaction.member as GuildMember).voice.channelId;
  const botChannelId = interaction.guild?.members.me?.voice.channelId;
  const guildId = interaction.guildId;

  await interaction.reply({
    content: 'Loading track!',
    ephemeral: true,
  });

  try {
    const result = await addToQueue(
      source,
      query,
      playNext,
      musicbot,
      userChannelId as string,
      botChannelId || null,
      guildId,
    );
    await interaction.followUp({
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
    try {
      interaction.deleteReply();
    } catch (err) {
      ('dooont care');
    }
    return true;
  } catch (err) {
    console.error('Error adding to queue:', err);
    await interaction.followUp({
      content: (err as Error).message,
      ephemeral: true,
    });
    return false;
  }
}

interface addToQueueResult {
  data: queueItem;
  queuePosition: number;
}

export async function addToQueue(
  source: string,
  query: string,
  playNext: boolean,
  musicbot: Musicbot,
  userChannelId: string,
  botChannelId: string | null, // channel bot is in, if any
  guildId: string,
): Promise<addToQueueResult> {
  let result: ResolveResponse;
  // query is a url, provide directly to lavalink
  try {
    if (query.match(/^https?:\/\//)) {
      result = await musicbot.lavalink.resolve(query);
    } else {
      result = await musicbot.lavalink.resolve(`${source}:${query}`);
    }
  } catch (err) {
    console.error(`Query: ${query}`, err);
    throw new Error('Failed to load track.');
  }

  // the check if the load is a track or playlist is enough
  /*if (
    result.loadType === LoadResultType.error ||
    result.loadType === LoadResultType.empty
  ) {
    await interaction.editReply({
      content: 'Failed to load track.',
      // ephemeral: true,
    });
    return false;
  }*/

  if (
    (result.loadType === LoadResultType.track ||
      result.loadType === LoadResultType.playlist) &&
    result.data
  ) {
    // if user is not in a voice channel or a different voice channel, terminate
    if (!userChannelId || (botChannelId && userChannelId !== botChannelId)) {
      throw new Error('We must be in the same voice channel.');
    }
    // at this point, either the bot is not in a voice channel, or it is in the same voice channel as the user
    // if the bot is not in a voice channel
    if (!botChannelId) {
      // join the voice channel
      const response: JoinResponse = await musicbot.joinVoiceChannel(
        guildId,
        userChannelId as string,
        true,
      );
      if (response === JoinResponse.errorGeneric) {
        throw new Error(response);
      }
    }
    // if everything has been ok so far, we can now enqueue
    const playbackManager: PlaybackManager =
      musicbot.getPlaybackManager(guildId);
    const queuePosition = playbackManager.add(result.data, playNext);

    // note playback handled by playback manager
    return {data: result.data, queuePosition: queuePosition};
  } else {
    throw new Error('Failed to load track.');
  }
}
