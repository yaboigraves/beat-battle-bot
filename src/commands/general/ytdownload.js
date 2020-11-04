// import { Pully, Presets } from 'pully';

const { Command } = require('discord-akairo');
const fs = require('fs');
const Downloader = require('../../ytdownloader');
const logger = require('../../logger');

const dl = new Downloader();

const ytdl = require('ytdl-core');
const { measureMemory } = require('vm');

// const pully = new Pully();

class YtDownloadCommand extends Command {
  constructor() {
    super('ytDownload', {
      aliases: ['ytDownload'],
      category: 'general',
      description: {
        icon: ':small_blue_diamond:',
        content: 'Download and repost audio from a youtube link.',
        usage: '.ytDownload [link]',
      },
      args: [
        {
          id: 'sample',
          type: 'string',
          match: 'rest',
        },
      ],
    });

    // import { Pully, Presets } from 'pully';

    // const pully = new Pully();

    // const video = await pully.query('<some-neato-video-url>');
    // console.log(`${video.videoTitle} by ${video.channelName} has ${video.views} views!`);
  }

  async exec(message, { sample }) {
    const videoid = sample.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    logger.success('checkpoint 1');

    if (videoid != null) {
      message.channel.send('YtDownload is currently disabled.');
      // const video = await pully.query(same);
      // console.log(`${video.videoTitle} by ${video.channelName} has ${video.views} views!`);

      // trying shit with pully now

      // going to try a rewrite with just readable streams and the core library
      // logger.success(videoid[0]);

      // // stream.pipe(fs.createWriteStream('temp/x.mp3'));

      // // message.channel.send('', { files: [{ attachment: 'src/commands/general/x.mp3' }] });

      // const uniqueFileName = `${message.id + new Date().getMilliseconds()}.mp3`;
      // ytdl(sample, { filter: 'audioonly', format: 'mp3' })
      //   .pipe(fs.createWriteStream(`temp/${uniqueFileName}`))
      //   .on('finish', () => {
      //     logger.success('trying to send the file now');
      //     message.channel.send('', { files: [{ attachment: `temp/${uniqueFileName}` }] }).then(() => {
      //       // delete the file
      //       if (fs.existsSync('temp/audio.mp3')) {
      //         fs.unlink('temp/audio.mp3', (errr) => {
      //           if (errr) {
      //             throw errr;
      //           }
      //         });
      //       }
      //     }).catch((errorr) => {
      //       logger.error(errorr);
      //       throw errorr;
      //     });
      //   });
    }

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
  }
}

module.exports = YtDownloadCommand;
