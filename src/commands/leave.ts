import {CommandInteraction, SlashCommandBuilder} from 'discord.js';
import {Mandarine} from '../classes/mandarine';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave your voice channel.'),
  async execute(interaction: CommandInteraction, mandarine: Mandarine) {
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
