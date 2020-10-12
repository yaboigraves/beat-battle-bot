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
    let winner;
    await Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((serverBattle) => {
      winner = {
        id: serverBattle.playerIDs[0],
        submissionLink: '',
        score: 0,
      };

      // loop through all the player ids
      for (let i = 0; i < serverBattle.playerIDs.length; i += 1) {
        const { submissionsScores } = serverBattle;

        const score = submissionsScores[serverBattle.playerIDs[i]];

        message.channel.send(score);

        // check if the score is larger than the current winners score

        if (winner.score < score) {
          winner.id = serverBattle.playerIDs[i];
          winner.submissionLink = serverBattle.submissions[winner.id];
          winner.score = score;
        }
      }

      // after the await, we then display the winner and then update leaderboards
      // TODO: make this prettier
      message.channel.send(winner.submissionLink);

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
