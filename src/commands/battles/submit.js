const { Command } = require('discord-akairo');
const Battle = require('../../models/battle');

class SubmitCommand extends Command {
  constructor() {
    super('submit', {
      aliases: ['submit'],
      category: 'battle',
      channel: 'guild',
      args: [
        {
          id: 'link',
          type: 'string',
          default: 'https://www.youtube.com/watch?v=E_Wih7Bgmxo',
          match: 'content',
        },
      ],
      description: {
        icon: ':small_blue_diamond:',
        content: 'Submit your beat.',

        usage: '.submit [link]',
      },
    });
  }

  async exec(message, { link }) {
    // check if there's a battle running in the current server that the user is a participant in
    await Battle.findOne({ serverID: message.guild.id, status: 'BATTLING' }).then((serverBattle) => {
      const { submissions } = serverBattle;
      submissions[message.author.id] = link;

      Battle.updateOne({ serverID: message.guild.id, status: 'BATTLING' }, { $set: { submissions } });
    });

    // append the submission of that user to the submissions list

    return message.channel.send('Submission Recieved!');
  }
}

module.exports = SubmitCommand;
