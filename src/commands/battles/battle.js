/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable brace-style */
const { Command, Argument } = require('discord-akairo');

const YoutubeMp3Downloader = require('youtube-mp3-downloader');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const { measureMemory } = require('vm');
const Battle = require('../../models/battle');

// config for youtube downloader
const youtubeDownloader = new YoutubeMp3Downloader({
  // TODO: move this to env
  ffmpegPath: 'C:/Program Files/ffmpeg/bin/ffmpeg.exe', // FFmpeg binary location
  outputPath: './src/tempFiles', // Output file location (default: the home directory)
  youtubeVideoQuality: 'highestaudio', // Desired video quality (default: highestaudio)
  queueParallelism: 2, // Download parallelism (default: 1)
  progressTimeout: 2000, // Interval in ms for the progress reports (default: 1000)
  allowWebm: false, // Enable download from WebM sources (default: false)
});

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
          type: Argument.range('number', 3, 10000),
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

    const videoid = sample.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    if (videoid != null) {
      // console.log('video id = ', videoid[1]);
      youtubeDownloader.download(videoid[1]);

      youtubeDownloader.on('finished', (err, data) => {
        // console.log(data.file);

        // post the file in the server
        message.channel.send('', { files: [data.file] }).then(() => {
          // delete the file from the temp server
          fs.unlink(data.file, (errr) => {
            if (errr) {
              console.error(errr);
            }
          });
        });
      });
    } else {
      return message.channel.send('Invalid sample link, must be youtube link.');
    }

    youtubeDownloader.on('error', (error) => {
      console.log(error);
    });

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

          // why tf doesnt this work?
          // const pipeline = [{
          //   $match: { 'documentKey._id': message.guild.id },
          // },
          // ];
          const options = { fullDocument: 'updateLookup' };

          const changeStream = Battle.watch(options);

          const voteReactionCollectors = [];

          changeStream.on('change', (next) => {
            console.log('received a change to the collection: \t', next.fullDocument.serverID);

            /*
              so to summarize the problem
              -this listener runs anytime ANY document in the collection is changed
              -this means that anytime any battle runs, the listener will update ALL servers with the changes
                -this is obviously a no no

              -so we need to make sure that each listener for each server only responds to changes to ITS battle document
              -for some reason this is fucking impossible????
                -probably needs something with a pipeline? we need to only allow events where the document
                id matches the server id
                  -HOWEVER for some fucking reason the serverid and the message id are different ids? despite being
                  in the same server?????
            */

            // TODO: FOR NOW THIS IS A SHITTY FIX, CHECK IF THE UPDATE IS RELEVANT TO THIS CURRENT SERVER
            // WHY TF DOESNT THIS WORK??
            // ids are different all of a sudden???

            // Battle.findById(new ObjectId(next.documentKey._id), (bttle) => {
            //   console.log(bttle);
            // });

            // why the fuck are these id's different
            // Battle.findOne({ serverID: message.guild.id }, (b) => {
            //   console.log(b);
            //   console.log(message.guild.id);
            // });

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

              Battle.findOne({ serverID: message.guild.id, status: 'VOTING' }).then((battleResults) => {
                if (battleResults === null) {
                  return message.channel.send('No battle in the voting phase.');
                }

                // check for no submissions
                if (Object.keys(battleResults.submissions).length === 0) {
                  return message.channel.send('No one submitted, ending battle');
                }

                const votingEmbed = this.client.util.embed()
                  .setColor('GOLD')
                  .setTitle(':ballot_box: Voting Has Begun!')
                  .setDescription('React with 1️⃣,2️⃣,3️⃣,4️⃣,5️⃣ to vote.\nPlease wait until all numbers have been loaded.\nVoting will end automatically in 45 minutes.');

                message.channel.send(votingEmbed);

                for (let i = 0; i < battleResults.playerIDs.length; i += 1) {
                  if (battleResults.submissions[battleResults.playerIDs[i]] === undefined) {
                    const noSubmissionEmbed = this.client.util.embed().setColor('RED')
                      .setTitle('No Submission')
                      .setDescription(`From <@${battleResults.playerIDs[i]}`);
                    return message.channel.send(noSubmissionEmbed);
                  }

                  const voteReactEmbed = this.client.util.embed()
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
