const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const {client} = require('./modules/discord_client.js');
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

async function bot_initialize() {
	try {
		console.log('Registering application commands...')
		
		const commands = [];
		const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
		
		const all_guild_ids = await client.guilds.fetch().then(guilds => {return guilds.map(guild => guild.id)}).catch(err => console.log(err))
		console.log(all_guild_ids)
	
		for (const file of commandFiles) {
			const command = require(`./commands/${file}`);
			if (command.status == 'active') {
				if (command.scope == 'private')
					commands.push({commandBody: command.data.toJSON(), guildIds: command.guildIds, name: command.command_name});
				else if (command.scope == 'global')
					commands.push({commandBody: command.data.toJSON(), guildIds: all_guild_ids, name: command.command_name});
			}
		}
		// modify commands if needed
		for (var [index,command] of commands.entries()) {
			if (command.commandBody.name == 'lich') {
				commands[index].commandBody.options[0].options[0].autocomplete = true
				commands[index].commandBody.options[1].options[0].autocomplete = true
			}
			if (command.commandBody.name == 'track') {
				if (command.commandBody.options[0].name == 'bounties')
					commands[index].commandBody.options[0].options[1].autocomplete = true
				if (command.commandBody.options[1].name == 'teshin')
					commands[index].commandBody.options[1].options[0].autocomplete = true
			}
		}
		console.log(JSON.stringify(commands))
	
		all_guild_ids.forEach(guildId => {
			var all_commands = []
			commands.forEach(command => {
				if (command.guildIds.includes(guildId)) all_commands.push(command.commandBody)
			})
			
			rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: all_commands })
				.then(() => console.log(`Successfully registered application commands ${all_commands.map(command => name).toString()} for guild ${guildId}`))
				.catch(console.error);
		})

	} catch(e) {
		console.log(e)
	}
}

module.exports = {
	bot_initialize
}