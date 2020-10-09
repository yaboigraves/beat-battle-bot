const { Command } = require('discord-akairo');
const Battle = require('../../models/battle');

class StartCommand extends Command {
  constructor() {
    super('start', {
      aliases: ['start'],
      category: 'battle',
      description: {
        icon: ':small_blue_diamond:',
        content: 'Start the battle!.',
        usage: '.start',
      },
    });
  }

  async exec(message) {
    // const sent = await message.channel.send(':gear: **Pong**!');
    // const sentTime = sent.editedTimestamp || sent.createdTimestamp;
    // const startTime = message.editedTimestamp || message.createdTimestamp;
    // sent.edit(`:gear: **Pong!** (${sentTime - startTime}*ms*)`);


    
    //check the db for a battle in this server that is in the await phase
    //TODO: fix this query, i forget what you said you'd do to make it faster, just remove the for loop part 
    //

    await Battle.findOne({ serverID: message.guild.id, status: "PREPARING" }).then((serverBattle) => {
      // for (let i = 0; i < serverBattles.length; i += 1) {
      //   if (serverBattles[i].active) {
      //     // const embed = this.client.util.embed()
      //     //   .setColor('RED')
      //     //   .setTitle(':warning: Battle in Progress')
      //     //   .setDescription('There\'s already a battle happening in this server!\nPlease wait for it to finish or use `.stop`.');

      //     // return message.channel.send(embed);
      //   }
      // }


      //check if there's a battle running in the current server
      
      if(serverBattle === undefined || serverBattle === null){
          const embed = this.client.util.embed()
          .setColor('RED')
          .setTitle(':warning: No Battle Running')
          .setDescription('There\'s not a battle happening in this server!\nPlease start a battle with `.battle <sample>`.');

          return message.channel.send(embed);
      }
      else{
        message.channel.send("Starting the battle");
      }

    });

    //tell all users with the participating role that a battle has begun

    

  }
}

module.exports = StartCommand;
