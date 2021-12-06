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
        )
};