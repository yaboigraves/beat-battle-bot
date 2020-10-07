const { Listener } = require('discord-akairo');
const logger = require('../../logger');

class GuildListener extends Listener {
  constructor() {
    super('guildCreate', {
      emitter: 'client',
      event: 'guildCreate',
    });
  }

  async exec(guild) {
    // todo: automatically post help information in default channel
    logger.log(`Joined server ${logger.chalk().cyan(guild.name)}, with ${logger.chalk().cyan(`${guild.memberCount} members`)}.`);
  }
}

module.exports = GuildListener;
