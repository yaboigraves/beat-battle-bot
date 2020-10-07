const { AkairoClient, CommandHandler, ListenerHandler } = require('discord-akairo');
const mongoose = require('mongoose');
const logger = require('./logger');
const pkg = require('../package.json');

require('dotenv-safe').config();

const owners = process.env.OWNERIDS.includes(',') ? process.env.OWNERIDS.split(',') : process.env.OWNERIDS;
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

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
      handleEdits: true,
      allowMention: true,
      fetchMembers: true,
      commandUtil: true,
    });

    this.listenerHandler = new ListenerHandler(this, {
      directory: './src/listeners/',
    });

    this.setup();
  }

  setup() {
    this.listenerHandler.setEmitters({
      commandHandler: this.commandHandler,
      listenerHandler: this.listenerHandler,
    });

    this.commandHandler.loadAll();
    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.listenerHandler.loadAll();
  }
}

logger.success(`battlebot v${pkg.version}`, logger.prefix('~'));

mongoose.connect(process.env.MONGOURL, mongoOptions).then(() => {
  if (mongoose.connection.readyState !== 1) logger.error('Could not connect to MongoDB.');
  else if (mongoose.connection.readyState === 1) logger.success('Connected to MongoDB.');
});

const client = new Client();
client.battles = {};

client.login(process.env.TOKEN);
