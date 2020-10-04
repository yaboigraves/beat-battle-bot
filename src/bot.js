const { AkairoClient, CommandHandler } = require('discord-akairo');
const logger = require('./logger');
const pkg = require('../package.json');

require('dotenv-safe').config();

const owners = process.env.OWNERIDS.includes(',') ? process.env.OWNERIDS.split(',') : process.env.OWNERIDS;

class Client extends AkairoClient {
  constructor() {
    super({
      ownerID: owners,
    }, {
      disableMentions: 'everyone',
    });

    this.commandHandler = new CommandHandler(this, {
      directory: './src/commands',
      prefix: process.env.PREFIX,
    });

    this.commandHandler.loadAll();
  }
}

logger.success(`battlebot v${pkg.version}`, logger.prefix('~'));

const client = new Client();
client.login(process.env.TOKEN);
