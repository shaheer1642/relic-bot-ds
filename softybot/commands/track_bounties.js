const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('track')
		.setDescription('Track bounties')
        .addSubcommand(subcommand =>
            subcommand.setName('bounties')
            .setDescription('Track bounties')
            .addStringOption(option =>
                option.setName('syndicate')
                    .setDescription('Select syndicate type')
                    .setRequired(true)
                    .addChoice('Entrati', 'entrati')
                    .addChoice('Ostrons', 'ostrons')
                    .addChoice('Solaris United', 'solaris_united'))
            .addStringOption(option =>
                option.setName('mission_type')
                    .setDescription('Select mission type')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('level')
                    .setDescription('Select preferred level')
                    .setRequired(false)
                    .addChoice('Lvl 1 (5-15)', '5-15')
                    .addChoice('Ostrons', '10-30')
                    .addChoice('Solaris United', '20-40')
                    .addChoice('Entrati', '30-50')
                    .addChoice('Ostrons', '40-60')
                    .addChoice('Solaris United', 'lvl6'))
        )
};