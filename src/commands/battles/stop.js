const { Command } = require('discord-akairo');
const Battle = require('../../models/battle');

class StopCommand extends Command {
  constructor() {
    super('stop', {
      aliases: ['stop'],
      category: 'battles',
      description: {
        icon: ':small_blue_diamond:',
        content: 'Stop the current battle if their is one in this server.',
        usage: '.stop',
      },
    });
  }

  async exec(message) {
    await Battle.findOne({ serverID: message.guild.id, status: { $ne: 'FINISHED' } }).then((serverBattle) => {
      // loop through all the playerid's and post their submissions, add 1-5 reactions below them
      if (serverBattle === null) {
        return message.channel.send('No battle currently active to stop');
      }

      // eslint-disable-next-line no-underscore-dangle
      Battle.deleteOne({ _id: serverBattle._id }).then(() => {
        return message.channel.send('Battle cancelled');
      });

      // drop the db from the table (no point in setting it finished)
    });
  }
}

module.exports = StopCommand;