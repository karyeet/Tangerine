import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to a specific position in the current track')
    .addSubcommand(subcommand =>
      subcommand
        .setName('to Timestamp')
        .setDescription('Seek to a time formatted as such: MM:SS or HH:MM:SS')
        .addStringOption(option =>
          option
            .setName('timestamp')
            .setDescription('Example: 1:30, 01:30, 22:01:30')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('by Seconds')
        .setDescription(
          'Seek forward or backwards by a number of seconds from the current position'
        )
        .addIntegerOption(option =>
          option
            .setName('seconds')
            .setDescription(
              'Seek by # of seconds. Negative numbers seek backwards'
            )
            .setRequired(true)
        )
    ),
  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }

    const playbackManager = musicbot.getPlaybackManager(interaction.guildId);
    const subcommand = interaction.options.getSubcommand();
    let newPosition;
    if (subcommand === 'to Timestamp') {
      const timestamp = interaction.options.getString('timestamp');
      // timestamp to miliseconds
      // do bounds check
      // write to newPosition
    } else if (subcommand === 'by Seconds') {
      const seconds = interaction.options.getString('seconds');
      // get current position, add seconds
      // write to newPosition
    }

    // set min and max bounds
    // seek to bounded newPosition

    // respond
    await interaction.reply({
      content: 'Seeked to -timestamp-!',
      ephemeral: true,
    });
    return true;
  },
};
