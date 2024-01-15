import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {Mandarine} from '../classes/mandarine';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave your voice channel.'),
  async execute(
    interaction: ChatInputCommandInteraction,
    mandarine: Mandarine
  ) {
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }

    await mandarine.leaveVoiceChannel(interaction.guildId);
    await interaction.reply({
      content: 'OK!',
      ephemeral: true,
    });
    return true;
  },
};
