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
        console.log(saved);
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

          changeStream.on('change', (next) => {
            // console.log('received a change to the collection: \t', next);

            // first check the operation type, because for some fucking
            // reason the same info is stored differently

            let currentStatus = '';

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

            switch (currentStatus) {
              case 'PREPARING':
                console.log('preparing found');
                break;
              case 'BATTLING':
                // TODO: if we're moving into the battle state, check if the reaction collector is
                // still running, if it is still running, then we turn it off

                setTimeout(() => {
                  Battle.updateOne({ serverID: message.guild.id, status: 'BATTLING' }, { $set: { playerIDs: reactedIDs, status: 'VOTING' } }, () => {
                    return message.channel.send(`Battles over!! ${role}`);
                  });
                }, time * 1000);
                break;
              case 'VOTING':
                // if we're switching to voting then we start a timer? just wait for voting phase
                console.log('voting phase activated');
                break;

              case 'FINISHED':
                // end the battle, take away participant roles, update leaderboards

                // first calculate who won

                break;

              default:
                break;
            }
          });

          // add all the players to the db and set the state to battling
          Battle.updateOne({ serverID: message.guild.id, status: 'PREPARING' }, { $set: { playerIDs: reactedIDs, status: 'BATTLING' } }, () => {
            return message.channel.send(`The battle is starting! ${role}`);
          });
        });
      });
    });
  }
}

module.exports = BattleCommand;
