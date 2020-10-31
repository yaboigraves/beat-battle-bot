const YoutubeMp3Downloader = require('youtube-mp3-downloader');

const Downloader = function () {
  const self = this;

  // Configure YoutubeMp3Downloader with your settings
  self.YD = new YoutubeMp3Downloader({
    ffmpegPath: process.env.FFPATH || '/usr/local/bin/ffmpeg', // FFmpeg binary location
    outputPath: 'src/tempFiles', // Output file location (default: the home directory)
    youtubeVideoQuality: 'highestaudio', // Desired video quality (default: highestaudio)
    queueParallelism: 2, // Download parallelism (default: 1)
    progressTimeout: 2000, // Interval in ms for the progress reports (default: 1000)
    allowWebm: false, // Enable download from WebM sources (default: false)
  });

  self.callbacks = {};

  self.YD.on('finished', (error, data) => {
    if (self.callbacks[data.videoId]) {
      self.callbacks[data.videoId](error, data);
    } else {
      console.log('Error: No callback for videoId!');
    }
  });

  self.YD.on('error', (error, data) => {
    console.log(error);

    if (data) {
      console.error(`${error} on videoId ${data.videoId}`);

      if (self.callbacks[data.videoId]) {
        self.callbacks[data.videoId](error, data);
      } else {
        console.log('Error: No callback for videoId!');
      }
    }
  });
};

Downloader.prototype.getMP3 = function (track, callback) {
  const self = this;

  // Register callback
  self.callbacks[track.videoId] = callback;
  // Trigger download
  self.YD.download(track.videoId, track.name);
};

module.exports = Downloader;
