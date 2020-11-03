const { Listener } = require('discord-akairo');
const logger = require('../../logger');

class ReadyListener extends Listener {
  constructor() {
    super('ready', {
      emitter: 'client',
      event: 'ready',
    });
  }

  async exec() {
    const guildCount = this.client.guilds.cache.array().length;
    const moduleCount = this.client.commandHandler.modules.size;
    logger.success(`Logged in as ${this.client.user.tag}.`);
    if (moduleCount > 0) logger.log(`Loaded ${logger.chalk().cyan(moduleCount)} module${moduleCount > 1 ? 's' : ''}.`);
    logger.success(`Active in ${logger.chalk().cyan(guildCount)} server${guildCount > 1 ? 's' : ''}.`);
    this.client.user.setPresence({
      activity: {
        name: process.env.STATUS || 'for .help',
        type: process.env.TYPE.toUpperCase() || 'WATCHING',
      },
      status: process.env.PRESENCE || 'dnd',
    });
  }
}

module.exports = ReadyListener;
