import {EmbedBuilder} from 'discord.js';
import type {queueItem} from './queue';

export function secondsToTime(seconds: number) {
  if (seconds % 60 < 10) {
    return Math.floor(seconds / 60) + ':0' + Math.floor(seconds % 60);
  } else {
    return Math.floor(seconds / 60) + ':' + Math.floor(seconds % 60);
  }
}

export function buildEnqueuedEmbed(qItem: queueItem) {
  return new EmbedBuilder()
    .setTitle('Added To Queue')
    .setDescription(qItem.title)
    .setColor(0xffa500)
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
