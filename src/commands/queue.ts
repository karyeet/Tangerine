import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  InteractionResponse,
} from 'discord.js';
import type {Musicbot} from '../classes/musicbot';
import {queueItem} from '../classes/queue';
import type {PlaybackManager} from '../classes/PlaybackManager';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the queue and whats currently playing.'),
  async execute(interaction: ChatInputCommandInteraction, musicbot: Musicbot) {
    if (!interaction.guildId) {
      await interaction.reply('This command only works in servers');
      return false;
    }

    const PBM = musicbot.getPlaybackManager(interaction.guildId);
    const itemsPerPage = 5;
    const interactiveQueue = new InteractiveQueue(PBM, itemsPerPage);

    interactiveQueue.sendQueueMessage(interaction);

    return true;
  },
};

function secondsToTime(seconds: number) {
  if (seconds % 60 < 10) {
    return Math.floor(seconds / 60) + ':0' + Math.floor(seconds % 60);
  } else {
    return Math.floor(seconds / 60) + ':' + Math.floor(seconds % 60);
  }
}

interface queueEmbedRequirements {
  currentTrack: queueItem | undefined;
  loopString: string | undefined;
  totalPages: number | undefined;
  pageItems: queueItem[] | undefined;
  totalDurationString: string | undefined;
  itemsPerPage: number;
  page: number;
}

class InteractiveQueue {
  private queueEmbedRequirements: queueEmbedRequirements;
  private PBM: PlaybackManager;

  private queueMessage: InteractionResponse | undefined;

  constructor(PBM: PlaybackManager, itemsPerPage: number) {
    this.PBM = PBM;
    this.queueEmbedRequirements = {
      currentTrack: undefined,
      loopString: undefined,
      totalPages: undefined,
      pageItems: undefined,
      totalDurationString: undefined,
      itemsPerPage: itemsPerPage,
      page: 0,
    };
    this.updateInformation();
  }

  public async sendQueueMessage(interaction: ChatInputCommandInteraction) {
    this.updateInformation();
    if (!this.queueMessage) {
      this.queueMessage = await interaction.reply({
        embeds: [this.buildQueueEmbed()],
        components: [this.buildButtonRow()],
        ephemeral: true,
      });
    } else {
      throw new Error('Queue message already exists');
    }
    const collector = this.queueMessage.createMessageComponentCollector({
      time: 30_000,
    });
    collector.on('collect', buttonPressed => {
      if (
        (buttonPressed.user.id === interaction.user.id &&
          buttonPressed.customId === 'next') ||
        buttonPressed.customId === 'back'
      ) {
        if (buttonPressed.customId === 'next') {
          this.queueEmbedRequirements.page++;
        } else {
          this.queueEmbedRequirements.page--;
        }
        this.updateInformation();
        buttonPressed.update({
          embeds: [this.buildQueueEmbed()],
          components: [this.buildButtonRow()],
        });
        collector.resetTimer();
      } else {
        buttonPressed.deferReply();
      }
    });

    collector.on('end', collected => {
      console.log(`Collected ${collected.size} interactions.`);
      try {
        this.queueMessage?.delete();
      } catch (err) {
        ('dooont care');
      }
    });
  }

  private updateInformation(): boolean {
    // currentTrack
    const currentTrack = this.PBM.getCurrentTrack();
    if (!currentTrack) {
      return false;
    }
    this.queueEmbedRequirements.currentTrack = currentTrack;
    // pageItems
    this.queueEmbedRequirements.pageItems = this.getItemsOnPage();
    // totalPages
    this.queueEmbedRequirements.totalPages = Math.ceil(
      this.PBM.queue.length / this.queueEmbedRequirements.itemsPerPage
    );
    if (
      this.queueEmbedRequirements.page >
      this.queueEmbedRequirements.totalPages - 1
    ) {
      this.queueEmbedRequirements.totalPages - 1;
    }
    // totalDurationString
    const totalDuration =
      this.PBM.queue.reduce(
        (acc: number, cur: queueItem) => acc + cur.duration,
        0
      ) + this.queueEmbedRequirements.currentTrack.duration;
    this.queueEmbedRequirements.totalDurationString = secondsToTime(
      totalDuration / 1000
    );
    // loopString
    let loopString: string;
    if (this.PBM.isTrackLooping()) {
      loopString = 'Track';
    } else if (this.PBM.isQueueLooping()) {
      loopString = 'Queue';
    } else {
      loopString = 'Disabled';
    }
    this.queueEmbedRequirements.loopString = loopString;
    // done
    return true;
  }

  private getItemsOnPage(): queueItem[] {
    const start =
      this.queueEmbedRequirements.page *
      this.queueEmbedRequirements.itemsPerPage;
    const end = start + this.queueEmbedRequirements.itemsPerPage;
    return this.PBM.queue.slice(start, end);
  }

  private buildQueueEmbed(): EmbedBuilder {
    const qer = this.queueEmbedRequirements;
    if (
      qer.currentTrack === undefined ||
      qer.pageItems === undefined ||
      qer.totalDurationString === undefined ||
      qer.loopString === undefined
    ) {
      return new EmbedBuilder()
        .setTitle('Queue')
        .setDescription('Queue is empty.');
    }
    this.queueEmbedRequirements.totalPages =
      this.queueEmbedRequirements.totalPages || 1;
    const queueEmbed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('Queue')
      .setDescription(`**Currently Playing:** ${qer.currentTrack.title}`)
      .setThumbnail(qer.currentTrack.artwork)
      .addFields(
        {
          name: 'Artist',
          value: qer.currentTrack.author,
          inline: true,
        },
        {
          name: 'Length',
          value: secondsToTime(qer.currentTrack.duration / 1000),
          inline: true,
        },
        {
          name: 'Looping',
          value: qer.loopString,
          inline: true,
        }
      )
      .setFooter({
        text: `Page: ${qer.page + 1}/${
          this.queueEmbedRequirements.totalPages
        }\nDuration: ${qer.totalDurationString}`,
      });
    let counter = qer.page * qer.itemsPerPage;
    for (const item of qer.pageItems) {
      counter++;
      queueEmbed.addFields({
        name: '#' + counter,
        value: item.title + ' | ' + secondsToTime(item.duration / 1000),
        inline: false,
      });
    }

    return queueEmbed;
  }

  buildButtonRow() {
    const disableNext =
      !this.queueEmbedRequirements.totalPages ||
      this.queueEmbedRequirements.page + 1 >=
        this.queueEmbedRequirements.totalPages;
    const disableBack =
      !this.queueEmbedRequirements.totalPages ||
      this.queueEmbedRequirements.page <= 0;
    const next = new ButtonBuilder()
      .setCustomId('next')
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disableNext);

    const back = new ButtonBuilder()
      .setCustomId('back')
      .setLabel('◀ Back')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disableBack);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(back, next);

    return row;
  }
}
