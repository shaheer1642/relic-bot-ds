const { Client, GatewayIntentBits, time } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.login(process.env.DISCORD_BOT_TOKEN);

var onlineDate;
client.on('ready', () => {
    console.log('Bot is online!')
    console.log('Ping:', client.ws.ping)
    onlineDate=new Date();
    console.log('Bot Online time:',onlineDate.getTime())
})

client.on('messageCreate', (message) => {
    if (message.content == '.ping') {
        message.channel.send('Pong!').then((_message) => {
            console.log('Responded with pong!', _message.id);
            message.react('☑️').catch(console.error)
        }).catch((err) => {
            console.error(err)
        })
        console.log('After sending')
    }
    if (message.content == '.uptime') {
        //compute bot uptime
        const currentDate=new Date();
        console.log('Current time:',currentDate.getTime())
        const uptime_milliseconds=currentDate.getTime()-onlineDate.getTime();
        const uptime_seconds=uptime_milliseconds/1000;
        const uptime_string_seconds=parseInt(uptime_seconds%60);
        const uptime_string_minutes=parseInt((uptime_seconds%3600)/60);
        const uptime_string_hours=parseInt((uptime_seconds%86400)/3600);
        const uptime_string_days=parseInt(uptime_seconds/86400);
        const uptime_string=uptime_string_days+' days '+uptime_string_hours+' hours '+uptime_string_minutes+' minutes '+uptime_string_seconds+' seconds ';
        console.log('Uptime:',uptime_seconds)

        message.channel.send('Current uptime: '+uptime_string+'\nPing: '+client.ws.ping.toString()).then((_message) => {
            console.log('uptime data sent', _message.id);
            message.react('☑️').catch(console.error)
        }).catch((err) => {
            console.error(err)
        })
        
        console.log('After sending')
    }
    
})