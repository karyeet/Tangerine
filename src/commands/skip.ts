import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track')
    .addBooleanOption(option =>
      option.setName('force').setDescription('Skip even if looping.')
    ),
  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }

    const playbackManager = musicbot.getPlaybackManager(interaction.guildId);
    const force = interaction.options.getBoolean('force') || false;

    playbackManager.skip(force);

    await interaction.reply({
      content: 'Skipped!',
      ephemeral: false,
    });
    return true;
  },
};
