const {REST, Routes} = require('discord.js');
const {token} = require('../config.json');

const rest = new REST().setToken(token);
const clientid = '906647083573920380';
rest
  .put(Routes.applicationCommands(clientid), {body: []})
  .then(() => console.log('Successfully deleted all application commands.'))
  .catch(console.error);
