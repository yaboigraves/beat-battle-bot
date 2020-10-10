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
          type: Argument.range('number', 10, 240),
          default: '30',
          match: 'option',
          flag: 'length:',
        },
        {
          // time in minutes to watch for reactions
          // 1 to 15 minutes
          id: 'timeout',
          type: Argument.range('number', 1, 15),
          default: 30, // temporary, in seconds
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

  async exec(message, { time, timeout, sample }) {
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
    });

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
      msg.awaitReactions(reactFilter, { time: timeout * 1000 }).then((collected) => {
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
        message.channel.send(`${reacts.first().count - 1} people reacted`);
        // console.log(swords.first().users.cache);

        message.channel.send(`The battle is starting! ${role}`);

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

        // add all the players to the db and set the state to battling
        Battle.updateOne({ serverID: message.guild.id, status: 'PREPARING' }, { $set: { playerIDs: reactedIDs, status: 'BATTLING' } }, () => {
          // console.log('battle begun');
        });

        // const battle = new Battle(battleOpts);
        // battle.save().then((saved) => {
        //   console.log(saved);
        // });

        // loop through and push to battleOpts.playerIds = [];
        // const battle = new Battle(battleOpts);
        // once we create the battle object, we can save it to the client
        // message.client.battles[serverID] = the id of the object
        // so we can easily reference it in other commands to start/stop it etc
      });
    });
  }
}

module.exports = BattleCommand;
