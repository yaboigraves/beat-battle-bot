const { Command } = require('discord-akairo');

class InviteCommand extends Command {
  constructor() {
    super('invite', {
      aliases: ['invite'],
      category: 'general',
      description: {
        icon: ':scroll:',
        content: 'Invite the bot to your server.',
        usage: '.invite',
      },
    });
  }

  async fetchInvite() {
    if (this.invite) return this.invite;
    const invite = await this.client.generateInvite([
      'READ_MESSAGE_HISTORY',
      'SEND_MESSAGES',
      'EMBED_LINKS',
      'VIEW_CHANNEL',
      'MANAGE_MESSAGES',
      'MANAGE_ROLES',
    ]);

    this.invite = invite;
    return invite;
  }

  async exec(message) {
    const { username } = this.client.user;
    const reid = this.client.users.cache.get('110713257186054144');

    const description = [
      `You can invite **${username}** to your server by [**clicking here**](${await this.fetchInvite()})`,
    ].join('\n');

    return message.channel.send({
      embed: {
        color: 'GOLD',
        title: `:mailbox_with_mail: Invite ${username}`,
        description,
        footer: {
          text: `built by ${reid.tag}`,
          icon_url: reid.avatarURL(),
        },
      },
    });
  }
}

module.exports = InviteCommand;
