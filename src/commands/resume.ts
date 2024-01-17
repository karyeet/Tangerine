import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume playback.'),
  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }

    try {
      await musicbot.getPlaybackManager(interaction.guildId).resume();
    } catch (err) {
      console.error(
        'Error while resuming in guild ' + interaction.guildId + ': ' + err
      );
      await interaction.reply({
        content: "I can't do that!",
        ephemeral: true,
      });
      return false;
    }

    await interaction.reply({
      content: 'Resumed!',
      ephemeral: false,
    });
    return true;
  },
};
