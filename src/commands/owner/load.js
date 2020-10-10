const { Command } = require('discord-akairo');

class ReloadCommand extends Command {
  constructor() {
    super('reload', {
      aliases: ['reload'],
      category: 'owner',
      description: {
        icon: ':open_file_folder:',
        content: 'Reload a module.',
        usage: '.load <module>',
      },
      ownerOnly: true,
      quoted: false,
      args: [
        {
          id: 'module',
          match: 'content',
        },
      ],
    });
  }

  async exec(message, { module }) {
    const { commandHandler } = this.client;
    const embed = this.client.util.embed().setColor('GOLD');
    embed.setDescription(`${this.client.commandHandler.modules.size} modules loaded.`);

    if (!module) return message.channel.send('Usage: .reload <module>');

    try {
      commandHandler.reload(module);
      embed.setTitle(`:gear: Reloaded '${module}'.`);
      message.channel.send(embed);
    } catch (err) {
      embed.setColor('RED');
      embed.setTitle(`:warning: Could not reload '${module}'.`);
      message.channel.send(embed);
    }
  }
}

module.exports = ReloadCommand;
