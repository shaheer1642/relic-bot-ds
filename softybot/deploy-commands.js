const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId} = require('./config.json');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

rest.put(Routes.applicationGuildCommands(clientId, guildId[0]), { body: commands })
	.then(() => console.log('Successfully registered application commands for guild: ' + guildId[0]))
	.catch(console.error);

rest.put(Routes.applicationGuildCommands(clientId, guildId[1]), { body: commands })
    .then(() => console.log('Successfully registered application commands for guild: ' + guildId[1]))
    .catch(console.error);