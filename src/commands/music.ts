import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';

import {addToQueue} from '../classes/utility';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('music')
    .setDescription('Search and play from a large music library or URL')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Song title or any URL')
        .setRequired(true)
        .setMaxLength(100)
    ),
  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    addToQueue('spsearch', interaction, musicbot);
  },
};
