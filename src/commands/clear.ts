import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear the queue for this server.'),
  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }

    const PBM = musicbot.getPlaybackManager(interaction.guildId);
    PBM.clearQueue();

    await interaction.reply({
      content: 'Cleared!',
      ephemeral: false,
    });
    return true;
  },
};
