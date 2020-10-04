//NOTE: APP.JS IS THE INITIAL PROTOTYPE CODE, CHUCK THIS IN FUTURE ITERATIONS
//ACTUAL CODE IS IN INDEX.JS


const Discord = require("discord.js");
const client = new Discord.Client();
const token = require("./token.js");

//List of battles

let battles = {};

//Storing botMsg and list of players who reacted
class Battle {
  constructor(message, battleTime) {
    this.message = message;
    this.players = [];
    this.battleTime = battleTime;

    //boolean state variables (maybe do this with a string instead)
    this.votingPhase = false;

    //submissions is a dictionary of playerID's to strings
    this.submissions = {};
  }

  addPlayer(id) {
    this.players.push(id);
  }

  if(callPlayers = true) {
    this.callPlayerList();
  }

  //make list of discord tags then send message
  callPlayerList() {
    let playerTagList = [];
    let playerList = [...this.players];

    playerList.forEach((player, i) => {
      let tag = "<@" + player + ">";
      playerTagList.push(tag);
    });

    let tagList = playerTagList.join(", ");

    this.message.channel.send(
      `The beatbattle has started! ${playerTagList.join(", ")}`
    );
  }

  timer() {
    let warningTime = this.battleTime - 3000000;

    let warning = setTimeout(() => {
      this.message.channel.send(
        `Beatbattle ends in 5 minutes! ${this.callPlayerList()}`
      );
    }, warningTime);

    let timer = setTimeout(() => {
      this.message.channel.send(`Time's up! ${this.callPlayerList()}`);
      console.log(this.battleTime);
    }, this.battleTime);
  }

  startVotePhase() {}
}

//Listen for !bb and reply with prompt
client.on("message", (msg) => {
  if (msg.content.startsWith("!bb")) {
    let battleMinutes = msg.content.replace(/\D/g, "");
    let battleTime = parseInt(battleMinutes, 10) * 60 * 1000;
    let promptText =
      "React to this message with :white_check_mark: to join the beatbattle!";

    if (isNaN(parseInt(battleMinutes, 10)) == true) {
      msg.reply("You need to provide a time for the beatbattle in minutes");
    } else if (parseInt(battleMinutes, 10) > 120) {
      msg.reply("Nice try, the maximum time for the timer is 2 hours");
    } else {
      msg.reply(promptText).then((botMsg) => {
        battles[botMsg.channel.id] = new Battle(botMsg, battleTime);
      });
    }
  }
});

//Listen for reaction and send player list to class
client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.portal) {
    //Wait for stable notification
    try {
      await reaction.fetch();
    } catch (error) {
      console.log("Something want wrong when fetching the message: ", error);
      return;
    }
  }

  let battle = battles[reaction.message.channel.id];
  if (reaction.emoji.name == "✅") {
    battle.addPlayer(user.id);
    //   console.log("hey");
  }
});

//notify players that the beatbattle has started
client.on("message", (msg) => {
  if (msg.content.startsWith("!start")) {
    //look at the battles id and find that battle in the battles dictionary
    battles[msg.channel.id].callPlayerList();
    battles[msg.channel.id].timer();
  }
});

//take submissions after a battle has entered its voting phase
client.on("message", (msg) => {
  if (msg.content.startsWith("!submit")) {
    //parse out the link
    let submissionLink = msg.content.substring(8, msg.content.length);
    console.log("submission recieved " + submissionLink);

    //so now we need to find the battle in our list of battles that matches
  }
});
client.login(token);
