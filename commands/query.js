const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('query')
		.setDescription('Query useful data from the database')
		.addSubcommand(subcommand =>
			subcommand.setName('sets')
				.setDescription('Prime sets')
				.addNumberOption(option => 
					option.setName('threshold')
						.setDescription('Minimum price')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand.setName('parts')
				.setDescription('Prime parts')
				.addNumberOption(option => 
					option.setName('threshold')
						.setDescription('Minimum price')
						.setRequired(true))),
	scope: 'global',
	status: 'active',
	command_name: '/query'
};