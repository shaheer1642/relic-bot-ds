const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('giveaways')
		.setDescription('Giveaways')
		.addSubcommand(subcommand =>
			subcommand.setName('create')
			.setDescription('Host a new giveaway')
			.addStringOption(option => 
				option.setName('item')
					.setDescription('Item(s) name')
					.setRequired(true))
			.addNumberOption(option => 
				option.setName('rp_cost')
					.setDescription('RP required to join giveaway i.e. 10')
					.setRequired(true))
			.addStringOption(option => 
				option.setName('expiry')
					.setDescription('Time till giveaway ends. Type 1d for one day, 2h for two hours, 10m for ten minutes')
					.setRequired(true))
			.addNumberOption(option => 
				option.setName('winner_count')
					.setDescription('Winner(s) count i.e. 1')
					.setRequired(false))
		)
		.addSubcommand(subcommand =>
			subcommand.setName('reroll')
			.setDescription('Reroll previous giveaway')
			.addStringOption(option => 
				option.setName('giveaway')
					.setDescription('Select giveaway')
					.setRequired(true))
		),
	scope: 'private',
	guildIds: [
		"865904902941048862",
	],
	status: 'active',
	command_name: '/giveaways'
};