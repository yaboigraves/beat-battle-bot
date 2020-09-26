const Discord = require("discord.js");
const client = new Discord.Client();
const token = require("./token.js");

var callPlayers = false;

//List of battles
var battles = {};

//Storing botMsg and list of players who reacted
class Battle {
  constructor(message) {
    this.message = message;
    this.players = [];
  }

  addPlayer(id) {
    this.players.push(id);
  }

  if(callPlayers = true) {
    this.callPlayerList();
  }

  //make list of discord tags then send message
  callPlayerList() {
    var playerTagList = [];
    var playerList = [...this.players];

    playerList.forEach((player, i) => {
      var tag = "<@" + player + ">";
      playerTagList.push(tag);
    });

    this.message.channel.send(
      `The beatbattle has started! ${playerTagList.join(", ")}`
    );
  }
}

//Listen for .bb and reply with prompt
client.on("message", (msg) => {
  if (msg.content == "!bb") {
    msg.channel.send("LETS GET REAADYYY TOO RUMBLEEEEEEE!");
    var promptText =
      "React to this message with :white_check_mark: to join the beatbattle!";

    msg.reply(promptText).then((botMsg) => {
      battles[botMsg.channel.id] = new Battle(botMsg);
    });
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

  var battle = battles[reaction.message.channel.id];
  if (reaction.emoji.name == "✅") {
    battle.addPlayer(user.id);
    console.log("hey");
  }
});

//notify players that the beatbattle has started
client.on("message", (msg) => {
  if (msg.content.startsWith("!start")) {
    // Battle.callPlayerList;
    //look at the battles id and find that battle in the battles dictionary
    battles[msg.channel.id].callPlayerList();
  }
});

client.login(token);
