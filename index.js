const Discord = require("discord.js");
const client = new Discord.Client();
const token = require("./token.js");
const Battle = require("./battle.js");

//so this should be handled by a battle dispatcher later
let battles = {};

function checkIfBattleInServer(guildID) {
  if (battles[guildID] == null) {
    return false;
  } else {
    return true;
  }
}

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
        // battles[botMsg.channel.id] = new Battle(botMsg, battleTime);
        battles[botMsg.guild.id] = new Battle(
          botMsg.guild.id,
          battleTime,
          botMsg
        );
      });
    }
  }
});

//notify players that the beatbattle has started
client.on("message", (msg) => {
  //check if theres a battle in the current server
  if (!checkIfBattleInServer(msg.guild.id)) {
    return;
  }

  //START BATTLE
  if (msg.content.startsWith("!start")) {
    //look at the battles id and find that battle in the battles dictionary
    battles[msg.guild.id].callPlayerList();
    battles[msg.guild.id].timer();
  }

  //SUBMISSION
  if (msg.content.startsWith("!submit")) {
    //parse out the link
    let submissionLink = msg.content.substring(8, msg.content.length);
    //console.log("submission recieved " + submissionLink);

    //so now we need to find the battle in our list of battles that matches
    //add a submission for that authors id (ay this stops duplicates too nice)
    //battles[msg.guild.id].submissions[msg.author.id] = submissionLink;
    battles[msg.guild.id].addSubmission(msg.author.id, submissionLink);
  }

  //VOTING PHASE
  if (msg.content.startsWith("!vote")) {
    //so this starts the voting phase
    //in the voting phase, each submission from the submissions list is sent into the chat
    //set the battle into voting phase (no more submission)

    battles[msg.guild.id].voting = true;
    //tell the battle to show the submissions
    //(for now we just drop all of them into chat)
    battles[msg.guild.id].showSubmissions();
  }

  //RESULTS

  if (msg.content.startsWith("!results")) {
    battles[msg.guild.id].showResults();
  }
});

//Listen for reaction and send player list to class
//TODO: this needs to verify there is actually an active battle running, dunno how to disable this until then rn tho
client.on("messageReactionAdd", async (reaction, user) => {
  //check if there is a battle running in the server
  if (battles[reaction.message.guild.id] == null) {
    return;
  }

  if (reaction.portal) {
    //Wait for stable notification
    try {
      await reaction.fetch();
    } catch (error) {
      console.log("Something want wrong when fetching the message: ", error);
      return;
    }
  }

  let battle = battles[reaction.message.guild.id];
  //check if we're in the voting phase or juststarting up

  if (battle.voting) {
    //if we're voting check and see what the reaction is (one of the 5 numbers )
    let score = 0;
    if (reaction.emoji.name == "1️⃣") {
      score = 1;
    } else if (reaction.emoji.name == "2️⃣") {
      score = 2;
    } else if (reaction.emoji.name == "3️⃣") {
      score = 3;
    } else if (reaction.emoji.name == "4️⃣") {
      score = 4;
    } else if (reaction.emoji.name == "5️⃣") {
      score = 5;
    }

    battle.voteForSubmission(reaction.message, score);
  } else {
    if (reaction.emoji.name == "✅") {
      battle.addPlayer(user.id);
    }
  }
});

client.login(token);
