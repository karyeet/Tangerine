import {CommandInteraction, GuildMember, SlashCommandBuilder} from 'discord.js';
import {JoinResponse} from '../classes/LavalinkAbstract';
import {Mandarine} from '../classes/mandarine';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join your voice channel.'),
  async execute(interaction: CommandInteraction, mandarine: Mandarine) {
    const channelId = (interaction.member as GuildMember).voice.channelId;
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }

    if (!channelId) {
      await interaction.reply('You must be in a voice channel.');
      return false;
    }

    const response: JoinResponse = await mandarine.joinVoiceChannel(
      interaction.guildId,
      (interaction.member as GuildMember).voice.channelId as string,
      true
    );

    if (response === JoinResponse.OK) {
      await interaction.reply('Joined!');
      return true;
    } else {
      await interaction.reply(response);
      return false;
    }
  },
};