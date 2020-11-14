module.exports = {
  apps: [{
    script: 'src/bot.js',
    watch: ['bot'],
    ignore_watch: ['src/temp'],
    watch_options: {
      followSymlinks: false,
      persistent: true,
      ignoreInitial: true,
    },
  }],

};
