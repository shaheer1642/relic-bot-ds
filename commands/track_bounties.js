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
                    .setRequired(true)
                    .addChoice('Umbra Forma Blueprint', 'Umbra_Forma_Blueprint')
                    .addChoice('50,000 Kuva', '50,000_Kuva')
                    .addChoice('Kitgun Riven Mod', 'Kitgun_Riven_Mod')
                    .addChoice('3x Forma', '3x_Forma')
                    .addChoice('Zaw Riven Mod', 'Zaw_Riven_Mod')
                    .addChoice('30,000 Endo', '30,000_Endo')
                    .addChoice('Rifle Riven Mod United', 'Rifle_Riven_Mod_United')
                    .addChoice('Shotgun Riven Mod', 'Shotgun_Riven_Mod'))
        )
};