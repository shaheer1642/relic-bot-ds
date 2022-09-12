const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fissures')
		.setDescription('View currently active fissures in Warframe'),
	scope: 'global',
	status: 'active',
	command_name: '/fissures'
};