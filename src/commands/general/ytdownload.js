const { Command } = require('discord-akairo');
const fs = require('fs');
const Downloader = require('../../ytdownloader');
const logger = require('../../logger');

const dl = new Downloader();

const ytdl = require('ytdl-core');
const { measureMemory } = require('vm');

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
  }

  async exec(message, { sample }) {
    const videoid = sample.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    logger.success('checkpoint 1');
    // dumby comment again
    if (videoid != null) {
      // going to try a rewrite with just readable streams and the core library
      logger.success(videoid[0]);

      // stream.pipe(fs.createWriteStream('temp/x.mp3'));

      // message.channel.send('', { files: [{ attachment: 'src/commands/general/x.mp3' }] });

      ytdl(sample, { filter: 'audioonly', format: 'mp3' })
        .pipe(fs.createWriteStream('temp/audio.mp3'))
        .on('finish', () => {
          logger.success('trying to send the file now');
          message.channel.send('', { files: [{ attachment: 'temp/audio.mp3' }] }).then(() => {
            // delete the file
            if (fs.existsSync('temp/audio.mp3')) {
              fs.unlink('temp/audio.mp3', (errr) => {
                if (errr) {
                  throw errr;
                }
              });
            }
          });
        });

    //   dl.getMP3({ videoId: videoid[1], serverId: message.guild.id }, (err, res) => {
    //     if (err) {
    //       logger.success('checkpoint error ');
    //       throw err;
    //     } else {
    //       logger.success('made it to the send part');
    //       logger.success(res);
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
}

module.exports = YtDownloadCommand;
