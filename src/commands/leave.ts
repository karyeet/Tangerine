import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave your voice channel.'),
  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }

    await musicbot.leaveVoiceChannel(interaction.guildId);
    await interaction.reply({
      content: 'OK!',
      ephemeral: false,
    });
    return true;
  },
};
