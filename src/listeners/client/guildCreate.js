const { Listener } = require('discord-akairo');
const logger = require('../../logger');

class GuildListener extends Listener {
  constructor() {
    super('guildCreate', {
      emitter: 'client',
      event: 'guildCreate',
    });
  }

  async exec(guild) {
    if (guild.available) {
      // create a role to mention battle participants
      guild.roles.create({
        data: {
          name: 'Participant',
          mentionable: true,
          permissions: [],
        },
      });

      // post about information in the first channel we have permission to speak in
      const channel = guild.channels.cache.find((chan) => chan.type === 'text' && chan.name === 'general');
      const welcomeText = [
        'Thank you for inviting the battle bot! For more information, please refer to `.help`.\n',
      ];

      if (guild.roles.cache.find((role) => role.name === 'Participant') !== undefined) {
        welcomeText.push(
          'The bot has automatically created a Participant role to mention people who are battling.',
          'You may change the colour and position of the role, but please do not delete it.',
        );
      } else {
        welcomeText.push(
          'The bot does not have permission to manage roles.',
          'Please create a role called \'Participant\' so that it can mention people who are battling.',
        );
      }

      const embed = this.client.util.embed()
        .setColor('GOLD')
        .setTitle(':crossed_swords: Welcome!')
        .setDescription(welcomeText.join('\n'));

      // i was going to have the bot post in the first text channel it had permission to speak in
      // but i realise because it likely has administrator permissions this is not a good idea
      if (channel) channel.send(embed);
    }

    logger.log(
      `Joined server ${logger.chalk().cyan(guild.name)}, with ${logger.chalk().cyan(`${guild.memberCount} members`)}.`,
    );
  }
}

module.exports = GuildListener;
