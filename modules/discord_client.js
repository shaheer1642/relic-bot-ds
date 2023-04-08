

const {Client, Options} = require('discord.js');

const client = new Client({ intents: 14095, partials: ['REACTION', 'MESSAGE', 'CHANNEL', 'GUILD_MEMBER', 'USER'], sweepers: Options.defaultSweeperSettings}) //{ intents: 14095 })

client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.log(err);
    process.exit()
});

const tickcount = new Date().getTime();

module.exports = {client,tickcount};