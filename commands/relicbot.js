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
	scope: 'global',
	status: 'active',
	command_name: '/relic_bot'
};