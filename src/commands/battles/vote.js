const { Command } = require('discord-akairo');
const battle = require('../../models/battle');
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
    let serverBattle;

    const filter = (reaction, user) => {
      return ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'].includes(reaction.emoji.name) && user.id !== this.client.user.id;
    };

    Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((battleResults) => {
      // loop through all the playerid's and post their submissions, add 1-5 reactions below them
      if (battleResults === null) {
        return message.channel.send('No battle in the voting phase to vote in buster');
      }
      serverBattle = battleResults;
      // this filter will ignore any reactions other than 1,2,3,4,5 and ignores the bots reactions
    });

    const reactEmbed = this.client.util.embed()
      .setColor('GOLD')
      .setTitle(':crossed_swords: Voting Time!')
      .setDescription('Voting time.');
    for (let i = 0; i < 3; i += 1) {
      message.channel.send(reactEmbed).then((msg) => {
        msg.react('1️⃣')
          .then(() => msg.react('2️⃣')).then(() => {
            // this will need to be moved to a list or something otherwise
            // these are broken once we loop
            const collector = msg.createReactionCollector(filter, { time: 15000 });
            collector.on('collect', (reaction, user) => {
              console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
            });

            collector.on('end', (collected) => {
              console.log(`Collected ${collected.size} items`);
              return message.channel.send('voting has ended');
            });
          });
      });
    }
  }
}

module.exports = VoteCommand;
