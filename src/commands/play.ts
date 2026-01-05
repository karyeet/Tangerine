import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';

import {addToQueueCommandEntry} from '../classes/utility';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Search and play from YouTube or a URL.')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('YT video title or any URL')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addBooleanOption(option =>
      option.setName('playnext').setDescription('Play next in queue')
    ),
  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    addToQueueCommandEntry('ytsearch', interaction, musicbot);
  },
};
