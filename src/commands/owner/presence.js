const { Command } = require('discord-akairo');

class PresenceCommand extends Command {
  constructor() {
    super('presence', {
      aliases: ['presence', 'status'],
      category: 'owner',
      description: {
        icon: ':red_circle:',
        content: 'Change the bot\'s presence.',
        usage: '.presence -p [idle/dnd] -t [watching/playing] <txt>',
      },
      ownerOnly: true,
      quoted: false,
      args: [
        {
          id: 'presence',
          match: 'option',
          flag: 'p:',
          type: ['online', 'idle', 'dnd', 'invisible'], // TODO: inhibitor + permission inhib
        },
        {
          id: 'type',
          match: 'option',
          flag: 't:',
        },
        {
          id: 'status',
          match: 'rest',
        },
      ],
    });
  }

  async exec(message, { presence, type, status }) {
    const fixedType = type ? type.toUpperCase() : this.client.user.presence.activities[0].type;
    const fixedStatus = status || this.client.user.presence.activities[0].name;
    const fixedPresence = presence ? presence.toLowerCase() : this.client.user.presence.status;
    const embed = this.client.util.embed().setTitle(':gear: Presence Updated').setColor('GOLD');
    await this.client.user.setPresence({
      activity: {
        name: fixedStatus,
        type: fixedType,
      },
      status: fixedPresence,
    });

    message.channel.send(embed);
  }
}

module.exports = PresenceCommand;
