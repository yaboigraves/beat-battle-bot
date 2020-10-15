const { Command } = require('discord-akairo');
const Battle = require('../../models/battle');

/*
  start command may need to be removed for now
  it provides some weird problems with storing references to the collector

*/

class StartCommand extends Command {
  constructor() {
    super('start', {
      aliases: ['start'],
      category: 'battles',
      description: {
        icon: ':arrow_forward:',
        content: 'Starts the battle.',
        usage: '.start',
      },
    });
  }

  async exec(message) {
    // const sent = await message.channel.send(':gear: **Pong**!');
    // const sentTime = sent.editedTimestamp || sent.createdTimestamp;
    // const startTime = message.editedTimestamp || message.createdTimestamp;
    // sent.edit(`:gear: **Pong!** (${sentTime - startTime}*ms*)`);

    // check the db for a battle in this server that is in the await phase

    // TODO: fix this query, i forget what you said you'd do to make it faster,
    // just remove the for loop part

    await Battle.findOne({ serverID: message.guild.id, status: 'PREPARING' }).then((serverBattle) => {
      if (serverBattle === undefined || serverBattle === null) {
        const embed = this.client.util.embed()
          .setColor('RED')
          .setTitle(':warning: No Battle Running')
          .setDescription('There\'s not a battle happening in this server!\nPlease start a battle with `.battle <sample>`.');

        message.channel.send(embed);
      } else {
        const role = message.guild.roles.cache.find((r) => r.name === 'Participant');
        message.channel.send(`The battle is starting! ${role}`);

        // so this is manually starting the battle
        // set the battle state in the db to Battling
        // turn off the timer for the start battle thing

        // TODO: collect all the players that joined the battle via reaction and add them
        // done by the listener
        Battle.updateOne({ serverID: message.guild.id, status: 'PREPARING' }, { $set: { status: 'BATTLING' } }, () => {

        });
      }
    });

    // tell all users with the participating role that a battle has begun
  }
}

module.exports = StartCommand;
