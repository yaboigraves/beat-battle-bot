### setup
```sh
$ cp .env.example .env
$ code .env
```

fill in the environment variables (mostly just token for now), then `yarn run start`

i recommend `pm2` to keep the bot up and running for changes, personally i use this

```sh
$ pm2 start src/bot.js --name bot --watch
$ pm2 logs bot
```

you can then change and update files and the bot will automatically restart and log to stdout