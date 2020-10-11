const { Command } = require('discord-akairo');
const Battle = require('../../models/battle');

class ResultsCommand extends Command {
  constructor() {
    super('results', {
      aliases: ['results'],
      category: 'battles',
      description: {
        icon: ':small_blue_diamond:',
        content: 'Display Results',
        usage: '.results',
      },
    });
  }

  async exec(message) {
    // figure out which server battle we're getting the results from
    Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((serverBattle) => {
      // loop through all the player ids

      for (let i = 0; i < serverBattle.playerIDs.length; i += 1) {
        const { submissionsScores } = serverBattle;
        message.channel.send(submissionsScores[serverBattle.playerIDs[i]]);
      }

      // TODO: re-enable
      /*
        Battle.updateOne({ serverID: message.guild.id, status: 'BATTLING' },
        { $set: { status: 'FINISHED' } }, () => {
        / this is a great callback
        });
    */
    });
  }
}

module.exports = ResultsCommand;
