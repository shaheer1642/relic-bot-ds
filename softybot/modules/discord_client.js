

const {Client, Collection, Intents, MessageEmbed, MessageReaction, WebhookClient} = require('discord.js');

const client = new Client({ intents: 14095, partials: ['REACTION', 'MESSAGE', 'CHANNEL', 'GUILD_MEMBER', 'USER']}) //{ intents: 14095 })

client.login(process.env.DISCORD_BOT_TOKEN).catch(err => console.log(err));

module.exports = {client};