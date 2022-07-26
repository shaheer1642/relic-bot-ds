const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lich')
		.setDescription('Create new lich order')
        .addSubcommand(subcommand =>
            subcommand.setName('sell')
            .setDescription('Create lich sell order')
			.addStringOption(option =>
				option.setName('weapon')
					.setDescription('Select weapon')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('element')
					.setDescription('Select damage element')
					.setRequired(true)
					.addChoice('Impact', 'impact')
					.addChoice('Heat', 'heat')
					.addChoice('Cold', 'cold')
					.addChoice('Electricity', 'electricity')
					.addChoice('Toxin', 'toxin')
					.addChoice('Magnetic', 'magnetic')
					.addChoice('Radiation', 'radiation'))
			.addNumberOption(option => 
				option.setName('damage')
					.setDescription('Input damage %')
					.setRequired(true))
			.addBooleanOption(option =>
				option.setName('ephemera')
					.setDescription('Includes ephmera?')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('name')
					.setDescription('Input lich name')
					.setRequired(true))
			.addIntegerOption(option =>
				option.setName('price')
					.setDescription('Input buy price')
					.setRequired(true))
		)
        .addSubcommand(subcommand =>
            subcommand.setName('buy')
            .setDescription('Create lich buy order')
			.addStringOption(option =>
				option.setName('weapon')
					.setDescription('Select weapon')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('element')
					.setDescription('Select damage element')
					.setRequired(true)
					.addChoice('Impact', 'impact')
					.addChoice('Heat', 'heat')
					.addChoice('Cold', 'cold')
					.addChoice('Electricity', 'electricity')
					.addChoice('Toxin', 'toxin')
					.addChoice('Magnetic', 'magnetic')
					.addChoice('Radiation', 'radiation'))
			.addNumberOption(option => 
				option.setName('damage')
					.setDescription('Input min damage %')
					.setRequired(true))
			.addBooleanOption(option =>
				option.setName('ephemera')
					.setDescription('Includes ephmera?')
					.setRequired(true))
			.addIntegerOption(option =>
				option.setName('price')
					.setDescription('Input buy price')
					.setRequired(true))
		),
	scope: 'private',
	status: 'active',
	guildIds: [
		"865904902941048862",
		"832677897411493949"
	],
	command_name: '/query'
};