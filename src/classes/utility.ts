import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  type GuildMember,
  Guild,
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
  requesterName?: string | null;
  requesterAvatarURL?: string | null;
}

export function buildQueueItemEmbed(
  qItem: queueItem,
  title: string,
  options: buildQueueItemEmbedOptions
) {
  if (!options || !options.color) {
    options.color = 0xffa500;
  }
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(qItem.title)
    .setColor(options.color)
    .addFields(
      {
        name: 'Artist',
        value: qItem.author,
        inline: true,
      },
      {
        name: 'Length',
        value: secondsToTime(qItem.duration / 1000),
        inline: true,
      }
    )
    .setThumbnail(qItem.artwork);
  if (options.requesterAvatarURL && options.requesterName) {
    embed.setFooter({
      text: options.requesterName,
      iconURL: options.requesterAvatarURL,
    });
  }
  return embed;
}

export async function addToQueue(
  source: string,
  interaction: ChatInputCommandInteraction,
  musicbot: Musicbot
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

  await interaction.reply({
    content: 'Loading track!',
    ephemeral: true,
  });
  // query is a url, provide directly to lavalink
  let result: ResolveResponse;
  try {
    if (query.match(/^https?:\/\//)) {
      result = await musicbot.lavalink.resolve(query);
    } else {
      result = await musicbot.lavalink.resolve(`${source}:${query}`);
    }
  } catch (err) {
    await interaction.editReply({
      content: 'Failed to load track.',
      // ephemeral: true,
    });
    console.error(`Query: ${query}`, err);
    return false;
  }

  if (
    result.loadType === LoadResultType.error ||
    result.loadType === LoadResultType.empty
  ) {
    await interaction.editReply({
      content: 'Failed to load track.',
      // ephemeral: true,
    });
    return false;
  }

  if (
    (result.loadType === LoadResultType.track ||
      result.loadType === LoadResultType.playlist) &&
    result.data
  ) {
    // get voice channel id
    const usrchannelId = (interaction.member as GuildMember).voice.channelId;
    const botchannelid = interaction.guild?.members.me?.voice.channelId;
    // if user is not in a voice channel or a different voice channel, terminate
    if (!usrchannelId || (botchannelid && usrchannelId !== botchannelid)) {
      await interaction.editReply({
        content: 'We must be in the same voice channel.',
        // ephemeral: true,
      });
      return false;
    }
    // at this point, either the bot is not in a voice channel, or it is in the same voice channel as the user
    // if the bot is not in a voice channel
    if (!botchannelid) {
      // join the voice channel
      const response: JoinResponse = await musicbot.joinVoiceChannel(
        interaction.guildId,
        usrchannelId as string,
        true
      );
      if (response === JoinResponse.errorGeneric) {
        await interaction.editReply({
          content: response,
          // ephemeral: true,
        });
        return false;
      }
    }
    // if everything has been ok so far, we can now enqueue
    const playbackManager: PlaybackManager = musicbot.getPlaybackManager(
      interaction.guildId
    );
    playbackManager.push(result.data);
    await interaction.followUp({
      embeds: [
        buildQueueItemEmbed(result.data, 'Added To Queue', {
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
    // note playback handled by playback manager
    return true;
  } else {
    return false;
  }
}
