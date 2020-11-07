const { Command } = require('discord-akairo');
const Battle = require('../../models/battle');

class StopCommand extends Command {
  constructor() {
    super('stop', {
      aliases: ['stop'],
      category: 'battles',
      description: {
        icon: ':octagonal_sign:',
        content: 'Stops any current active battles in the server.',
        usage: '.stop',
      },
    });
  }

  async exec(message) {
    Battle.findOne({ serverID: message.guild.id, status: { $ne: 'FINISHED' } }).then((serverBattle) => {
      if (serverBattle === null) {
        return message.channel.send('No battle currently active to stop');
      }

      Battle.updateOne({ serverID: message.guild.id, active: true }, { $set: { status: 'STOPPING' } }).exec();
    });
  }
}

module.exports = StopCommand;
