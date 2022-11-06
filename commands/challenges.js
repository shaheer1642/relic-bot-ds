const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('challenges')
		.setDescription('Add new weekly challenges')
		.addSubcommand(subcommand =>
			subcommand.setName('add')
				.setDescription('Add new weekly challenges')
				.addStringOption(option =>
					option.setName('name')
						.setDescription('Challenge name')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('description')
						.setDescription('Challenge description')
						.setRequired(true))
				.addNumberOption(option =>
					option.setName('count')
						.setDescription('Number of times user has to perform the challenge')
						.setRequired(true))
				.addNumberOption(option =>
					option.setName('rp')
						.setDescription('Total points rewarded on completion')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand.setName('view')
				.setDescription('List of all challenges')),
	scope: 'private',
	status: 'active',
	guildIds: [
		"776804537095684108",
		"832677897411493949"
	],
	command_name: '/challenges'
};