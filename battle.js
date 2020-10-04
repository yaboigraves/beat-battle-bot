// const Discord = require("discord.js");

class Battle {
  //so when we make a battle the most important shit is we need the server id for now
  //one battle per server, just going to have to be that way otherwise this thing will fuckin overload for sure
  //later once we get a db setup and if ppl are still askin for it replace this based off of some kind of server
  //identifier object comprised of channel and server id or something autoincrementing
  constructor(serverID, battleTime, message) {
    //this is the message that the battle was started with, we can use this for a bunch of stuff like channels server id etc
    this.message = message;
    this.serverID = serverID;
    this.battleTime = battleTime;
    this.playerIDs = [];
    this.playerTagList = [];

    this.submissions = [];
    this.voting = false;

    //index used for scrolling through submissions
    this.voteIndex = 0;
  }

  addPlayer(id) {
    //dont add duplicate id's lol
    if (this.playerIDs.includes(id)) {
      return;
    }
    this.playerIDs.push(id);
  }

  addSubmission(playerId, link, msg) {
    let submission = new Submission(playerId, link, msg);
    this.submissions.push(submission);
  }

  callPlayerList() {
    let playerList = [...this.playerIDs];

    playerList.forEach((player, i) => {
      let tag = "<@" + player + ">";
      this.playerTagList.push(tag);
    });

    let tagList = this.playerTagList.join(", ");

    this.message.channel.send(
      `The beatbattle has started! ${this.playerTagList.join(", ")}`
    );
  }

  timer() {
    let warningTime = this.battleTime - 3000000;

    let warning = setTimeout(() => {
      this.message.channel.send(
        `Beatbattle ends in 5 minutes! ${this.playerTagList.join(", ")}`
      );
    }, warningTime);

    let timer = setTimeout(() => {
      this.message.channel.send(`Time's up! ${this.playerTagList.join(", ")}`);
      console.log(this.battleTime);
    }, this.battleTime);
  }

  showSubmissions() {
    for (let i = 0; i < this.submissions.length; i++) {
      //check and see if they submitted something
      this.message.channel.send(this.submissions[i].link).then((msg) => {
        this.submissions[i].msg = msg;
        msg.react("1️⃣");
        msg.react("2️⃣");
        msg.react("3️⃣");
        msg.react("4️⃣");
        msg.react("5️⃣");
      });
    }
  }

  voteForSubmission(msg, score) {
    //look in submissions and find the submission with the corresponding msg, give it the score
    for (let i = 0; i < this.submissions.length; i++) {
      if (this.submissions[i].msg.id == msg.id) {
        console.log("score logged");
        this.submissions[i].score += score;
        return;
      }
    }
  }

  showResults() {
    let winnerScore = 0;
    let winnerName = "";

    for (let i = 0; i < this.submissions.length; i++) {
      this.message.channel.send(
        `${this.submissions[i].playerID} : ${this.submissions[i].score} `
      );

      if (this.submissions[i].score > winnerScore) {
        winnerName = this.submissions[i].playerId;
        winnerScore = this.submissions[i].score;
      }
    }

    this.message.channel.send(
      `The winner is ${winnerName} with a score of ${winnerScore}`
    );
  }
}

class Submission {
  constructor(playerID, link) {
    this.playerID = playerID;
    this.link = link;
    //since the bot will always respond with 1,2,3,4,5 start score at -15 to offset this
    //probably dumb, better to just ignore scores if it comes from the id of the bot
    this.score = -15;
    //message is used to track reactions
    this.msg = null;
  }
}

module.exports = Battle;
