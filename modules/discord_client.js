

const {Client, Options} = require('discord.js');

const client = new Client({ 
    intents: 14095, 
    partials: ['REACTION', 'MESSAGE', 'CHANNEL', 'GUILD_MEMBER', 'USER'], 
    sweepers: {
        ...Options.defaultSweeperSettings,
		messages: {
			interval: 3600, // Every hour...
			lifetime: 1800,	// Remove messages older than 30 minutes.
		},
		// users: {
		// 	interval: 3600, // Every hour...
		// 	filter: user => user?.bot && user?.id !== client.user.id, // Remove all bots.
		// },
    }
})

client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.log(err);
    process.exit()
});

const tickcount = new Date().getTime();

module.exports = {client,tickcount};