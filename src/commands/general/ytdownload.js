const { Command } = require('discord-akairo');
const fs = require('fs');
const Downloader = require('../../ytdownloader');

const dl = new Downloader();

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

    // TODO: reimpliment this command
    // const videoid = sample.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);

    // if (videoid != null) {
    //   dl.getMP3({ videoId: videoid[1] }, (err, res) => {
    //     if (err) {
    //       throw err;
    //     } else {
    //       message.channel.send('', { files: [res.file] }).then(() => {
    //         fs.unlink(res.file, (errr) => {
    //           if (errr) {
    //             throw (errr);
    //           }
    //         });
    //       });
    //     }
    //   });
    // } else {
    //   return message.channel.send('Invalid sample link, must be youtube link.');
    // }
  }
}

module.exports = YtDownloadCommand;
