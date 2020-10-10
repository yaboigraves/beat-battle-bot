const { Command } = require('discord-akairo');

class VoteCommand extends Command {
  constructor() {
    super('vote', {
      aliases: ['vote'],
      category: 'battles',
      description: {
        icon: ':small_blue_diamond:',
        content: 'Trigger the voting phase.',
        usage: '.vote',
      },
    });
  }

  async exec(message) {
    message.channel.send('hello yes vote time');
  }
}

module.exports = VoteCommand;
