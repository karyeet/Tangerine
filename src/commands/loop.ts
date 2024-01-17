import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle loop settings for this guild.')
    .addStringOption(option =>
      option
        .setName('target')
        .setDescription('What should I toggle looping for?')
        .setRequired(true)
        .addChoices(
          {name: 'Just this track', value: 'track'},
          {name: 'Entire queue', value: 'queue'}
        )
    ),
  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }
    const target = interaction.options.getString('target');
    const PBM = musicbot.getPlaybackManager(interaction.guildId);

    if (target === 'track') {
      PBM.setTrackLooping(!PBM.isTrackLooping());
      await interaction.reply({
        content: `Toggled looping track to ${PBM.isTrackLooping()}!`,
        ephemeral: true,
      });
    } else {
      PBM.setQueueLooping(!PBM.isQueueLooping());
      await interaction.reply({
        content: `Toggled looping queue to ${PBM.isQueueLooping()}!`,
        ephemeral: true,
      });
    }

    return true;
  },
};
