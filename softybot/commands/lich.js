const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lich')
		.setDescription('Post a new lich order')
		.addStringOption(option =>
			option.setName('damage_type')
				.setDescription('Select damage type')
				.setRequired(true)
				.addChoice('impact', 'dt_impact')
				.addChoice('heat', 'dt_heat')
				.addChoice('cold', 'dt_cold')
				.addChoice('electricity', 'dt_electricity')
				.addChoice('toxin', 'dt_toxin')
				.addChoice('magnetic', 'dt_magnetic')
				.addChoice('radiation', 'dt_radiation'))
};