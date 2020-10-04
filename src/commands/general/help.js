const { Command } = require('discord-akairo');

class HelpCommand extends Command {
  constructor() {
    super('help', {
      aliases: ['help'],
      category: 'general',
      args: [
        {
          id: 'with',
        },
      ],
      description: {
        icon: ':book:',
        content: 'View information about a command.',
        usage: '.help <command/category>',
        examples: ['', 'profile', 'ping'],
      },
    });
  }

  async exec(message, args) {
    if (!args.with) return this.generalHelp(message);
    await this.findItem(args.with).then((item) => {
      let embed = this.client.util.embed();

      if (!item) embed.setColor('RED').setDescription(':warning: Invalid command or category.');
      if (item.type === 'cmd') embed = this.commandEmbed(item.obj);
      else embed = this.catEmbed(item.obj);

      return message.channel.send(embed);
    });
  }

  async findItem(search) {
    const { categories, modules } = this.client.commandHandler;
    let item = false;

    await categories.array().forEach((cat) => {
      if (search.toLowerCase() === cat.id) {
        item = {
          type: 'cat',
          obj: cat,
        };
      }
    });

    await modules.array().forEach((module) => {
      if (module.aliases.includes(search.toLowerCase())) {
        item = {
          type: 'cmd',
          obj: module,
        };
      }
    });

    return item;
  }

  commandEmbed(command) {
    const { content, usage, icon } = command.description;
    const title = icon ? `${icon} ${command.id}` : command.id;
    const description = [
      content,
      `**Usage**: \`${usage}\``,
    ].join('\n');

    return {
      embed: {
        color: 'GOLD',
        title,
        description,
      },
    };
  }

  catEmbed(category) {
    const { name } = this.getInfo(category.id);
    const commands = [];

    category.array().forEach((module) => {
      if (module.description.hidden) return;
      commands.push(`\`${module.id}\``);
    });

    return {
      embed: {
        color: 'GOLD',
        title: `${name} Commands`,
        description: commands.join(' '),
      },
    };
  }

  getInfo(catID) {
    const catInfo = {
      owner: [':hammer_pick:', 'Bot owner commands'],
      general: [':nut_and_bolt:', 'General commands'],
      battles: [':crossed_swords:', 'Battle commands'],
    };

    const icon = catInfo[catID][0];
    const desc = catInfo[catID][1];
    const title = `${catID[0].toUpperCase()}${catID.substr(1, catID.length)}`;

    return {
      name: `${icon} ${title}`,
      desc: `${desc}\n`,
    };
  }

  async generalHelp(message) {
    const { categories } = this.client.commandHandler;
    const embed = this.client.util.embed().setColor('GOLD');

    const helpText = [
      'Use `.help <category>` to view commands in a category, or',
      '`.help <command>` to view command specific information.',
      '',
      '**Categories:**',
    ].join('\n');

    embed.setAuthor(`Help | ${this.client.user.username}`, this.client.user.avatarURL());
    embed.setDescription(helpText);

    await categories.array().forEach((cat) => {
      const { name, desc } = this.getInfo(cat.id);
      embed.addField(name, desc);
    });

    message.channel.send(embed);
  }
}

module.exports = HelpCommand;
