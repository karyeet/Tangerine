import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';
import {Playlist} from '../classes/queue';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('expandplaylist')
    .setDescription('Expand a playlist or album in the queue.')
    .addIntegerOption(option =>
      option
        .setMinValue(1)
        .setRequired(true)
        .setName('index')
        .setDescription('The index of the playlist to expand.')
    ),

  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }

    const PBM = musicbot.getPlaybackManager(interaction.guildId);

    const index = interaction.options.getInteger('index');
    if (!index || index < 1 || index > PBM.queue.length) {
      await interaction.reply({
        content: 'Please provide a valid index.',
        ephemeral: true,
      });
      return false;
    }

    if (!(PBM.queue[index - 1] instanceof Playlist)) {
      await interaction.reply({
        content: 'Item is not a Playlist or Album.',
        ephemeral: true,
      });
      return false;
    }

    try {
      const playlist = PBM.queue[index - 1] as Playlist;
      playlist.expandPlaylist(PBM.queue, index - 1);
      await interaction.reply({
        content: 'Playlist expanded.',
        ephemeral: true,
      });
      return true;
    } catch (err) {
      console.error(
        'Error while expanding playlist in guild ' +
          interaction.guildId +
          ': ' +
          err
      );
      await interaction.reply({
        content: "I couldn't expand that item.",
        ephemeral: true,
      });
      return false;
    }
  },
};
