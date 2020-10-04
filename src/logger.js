/* eslint-disable no-console */
const chalk = require('chalk');

module.exports = {
  chalk() {
    return chalk;
  },

  prefix(char = '*') {
    return chalk.bold.cyan(`[${char}]`);
  },

  log(msg, pre = this.prefix('i')) {
    if (process.env.INFO.toLowerCase() === 'true') {
      console.log(`${pre} ${msg}`);
    }
  },

  success(msg, pre = this.prefix()) {
    console.log(`${pre} ${chalk.green(msg)}`);
  },

  error(msg, pre = this.prefix('!')) {
    console.log(`${pre} ${chalk.bold.red(msg)}`);
  },
};
