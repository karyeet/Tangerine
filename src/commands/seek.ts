import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';
import {time} from 'console';
import {secondsToTime} from '../classes/utility';

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
    if (!playbackManager || !playbackManager.getCurrentTrack()) {
      await interaction.reply({
        content: 'No track is currently playing',
        ephemeral: true,
      });
      return false;
    }

    const subcommand = interaction.options.getSubcommand();
    let newPosition = 0;
    if (subcommand === 'to Timestamp') {
      const timestamp = interaction.options.getString('timestamp');
      if (!timestamp) {
        await interaction.reply({
          content: 'No timestamp provided.',
          ephemeral: true,
        });
        return false;
      }
      const timeStrings = timestamp.split(':');
      if (timeStrings.length > 3 || timeStrings.length < 1) {
        await interaction.reply({
          content:
            'Timestamp too long or too short. Use format HH:MM:SS or MM:SS or SS.',
          ephemeral: true,
        });
        return false;
      }
      // fill in missing time stamp elements
      for (let i = timeStrings.length; i < 3; i++) {
        timeStrings.unshift('00');
      }
      // parse timestamp timestamp to miliseconds...
      const miliseconds = Date.parse(
        `Thu, 01 Jan 1970 ${timeStrings[0]}:${timeStrings[1]}:${timeStrings[2]} GMT`
      );
      // check if successful
      if (isNaN(miliseconds)) {
        await interaction.reply({
          content:
            'Invalid timestamp provided. Use format HH:MM:SS or MM:SS or SS.',
          ephemeral: true,
        });
        return false;
      }
      // write to newPosition
      newPosition = miliseconds;
    } else if (subcommand === 'by Seconds') {
      const seconds = interaction.options.getInteger('seconds');
      if (!seconds) {
        await interaction.reply({
          content: 'No seconds provided.',
          ephemeral: true,
        });
        return false;
      }
      // get current position, add seconds
      const currentPosition = playbackManager.getPlaybackProgress();
      newPosition = currentPosition + seconds * 1000;
    }

    // seek (bounds check done in seekTo)
    await playbackManager.seekTo(newPosition);
    // respond
    await interaction.reply({
      content: `Seeked to ${secondsToTime(newPosition / 1000)}!`,
      ephemeral: true,
    });
    return true;
  },
};
