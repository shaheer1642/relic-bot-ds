const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('track')
		.setDescription('Track useful resources')
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
        .addSubcommand(subcommand =>
            subcommand.setName('teshin')
            .setDescription('Track teshin rotation')
            .addStringOption(option =>
                option.setName('item')
                    .setDescription('Select syndicate type')
                    .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('cetus')
            .setDescription('Track cetus day/night cycle')
            .addStringOption(option =>
                option.setName('condition')
                    .setDescription('Select time of the day')
                    .setRequired(true)
                    .addChoice('Day', 'day')
                    .addChoice('Night', 'night')
                    .addChoice('Remove tracker', 'remove'))
        ),
    scope: 'global',
    status: 'active'
};