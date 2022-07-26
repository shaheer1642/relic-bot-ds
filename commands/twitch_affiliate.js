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
        )
        .addSubcommand(subcommand =>
            subcommand.setName('delete')
            .setDescription('Delete affiliation on this server. Be careful, this is not revert-able')
        ),
    scope: 'global',
    status: 'active',
    command_name: '/twitch_affiliate'
};