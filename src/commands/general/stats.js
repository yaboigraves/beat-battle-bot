const { Command } = require('discord-akairo');
const pkg = require('../../../package.json');

class StatsCommand extends Command {
  constructor() {
    super('stats', {
      aliases: ['stats', 'info', 'statistics'],
      category: 'general',
      description: {
        icon: ':bar_chart:',
        content: 'View bot statistics.',
        usage: '.stats',
      },
    });
  }

  formatMilliseconds(ms) {
    let x = Math.floor(ms / 1000);
    let seconds = x % 60;

    x = Math.floor(x / 60);
    let minutes = x % 60;

    x = Math.floor(x / 60);
    let hours = x % 24;

    let days = Math.floor(x / 24);

    seconds = `${'0'.repeat(2 - seconds.toString().length)}${seconds}`;
    minutes = `${'0'.repeat(2 - minutes.toString().length)}${minutes}`;
    hours = `${'0'.repeat(2 - hours.toString().length)}${hours}`;
    days = `${'0'.repeat(Math.max(0, 2 - days.toString().length))}${days}`;

    return `${days === '00' ? '' : `${days}:`}${hours}:${minutes}:${seconds}`;
  }

  async exec(message) {
    const description = [
      `**Guilds**: ${this.client.guilds.cache.size}`,
      `**Channels**: ${this.client.channels.cache.size}`,
      `**Users**: ${this.client.users.cache.size}`,
      `**Modules**: ${this.client.commandHandler.modules.size}`,
      `**Uptime**: ${this.formatMilliseconds(this.client.uptime)}`,
      `**Memory Usage**: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB.`,
    ].join('\n');

    return message.channel.send({
      embed: {
        color: 'GOLD',
        title: ':robot: Statistics',
        footer: {
          text: `v${pkg.version}`,
          icon_url: this.client.user.avatarURL(),
        },
        description,
        timestamp: new Date(),
      },
    });
  }
}

module.exports = StatsCommand;
