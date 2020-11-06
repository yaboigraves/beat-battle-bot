const { Command } = require('discord-akairo');
const Battle = require('../../models/battle');

class StopCommand extends Command {
  constructor() {
    super('stop', {
      aliases: ['stop'],
      category: 'battles',
      description: {
        icon: ':octagonal_sign:',
        content: 'Stops any current active battles in the server.',
        usage: '.stop',
      },
    });
  }

  async exec(message) {
    await Battle.findOne({ serverID: message.guild.id, status: { $ne: 'FINISHED' } }).then((serverBattle) => {
      if (serverBattle === null) {
        return message.channel.send('No battle currently active to stop');
      }

      // TODO: tell the db listener to turn off any timeouts waiting in that server too
      // eslint-disable-next-line no-underscore-dangle

      // so to actually stop the timeouts, before we cancel the battle
      // we move the state of the battle to a "stopping" state, where the db listener can handle
      // turning off the timers and all that lovely stuff
      // Battle.deleteOne({ _id: serverBattle._id }).then(() => {

      //   // return message.channel.send('Battle cancelled');
      // });

      Battle.updateOne({ serverID: message.guild.id, active: true }, { $set: { status: 'STOPPING' } }).exec();
    });
  }
}

module.exports = StopCommand;
