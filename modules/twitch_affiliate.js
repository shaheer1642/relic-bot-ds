const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');

const {ClientCredentialsAuthProvider} = require('@twurple/auth')
const {ApiClient} = require('@twurple/api');

const { WebhookClient } = require('discord.js');

const authProvider = new ClientCredentialsAuthProvider(process.env.twitch_clientId, process.env.twitch_clientSecret);
const twitchApiClient = new ApiClient({ authProvider });

const authorized_userIds = ['253525146923433984','253980061969940481']

const countries = [ 
    {name: 'Afghanistan', code: 'AF'}, 
    {name: 'Åland Islands', code: 'AX'}, 
    {name: 'Albania', code: 'AL'}, 
    {name: 'Algeria', code: 'DZ'}, 
    {name: 'American Samoa', code: 'AS'}, 
    {name: 'AndorrA', code: 'AD'}, 
    {name: 'Angola', code: 'AO'}, 
    {name: 'Anguilla', code: 'AI'}, 
    {name: 'Antarctica', code: 'AQ'}, 
    {name: 'Antigua and Barbuda', code: 'AG'}, 
    {name: 'Argentina', code: 'AR'}, 
    {name: 'Armenia', code: 'AM'}, 
    {name: 'Aruba', code: 'AW'}, 
    {name: 'Australia', code: 'AU'}, 
    {name: 'Austria', code: 'AT'}, 
    {name: 'Azerbaijan', code: 'AZ'}, 
    {name: 'Bahamas', code: 'BS'}, 
    {name: 'Bahrain', code: 'BH'}, 
    {name: 'Bangladesh', code: 'BD'}, 
    {name: 'Barbados', code: 'BB'}, 
    {name: 'Belarus', code: 'BY'}, 
    {name: 'Belgium', code: 'BE'}, 
    {name: 'Belize', code: 'BZ'}, 
    {name: 'Benin', code: 'BJ'}, 
    {name: 'Bermuda', code: 'BM'}, 
    {name: 'Bhutan', code: 'BT'}, 
    {name: 'Bolivia', code: 'BO'}, 
    {name: 'Bosnia and Herzegovina', code: 'BA'}, 
    {name: 'Botswana', code: 'BW'}, 
    {name: 'Bouvet Island', code: 'BV'}, 
    {name: 'Brazil', code: 'BR'}, 
    {name: 'British Indian Ocean Territory', code: 'IO'}, 
    {name: 'Brunei Darussalam', code: 'BN'}, 
    {name: 'Bulgaria', code: 'BG'}, 
    {name: 'Burkina Faso', code: 'BF'}, 
    {name: 'Burundi', code: 'BI'}, 
    {name: 'Cambodia', code: 'KH'}, 
    {name: 'Cameroon', code: 'CM'}, 
    {name: 'Canada', code: 'CA'}, 
    {name: 'Cape Verde', code: 'CV'}, 
    {name: 'Cayman Islands', code: 'KY'}, 
    {name: 'Central African Republic', code: 'CF'}, 
    {name: 'Chad', code: 'TD'}, 
    {name: 'Chile', code: 'CL'}, 
    {name: 'China', code: 'CN'}, 
    {name: 'Christmas Island', code: 'CX'}, 
    {name: 'Cocos (Keeling) Islands', code: 'CC'}, 
    {name: 'Colombia', code: 'CO'}, 
    {name: 'Comoros', code: 'KM'}, 
    {name: 'Congo', code: 'CG'}, 
    {name: 'Congo, The Democratic Republic of the', code: 'CD'}, 
    {name: 'Cook Islands', code: 'CK'}, 
    {name: 'Costa Rica', code: 'CR'}, 
    {name: 'Cote D\'Ivoire', code: 'CI'}, 
    {name: 'Croatia', code: 'HR'}, 
    {name: 'Cuba', code: 'CU'}, 
    {name: 'Cyprus', code: 'CY'}, 
    {name: 'Czech Republic', code: 'CZ'}, 
    {name: 'Denmark', code: 'DK'}, 
    {name: 'Djibouti', code: 'DJ'}, 
    {name: 'Dominica', code: 'DM'}, 
    {name: 'Dominican Republic', code: 'DO'}, 
    {name: 'Ecuador', code: 'EC'}, 
    {name: 'Egypt', code: 'EG'}, 
    {name: 'El Salvador', code: 'SV'}, 
    {name: 'Equatorial Guinea', code: 'GQ'}, 
    {name: 'Eritrea', code: 'ER'}, 
    {name: 'Estonia', code: 'EE'}, 
    {name: 'Ethiopia', code: 'ET'}, 
    {name: 'Falkland Islands (Malvinas)', code: 'FK'}, 
    {name: 'Faroe Islands', code: 'FO'}, 
    {name: 'Fiji', code: 'FJ'}, 
    {name: 'Finland', code: 'FI'}, 
    {name: 'France', code: 'FR'}, 
    {name: 'French Guiana', code: 'GF'}, 
    {name: 'French Polynesia', code: 'PF'}, 
    {name: 'French Southern Territories', code: 'TF'}, 
    {name: 'Gabon', code: 'GA'}, 
    {name: 'Gambia', code: 'GM'}, 
    {name: 'Georgia', code: 'GE'}, 
    {name: 'Germany', code: 'DE'}, 
    {name: 'Ghana', code: 'GH'}, 
    {name: 'Gibraltar', code: 'GI'}, 
    {name: 'Greece', code: 'GR'}, 
    {name: 'Greenland', code: 'GL'}, 
    {name: 'Grenada', code: 'GD'}, 
    {name: 'Guadeloupe', code: 'GP'}, 
    {name: 'Guam', code: 'GU'}, 
    {name: 'Guatemala', code: 'GT'}, 
    {name: 'Guernsey', code: 'GG'}, 
    {name: 'Guinea', code: 'GN'}, 
    {name: 'Guinea-Bissau', code: 'GW'}, 
    {name: 'Guyana', code: 'GY'}, 
    {name: 'Haiti', code: 'HT'}, 
    {name: 'Heard Island and Mcdonald Islands', code: 'HM'}, 
    {name: 'Holy See (Vatican City State)', code: 'VA'}, 
    {name: 'Honduras', code: 'HN'}, 
    {name: 'Hong Kong', code: 'HK'}, 
    {name: 'Hungary', code: 'HU'}, 
    {name: 'Iceland', code: 'IS'}, 
    {name: 'India', code: 'IN'}, 
    {name: 'Indonesia', code: 'ID'}, 
    {name: 'Iran, Islamic Republic Of', code: 'IR'}, 
    {name: 'Iraq', code: 'IQ'}, 
    {name: 'Ireland', code: 'IE'}, 
    {name: 'Isle of Man', code: 'IM'}, 
    {name: 'Israel', code: 'IL'}, 
    {name: 'Italy', code: 'IT'}, 
    {name: 'Jamaica', code: 'JM'}, 
    {name: 'Japan', code: 'JP'}, 
    {name: 'Jersey', code: 'JE'}, 
    {name: 'Jordan', code: 'JO'}, 
    {name: 'Kazakhstan', code: 'KZ'}, 
    {name: 'Kenya', code: 'KE'}, 
    {name: 'Kiribati', code: 'KI'}, 
    {name: 'Korea, Democratic People\'S Republic of', code: 'KP'}, 
    {name: 'Korea, Republic of', code: 'KR'}, 
    {name: 'Kuwait', code: 'KW'}, 
    {name: 'Kyrgyzstan', code: 'KG'}, 
    {name: 'Lao People\'S Democratic Republic', code: 'LA'}, 
    {name: 'Latvia', code: 'LV'}, 
    {name: 'Lebanon', code: 'LB'}, 
    {name: 'Lesotho', code: 'LS'}, 
    {name: 'Liberia', code: 'LR'}, 
    {name: 'Libyan Arab Jamahiriya', code: 'LY'}, 
    {name: 'Liechtenstein', code: 'LI'}, 
    {name: 'Lithuania', code: 'LT'}, 
    {name: 'Luxembourg', code: 'LU'}, 
    {name: 'Macao', code: 'MO'}, 
    {name: 'Macedonia, The Former Yugoslav Republic of', code: 'MK'}, 
    {name: 'Madagascar', code: 'MG'}, 
    {name: 'Malawi', code: 'MW'}, 
    {name: 'Malaysia', code: 'MY'}, 
    {name: 'Maldives', code: 'MV'}, 
    {name: 'Mali', code: 'ML'}, 
    {name: 'Malta', code: 'MT'}, 
    {name: 'Marshall Islands', code: 'MH'}, 
    {name: 'Martinique', code: 'MQ'}, 
    {name: 'Mauritania', code: 'MR'}, 
    {name: 'Mauritius', code: 'MU'}, 
    {name: 'Mayotte', code: 'YT'}, 
    {name: 'Mexico', code: 'MX'}, 
    {name: 'Micronesia, Federated States of', code: 'FM'}, 
    {name: 'Moldova, Republic of', code: 'MD'}, 
    {name: 'Monaco', code: 'MC'}, 
    {name: 'Mongolia', code: 'MN'}, 
    {name: 'Montserrat', code: 'MS'}, 
    {name: 'Morocco', code: 'MA'}, 
    {name: 'Mozambique', code: 'MZ'}, 
    {name: 'Myanmar', code: 'MM'}, 
    {name: 'Namibia', code: 'NA'}, 
    {name: 'Nauru', code: 'NR'}, 
    {name: 'Nepal', code: 'NP'}, 
    {name: 'Netherlands', code: 'NL'}, 
    {name: 'Netherlands Antilles', code: 'AN'}, 
    {name: 'New Caledonia', code: 'NC'}, 
    {name: 'New Zealand', code: 'NZ'}, 
    {name: 'Nicaragua', code: 'NI'}, 
    {name: 'Niger', code: 'NE'}, 
    {name: 'Nigeria', code: 'NG'}, 
    {name: 'Niue', code: 'NU'}, 
    {name: 'Norfolk Island', code: 'NF'}, 
    {name: 'Northern Mariana Islands', code: 'MP'}, 
    {name: 'Norway', code: 'NO'}, 
    {name: 'Oman', code: 'OM'}, 
    {name: 'Pakistan', code: 'PK'}, 
    {name: 'Palau', code: 'PW'}, 
    {name: 'Palestinian Territory, Occupied', code: 'PS'}, 
    {name: 'Panama', code: 'PA'}, 
    {name: 'Papua New Guinea', code: 'PG'}, 
    {name: 'Paraguay', code: 'PY'}, 
    {name: 'Peru', code: 'PE'}, 
    {name: 'Philippines', code: 'PH'}, 
    {name: 'Pitcairn', code: 'PN'}, 
    {name: 'Poland', code: 'PL'}, 
    {name: 'Portugal', code: 'PT'}, 
    {name: 'Puerto Rico', code: 'PR'}, 
    {name: 'Qatar', code: 'QA'}, 
    {name: 'Reunion', code: 'RE'}, 
    {name: 'Romania', code: 'RO'}, 
    {name: 'Russian Federation', code: 'RU'}, 
    {name: 'RWANDA', code: 'RW'}, 
    {name: 'Saint Helena', code: 'SH'}, 
    {name: 'Saint Kitts and Nevis', code: 'KN'}, 
    {name: 'Saint Lucia', code: 'LC'}, 
    {name: 'Saint Pierre and Miquelon', code: 'PM'}, 
    {name: 'Saint Vincent and the Grenadines', code: 'VC'}, 
    {name: 'Samoa', code: 'WS'}, 
    {name: 'San Marino', code: 'SM'}, 
    {name: 'Sao Tome and Principe', code: 'ST'}, 
    {name: 'Saudi Arabia', code: 'SA'}, 
    {name: 'Senegal', code: 'SN'}, 
    {name: 'Serbia and Montenegro', code: 'CS'}, 
    {name: 'Seychelles', code: 'SC'}, 
    {name: 'Sierra Leone', code: 'SL'}, 
    {name: 'Singapore', code: 'SG'}, 
    {name: 'Slovakia', code: 'SK'}, 
    {name: 'Slovenia', code: 'SI'}, 
    {name: 'Solomon Islands', code: 'SB'}, 
    {name: 'Somalia', code: 'SO'}, 
    {name: 'South Africa', code: 'ZA'}, 
    {name: 'South Georgia and the South Sandwich Islands', code: 'GS'}, 
    {name: 'Spain', code: 'ES'}, 
    {name: 'Sri Lanka', code: 'LK'}, 
    {name: 'Sudan', code: 'SD'}, 
    {name: 'Suriname', code: 'SR'}, 
    {name: 'Svalbard and Jan Mayen', code: 'SJ'}, 
    {name: 'Swaziland', code: 'SZ'}, 
    {name: 'Sweden', code: 'SE'}, 
    {name: 'Switzerland', code: 'CH'}, 
    {name: 'Syrian Arab Republic', code: 'SY'}, 
    {name: 'Taiwan, Province of China', code: 'TW'}, 
    {name: 'Tajikistan', code: 'TJ'}, 
    {name: 'Tanzania, United Republic of', code: 'TZ'}, 
    {name: 'Thailand', code: 'TH'}, 
    {name: 'Timor-Leste', code: 'TL'}, 
    {name: 'Togo', code: 'TG'}, 
    {name: 'Tokelau', code: 'TK'}, 
    {name: 'Tonga', code: 'TO'}, 
    {name: 'Trinidad and Tobago', code: 'TT'}, 
    {name: 'Tunisia', code: 'TN'}, 
    {name: 'Turkey', code: 'TR'}, 
    {name: 'Turkmenistan', code: 'TM'}, 
    {name: 'Turks and Caicos Islands', code: 'TC'}, 
    {name: 'Tuvalu', code: 'TV'}, 
    {name: 'Uganda', code: 'UG'}, 
    {name: 'Ukraine', code: 'UA'}, 
    {name: 'United Arab Emirates', code: 'AE'}, 
    {name: 'United Kingdom', code: 'GB'}, 
    {name: 'United States', code: 'US'}, 
    {name: 'United States Minor Outlying Islands', code: 'UM'}, 
    {name: 'Uruguay', code: 'UY'}, 
    {name: 'Uzbekistan', code: 'UZ'}, 
    {name: 'Vanuatu', code: 'VU'}, 
    {name: 'Venezuela', code: 'VE'}, 
    {name: 'Viet Nam', code: 'VN'}, 
    {name: 'Virgin Islands, British', code: 'VG'}, 
    {name: 'Virgin Islands, U.S.', code: 'VI'}, 
    {name: 'Wallis and Futuna', code: 'WF'}, 
    {name: 'Western Sahara', code: 'EH'}, 
    {name: 'Yemen', code: 'YE'}, 
    {name: 'Zambia', code: 'ZM'}, 
    {name: 'Zimbabwe', code: 'ZW'}
]

function bot_initialize() {
    updateAffiliations()
    
    setInterval(() => {
        updateAffiliations()
    }, 60000);
}

const emotes = {
    notify: {
        string: '<:follow_twitch:1001860010877399182>',
        identifier: 'follow_twitch:1001860010877399182'
    }
}

async function interaction_handler(interaction) {
    try {
        if (interaction.isCommand()) {
            if (interaction.commandName == 'twitch_affiliate') {
                if (authorized_userIds.includes(interaction.user.id)) {
                    if (interaction.options.getSubcommand() == 'add_streamer') {
                        addStreamer(usernameValidate(interaction.options.getString('username')),interaction.options.getString('country')).catch(err => {interaction.reply({content: `Sorry, some error occured.\n${JSON.stringify(err)}`});console.log(err)})
                        .then((res) => {
                            interaction.reply({content: typeof res == 'string' ? res:JSON.stringify(res),ephemeral: true}).catch(err => console.log(err))
                            updateAffiliations()
                        })
                        
                    } else if (interaction.options.getSubcommand() == 'remove_streamer') {
                        removeStreamer(usernameValidate(interaction.options.getString('username'))).catch(err => {interaction.reply({content: `Sorry, some error occured.\n${JSON.stringify(err)}`}).catch(err => console.log(err));console.log(err)})
                        .then((res) => {
                            interaction.reply({content: typeof res == 'string' ? res:JSON.stringify(res),ephemeral: true}).catch(err => console.log(err))
                            updateAffiliations()
                        })
                    } else if (interaction.options.getSubcommand() == 'add_server') {
                        await interaction.deferReply().catch(err => console.log(err))
                        addServerAffiliation(interaction.guild.id).then(res => {
                            interaction.editReply({content: res,ephemeral: true}).catch(err => console.log(err))
                        }).catch(err => {
                            interaction.editReply({content: `Sorry, some error occured\n${err}`,ephemeral: false}).catch(err => console.log(err))
                        })
                        updateAffiliations()
                    } else if (interaction.options.getSubcommand() == 'remove_server') {
                        await interaction.deferReply().catch(err => console.log(err))
                        removeServerAffiliation(interaction.guild.id).then(res => {
                            interaction.editReply({content: res,ephemeral: true}).catch(err => console.log(err))
                        }).catch(err => {
                            interaction.editReply({content: `Sorry, some error occured\n${err}`,ephemeral: false}).catch(err => console.log(err))
                        })
                        updateAffiliations()
                    }
                } else {
                    interaction.reply({content: 'Sorry, you are not authorized for this command'}).catch(err => console.log(err))
                }
            }
        }
        if (interaction.isAutocomplete()) {
            if (interaction.commandName == 'twitch_affiliate') {
                // check if authorized user
                if (authorized_userIds.includes(interaction.user.id)) {
                    if (interaction.options.getSubcommand() == 'add_streamer') {
                        console.log('autocomplete (twitch_affiliate add_streamer)')
                        const country_text = interaction.options.getString('country')
                        if (!country_text)
                            return
                        var postdata = [];
                        for (const [index,country] of countries) {
                            if (index == 25)
                                break
                            if (country.name.toLowerCase().match(country_text.toLowerCase()))
                                postdata.push({name: country.name, value: country.code})
                        }
                        interaction.respond(postdata).catch(err => console.log(err))
                        return
                    }
                }
            }
        }
    } catch(e) {
        console.log(e)
    }
}

async function reaction_handler(reaction, user, action) {
    if (action == 'add') {
        db.query(`
            UPDATE twitch_affiliate_messages
            SET notify = jsonb_set(notify, '{user_ids,999999}', '"${user.id}"', true)
            WHERE message_id = ${reaction.message.id};
        `).catch(err => console.log(err))
    } else if (action == 'remove') {
        db.query(`
            UPDATE twitch_affiliate_messages
            SET notify = jsonb_set(notify, '{user_ids}', (notify->'user_ids') - '${user.id}')
            WHERE message_id = ${reaction.message.id};
        `).catch(err => console.log(err))
    }
}

async function addStreamer(username,country_code) {
    return new Promise(async (resolve,reject) => {
        twitchApiClient.users.getUserByName(username).catch(err => reject(err))
        .then(twitchUser => {
            if (!twitchUser) {
                resolve(`The streamer **${username}** does not exist`)
                return
            }
            db.query(`SELECT * FROM twitch_affiliate_streamers where streamer_id = '${twitchUser.id}'`).catch(err => reject(err))
            .then(res => {
                if (res.rowCount == 1) resolve(`The streamer **${username}** has already been affiliated with WarframeHub`)
                else if (res.rowCount == 0) {
                    db.query(`INSERT INTO twitch_affiliate_streamers (username,streamer_id,country_code,time_added) VALUES ('${username}','${twitchUser.id}',NULLIF('${country_code}', ''),${new Date().getTime()})`).catch(err => reject(err))
                    .then(res => {
                        //send affiliation msg in sub channels
                        db.query(`SELECT * FROM twitch_affiliate_channels WHERE channel_type='affiliate_channel'`).catch(err => reject(err))
                        .then(async res => {
                            for (const [index,row] of res.rows.entries()) {
                                const webhookClient = new WebhookClient({url: row.webhook_url});
                                await webhookClient.send({
                                    content: `Streamer: ${username} (fetching details...)`
                                }).catch(err => reject(err))
                                .then(async res => {
                                    client.channels.cache.get(res.channel_id).messages.fetch(res.id).then(msg => msg.react(emotes.notify.string).catch(err => console.log(err))).catch(err => console.log(err))
                                    await db.query(`INSERT INTO twitch_affiliate_messages (streamer_id,message_id,channel_id,guild_id,message_type,time_added) VALUES ('${twitchUser.id}',${res.id},${row.channel_id},${row.guild_id},'affiliate_message',${new Date().getTime()})`).catch(err => reject(err))
                                })
                            }
                            resolve(`**${username}** has now been affiliated with WarframeHub`)
                        })
                    })
                } else {
                    reject('unexpected result querying db, contact developer with error code 502')
                }
            })
        });
    })
}
async function removeStreamer(username) {
    return new Promise(async (resolve,reject) => {
        twitchApiClient.users.getUserByName(username).catch(err => reject(err))
        .then(twitchUser => {
            if (!twitchUser) {
                resolve(`The streamer **${username}** does not exist`)
                return
            }
            db.query(`SELECT * FROM twitch_affiliate_streamers WHERE streamer_id = '${twitchUser.id}'`).catch(err => reject(err))
            .then(res => {
                if (res.rowCount == 0) resolve(`The streamer **${username}** was never affiliated with WarframeHub`)
                else if (res.rowCount == 1) {
                    db.query(`SELECT * FROM twitch_affiliate_messages 
                    JOIN twitch_affiliate_channels ON twitch_affiliate_messages.channel_id = twitch_affiliate_channels.channel_id
                    WHERE twitch_affiliate_messages.streamer_id = '${twitchUser.id}' ;
                    `).catch(err => reject(err))
                    .then(res => {
                        const messages = res.rows
                        db.query(`DELETE FROM twitch_affiliate_streamers WHERE streamer_id = '${twitchUser.id}'`).catch(err => reject(err))
                        .then(() => {
                            messages.forEach(message => {
                                const webhookClient = new WebhookClient({url: message.webhook_url});
                                webhookClient.deleteMessage(message.message_id).catch(err => console.log(err))
                                //client.channels.cache.get(message.channel_id).messages.fetch(message.message_id).then(msg => msg.delete().catch(err => console.log(err))).catch(err => console.log(err))
                            })
                            resolve(`**${username}** has been unaffiliated from WarframeHub`)
                        })
                    })
                } else {
                    reject('unexpected result querying db, contact developer with error code 503')
                }
            })
        });
    })
}

async function updateAffiliations() {
    try {
        const streamers = await db.query(`SELECT * FROM twitch_affiliate_streamers`).catch(err => console.log(err))
        .then(res => {
            return res.rows
        })
        const channels = await db.query(`SELECT * FROM twitch_affiliate_channels`).catch(err => console.log(err))
        .then(res => {
            return res.rows
        })
        const affiliate_messages = await db.query(`SELECT * FROM twitch_affiliate_messages JOIN twitch_affiliate_channels ON twitch_affiliate_messages.channel_id = twitch_affiliate_channels.channel_id`).catch(err => console.log(err))
        .then(res => {
            return res.rows
        })

        var channels_data = {}
        channels.forEach(channel => {
            channels_data[channel.channel_id] = channel
        })

        var streamers_data = {}
        for (const [index,streamer] of streamers.entries()) {
            const twitchUser = await twitchApiClient.users.getUserById(streamer.streamer_id).catch(err => console.log(err));
            if (twitchUser) {
                streamers_data[streamer.streamer_id] = {
                    id: streamer.streamer_id,
                    username: twitchUser.name,
                    displayName: twitchUser.displayName,
                    description: twitchUser.description,
                    avatarUrl: twitchUser.profilePictureUrl,
                    stream: {},
                    old_stream_status: streamer.status
                }
            }
            
            await twitchUser.getStream().catch(err => console.log(err)).then(stream => {
                if (stream) {
                    streamers_data[streamer.streamer_id].stream = {
                        status: 'live',
                        startedAt: new Date(stream.startDate).getTime(),
                        playing: stream.gameName == '' ? '\u200b':stream.gameName,
                        viewCount: stream.viewers == '' ? '\u200b':stream.viewers.toString(),
                        lang: stream.language == '' ? '\u200b':stream.language,
                        title: stream.title,
                        thumbnail: stream.thumbnailUrl.replace('-{width}x{height}','')
                    }

                    if (stream.gameName.toLowerCase() == 'warframe') {
                        if (streamer.status == 'offline') {
                            postLiveMessage(streamers_data[streamer.streamer_id])
                        }
                    }
                } else {
                    streamers_data[streamer.streamer_id].stream = {
                        status: 'offline'
                    }

                    if (streamer.status == 'live') {
                        db.query(`DELETE FROM twitch_affiliate_messages WHERE message_type = 'live_message' AND streamer_id = '${streamer.streamer_id}' RETURNING *`)
                        .then(res => {
                            for (const [index,row] of res.rows.entries()) {
                                const webhookClient = new WebhookClient({url: channels_data[row.channel_id].webhook_url});
                                webhookClient.deleteMessage(row.message_id).catch(err => console.log(err))
                            }
                        }).catch(err => console.log(err))
                    }
                }
            })
        }

        function postLiveMessage(streamer_obj) {
            channels.forEach(channel => {
                if (channel.channel_type == 'live_channel') {
                    const webhookClient = new WebhookClient({url: channel.webhook_url});
                    webhookClient.send({
                        content: ' ',
                        embeds: [{
                            author: {
                                name: streamer_obj.displayName + ' is live!',
                                url: `https://twitch.tv/${streamer_obj.username}`,
                                icon_url: streamer_obj.avatarUrl,
                            },
                            description: `[${streamer_obj.stream.title}](https://twitch.tv/${streamer_obj.username})`,
                            fields: [{
                                name: 'Stream started', value: `<t:${Math.round(streamer_obj.stream.startedAt / 1000)}:R>`, inline: true
                            }, {
                                name: 'Playing', value: streamer_obj.stream.playing, inline: true
                            },{
                                name: '\u200b', value: '\u200b', inline: true
                            },{
                                name: 'Viewers', value: streamer_obj.stream.viewCount, inline: true
                            },{
                                name: 'Language', value: streamer_obj.stream.lang, inline: true
                            },{
                                name: '\u200b', value: '\u200b', inline: true
                            },],
                            image: {url: streamer_obj.stream.thumbnail},
                            color: '#ff0000'
                        }]
                    }).catch(err => console.log(err)).then(msg => db.query(`INSERT INTO twitch_affiliate_messages (streamer_id,message_id,channel_id,guild_id,message_type,time_added) VALUES ('${streamer_obj.id}',${msg.id},${channel.channel_id},${channel.guild_id},'live_message',${new Date().getTime()})`).catch(err => console.log(err)))
                    affiliate_messages.forEach(message => {
                        if ((message.guild_id == channel.guild_id) && (message.streamer_id == streamer_obj.id) && (message.message_type == 'affiliate_message')) {
                            if (message.notify.user_ids.length > 0) {
                                webhookClient.send(`**${streamers_data[message.streamer_id].displayName}** is live!\n${message.notify.user_ids.map(userId => `<@${userId}>`).join(', ')}`)
                                .then(msg => {
                                    setTimeout(() => {
                                        webhookClient.deleteMessage(msg.id).catch(err => console.log(err))
                                    }, 10000);
                                })
                                .catch(err => console.log(err))
                            }
                        }
                    })
                }
            })
        }

        var db_query = ''
        Object.keys(streamers_data).forEach(async streamer_id => {
            db_query += `UPDATE twitch_affiliate_streamers SET status='${streamers_data[streamer_id].stream.status}' WHERE streamer_id = '${streamer_id}';`
        })

        await db.query(db_query).catch(err => console.log(err))

        for (const [index,message] of affiliate_messages.entries()) {
            if (message.message_type == 'affiliate_message') {
                const webhookClient = new WebhookClient({url: message.webhook_url});
    
                webhookClient.editMessage(message.message_id, {
                    content: `React with ${emotes.notify.string} to be notified when ${streamers_data[message.streamer_id].displayName} streams Warframe`,
                    embeds: [{
                        title: streamers_data[message.streamer_id].displayName + (streamers_data[message.streamer_id].stream.status == 'live' ? ' 🔴':''),
                        url: `https://twitch.tv/${streamers_data[message.streamer_id].username}`,
                        thumbnail: {
                            url: streamers_data[message.streamer_id].avatarUrl
                        },
                        description: streamers_data[message.streamer_id].description + `\n\nUser is currently ${streamers_data[message.streamer_id].stream.status}`,
                        color: streamers_data[message.streamer_id].stream.status == 'live' ? '#ff0000':'#9511d6'
                    }]
                }).catch(err => console.log(err))
            } else if (message.message_type == 'live_message') {
                if (streamers_data[message.streamer_id].stream.status == 'live') {
                    const webhookClient = new WebhookClient({url: message.webhook_url});
                    webhookClient.editMessage(message.message_id, {
                        content: ' ',
                        embeds: [{
                            author: {
                                name: streamers_data[message.streamer_id].displayName + ' is live!',
                                url: `https://twitch.tv/${streamers_data[message.streamer_id].username}`,
                                icon_url: streamers_data[message.streamer_id].avatarUrl,
                            },
                            description: `[${streamers_data[message.streamer_id].stream.title}](https://twitch.tv/${streamers_data[message.streamer_id].username})`,
                            fields: [{
                                name: 'Stream started', value: `<t:${Math.round(streamers_data[message.streamer_id].stream.startedAt / 1000)}:R>`, inline: true
                            }, {
                                name: 'Playing', value: streamers_data[message.streamer_id].stream.playing, inline: true
                            },{
                                name: '\u200b', value: '\u200b', inline: true
                            },{
                                name: 'Viewers', value: streamers_data[message.streamer_id].stream.viewCount, inline: true
                            },{
                                name: 'Language', value: streamers_data[message.streamer_id].stream.lang, inline: true
                            },{
                                name: '\u200b', value: '\u200b', inline: true
                            },],
                            image: {url: streamers_data[message.streamer_id].stream.thumbnail},
                            color: '#ff0000'
                        }]
                    }).catch(err => console.log(err))
                }
            }
        }
    } catch(e) {
        console.log(e)
    }
}

async function removeServerAffiliation(guildId) {
    return new Promise((resolve,reject) => {
        db.query(`DELETE FROM twitch_affiliate_channels WHERE guild_id = ${guildId} RETURNING *`).catch(err => reject(err))
        .then(async res => {
            if (res.rowCount == 2) {
                for (const [index,row] of res.rows.entries()) {
                    await client.channels.fetch(row.channel_id).then(async (channel) => {
                        if (channel.parent)
                            await channel.parent.delete().catch(err => console.log(err))
                        await channel.delete().catch(err => console.log(err))
                    })
                }
                resolve('The server is has been unaffiliated from WarframeHub')
            } else if (res.rowCount == 0) {
                resolve('The server is currently not in affiliation with WarframeHub')
            } else {
                reject('Unexpected result querying db, contact developer with error code 504')
            }
        })
    })
}

async function addServerAffiliation(guildId) {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM twitch_affiliate_channels WHERE guild_id=${guildId}`).catch(err => reject(err))
        .then(res => {
            if (res.rowCount == 2) resolve('This server has already been affiliated with WarframeHub')
            else if (res.rowCount == 0) {
                client.guilds.fetch(guildId).catch(err => reject(err))
                .then(guild => {
                    guild.channels.create('Twitch Affiliates',{
                        type: 'GUILD_CATEGORY',
                    }).catch(err => reject(err)).then(category => { 
                        guild.channels.create('•📺•streamer-on-live',{
                            type: 'GUILD_TEXT',
                        }).catch(err => reject(err)).then(streamerlive => {
                            guild.channels.create('•🎙•streamer-affiliates',{
                                type: 'GUILD_TEXT',
                            }).catch(err => reject(err)).then(streameraff => {
                                streamerlive.setParent(category).catch(err => reject(err))
                                streameraff.setParent(category).catch(err => reject(err))
                                streamerlive.createWebhook('Twitch Affiliates (WarframeHub)',{avatar: 'https://cdn.discordapp.com/attachments/864199722676125757/1001563100438331453/purple-twitch-logo-png-18.png'}).catch(err => reject(err))
                                .then(streamerliveWebhook => {
                                    streameraff.createWebhook('Twitch Affiliates (WarframeHub)',{avatar: 'https://cdn.discordapp.com/attachments/864199722676125757/1001563100438331453/purple-twitch-logo-png-18.png'}).catch(err => reject(err))
                                    .then(streameraffWebhook => {
                                        db.query(`
                                            INSERT INTO twitch_affiliate_channels (channel_id,webhook_url,guild_id,channel_type,time_added) VALUES (${streamerlive.id},'${streamerliveWebhook.url}',${guildId},'live_channel',${new Date().getTime()});
                                            INSERT INTO twitch_affiliate_channels (channel_id,webhook_url,guild_id,channel_type,time_added) VALUES (${streameraff.id},'${streameraffWebhook.url}',${guildId},'affiliate_channel',${new Date().getTime()});
                                        `).catch(err => reject(err))
                                        .then(res => {
                                            // send all existing streamers messages
                                            db.query(`SELECT * FROM twitch_affiliate_streamers`).catch(err => reject(err))
                                            .then(async res => {
                                                for (const [index,row] of res.rows.entries()) {
                                                    await streameraffWebhook.send({
                                                        content: `Streamer: ${row.username} (fetching details...)`
                                                    }).catch(err => reject(err))
                                                    .then(async res => {
                                                        streameraff.messages.fetch(res.id).then(msg => msg.react(emotes.notify.string).catch(err => console.log(err))).catch(err => console.log(err))
                                                        await db.query(`INSERT INTO twitch_affiliate_messages (streamer_id,message_id,channel_id,guild_id,message_type,time_added) VALUES ('${row.streamer_id}',${res.id},${streameraff.id},${streameraff.guild.id},'affiliate_message',${new Date().getTime()})`).catch(err => reject(err))
                                                    })
                                                }
                                                await streamerliveWebhook.send({
                                                    content: `Streamers currently live are shown here`
                                                }).catch(err => reject(err))
                                                resolve(`This server has now been affiliated with WarframeHub. View affiliates in <#${streameraff.id}>`)
                                            })
                                        })
                                    })
                                })
                            })
                        })
                        
                    })
                })
            } else reject('Unexpected result querying db, please contact developer')
        })
    })
}

function usernameValidate(str) {
    return str.replace(/-/g,'').replace(/ /g,'').toLowerCase()
}

module.exports = {
    interaction_handler,
    bot_initialize,
    reaction_handler,
    emotes
}