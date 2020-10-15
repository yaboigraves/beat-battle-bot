/* eslint-disable max-len */
/* eslint-disable brace-style */
const { Command, Argument } = require('discord-akairo');

const Battle = require('../../models/battle');

class BattleCommand extends Command {
  constructor() {
    super('battle', {
      aliases: ['battle'],
      category: 'battles',
      channel: 'guild',
      ratelimit: 1,
      cooldown: 300000,
      args: [
        {
          // time in minutes for the battle to last
          // 10 minutes to 4 hours
          // todo: inhibitor for incorrect argument
          id: 'time',
          type: Argument.range('number', 10, 10000),
          default: '30',
          match: 'option',
          flag: 'length:',
        },
        {
          // time in minutes to watch for reactions
          // 1 to 15 minutes
          id: 'timeout',
          type: Argument.range('number', 1, 500),
          default: '30', // temporary, in seconds
          match: 'option',
          flag: 'timeout:',
        },
        {
          id: 'sample',
          type: 'string',
          match: 'rest',
        },
      ],
      description: {
        icon: ':crossed_swords:',
        content: 'Start a beatbattle.',
        usage: '.battle [sample] length:30 timeout:10',
      },
    });
  }

  async exec(message, { sample, time, timeout }) {
    // message.channel.send(`${time} ${timeout}`);
    if (!sample) {
      const embed = this.client.util.embed()
        .setColor('RED')
        .setTitle(':warning: Please provide a sample')
        .setDescription('See `.help battle` for more information and usage.');

      return message.channel.send(embed);
    }

    // battle in progress
    Battle.find({ serverID: message.guild.id }).then((serverBattles) => {
      for (let i = 0; i < serverBattles.length; i += 1) {
        if (serverBattles[i].active) {
          const embed = this.client.util.embed()
            .setColor('RED')
            .setTitle(':warning: Battle in Progress')
            .setDescription('There\'s already a battle happening in this server!\nPlease wait for it to finish or use `.stop`.');

          return message.channel.send(embed);
        }
      }

      // create the battle and append it to the DB in the preparing state

      const battleOpts = {
        serverID: message.guild.id,
        length: time,
        playerIDs: [],
        status: 'PREPARING',
        reactMessage: {
          channelID: message.channel.id,
          messageID: message.id,
        },
        sample,
      };

      const battle = new Battle(battleOpts);
      battle.save().then((saved) => {
        // console.log(saved);
      });

      const reactFilter = (reaction, user) => {
        return ['⚔️'].includes(reaction.emoji.name) && user.id !== this.client.user.id;
      };

      const reactEmbed = this.client.util.embed()
        .setColor('GOLD')
        .setTitle(':crossed_swords: A battle is about to begin')
        .setDescription(`React to this message with :crossed_swords: to join the battle.\nIt will begin in **${timeout} seconds**.`);

      message.channel.send(reactEmbed).then((msg) => {
        msg.react('⚔️');

        const collector = msg.createReactionCollector(reactFilter, { time: timeout * 1000 });

        // TODO: convert this to creating a collector rather than awaiting reactions
        // so it can be stopped later if the .start command is run
        collector.on('end', (collected) => {
        // nobody reacted
          if (!collected.first()) {
            const embed = this.client.util.embed()
              .setColor('RED')
              .setTitle(':warning: Nobody joined the battle, so it will not begin.')
              .setDescription('To start another battle, use `.battle <sample>`.\nSee `.help battle` for more information.');

            msg.delete();
            return message.channel.send(embed);
          }

          const role = message.guild.roles.cache.find((r) => r.name === 'Participant');

          const reacts = collected.first().message.reactions.cache;
          // message.channel.send(`${reacts.first().count - 1} people reacted`);
          // console.log(swords.first().users.cache);

          // list of all the players in the battle
          const reactedIDs = [];

          // give all the players the participant role
          reacts.first().users.cache.forEach((user) => {
            if (user.id !== this.client.user.id) {
              reactedIDs.push(user.id);
              if (role) {
                message.guild.members.cache.get(user.id).roles.add(role);
              }
            }
          });

          /*
          Listener Prototype
          -here we create a listener thats waiting for the status to get set to battling
            -once battling a timer is created to switch from battling to voting
              (maybe add a submission phase)
          -once voting is switched to we wait for the .vote command to get run once users are ready
          -once vote is run we then wait a predefined amount of time before triggering results
            -or we wait for the .results command
          -once results are triggered the battle ends
          */

          // cant do this on a testing db, need to move it to replica

          const changeStream = Battle.watch();

          const voteReactionCollectors = [];

          changeStream.on('change', (next) => {
            // console.log('received a change to the collection: \t', next);

            // first check the operation type, because for some fucking
            // reason the same info is stored differently

            let currentStatus = '';

            // eslint-disable-next-line prefer-const

            const serverBattle = serverBattles;

            if (next.operationType === 'replace') {
              // console.log('replace operation');
              currentStatus = next.fullDocument.status;
            } else if (next.operationType === 'update') {
              // console.log('update operation');
              currentStatus = next.updateDescription.updatedFields.status;
            }

            // console.log(currentStatus);

            // TODO: move all timing events and state switching code into this listener

            // TODO: package this listener code up into some kind of object and then import it
            // rather than having all this code here

            if (currentStatus === 'PREPARING') {
              console.log('preparing found');
            }
            else if (currentStatus === 'BATTLING') {
              setTimeout(() => {
                Battle.updateOne({ serverID: message.guild.id, status: 'BATTLING' }, { $set: { playerIDs: reactedIDs, status: 'VOTING' } }, () => {
                  return message.channel.send(`Battles over!! ${role}`);
                });
              }, time * 1000);
            }
            else if (currentStatus === 'VOTING') {
              // when voting is switched to we need to create a timeout that waits voting timeout
              // no point in really timing this so we're just gonna make it one hour for now
              // the collector will continously collect until the finished command is recieved
              // the voting collector will need to be declared before the ifelse block so it can be
              // accessed in the finished condtional

              const filter = (reaction, user) => {
                return ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'].includes(reaction.emoji.name) && user.id !== this.client.user.id;
              };

              const votingEmbed = this.client.util.embed()
                .setColor('GOLD')
                .setTitle(':ballot_box: Voting Has Begun!')
                .setDescription('React with 1️⃣,2️⃣,3️⃣,4️⃣,5️⃣ to vote.\nPlease wait until all numbers have been loaded.\nVoting will end automatically in 45 minutes.');

              message.channel.send(votingEmbed);

              Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((battleResults) => {
                if (battleResults === null) {
                  return message.channel.send('No battle in the voting phase.');
                }

                for (let i = 0; i < battleResults.playerIDs.length; i += 1) {
                  const voteReactEmbed = this.client.util.embed()
                    .setColor('GOLD')
                    .setTitle(`:crossed_swords: ${battleResults.submissions[battleResults.playerIDs[i]]}`);

                  message.channel.send(voteReactEmbed).then((voteMsg) => {
                    const submissionScore = 0;
                    voteMsg.react('1️⃣')
                      .then(() => voteMsg.react('2️⃣'))
                      .then(() => voteMsg.react('3️⃣'))
                      .then(() => voteMsg.react('4️⃣'))
                      .then(() => voteMsg.react('5️⃣'))
                      .then(() => {
                        // eslint-disable-next-line max-len
                        const voteReactionCollector = voteMsg.createReactionCollector(filter, { time: 2700 * 1000 });
                        voteReactionCollectors.push(voteReactionCollector);
                        console.log(voteReactionCollectors);

                        voteReactionCollector.on('collect', (reaction, user) => {
                          console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);

                          // update the database dynamically rather than all at the end
                          // -Billy

                          let voteSubmissionScore = 0;

                          switch (reaction.emoji.name) {
                            case '1️⃣':
                              // console.log('got 1 vote');
                              voteSubmissionScore = 1;
                              break;
                            case '2️⃣':
                              // console.log('got 2 vote');
                              voteSubmissionScore = 2;
                              break;
                            case '3️⃣':
                              // console.log('got 3 vote');
                              voteSubmissionScore = 3;
                              break;
                            case '4️⃣':
                              // console.log('got 4 vote');
                              voteSubmissionScore = 4;
                              break;
                            case '5️⃣':
                              // console.log('got 5 vote');
                              voteSubmissionScore = 5;
                              break;
                            default:
                              break;
                          }

                          // update the db with the score
                          Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((serverBattle2) => {
                            const { submissionsScores } = serverBattle2;
                            submissionsScores[serverBattle2.playerIDs[i]] = voteSubmissionScore;

                            Battle.updateOne({ serverID: message.guild.id, status: 'VOTING' }, { $set: { submissionsScores } }, () => {
                              // this is a great callback
                            });
                          });
                        });
                      });
                  });
                }
              });
            }

            else if (currentStatus === 'RESULTS') {
              // db query for the battle because i think the reference is broken
              Battle.findOne({ serverID: message.guild.id, status: 'RESULTS' }).then((resultsBattle) => {
                let winner;

                console.log(voteReactionCollectors);
                for (let i = 0; i < voteReactionCollectors.length; i += 1) {
                  // console.log('stopping vote reaction collector');
                  voteReactionCollectors[i].stop();
                }

                winner = {
                  id: resultsBattle.playerIDs[0],
                  submissionLink: '',
                  score: 0,
                };

                // loop through all the player ids
                for (let i = 0; i < resultsBattle.playerIDs.length; i += 1) {
                  const { submissionsScores } = resultsBattle;

                  const score = submissionsScores[resultsBattle.playerIDs[i]];

                  const resultEmbed = this.client.util.embed()
                    .setColor('BLUE')
                    .setTitle(` ${resultsBattle.submissions[resultsBattle.playerIDs[i]]}`)
                    .setDescription(`Submitted By : <@${resultsBattle.playerIDs[i]}> \n Score : ${score}`);

                  // todo: only post the top three at the end maybe?
                  message.channel.send(resultEmbed);

                  // check if the score is larger than the current winners score

                  if (winner.score < score) {
                    winner.id = resultsBattle.playerIDs[i];
                    winner.submissionLink = resultsBattle.submissions[winner.id];
                    winner.score = score;
                  }

                  // while we're at it and looping thru player id's remove their participant role
                  message.guild.members.cache.get(resultsBattle.playerIDs[i]).roles.remove(role);
                }

                // after the await, we then display the winner and then update leaderboards
                const winnerEmbed = this.client.util.embed()
                  .setColor('GOLD')
                  .setTitle(`:fire: ${winner.submissionLink}\nScore : ${winner.score}`)
                  .setDescription(`:crown: The Winner is - <@${winner.id}>`);

                message.channel.send(winnerEmbed);

                // eslint-disable-next-line no-underscore-dangle
                Battle.updateOne({ serverID: message.guild.id, status: 'RESULTS' }, { $set: { status: 'FINISHED', active: 'false' } }, () => {
                  console.log('battle has ended');
                });
              });
            }
          });

          // add all the players to the db and set the state to battling
          Battle.updateOne({ serverID: message.guild.id, status: 'PREPARING' }, { $set: { playerIDs: reactedIDs, status: 'BATTLING', date: +new Date() } }, () => {
            return message.channel.send(`The battle is starting! ${role}`);
          });
        });
      });
    });
  }
}

module.exports = BattleCommand;
