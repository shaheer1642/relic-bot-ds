const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lich')
		.setDescription('Post a new lich order')
		.addStringOption(option =>
			option.setName('damage_type')
				.setDescription('Select damage type')
				.setRequired(true)
				.addChoice('Impact', 'impact')
				.addChoice('Heat', 'heat')
				.addChoice('Cold', 'cold')
				.addChoice('Electricity', 'electricity')
				.addChoice('Toxin', 'toxin')
				.addChoice('Magnetic', 'magnetic')
				.addChoice('Radiation', 'radiation'))
};