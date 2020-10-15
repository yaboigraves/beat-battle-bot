const { Command } = require('discord-akairo');
const Battle = require('../../models/battle');

class TimeLeftCommand extends Command {
  constructor() {
    super('timeLeft', {
      aliases: ['timeLeft'],
      category: 'battles',
      description: {
        icon: ':alarm_clock:',
        content: 'Get the time left in the current battle.',
        usage: '.timeLeft',
      },
    });
  }

  async exec(message) {
    // look at the current time
    // look at the timestamp for the start of the battle
    // look at the length of the current battle
    // time left = length - (current - start)

    Battle.findOne({ serverID: message.guild.id, status: 'BATTLING' }).then((battle) => {
      if (battle == null) {
        return message.channel.send('No battle currently running');
      }

      // now - start -> how much time has passed
      // left = length - timepassed

      const timeLeft = (battle.length * 1000) - (Date.now() - battle.date);
      return message.channel.send(`${timeLeft / 1000} seconds left`);
    });
  }
}

module.exports = TimeLeftCommand;
