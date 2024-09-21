const { Client, GatewayIntentBits, time, Partials } = require('discord.js');

const client = new Client({
    partials: [Partials.Reaction, Partials.Message],
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions]
});

client.login(process.env.DISCORD_BOT_TOKEN);

module.exports = {
    client
}