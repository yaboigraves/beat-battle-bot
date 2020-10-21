const { Command } = require('discord-akairo');

class CreditsCommand extends Command {
  constructor() {
    super('credits', {
      aliases: ['credits'],
      category: 'general',
      description: {
        icon: ':small_blue_diamond:',
        content: 'Displays developer credits and donation link',
        usage: '.credits',
      },
    });
  }

  async exec(message) {
    const response = this.client.util.embed()
      .setColor('GREEN')
      .setTitle(':alembic: Created By')
      .setDescription(' :cat: Reid - https://reid.cat/ \n :man_mage: Graves - https://gravesmakes.art/ \n :money_with_wings: Donate - https://ko-fi.com/beatbattledevs');

    message.channel.send(response);
  }
}

module.exports = CreditsCommand;
