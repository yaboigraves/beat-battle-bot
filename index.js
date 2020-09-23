const Discord = require("discord.js");
const client = new Discord.Client();

client.once("ready", () => {
  console.log("Ready!");
});

client.on("message", (message) => {
  if (message.content == "!bb") {
    message.channel.send("LETS GET REAADYYY TOO RUMBLEEEEEEE!");
  }
});

client.login("NzU4MTQ3ODc4NjQzOTU3Nzgw.X2quOw.NYCzjEySj2hmaNI1RxW9yq05Ajo");
