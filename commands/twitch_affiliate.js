const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('twitch_affiliate')
		.setDescription('Add or remove an affiliated Twitch streamer')
        .addSubcommand(subcommand =>
            subcommand.setName('add_streamer')
            .setDescription('Add streamer to affiliation')
            .addStringOption(option =>
                option.setName('username')
                    .setDescription('Streamer\'s username')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('country')
                    .setDescription('Choose country')
                    .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove_streamer')
            .setDescription('Remove streamer from affiliation')
            .addStringOption(option =>
                option.setName('username')
                    .setDescription('Streamer\'s username')
                    .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('add_server')
            .setDescription('Affiliate with this server')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove_server')
            .setDescription('Unaffiliate this server')
        ),
    scope: 'global',
    status: 'active',
    command_name: '/twitch_affiliate'
};