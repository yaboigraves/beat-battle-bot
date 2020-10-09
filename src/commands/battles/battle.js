const { Command, Argument } = require('discord-akairo');

const Battle = require('../../models/battle');

class BattleCommand extends Command {
  constructor() {
    super('battle', {
      aliases: ['battle', 'start'],
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
          flag: 'time:',
        },
        {
          // time in minutes to watch for reactions
          // 1 to 15 minutes
          id: 'timeout',
          type: Argument.range('number', 1, 15),
          default: 5, // temporary, in seconds
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
        usage: '.battle [length]',
      },
    });
  }

  async exec(message, { time, timeout, sample }) {
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

        const battleOpts = {
          serverID: message.guild.id,
          length: time,
          playerIDs: [],
          status: 'BATTLING',
          sample,
        };

        const reacts = collected.first().message.reactions.cache;
        message.channel.send(`${reacts.first().count - 1} people reacted`);
        // console.log(swords.first().users.cache);
        reacts.first().users.cache.forEach((user) => {
          if (user.id !== this.client.user.id) {
            battleOpts.playerIDs.push(user.id);
            if (role) {
              message.guild.members.cache.get(user.id).roles.add(role);
            }
          }
        });

        const battle = new Battle(battleOpts);
        battle.save().then((saved) => {
          console.log(saved);
        });
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
