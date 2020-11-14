// import { Pully, Presets } from 'pully';

const { Command } = require('discord-akairo');
const fs = require('fs');
const ytdl = require('ytdl-core');
const extractAudio = require('ffmpeg-extract-audio');
const logger = require('../../logger');

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

    if (videoid != null) {
      // message.channel.send('YtDownload is currently disabled.');

      // ytdl(sample)
      //   .pipe(fs.createWriteStream('temp/video.mp4'));

      // ok so we're just gonna download the video then convert it to mp3

      // going to try a rewrite with just readable streams and the core library

      const uniqueFileName = `${message.id + new Date().getMilliseconds()}`;
      ytdl(sample, { filter: 'audioonly', format: 'mp4' })
        .pipe(fs.createWriteStream(`temp/${uniqueFileName}.mp4`))
        .on('finish', () => {
          // convert the mp4 to mp3

          extractAudio({
            input: `temp/${uniqueFileName}.mp4`,
            output: `temp/${uniqueFileName}.mp3`,
          }).then(() => {
            message.channel.send('', { files: [{ attachment: `temp/${uniqueFileName}.mp3` }] }).then(() => {
              // delete the file

              if (fs.existsSync(`temp/${uniqueFileName}.mp4`)) {
                fs.unlink(`temp/${uniqueFileName}.mp4`, (errr) => {
                  if (errr) {
                    throw errr;
                  }
                });
              }

              if (fs.existsSync(`temp/${uniqueFileName}.mp3`)) {
                fs.unlink(`temp/${uniqueFileName}.mp3`, (errr) => {
                  if (errr) {
                    throw errr;
                  }
                });
              }
            }).catch((errorr) => {
              logger.error(errorr);
              throw errorr;
            });
          });
        });
    }
  }
}

module.exports = YtDownloadCommand;
