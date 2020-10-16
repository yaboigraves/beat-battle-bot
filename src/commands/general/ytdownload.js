const { Command } = require('discord-akairo');

const YoutubeMp3Downloader = require('youtube-mp3-downloader');
const fs = require('fs');

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
    if (videoid != null) {
      this.youtubeDownloader = new YoutubeMp3Downloader({
        // TODO: move this to env
        ffmpegPath: 'C:/Program Files/ffmpeg/bin/ffmpeg.exe', // FFmpeg binary location
        outputPath: './src/tempFiles', // Output file location (default: the home directory)
        youtubeVideoQuality: 'highestaudio', // Desired video quality (default: highestaudio)
        queueParallelism: 2, // Download parallelism (default: 1)
        progressTimeout: 2000, // Interval in ms for the progress reports (default: 1000)
        allowWebm: false, // Enable download from WebM sources (default: false)
      });
      this.youtubeDownloader.download(videoid[1]);

      this.youtubeDownloader.on('finished', (err, data) => {
        // console.log(data.file);

        // post the file in the server
        message.channel.send('', { files: [data.file] }).then(() => {
          // delete the file from the temp server
          fs.unlink(data.file, (errr) => {
            if (errr) {
              console.error(errr);
            }
          });
        });
      });
    } else {
      return message.channel.send('Invalid sample link, must be youtube link.');
    }

    this.youtubeDownloader.on('error', (error) => {
      console.log(error);
    });
  }
}

module.exports = YtDownloadCommand;
