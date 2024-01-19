import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';
import type {queueItem} from '../classes/queue';
import {buildQueueItemEmbed} from '../classes/utility';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a track from the queue.')
    .addIntegerOption(option =>
      option
        .setMinValue(1)
        .setRequired(true)
        .setName('index')
        .setDescription(
          'The index of the track to remove, You can get the index of a track by using the queue command.'
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }

    const PBM = musicbot.getPlaybackManager(interaction.guildId);

    const index = interaction.options.getInteger('index');
    if (!index || index < 1 || index > PBM.queue.length) {
      await interaction.reply({
        content: 'Please provide a valid index.',
        ephemeral: true,
      });
      return false;
    }

    try {
      // we will give users a 1 indexed queue and so we subtract 1 from the index
      const removedItem: queueItem | undefined = PBM.removeQueueItem(index - 1);
      if (removedItem === undefined) {
        await interaction.reply({
          content: "I couldn't remove that track.",
          ephemeral: true,
        });
        return false;
      } else {
        await interaction.reply({
          embeds: [
            buildQueueItemEmbed(
              removedItem,
              'Removed #' + index + ' From Queue',
              0xff3500
            ),
          ],
          ephemeral: false,
        });
        return true;
      }
    } catch (err) {
      console.error(
        'Error while removing track in guild ' +
          interaction.guildId +
          ': ' +
          err
      );
      await interaction.reply({
        content: "I couldn't remove that track.",
        ephemeral: true,
      });
      return false;
    }
  },
};
