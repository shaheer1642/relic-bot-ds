const { Client, GatewayIntentBits, time } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,GatewayIntentBits.GuildMessageReactions]
});

client.login(process.env.DISCORD_BOT_TOKEN);

module.exports = {
    client
}