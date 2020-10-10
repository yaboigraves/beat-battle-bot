const { Command } = require('discord-akairo');
const Battle = require('../../models/battle');

class VoteCommand extends Command {
  constructor() {
    super('vote', {
      aliases: ['vote'],
      category: 'battles',
      description: {
        icon: ':small_blue_diamond:',
        content: 'Trigger the voting phase.',
        usage: '.vote',
      },
    });
  }

  async exec(message) {
    // check if its voting time (this is flipped after the battle timer is done)

    await Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((serverBattle) => {
      // loop through all the playerid's and post their submissions, add 1-5 reactions below them

      for (let i = 0; i < serverBattle.playerIDs.length; i += 1) {
        message.channel.send(serverBattle.submissions[serverBattle.playerIDs[i]]).then((msg) => {
          msg.react('1️⃣');
          msg.react('2️⃣');
          msg.react('3️⃣');
          msg.react('4️⃣');
          msg.react('5️⃣');
        });
      }
    });

    message.channel.send('Voting will end in _ seconds');
  }
}

module.exports = VoteCommand;
