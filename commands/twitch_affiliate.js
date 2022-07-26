const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('twitch_affiliate')
		.setDescription('Add or remove an affiliated Twitch streamer')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
            .setDescription('Add streamer')
            .addStringOption(option =>
                option.setName('username')
                    .setDescription('Streamer\'s username')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('custom_message')
                    .setDescription('Message displayed when streamer is live'))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
            .setDescription('Remove streamer')
            .addStringOption(option =>
                option.setName('username')
                    .setDescription('Streamer\'s username')
                    .setRequired(true))
        ),
    scope: 'global',
    status: 'active',
    command_name: '/track'
};