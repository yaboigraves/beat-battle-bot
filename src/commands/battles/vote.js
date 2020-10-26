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
        usage: '.vote timeout:30',
      },
      args: [
        {
          // time in minutes to watch for reactions
          // 1 to 15 minutes
          id: 'timeout',
          type: Argument.range('number', 1, 60),
          // 10 minutes by default
          default: 600, // temporary, in seconds
          match: 'option',
          flag: 'timeout:',
        },

      ],
    });
  }

  async exec(message, { timeout }) {
    await Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((battleResults) => {
      if (battleResults === null) {
        return message.channel.send('No battle in the voting phase.');
      }
    });

    // TODO: add announcement that voting has started and ended (listener)
  }

  displayVotes() {

  }
}

module.exports = VoteCommand;
