import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';
import {
  JoinResponse,
  LoadResultType,
  type ResolveResponse,
} from '../classes/LavalinkAbstract';
import {PlaybackManager} from '../classes/PlaybackManager';
import {buildEnqueuedEmbed} from '../classes/utility';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Search and play from YouTube or a URL.')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('YT video title or any URL')
        .setRequired(true)
        .setMaxLength(100)
    ),
  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }
    const query = interaction.options.getString('query');
    if (query === null) {
      await interaction.reply('Invalid query');
      return false;
    }

    /*await interaction.reply({
      content: 'Loading track!',
      ephemeral: true,
    });*/
    // query is a url, provide directly to lavalink
    let result: ResolveResponse;
    try {
      if (query.match(/^https?:\/\//)) {
        result = await musicbot.lavalink.resolve(query);
      } else {
        result = await musicbot.lavalink.resolve(`ytsearch:${query}`);
      }
    } catch (err) {
      await interaction.reply({
        content: 'Failed to load track.',
        ephemeral: true,
      });
      console.error(`Query: ${query}`, err);
      return false;
    }

    if (
      result.loadType === LoadResultType.error ||
      result.loadType === LoadResultType.empty
    ) {
      await interaction.reply({
        content: 'Failed to load track.',
        ephemeral: true,
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
        await interaction.reply({
          content: 'We must be in the same voice channel.',
          ephemeral: true,
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
          await interaction.reply({
            content: response,
            ephemeral: true,
          });
          return false;
        }
      }
      // if everything has been ok so far, we can now enqueue
      const playbackManager: PlaybackManager = musicbot.getPlaybackManager(
        interaction.guildId
      );
      playbackManager.push(result.data);
      await interaction.reply({
        embeds: [buildEnqueuedEmbed(result.data)],
        ephemeral: false,
      });
      // note playback handled by playback manager
      return true;
    } else {
      return false;
    }
  },
};
