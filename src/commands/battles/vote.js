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

    Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((serverBattle) => {
      // loop through all the playerid's and post their submissions, add 1-5 reactions below them

      const filter = (reaction, user) => {
        return ['⚔️', '2️⃣', '3️⃣', '4️⃣', '5️⃣'].includes(reaction.emoji.name) && user.id !== this.client.user.id;
      };

      message.channel.send(serverBattle.submissions[serverBattle.playerIDs[0]])
        .then((msg) => {
          // this is to force the order, otherwise it may desync

          // msg.react('⚔️');
          // msg.react('2️⃣');
          // msg.react('3️⃣');
          // msg.react('4️⃣');
          // msg.react('5️⃣');

          msg.awaitReactions({ filter }, { time: 15000 }).then((collected) => {
            // go through all the reactions to this vote
            // keep track of all the userids that have already been logged
            // (this doesnt need to be stored db side)
            // if any duplicates come up take the first one that appears and
            // ignore the rest of the reactions
            // console.log(collected.size);

            // nobody reacted
            if (!collected.first()) {
              const embed = this.client.util.embed()
                .setColor('RED')
                .setTitle(':warning: Nobody voted for this beat aww.')
                .setDescription('To start another battle, use `.battle <sample>`.\nSee `.help battle` for more information.');

              msg.delete();
              return message.channel.send(embed);
            }
          });
        });

      // this filter will ignore any reactions other than 1,2,3,4,5 and ignores the bots reactions
    });

    // message.channel.send('Voting will end in 10 seconds');
  }
}

module.exports = VoteCommand;
