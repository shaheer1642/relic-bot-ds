const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.login(process.env.DISCORD_BOT_TOKEN);

client.on('ready', () => {
    console.log('Bot is online!')
    console.log('Ping:', client.ws.ping)
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
    client.ws.ping()
})