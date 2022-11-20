const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('relic_bot')
		.setDescription('Query useful data from the database')
		.addSubcommand(subcommand =>
			subcommand.setName('add_server')
			.setDescription('Affiliate with this server')
		)
		.addSubcommand(subcommand =>
			subcommand.setName('remove_server')
			.setDescription('Unaffiliate this server')
		),
	scope: 'private',
	status: 'active',
	guildIds: [
		"832677897411493949",
		"865904902941048862",
		"730808307010240572"
	],
	command_name: '/relic_bot'
};