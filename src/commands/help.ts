import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  APIEmbedField,
} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all commands and their descriptions.'),
  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }

    const commands = await interaction.client.application.commands.fetch();
    const embed = new EmbedBuilder().setTitle('Commands').setColor(0xffa500);
    const commandFields: APIEmbedField[] = [];

    for (const command of commands.values()) {
      commandFields.push({
        name:
          command.name +
          ' ' +
          command.options?.map(o => `[${o.name}]`).join(' '),
        value: command.description,
        inline: false,
      });
    }

    embed.addFields(commandFields);

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    return true;
  },
};
