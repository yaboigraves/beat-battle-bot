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

    const header = this.client.util.embed()
      .setColor('RED')
      .setTitle(':crossed_swords: RESULTS :crossed_swords:');

    message.channel.send(header);

    await Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((serverBattle) => {
      if (serverBattle == null) {
        return message.channel.send('No battle ready for results yet');
      }

      Battle.updateOne({ serverID: message.guild.id, status: 'VOTING' },
        { $set: { status: 'RESULTS' } }, () => {
          // this is a great callback
        });
    });
  }
}

module.exports = ResultsCommand;
