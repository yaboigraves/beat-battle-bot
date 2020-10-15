const { Command } = require('discord-akairo');
const Battle = require('../../models/battle');

class ResultsCommand extends Command {
  constructor() {
    super('results', {
      aliases: ['results'],
      category: 'battles',
      description: {
        icon: ':crown: ',
        content: 'Manually ends voting, displays results, and ends the battle.',
        usage: '.results',
      },
    });
  }

  async exec(message) {
    // figure out which server battle we're getting the results from
    let winner;

    const header = this.client.util.embed()
      .setColor('RED')
      .setTitle(':crossed_swords: RESULTS :crossed_swords:');

    message.channel.send(header);

    await Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((serverBattle) => {
      if (serverBattle == null) {
        return message.channel.send('No battle ready for results yet');
      }

      // turn off the vote reaction collectors

      winner = {
        id: serverBattle.playerIDs[0],
        submissionLink: '',
        score: 0,
      };

      const role = message.guild.roles.cache.find((r) => r.name === 'Participant');

      // loop through all the player ids
      for (let i = 0; i < serverBattle.playerIDs.length; i += 1) {
        const { submissionsScores } = serverBattle;

        const score = submissionsScores[serverBattle.playerIDs[i]];

        const resultEmbed = this.client.util.embed()
          .setColor('BLUE')
          .setTitle(` ${serverBattle.submissions[serverBattle.playerIDs[i]]}`)
          .setDescription(`Submitted By : <@${serverBattle.playerIDs[i]}> \n Score : ${score}`);

        // todo: only post the top three at the end maybe?
        message.channel.send(resultEmbed);

        // check if the score is larger than the current winners score

        if (winner.score < score) {
          winner.id = serverBattle.playerIDs[i];
          winner.submissionLink = serverBattle.submissions[winner.id];
          winner.score = score;
        }

        // while we're at it and looping thru player id's remove their participant role
        message.guild.members.cache.get(serverBattle.playerIDs[i]).roles.remove(role);
      }

      // after the await, we then display the winner and then update leaderboards
      const winnerEmbed = this.client.util.embed()
        .setColor('GOLD')
        .setTitle(`:fire: ${winner.submissionLink}\nScore : ${winner.score}`)
        .setDescription(`:crown: The Winner is - <@${winner.id}>`);

      message.channel.send(winnerEmbed);

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
