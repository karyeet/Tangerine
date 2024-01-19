import {EmbedBuilder} from 'discord.js';
import type {queueItem} from './queue';

export function secondsToTime(seconds: number) {
  if (seconds % 60 < 10) {
    return Math.floor(seconds / 60) + ':0' + Math.floor(seconds % 60);
  } else {
    return Math.floor(seconds / 60) + ':' + Math.floor(seconds % 60);
  }
}

export function buildQueueItemEmbed(
  qItem: queueItem,
  title: string,
  color = 0xffa500
) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(qItem.title)
    .setColor(color)
    .addFields(
      {
        name: 'Artist',
        value: qItem.author,
        inline: true,
      },
      {
        name: 'Length',
        value: secondsToTime(qItem.duration / 1000),
        inline: true,
      }
    )
    .setThumbnail(qItem.artwork);
}
