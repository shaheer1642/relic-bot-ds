const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deals')
		.setDescription('Add new weekly deals')
		.addSubcommand(subcommand =>
			subcommand.setName('add')
				.setDescription('Add new item deal')
				.addStringOption(option =>
					option.setName('item')
						.setDescription('Item name')
						.setRequired(true))
				.addNumberOption(option =>
					option.setName('cost')
						.setDescription('RP cost')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand.setName('view')
				.setDescription('List of all deals')),
	scope: 'private',
	status: 'active',
	guildIds: [
		"776804537095684108",
		"832677897411493949"
	],
	command_name: '/deals'
};