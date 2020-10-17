const { Command } = require('discord-akairo');
const Battle = require('../../models/battle');

class SubmitCommand extends Command {
  constructor() {
    super('submit', {
      aliases: ['submit'],
      category: 'battles',
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
        icon: ':love_letter:',
        content: 'Submits a link to the battle, soundcloud link preferred.',

        usage: '.submit [link]',
      },
    });
  }

  async exec(message, { link }) {
    // check if there's a battle running in the current server that the user is a participant in
    await Battle.findOne({ serverID: message.guild.id, status: 'BATTLING' }).then((serverBattle) => {
      if (serverBattle === null) {
        return message.channel.send('No battle active to submit to');
      }

      const { submissions } = serverBattle;
      submissions[message.author.id] = link;

      Battle.updateOne({ serverID: message.guild.id, status: 'BATTLING' }, { $set: { submissions } }, () => {
        // this is a great callback
        return message.channel.send(`Submission Recieved <@${message.author.id}>!`);
      });
    });

    // append the submission of that user to the submissions list
  }
}

module.exports = SubmitCommand;
