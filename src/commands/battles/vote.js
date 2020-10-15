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
    let serverBattle;

    const filter = (reaction, user) => {
      return ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'].includes(reaction.emoji.name) && user.id !== this.client.user.id;
    };

    await Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((battleResults) => {
      if (battleResults === null) {
        return message.channel.send('No battle in the voting phase.');
      }

      // TODO: this variable is no longer required its a superflous alias
      serverBattle = battleResults;

      const votingEmbed = this.client.util.embed()
        .setColor('GOLD')
        .setTitle(':ballot_box: Voting Has Begun!')
        .setDescription(`React with 1️⃣,2️⃣,3️⃣,4️⃣,5️⃣ to vote.\nPlease wait until all numbers have been loaded.\nVoting will end in ${timeout} seconds`);

      message.channel.send(votingEmbed);

      for (let i = 0; i < serverBattle.playerIDs.length; i += 1) {
        const reactEmbed = this.client.util.embed()
          .setColor('GOLD')
          .setTitle(`:crossed_swords: ${serverBattle.submissions[serverBattle.playerIDs[i]]}`);

        message.channel.send(reactEmbed).then((msg) => {
          let submissionScore = 0;
          msg.react('1️⃣')
            .then(() => msg.react('2️⃣'))
            .then(() => msg.react('3️⃣'))
            .then(() => msg.react('4️⃣'))
            .then(() => msg.react('5️⃣'))
            .then(() => {
              const collector = msg.createReactionCollector(filter, { time: timeout * 1000 });

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

                // note, this is happening multiple times because their is one collector
                // for every submission
                // this should be handled by some kind of timer listener later

                // TODO: move this to the listener, and create a serpearte timeout that
                // waits the same amount of time the reaction collector waits

                Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((serverBattle2) => {
                  const { submissionsScores } = serverBattle2;
                  submissionsScores[serverBattle2.playerIDs[i]] = submissionScore;

                  Battle.updateOne({ serverID: message.guild.id, status: 'VOTING' }, { $set: { submissionsScores } }, () => {
                    // this is a great callback
                  });
                });
              });
            });
        });
      }
    });

    // TODO: add announcement that voting has started and ended (listener)
  }
}

module.exports = VoteCommand;
