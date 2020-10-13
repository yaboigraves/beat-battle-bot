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
    let serverBattle;

    const filter = (reaction, user) => {
      return ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'].includes(reaction.emoji.name) && user.id !== this.client.user.id;
    };

    await Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((battleResults) => {
      // loop through all the playerid's and post their submissions, add 1-5 reactions below them
      if (battleResults === null) {
        return message.channel.send('No battle in the voting phase to vote in buster');
      }
      serverBattle = battleResults;
      // this filter will ignore any reactions other than 1,2,3,4,5 and ignores the bots reactions
    });

    // TODO: stop this from running if theirs no battle ready to be voted on

    // TODO: add announcement that voting has started and ended

    for (let i = 0; i < serverBattle.playerIDs.length; i += 1) {
      const reactEmbed = this.client.util.embed()
        .setColor('GOLD')
        .setTitle(`:crossed_swords: ${serverBattle.submissions[serverBattle.playerIDs[i]]}`);
        // .setDescription('React with 1️⃣, 2️⃣ .');

      message.channel.send(reactEmbed).then((msg) => {
        let submissionScore = 0;
        msg.react('1️⃣')
          .then(() => msg.react('2️⃣'))
          .then(() => msg.react('3️⃣'))
          .then(() => msg.react('4️⃣'))
          .then(() => msg.react('5️⃣'))
          .then(() => {
            // this will need to be moved to a list or something otherwise
            // these are broken once we loop
            const collector = msg.createReactionCollector(filter, { time: 15000 });
            // collector.on('collect', (reaction, user) => {
            //   console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
            // });

            collector.on('end', (collected) => {
              // go through all the collected emojis and just print their name to start
              const reactions = collected.array();
              // let submissionScore = 0;

              for (let j = 0; j < reactions.length; j += 1) {
                // console.log(reactions[j].emoji.name);

                // figure out what score is being given to the submission
                // update the db submission object with the score of that submission

                switch (reactions[j].emoji.name) {
                  case '1️⃣':
                    // console.log('got 1 vote');
                    submissionScore += 1;
                    break;
                  case '2️⃣':
                    // console.log('got 2 vote');
                    submissionScore += 2;
                    break;
                  case '3️⃣':
                    // console.log('got 3 vote');
                    submissionScore += 3;
                    break;
                  case '4️⃣':
                    // console.log('got 4 vote');
                    submissionScore += 4;
                    break;
                  case '5️⃣':
                    // console.log('got 5 vote');
                    submissionScore += 5;
                    break;

                  default:
                    break;
                }
              }

              Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((serverBattle2) => {
                const { submissionsScores } = serverBattle2;
                submissionsScores[serverBattle2.playerIDs[i]] = submissionScore;

                Battle.updateOne({ serverID: message.guild.id, status: 'VOTING' }, { $set: { submissionsScores } }, () => {
                  // this is a great callback
                });
              });

              // console.log(`Collected ${collected.size} items`);
            });
          });
      });
    }
  }
}

module.exports = VoteCommand;
