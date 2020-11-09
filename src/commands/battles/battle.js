/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable brace-style */
const { Command, Argument } = require('discord-akairo');

const fs = require('fs');
// const { ObjectId } = require('mongodb');
const Battle = require('../../models/battle');

const Downloader = require('../../ytdownloader');

const dl = new Downloader();

const utility = require('../../utility/utility');
const logger = require('../../logger');

class BattleCommand extends Command {
  constructor() {
    super('battle', {
      aliases: ['battle'],
      category: 'battles',
      channel: 'guild',
      ratelimit: 1,
      cooldown: 300000,
      args: [
        {
          // time in minutes for the battle to last
          // 10 minutes to 4 hours
          // todo: inhibitor for incorrect argument
          id: 'time',
          type: Argument.range('number', 1, 360),
          default: '30',
          match: 'option',
          flag: 'length:',
        },
        {
          // time in minutes to watch for reactions
          // 5 seconds to 10 minutes
          id: 'timeout',
          type: Argument.range('number', 5, 600),
          default: '30', // temporary, in seconds
          match: 'option',
          flag: 'timeout:',
        },
        {
          id: 'sample',
          type: 'string',
          match: 'rest',
        },
      ],
      description: {
        icon: ':crossed_swords:',
        content: 'Start a beatbattle.',
        usage: '.battle [sample] length:30 (min) timeout: 30 (seconds)',
      },
    });
  }

  async exec(message, { sample, time, timeout }) {
    // message.channel.send(`${time} ${timeout}`);
    if (!sample) {
      const embed = this.client.util.embed()
        .setColor('RED')
        .setTitle(':warning: Please provide a sample')
        .setDescription('See `.help battle` for more information and usage.');

      return message.channel.send(embed);
    }

    utility.checkIfRoleExists(message);

    // TODO: reipliment
    // const videoid = sample.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    // if (videoid != null) {
    //   dl.getMP3({ videoId: videoid[1], serverId: message.guild.id }, (err, res) => {
    //     if (err) {
    //       throw err;
    //     } else {
    //       message.channel.send('', { files: [{ attachment: res.file, name: `${res.videoTitle}.mp3` }] }).then(() => {
    //         if (fs.existsSync(res.file)) {
    //           fs.unlink(res.file, (errr) => {
    //             if (errr) {
    //               throw (errr);
    //             }
    //           });
    //         }
    //       });
    //     }
    //   });
    // } else {
    //   return message.channel.send('Invalid sample link, must be youtube link.');
    // }

    // battle in progress
    Battle.find({ serverID: message.guild.id }).then((serverBattles) => {
      for (let i = 0; i < serverBattles.length; i += 1) {
        if (serverBattles[i].active !== false) {
          const embed = this.client.util.embed()
            .setColor('RED')
            .setTitle(':warning: Battle in Progress')
            .setDescription('There\'s already a battle happening in this server!\nPlease wait for it to finish or use `.stop`.');

          return message.channel.send(embed);
        }
      }

      // create the battle and append it to the DB in the preparing state
      const t = timeout;
      logger.success(time);
      const battleOpts = {
        serverID: message.guild.id,
        length: time,
        timeout: t,
        playerIDs: [],
        active: true,
        status: 'PREPARING',
        reactMessage: {
          channelID: message.channel.id,
          messageID: message.id,
        },
        sample,
      };

      const battle = new Battle(battleOpts);
      battle.save().then(() => {
        // very nice callback yes :)
      });
    });
  }
}

module.exports = BattleCommand;
