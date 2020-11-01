/* eslint-disable object-shorthand */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable brace-style */
const { Command, Argument } = require('discord-akairo');
const logger = require('../../logger');
// const { ObjectId } = require('mongodb');
const Battle = require('../../models/battle');

// so rather than opening and closing these constantly, we're just going to open one change stream on launch
// after the stream is open it then just handles dispensing of jobs between clients
// so for example we can get the info on the guild info on a change and dispense changes there
// this will save alot of effort in opening/closing multiple streams

class DBListener {
  constructor(AkairoClient) {
    this.client = AkairoClient;

    const options = { fullDocument: 'updateLookup' };
    const changeStream = Battle.watch(options);

    changeStream.on('change', (next) => {
      if (next.operationType !== 'replace' && next.operationType !== 'update') {
        return;
      }
      const { serverID } = next.fullDocument;
      const { channelID } = next.fullDocument.reactMessage;

      let guild; let channel;

      // TODO: redo this system
      const voteReactionCollectors = [];

      // participant role
      let role;

      AkairoClient.guilds.fetch(serverID).then((g) => {
        guild = g;
      }).catch((err) => {
        logger.error(err);
      });

      this.client.channels.fetch(channelID).then((c) => {
        channel = c;
        role = channel.guild.roles.cache.find((r) => r.name === 'Participant');
      }).catch((error) => logger.error(error));

      let currentStatus = '';

      if (next.operationType === 'replace') {
        currentStatus = next.fullDocument.status;
      } else if (next.operationType === 'update') {
        currentStatus = next.updateDescription.updatedFields.status;
      }

      if (currentStatus === 'PREPARING') {
        console.log('preparing found');
      }

      // so we're not going to move the state anymore until vote is run so people can still submit
      // TODO: reipliment correct time to this, probably need to pull the length from the db
      else if (currentStatus === 'BATTLING') {
        Battle.findOne({ serverID, status: 'BATTLING' }).then((serverBattle) => {
          setTimeout(() => {
            return channel.send(`Battles over ${role}! Run the .vote command to enter the voting phase once everyone has submit.`);
          }, serverBattle.length * 1000);
        });
      }

      else if (currentStatus === 'VOTING') {
        // when voting is switched to we need to create a timeout that waits voting timeout
        // no point in really timing this so we're just gonna make it one hour for now
        // the collector will continously collect until the finished command is recieved
        // the voting collector will need to be declared before the ifelse block so it can be
        // accessed in the finished condtional

        // TODO: check if this should be owner ID or something else
        const filter = (reaction, user) => {
          return ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'].includes(reaction.emoji.name) && user.id !== AkairoClient.ownerID;
        };

        Battle.findOne({ serverID, status: 'VOTING' }).then((battleResults) => {
          if (battleResults === null) {
            return channel.send('No battle in the voting phase.');
          }

          // check for no submissions
          if (Object.keys(battleResults.submissions).length === 0) {
            return channel.send('No one submitted, ending battle');
          }

          const votingEmbed = AkairoClient.util.embed()
            .setColor('GOLD')
            .setTitle(':ballot_box: Voting Has Begun!')
            .setDescription('React with 1️⃣,2️⃣,3️⃣,4️⃣,5️⃣ to vote.\nPlease wait until all numbers have been loaded.\nVoting will end automatically in 45 minutes.');

          channel.send(votingEmbed);

          for (let i = 0; i < battleResults.playerIDs.length; i += 1) {
            if (battleResults.submissions[battleResults.playerIDs[i]] === undefined) {
              const noSubmissionEmbed = AkairoClient.util.embed().setColor('RED')
                .setTitle('No Submission')
                .setDescription(`From <@${battleResults.playerIDs[i]}`);
              return channel.send(noSubmissionEmbed);
            }

            const voteReactEmbed = AkairoClient.util.embed()
              .setColor('GOLD')
              .setTitle(`:crossed_swords: ${battleResults.submissions[battleResults.playerIDs[i]]}`)
              .setDescription(`Submitted By <@${battleResults.playerIDs[i]}>`);

            channel.send(voteReactEmbed).then((voteMsg) => {
              voteMsg.react('1️⃣')
                .then(() => voteMsg.react('2️⃣'))
                .then(() => voteMsg.react('3️⃣'))
                .then(() => voteMsg.react('4️⃣'))
                .then(() => voteMsg.react('5️⃣'))
                .then(() => {
                  // eslint-disable-next-line max-len
                  const voteReactionCollector = voteMsg.createReactionCollector(filter, { time: 2700 * 1000 });
                  voteReactionCollectors.push(voteReactionCollector);

                  // tracks the number of reactions
                  let numReactions = 0;
                  // tracks the user's that have already voted
                  const usersReacted = [];
                  let score = 0;

                  voteReactionCollector.on('collect', (reaction, user) => {
                    // console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
                    if (!usersReacted.includes(user.id)) {
                      numReactions += 1;
                      usersReacted.push(user.id);
                    }
                    else {
                      return voteMsg.channel.send(`Vote already recieved <@${user.id}>`);
                    }

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

                    score += voteSubmissionScore;
                    voteMsg.edit(voteReactEmbed.setDescription(`${numReactions}/${battleResults.playerIDs.length} votes recieved. \n Current Score : ${score} `));

                    // update the db with the score
                    // eslint-disable-next-line object-shorthand
                    Battle.findOne({ serverID: serverID, status: 'VOTING' }).then((serverBattle2) => {
                      const { submissionsScores } = serverBattle2;
                      submissionsScores[serverBattle2.playerIDs[i]] = voteSubmissionScore;

                      // eslint-disable-next-line object-shorthand
                      Battle.updateOne({ serverID: serverID, status: 'VOTING' }, { $set: { submissionsScores } }, () => {
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
        Battle.findOne({ serverID: serverID, status: 'RESULTS' }).then((resultsBattle) => {
          let winner;

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

            const resultEmbed = AkairoClient.util.embed()
              .setColor('BLUE')
              .setTitle(` ${resultsBattle.submissions[resultsBattle.playerIDs[i]]}`)
              .setDescription(`Submitted By : <@${resultsBattle.playerIDs[i]}> \n Score : ${score}`);

            // todo: only post the top three at the end maybe?
            channel.send(resultEmbed);

            if (winner.score < score) {
              winner.id = resultsBattle.playerIDs[i];
              winner.submissionLink = resultsBattle.submissions[winner.id];
              winner.score = score;
            }

            // TODO: reimpliment this
            // message.guild.members.cache.get(resultsBattle.playerIDs[i]).roles.remove(role);
          }

          // after the await, we then display the winner and then update leaderboards
          const winnerEmbed = AkairoClient.util.embed()
            .setColor('GOLD')
            .setTitle(`:fire: ${winner.submissionLink}\nScore : ${winner.score}`)
            .setDescription(`:crown: The Winner is - <@${winner.id}>`);

          channel.send(winnerEmbed);

          // eslint-disable-next-line no-underscore-dangle
          Battle.updateOne({ serverID: serverID, status: 'RESULTS' }, { $set: { status: 'FINISHED', active: 'false' } }, () => {
            // changeStream.close();
          });
        });
      }
    });
  }
}

module.exports = DBListener;
