const { Command } = require('discord-akairo');

class BattleCommand extends Command {
  constructor() {
    super('battle', {
      aliases: ['battle', 'start'],
      category: 'battles',
      description: {
        icon: ':crossed_swords:',
        content: 'Start a beatbattle.',
        usage: '.battle [length]',
      },
    });
  }

  async exec(message) {
    const reactTimeout = 5000; // temporary
    const reactFilter = (reaction, user) => {
      return ['⚔️'].includes(reaction.emoji.name) && user.id !== this.client.user.id;
    };

    const reactEmbed = this.client.util.embed().setColor('GOLD').setDescription('React to this message to join the battle');
    message.channel.send(reactEmbed).then((msg) => {
      msg.react('⚔️');
      msg.awaitReactions(reactFilter, { time: reactTimeout }).then((collected) => {
        const swords = collected.first().message.reactions.cache;
        message.channel.send(`${swords.first().count - 1} people reacted`);
      });
    });
  }
}

module.exports = BattleCommand;
