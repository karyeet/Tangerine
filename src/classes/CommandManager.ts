import type {
  SlashCommandBuilder,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  CommandInteraction,
} from 'discord.js';

import {REST, Routes} from 'discord.js';

import type {Mandarine} from './mandarine';

interface SlashCommand {
  data: SlashCommandBuilder;
  execute: Function;
}

export class CommandManager {
  private commandsJSON: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
  private commands: {[key: string]: SlashCommand} = {};
  private rest = new REST().setToken(token);

  constructor(pathToCommands = '../commands') {
    this.loadCommands(pathToCommands);
  }

  private async loadCommands(pathToCommands: string) {
    // Grab all the commands
    const commandsPath: String = path.join(pathToCommands);
    const commandFiles: String[] = fs
      .readdirSync(commandsPath)
      .filter((file: String) => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath: string = path.join(commandsPath, file);
      const command: SlashCommand = require(filePath);
      if ('data' in command && 'execute' in command) {
        this.commandsJSON.push(command.data.toJSON());
        this.commands[command.data.name] = command;
      } else {
        console.warn(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }

  private async registerCommands(clientId: string) {
    try {
      console.log(
        `Started refreshing ${commands.length} application (/) commands.`
      );

      const data = await rest.put(Routes.applicationCommands(clientId), {
        body: this.commandsJSON,
      });

      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
      return true;
    } catch (error) {
      console.warn('Error while refreshing commands:\n', error);
      return false;
    }
  }

  private async executeCommand(
    commandName: string,
    interaction: CommandInteraction,
    mandarine: Mandarine
  ) {
    if (commandName in this.commands) {
      await this.commands[commandName].execute(interaction, mandarine);
    } else {
      console.warn(`Command ${commandName} was called, but not found.`);
    }
  }
}
