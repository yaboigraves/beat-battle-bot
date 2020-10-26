/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable brace-style */
const { Command, Argument } = require('discord-akairo');

const fs = require('fs');
// const { ObjectId } = require('mongodb');
const Battle = require('../../models/battle');

const Downloader = require('../../ytdownloader');

const dl = new Downloader();

// so the basic idea here is going to be that this listener will be launched to watch the db
// each server that launches a battle will create a listener that watches the db for changes to this servers battle
// when a change is detected we need to verify that the change is happening to the battle relevant to this server

class DBListener {
  constructor(message, time, AkairoClient) {
    const role = message.guild.roles.cache.find((r) => r.name === 'Participant');
    const options = { fullDocument: 'updateLookup' };

    const changeStream = Battle.watch(options);

    const voteReactionCollectors = [];

    changeStream.on('change', (next) => {
      console.log('change stream change thang for');
      console.log(next.documentKey);
      // console.log('received a change to the collection: \t', next);

      let currentStatus = '';

      // eslint-disable-next-line prefer-const

      //   const serverBattle = serverBattles;

      if (next.operationType === 'replace') {
        // console.log('replace operation');
        currentStatus = next.fullDocument.status;
      } else if (next.operationType === 'update') {
        // console.log('update operation');
        currentStatus = next.updateDescription.updatedFields.status;
      }

      // TODO: package this listener code up into some kind of object and then import it
      // rather than having all this code here

      if (currentStatus === 'PREPARING') {
        console.log('preparing found');
      }

      else if (currentStatus === 'BATTLING') {
        setTimeout(() => {
          Battle.updateOne({ serverID: message.guild.id, status: 'BATTLING' }, { $set: { status: 'VOTING' } }, () => {
            return message.channel.send(`Battles over!! ${role}`);
          });
        }, 5 * 1000);
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

        Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((battleResults) => {
          if (battleResults === null) {
            return message.channel.send('No battle in the voting phase.');
          }

          // check for no submissions
          if (Object.keys(battleResults.submissions).length === 0) {
            return message.channel.send('No one submitted, ending battle');

            // TODO: remove the battle from the db
          }

          // so this needs to call a function inside the appropriate command
          // shouldnt do any of the voting embed stuff in here

          //   const votingEmbed = AkairoClient.util.embed()
          //     .setColor('GOLD')
          //     .setTitle(':ballot_box: Voting Has Begun!')
          //     .setDescription('React with 1️⃣,2️⃣,3️⃣,4️⃣,5️⃣ to vote.\nPlease wait until all numbers have been loaded.\nVoting will end automatically in 45 minutes.');

          //   message.channel.send(votingEmbed);

          for (let i = 0; i < battleResults.playerIDs.length; i += 1) {
            if (battleResults.submissions[battleResults.playerIDs[i]] === undefined) {
              const noSubmissionEmbed = AkairoClient.embed().setColor('RED')
                .setTitle('No Submission')
                .setDescription(`From <@${battleResults.playerIDs[i]}`);
              return message.channel.send(noSubmissionEmbed);
            }

            const voteReactEmbed = AkairoClient.embed()
              .setColor('GOLD')
              .setTitle(`:crossed_swords: ${battleResults.submissions[battleResults.playerIDs[i]]}`)
              .setDescription(`Submitted By <@${battleResults.playerIDs[i]}>`);

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

            const resultEmbed = AkairoClient.embed()
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
          const winnerEmbed = AkairoClient.embed()
            .setColor('GOLD')
            .setTitle(`:fire: ${winner.submissionLink}\nScore : ${winner.score}`)
            .setDescription(`:crown: The Winner is - <@${winner.id}>`);

          message.channel.send(winnerEmbed);

          // eslint-disable-next-line no-underscore-dangle
          Battle.updateOne({ serverID: message.guild.id, status: 'RESULTS' }, { $set: { status: 'FINISHED', active: 'false' } }, () => {
            console.log('battle has ended');
            changeStream.close();
          });
        });
      }
    });
  }
}

module.exports = DBListener;
