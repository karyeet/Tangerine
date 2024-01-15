import {Client, Events, GatewayIntentBits} from 'discord.js';
// eslint-disable-next-line node/no-unpublished-import
import {token, node} from '../config.json';
import {ShoukakuLL} from './classes/ShoukakuLL';
import {Mandarine} from './classes/mandarine';
import {CommandManager} from './classes/CommandManager';

const Nodes = [node];
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const lavalink = new ShoukakuLL(client, Nodes);
const mandarine = new Mandarine(lavalink, client);
const commandManager = new CommandManager();

client.once(Events.ClientReady, readyClient => {
  console.log(`Discord Ready! Logged in as ${readyClient.user.tag}`);
  commandManager.registerCommands(readyClient.user.id, token);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    await commandManager.executeCommand(
      interaction.commandName,
      interaction,
      mandarine
    );
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  }
});

// Log in to Discord with your client's token
client.login(token);
