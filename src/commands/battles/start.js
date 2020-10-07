const { Command, Argument } = require('discord-akairo');

// const Battle = require('../../models/battle');

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
        },
        {
          id: 'sample',
          type: 'string',
        },
      ],
      description: {
        icon: ':crossed_swords:',
        content: 'Start a beatbattle.',
        usage: '.battle [length]',
      },
    });
  }

  async exec(message, { time, sample }) {
    const reactTimeout = 5000; // temporary
    const reactFilter = (reaction, user) => {
      return ['⚔️'].includes(reaction.emoji.name) && user.id !== this.client.user.id;
    };

    // eslint-disable-next-line no-unused-vars
    const battleOpts = {
      serverID: message.guild.id,
      length: time,
      sample,
    };

    const reactEmbed = this.client.util.embed()
      .setColor('GOLD').setDescription('React to this message to join the battle');

    message.channel.send(reactEmbed).then((msg) => {
      msg.react('⚔️');
      msg.awaitReactions(reactFilter, { time: reactTimeout }).then((collected) => {
        const swords = collected.first().message.reactions.cache;
        message.channel.send(`${swords.first().count - 1} people reacted`);
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
