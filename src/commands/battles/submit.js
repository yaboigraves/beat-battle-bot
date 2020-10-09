const { Command } = require('discord-akairo');

class SubmitCommand extends Command {
  constructor() {
    super('submit', {
      aliases: ['submit'],
      category: 'battle',
      description: {
        icon: ':small_blue_diamond:',
        content: 'Submit your beat.',
        args: [
          {
            // time in minutes for the battle to last
            // 10 minutes to 4 hours
            // todo: inhibitor for incorrect argument
            id: 'link',
            type: 'string',
            // i got the socc on me
            default: 'https://www.youtube.com/watch?v=E_Wih7Bgmxo',
            match: 'content',

          },
        ],
        usage: '.submit [link]',
      },
    });
  }

  async exec(message, { link }) {
    // check if there's a battle running in the current server that the user is a participant in
    console.log(link);
    // append the submission of that user to the submissions list
    message.channel.send('Submission Recieved!');
    console.log(`got submission ${link}`);
  }
}

module.exports = SubmitCommand;
