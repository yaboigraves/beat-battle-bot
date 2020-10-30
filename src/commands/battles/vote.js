const { Command, Argument } = require('discord-akairo');
const Battle = require('../../models/battle');

class VoteCommand extends Command {
  // TODO: add timeout argument to vote command
  constructor() {
    super('vote', {
      aliases: ['vote'],
      category: 'battles',
      description: {
        icon: ':ballot_box:',
        content: 'Triggers the voting phase.',
        usage: '.vote',
      },
    });
  }

  async exec(message) {
    await Battle.findOne({ serverID: message.guild.id, status: 'BATTLING' }).then((battleResults) => {
      if (battleResults === null) {
        return message.channel.send('No battle currently ready for voting.');
      }

      // move the battle in the current server to the voting phase
      Battle.updateOne({ serverID: message.guild.id, status: 'BATTLING' }, { $set: { status: 'VOTING' } }).exec();
    });
  }
}

module.exports = VoteCommand;
