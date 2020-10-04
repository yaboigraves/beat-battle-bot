const { Command } = require('discord-akairo');

class PingCommand extends Command {
  constructor() {
    super('ping', {
      aliases: ['ping'],
      category: 'general',
      description: {
        icon: ':small_blue_diamond:',
        content: 'Ping the server to see if the bot is responding.',
        usage: '.ping',
      },
    });
  }

  async exec(message) {
    const sent = await message.channel.send(':gear: **Pong**!');
    const sentTime = sent.editedTimestamp || sent.createdTimestamp;
    const startTime = message.editedTimestamp || message.createdTimestamp;
    sent.edit(`:gear: **Pong!** (${sentTime - startTime}*ms*)`);
  }
}

module.exports = PingCommand;
