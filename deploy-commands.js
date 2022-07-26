const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const {client} = require('./modules/discord_client.js');
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

async function bot_initialize() {
	console.log('Registering application commands...')
	
	const commands = [];
	const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
	
	const all_guild_ids = await client.guilds.fetch().then(guilds => {return guilds.map(guild => guild.id)}).catch(err => console.log(err))
	console.log(all_guild_ids)

	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		if (command.status == 'active') {
			if (command.scope == 'private')
				commands.push({commandBody: command.data.toJSON(), guildIds: JSON.parse(command.guildIds), name: command.command_name});
			else if (command.scope == 'global')
				commands.push({commandBody: command.data.toJSON(), guildIds: all_guild_ids, name: command.command_name});
		}
	}
	// modify commands if needed
	for (var command of commands) {
		if (command.commandBody.name	== 'lich') {
			command.commandBody.options[0].options[0].autocomplete = true
			command.commandBody.options[1].options[0].autocomplete = true
		}
		if (command.commandBody.name == 'track') {
			if (command.commandBody.options[0].name == 'bounties')
				command.commandBody.options[0].options[1].autocomplete = true
			if (command.commandBody.options[1].name == 'teshin')
				command.commandBody.options[1].options[0].autocomplete = true
		}
	}

	commands.forEach(command => {
		rest.put(Routes.applicationGuildCommands(client.user.id, command.guildIds), { body: command.commandBody })
			.then(() => console.log(`Successfully registered application command ${command.name} for guilds ${JSON.stringify(command.guildIds)}`))
			.catch(console.error);
	})
}

module.exports = {
	bot_initialize
}