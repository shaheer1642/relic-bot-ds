const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { client } = require('./modules/discord_client.js');
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

client.on("guildCreate", guild => {
	console.log("Joined a new guild: " + guild.name);
	deployCommands([guild.id])
	//Your other stuff like adding to guildArray
})

client.on('ready', () => {
	// if (process.env.DEPLOY_COMMANDS) {
	console.log('Bot has started')
	client.guilds.fetch().then(guilds => {
		deployCommands(guilds.map(g => g.id))
	}).catch(console.error)
	// } else {
	// 	console.log('Deployment commands are disabled')
	// }
})

async function deployCommands(guild_ids) {
	try {
		console.log('Registering application commands for guilds', guild_ids)

		const commands = [];
		const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

		// const guild_ids = await client.guilds.fetch().then(guilds => { return guilds.map(guild => guild.id) }).catch(err => console.log(err))
		// console.log(guild_ids)

		if (false) {
			// delete prev registered slash commands
			Promise.all(
				guild_ids.map((guildId) => {
					return new Promise(async (resolve) => {
						const promises = [];

						await rest.get(Routes.applicationGuildCommands(client.user.id, guildId))
							.then(data => {
								for (const command of data) {
									const deleteUrl = `${Routes.applicationGuildCommands(client.user.id, guildId)}/${command.id}`;
									promises.push(rest.delete(deleteUrl).then(res => console.log('deleted command', command.id)));
								}
							}).catch(console.error)

						if (promises.length == 0) {
							console.log('no commands found for guild', guildId)
							return resolve()
						}

						Promise.all(promises).then(res => {
							console.log('finished removing commands for guild', guildId)
							return resolve()
						}).catch(console.error);
					})
				})
			).then(res => console.log('finished removing commands for all guilds')).catch(console.error);
			return
		}

		for (const file of commandFiles) {
			const command = require(`./commands/${file}`);
			if (command.status == 'active') {
				if (command.scope == 'private')
					commands.push({ commandBody: command.data.toJSON(), guildIds: command.guildIds, name: command.command_name });
				else if (command.scope == 'global')
					commands.push({ commandBody: command.data.toJSON(), guildIds: guild_ids, name: command.command_name });
			}
		}
		// modify commands if needed
		for (var [index, command] of commands.entries()) {
			if (command.commandBody.name == 'lich') {
				commands[index].commandBody.options[0].options[0].autocomplete = true
				commands[index].commandBody.options[1].options[0].autocomplete = true
			}
			if (command.commandBody.name == 'track') {
				if (command.commandBody.options[0].name == 'bounties')
					commands[index].commandBody.options[0].options[1].autocomplete = true
				// if (command.commandBody.options[1].name == 'teshin')
				// 	commands[index].commandBody.options[1].options[0].autocomplete = true
			}
			if (command.commandBody.name == 'giveaways') {
				if (command.commandBody.options[1].name == 'reroll')
					commands[index].commandBody.options[1].options[0].autocomplete = true
			}
			if (command.commandBody.name == 'twitch_affiliate') {
				if (command.commandBody.options[0].name == 'add_streamer')
					commands[index].commandBody.options[0].options[1].autocomplete = true
			}
		}
		//console.log(JSON.stringify(commands))

		Promise.all(
			guild_ids.map(guildId => {
				return new Promise((resolve, reject) => {
					var all_commands = []
					commands.forEach(command => {
						if (command.guildIds.includes(guildId)) all_commands.push(command.commandBody)
					})

					rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: all_commands })
						.then(() => {
							console.log(`Successfully registered application commands ${all_commands.map(command => command.name).toString()} for guild ${guildId}`)
							resolve()
						})
						.catch(err => {
							if (err.code == 50001) console.log(`Could not register application commands for guild ${guildId}: Missing Access`)
							else console.log(err)
							reject()
						}
						);
				})
			})
		).then(res => console.log('Finished registering commands for all guilds')).catch(console.error)

	} catch (e) {
		console.log(e)
	}
}

async function bot_initialize() {
	deployCommands()
}

module.exports = {
	bot_initialize
}