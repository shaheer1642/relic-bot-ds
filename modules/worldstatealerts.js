const { client } = require('./discord_client.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const { db } = require('./db_connection.js');
const { inform_dc, dynamicSort, dynamicSortDesc, msToTime, msToFullTime, mod_log, getRandomColor, convertUpper, arrToStringsArrWithLimit, responsiveEmbedFields } = require('./extras.js');
const { db_schedule_msg_deletion } = require('./msg_auto_delete.js');
const { getWorldState } = require('./lambda.js');

const access_ids = [
    '253525146923433984',
    '834874419444711534'
]

const emotes = {
    baro: {
        string: '<:baro:961548844368293969>',
        identifier: 'baro:961548844368293969'
    },
    credits: {
        string: '<:credits:961605300601913424>',
        identifier: 'credits:961605300601913424'
    },
    ducats: {
        string: '<:ducats:961605317425234000>',
        identifier: 'ducats:961605317425234000'
    },
    day: {
        string: '☀️',
        identifier: '☀️'
    },
    night: {
        string: '🌙',
        identifier: '🌙'
    },
    cold: {
        string: '❄️',
        identifier: '❄️'
    },
    warm: {
        string: '🔥',
        identifier: '🔥'
    },
    fass: {
        string: '<:fass:961853261961371670>',
        identifier: 'fass:961853261961371670'
    },
    vome: {
        string: '<:vome:961853261713907752>',
        identifier: 'vome:961853261713907752'
    },
    defection: {
        string: '<:defection:961938897829523566>',
        identifier: 'defection:961938897829523566'
    },
    defense: {
        string: '<:defense:961938213256179802>',
        identifier: 'defense:961938213256179802'
    },
    interception: {
        string: '<:interception:961937942488678401>',
        identifier: 'interception:961937942488678401'
    },
    salvage: {
        string: '<:salvage:961939373908164638>',
        identifier: 'salvage:961939373908164638'
    },
    survival: {
        string: '<:survival:961937707477655592>',
        identifier: 'survival:961937707477655592'
    },
    excavation: {
        string: '<:excavation:961938527266955324>',
        identifier: 'excavation:961938527266955324'
    },
    disruption: {
        string: '<:disruption:962048774388195328>',
        identifier: 'disruption:962048774388195328'
    },
    Lith: {
        string: '<:Lith:962457564493271051>',
        identifier: 'Lith:962457564493271051'
    },
    Meso: {
        string: '<:Meso:962457563092361257>',
        identifier: 'Meso:962457563092361257'
    },
    Neo: {
        string: '<:Neo:962457562844909588>',
        identifier: 'Neo:962457562844909588'
    },
    Axi: {
        string: '<:Axi:962457563423735868>',
        identifier: 'Axi:962457563423735868'
    },
    Omnia: {
        string: '<:Omnia:1222621183292342332>',
        identifier: 'Omnia:1222621183292342332'
    },
    Requiem: {
        string: '<:Requiem:962457575230701598>',
        identifier: 'Requiem:962457575230701598'
    },
    endo: {
        string: '<:endo:962507075475370005>',
        identifier: 'endo:962507075475370005'
    },
    forma: {
        string: '<:forma:962507080667910194>',
        identifier: 'forma:962507080667910194'
    },
    forma_blueprint: {
        string: '<:forma:962507080667910194>',
        identifier: 'forma:962507080667910194'
    },
    kitgun_riven: {
        string: '<:kitgun_riven:962507042113880064>',
        identifier: 'kitgun_riven:962507042113880064'
    },
    kuva: {
        string: '<:kuva:962507064977023056>',
        identifier: 'kuva:962507064977023056'
    },
    rifle_riven: {
        string: '<:rifle_riven:962507043137261640>',
        identifier: 'rifle_riven:962507043137261640'
    },
    shotgun_riven: {
        string: '<:shotgun_riven:962507043695120414>',
        identifier: 'shotgun_riven:962507043695120414'
    },
    umbra_forma: {
        string: '<:umbra_forma:962507079111811093>',
        identifier: 'umbra_forma:962507079111811093'
    },
    zaw_riven: {
        string: '<:zaw_riven:962507044613685279>',
        identifier: 'zaw_riven:962507044613685279'
    },
    affinity_booster: {
        string: '<:affinity:971084285434032158>',
        identifier: 'affinity:971084285434032158'
    },
    credit_booster: {
        string: '<:credit:971084287136890932>',
        identifier: 'credit:971084287136890932'
    },
    resource_booster: {
        string: '<:resource:971084287501799464>',
        identifier: 'resource:971084287501799464'
    },
    resource_chance_booster: {
        string: '<:resource_chance:971084287774449674>',
        identifier: 'resource_chance:971084287774449674'
    },
    orokin_reactor: {
        string: '<:orokin_reactor:971513247930941480>',
        identifier: 'orokin_reactor:971513247930941480'
    },
    orokin_reactor_blueprint: {
        string: '<:orokin_reactor:971513247930941480>',
        identifier: 'orokin_reactor:971513247930941480'
    },
    orokin_catalyst: {
        string: '<:orokin_catalyst:971513248576860190>',
        identifier: 'orokin_catalyst:971513248576860190'
    },
    orokin_catalyst_blueprint: {
        string: '<:orokin_catalyst:971513248576860190>',
        identifier: 'orokin_catalyst:971513248576860190'
    },
    steel_essence: {
        string: '<:steel_essence:962508988442869800>',
        identifier: 'steel_essence:962508988442869800'
    },
    detonite_injector: {
        string: '<:detonite_injector:986700371462324224>',
        identifier: 'detonite_injector:986700371462324224'
    },
    fieldron: {
        string: '<:fieldron:986700389120372836>',
        identifier: 'fieldron:986700389120372836'
    },
    mutagen_mass: {
        string: '<:mutagen_mass:986700394627465237>',
        identifier: 'mutagen_mass:986700394627465237'
    },
    mutalist_alad_v_nav_coordinate: {
        string: '<:mutalist_alad_v_nav_coordinate:986700403951427624>',
        identifier: 'mutalist_alad_v_nav_coordinate:986700403951427624'
    },
    exilus_adapter_blueprint: {
        string: '<:exilus_adapter_blueprint:986700377502150706>',
        identifier: 'exilus_adapter_blueprint:986700377502150706'
    },
    snipetron_vandal: {
        string: '<:snipetron_vandal:986655973026443304>',
        identifier: 'snipetron_vandal:986655973026443304'
    },
    strun_wraith: {
        string: '<:strun_wraith:986656019071516752>',
        identifier: 'strun_wraith:986656019071516752'
    },
    twin_vipers_wraith: {
        string: '<:twin_vipers_wraith:986656068052590693>',
        identifier: 'twin_vipers_wraith:986656068052590693'
    },
    dera_vandal: {
        string: '<:dera_vandal:986655641647067156>',
        identifier: 'dera_vandal:986655641647067156'
    },
    sheev: {
        string: '<:sheev:986655789911539722>',
        identifier: 'sheev:986655789911539722'
    },
    latron_wraith: {
        string: '<:latron_wraith:986655734487986207>',
        identifier: 'latron_wraith:986655734487986207'
    },
    karak_wraith: {
        string: '<:karak_wraith:986655689097244692>',
        identifier: 'karak_wraith:986655689097244692'
    }
}

const colors = {
    baro: "#95744",
    cycles: "#a83258",
    arbitration: "#f59e42",
    fissures: "#3295a8",
    teshin: "#6432a8",
    notification: "#32a852",
    alerts: "#3fccb0",
    global_upgrades: '#f00a0a',
    invasions: '#f0692b'
}

var baroTimer
var cyclesTimer
var arbitrationTimer
var fissuresTimer
var teshinTimer
var alertsTimer
var global_upgrades_timer
var invasions_timer

function bot_initialize() {
    if (process.env.ENVIRONMENT_TYPE == 'dev') return
    //----set timers----
    baroTimer = setTimeout(baro_check, 10000)
    cyclesTimer = setTimeout(cycles_check, 11000)
    arbitrationTimer = setTimeout(arbitration_check, 12000)
    fissuresTimer = setTimeout(fissures_check, 13000)
    teshinTimer = setTimeout(teshin_check, 14000)
    alertsTimer = setTimeout(alerts_check, 15000)
    global_upgrades_timer = setTimeout(global_upgrades_check, 16000)
    invasions_timer = setTimeout(invasions_check, 17000)
    // db cleanup
    cleanUpDB()
}

async function interaction_handler(interaction) {
    if (interaction.commandName == 'fissures') {
        getWorldState('fissures')
            .then(async fissures => {

                if (fissures) {
                    var fissures_list = { normal: [], steelPath: [], voidStorm: [] }
                    fissures.forEach(fissure => {
                        if (fissure.isStorm)
                            fissures_list.voidStorm.push(fissure)
                        else if (fissure.isHard)
                            fissures_list.steelPath.push(fissure)
                        else
                            fissures_list.normal.push(fissure)
                    })
                    fissures_list.normal.sort(dynamicSort("tierNum"))
                    fissures_list.steelPath.sort(dynamicSort("tierNum"))
                    fissures_list.voidStorm.sort(dynamicSort("tierNum"))

                    var embed1 = {
                        title: "Fissures",
                        fields: [{
                            name: "Tier",
                            value: "",
                            inline: true
                        }, {
                            name: "Mission",
                            value: "",
                            inline: true
                        }, {
                            name: "Expires",
                            value: "",
                            inline: true
                        }],
                        color: colors.fissures
                    }
                    var embed2 = {
                        title: "Steel Path Fissures",
                        fields: [{
                            name: "Tier",
                            value: "",
                            inline: true
                        }, {
                            name: "Mission",
                            value: "",
                            inline: true
                        }, {
                            name: "Expires",
                            value: "",
                            inline: true
                        }],
                        color: colors.fissures
                    }
                    var embed3 = {
                        title: "Railjack Fissures",
                        fields: [{
                            name: "Tier",
                            value: "",
                            inline: true
                        }, {
                            name: "Mission",
                            value: "",
                            inline: true
                        }, {
                            name: "Expires",
                            value: "",
                            inline: true
                        }],
                        color: colors.fissures
                    }

                    fissures_list.normal.forEach(fissure => {
                        embed1.fields[0].value += `${emotes[fissure.tier].string} ${fissure.tier}\n`
                        embed1.fields[1].value += `${fissure.missionType} - ${fissure.node}\n`
                        embed1.fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
                    })
                    fissures_list.steelPath.forEach(fissure => {
                        embed2.fields[0].value += `${emotes[fissure.tier].string} ${fissure.tier}\n`
                        embed2.fields[1].value += `${fissure.missionType} - ${fissure.node}\n`
                        embed2.fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
                    })
                    fissures_list.voidStorm.forEach(fissure => {
                        embed3.fields[0].value += `${emotes[fissure.tier].string} ${fissure.tier}\n`
                        embed3.fields[1].value += `${fissure.missionType} - ${fissure.node}\n`
                        embed3.fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
                    })

                    interaction.reply({
                        content: ' ',
                        embeds: [embed1, embed2, embed3],
                    }).catch(console.error)
                }
            }).catch(console.error)
    }
    if (interaction.customId == 'worldstatealerts_fissures_show_modal') {
        interaction.showModal({
            title: "Track Fissures",
            custom_id: "worldstatealerts_fissures_tracker_add",
            components: [
                {
                    type: 1,
                    components: [{
                        type: 4,
                        custom_id: "relic_type",
                        label: "Relic Type",
                        style: 1,
                        min_length: 3,
                        max_length: 7,
                        placeholder: "Lith/Meso/Neo/Axi/Omnia/Requiem",
                        required: true
                    }]
                }, {
                    type: 1,
                    components: [{
                        type: 4,
                        custom_id: "mission_type",
                        label: "Mission Type",
                        style: 1,
                        min_length: 3,
                        max_length: 20,
                        placeholder: "i.e. defense",
                        required: true
                    }]
                }, {
                    type: 1,
                    components: [{
                        type: 4,
                        custom_id: "fissure_type",
                        label: "Fissure Type",
                        style: 1,
                        min_length: 6,
                        max_length: 10,
                        placeholder: "normal | steelpath | railjack | omnia",
                        required: true
                    }]
                }, {
                    type: 1,
                    components: [{
                        type: 4,
                        custom_id: "planet",
                        label: "Planet (optional)",
                        style: 1,
                        min_length: 1,
                        max_length: 20,
                        placeholder: "i.e. sedna",
                        required: false
                    }]
                }, {
                    type: 1,
                    components: [{
                        type: 4,
                        custom_id: "node",
                        label: "Node (optional)",
                        style: 1,
                        min_length: 1,
                        max_length: 25,
                        placeholder: "i.e. hydron",
                        required: false
                    }]
                }
            ]
        }).catch(console.error)
    }
    else if (interaction.customId == 'worldstatealerts_fissures_tracker_add') {
        const fissure_type = LU(interaction.fields.getTextInputValue('fissure_type').replace('steel path', 'steelpath').replace('rail jack', 'railjack'))
        const relic_type = LU(interaction.fields.getTextInputValue('relic_type')).replace('reqieum', 'requiem').replace('requium', 'requiem').replace('requim', 'requiem')
        const mission_type = LU(interaction.fields.getTextInputValue('mission_type').replace('defence', 'defense').replace('exterminate', 'extermination'))
        const planet = LU(interaction.fields.getTextInputValue('planet'))
        const node = LU(interaction.fields.getTextInputValue('node'))
        if (node && !planet)
            return interaction.reply({ content: `Please specify the planet for node **${node}**`, ephemeral: true }).catch(console.error)
        // if ((planet && !node) || (node && !planet)) {
        //     interaction.reply({content: `Please put the planet name as well as the node, not just one of them`, ephemeral: true}).catch(console.error)
        //     return
        // }
        if (relic_type != 'lith' && relic_type != 'meso' && relic_type != 'neo' && relic_type != 'axi' && relic_type != 'omnia' && relic_type != 'requiem') {
            interaction.reply({ content: `**${relic_type}** is an invalid relic type.\nPlease type one of: lith, meso, neo, axi, or requiem`, ephemeral: true }).catch(console.error)
            return
        }
        const tracker_id = `${fissure_type}_${relic_type}_${mission_type}${node ? `_${node}_` : ''}${planet ? `_${planet}_` : ''}`.replace(/_$/, '').replace(/__/g, '_')
        console.log(tracker_id)
        db.query(`SELECT fissures_users FROM worldstatealert WHERE channel_id = ${interaction.channel.id};`)
            .then(res => {
                if (res.rowCount == 1) {
                    const fissures_users = res.rows[0].fissures_users
                    if (!fissures_users[tracker_id])
                        fissures_users[tracker_id] = { users: [], last_appeared: 0 }
                    if (!fissures_users[tracker_id].users.includes(interaction.user.id))
                        fissures_users[tracker_id].users.push(interaction.user.id)
                    db.query(`UPDATE worldstatealert SET fissures_users = '${JSON.stringify(fissures_users)}' WHERE channel_id = ${interaction.channel.id} RETURNING fissures_users;`)
                        .then(res => {
                            if (res.rowCount == 1) {
                                if (interaction.message) {
                                    if (interaction.message.embeds[0]) {
                                        if (interaction.message.embeds[0].title == 'Your Fissure Trackers') {
                                            interaction.update(construct_your_fissures_embed(res.rows[0].fissures_users, interaction.user.id)).catch(console.error)
                                        } else {
                                            interaction.reply(construct_your_fissures_embed(res.rows[0].fissures_users, interaction.user.id)).catch(console.error)
                                        }
                                    } else {
                                        interaction.reply(construct_your_fissures_embed(res.rows[0].fissures_users, interaction.user.id)).catch(console.error)
                                    }
                                } else {
                                    interaction.reply(construct_your_fissures_embed(res.rows[0].fissures_users, interaction.user.id)).catch(console.error)
                                }
                            }
                        }).catch(console.error)
                }
            }).catch(console.error)
        function LU(text) {
            return text.trim().toLowerCase().replace(/ /g, '_')
        }
    }
    else if (interaction.customId == 'worldstatealerts_fissures_show_trackers') {
        db.query(`SELECT fissures_users FROM worldstatealert WHERE channel_id = ${interaction.channel.id};`)
            .then(res => {
                if (res.rowCount == 1) {
                    interaction.reply(construct_your_fissures_embed(res.rows[0].fissures_users, interaction.user.id)).catch(console.error)
                }
            }).catch(console.error)
    }
    else if (interaction.customId == 'worldstatealerts_fissures_tracker_remove') {
        var query = ''
        interaction.values.forEach(tracker_id => {
            query += `UPDATE worldstatealert SET fissures_users = jsonb_set(fissures_users, '{${tracker_id},users}', (fissures_users->'${tracker_id}'->'users') - '${interaction.user.id}') WHERE channel_id = ${interaction.channel.id};`
        })
        console.log(query)
        db.query(query)
            .then((res) => {
                if (res.rowCount > 0) {
                    db.query(`SELECT fissures_users FROM worldstatealert WHERE channel_id = ${interaction.channel.id}`)
                        .then(res => {
                            if (res.rowCount == 1) {
                                console.log(construct_your_fissures_embed(res.rows[0].fissures_users, interaction.user.id))
                                interaction.update(construct_your_fissures_embed(res.rows[0].fissures_users, interaction.user.id)).catch(console.error)
                            }
                        }).catch(console.error)
                }
            }).catch(console.error)
        console.log(interaction.values)
    }
    else if (interaction.customId == 'worldstatealerts_fissures_tracker_remove_all') {
        db.query(`SELECT fissures_users FROM worldstatealert WHERE channel_id = ${interaction.channel.id}`)
            .then(res => {
                if (res.rowCount == 1) {
                    const fissures_users = res.rows[0].fissures_users
                    var trackers = []
                    for (const tracker_id in fissures_users) {
                        if (fissures_users[tracker_id].users.includes(interaction.user.id)) {
                            trackers.push(tracker_id)
                        }
                    }
                    var query = ''
                    trackers.forEach(tracker_id => {
                        query += `UPDATE worldstatealert SET fissures_users = jsonb_set(fissures_users, '{${tracker_id},users}', (fissures_users->'${tracker_id}'->'users') - '${interaction.user.id}') WHERE channel_id = ${interaction.channel.id};`
                    })
                    console.log(query)
                    db.query(query)
                        .then((res) => {
                            db.query(`SELECT fissures_users FROM worldstatealert WHERE channel_id = ${interaction.channel.id}`)
                                .then(res => {
                                    if (res.rowCount == 1) {
                                        console.log(construct_your_fissures_embed(res.rows[0].fissures_users, interaction.user.id))
                                        interaction.update(construct_your_fissures_embed(res.rows[0].fissures_users, interaction.user.id)).catch(console.error)
                                    }
                                }).catch(console.error)
                        }).catch(console.error)
                }
            }).catch(console.error)
    }
}

function construct_your_fissures_embed(fissures_users, user_id) {
    try {
        var trackers = []
        for (const tracker_id in fissures_users) {
            if (fissures_users[tracker_id].users.includes(user_id)) {
                trackers.push({
                    tracker_id: tracker_id,
                    fissure_type: convertUpper(tracker_id.split('_')[0]),
                    fissure_name: convertUpper(
                        tracker_id.replace(`${tracker_id.split('_')[0]}_`, '')
                    ),
                    last_appeared: fissures_users[tracker_id].last_appeared
                })
            }
        }

        trackers = trackers.sort(dynamicSort('fissure_name'))
        trackers = trackers.sort(dynamicSort('fissure_type'))

        const embed = {
            title: 'Your Fissure Trackers',
            fields: responsiveEmbedFields({
                field1: {
                    label: 'Type',
                    valueArr: trackers.map(tracker => tracker.fissure_type)
                },
                field2: {
                    label: 'Fissure',
                    valueArr: trackers.map(tracker => `${emotes[tracker.fissure_name.split(' ')[0]]?.string} ${tracker.fissure_name}`),
                },
                field3: {
                    label: 'Last Appeared',
                    valueArr: trackers.map(tracker => tracker.last_appeared == 0 ? 'Unknown' : '<t:' + Math.round(tracker.last_appeared / 1000) + ':R>'),
                }
            }),
            color: '#ffffff'
        }

        const component_options = trackers.reduce((arr, tracker, index) => {
            if (index < 25) {
                arr.push({
                    label: tracker.fissure_type + ' ' + tracker.fissure_name,
                    value: tracker.tracker_id,
                    emoji: {
                        name: emotes[tracker.fissure_name.split(' ')[0]]?.identifier.split(':')[0],
                        id: emotes[tracker.fissure_name.split(' ')[0]]?.identifier.split(':')[1],
                    }
                })
            }
            return arr
        }, [])

        const components = [
            {
                type: 1,
                components: [
                    {
                        type: 3,
                        custom_id: "worldstatealerts_fissures_tracker_remove",
                        options: component_options,
                        placeholder: "Choose a tracker to remove",
                        min_values: 1,
                        max_values: component_options.length
                    }
                ]
            }, {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "Add Tracker",
                        style: 3,
                        custom_id: "worldstatealerts_fissures_show_modal"
                    },
                    {
                        type: 2,
                        label: "Remove All",
                        style: 4,
                        custom_id: "worldstatealerts_fissures_tracker_remove_all"
                    }
                ]
            }
        ]

        return {
            content: ' ',
            embeds: [embed],
            components: component_options.length > 0 ? components : [{
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "Add Tracker",
                        style: 3,
                        custom_id: "worldstatealerts_fissures_show_modal"
                    }
                ]
            }],
            ephemeral: true
        }
    } catch (e) {
        console.log(e)
        return {
            content: 'Sorry, an error occured constructing embed',
        }
    }
}

async function wssetup(message, args) {
    if (!access_ids.includes(message.author.id)) {
        message.channel.send('You do not have access to this command').catch(console.error)
        return
    }
    message.channel.send({
        content: ' ',
        embeds: [{
            title: 'Worldstate Alerts Setup',
            description: '1️⃣ Baro Alert\n2️⃣ Open World Cycles\n3️⃣ Arbitration\n4️⃣ Fissures\n5️⃣ Teshin Rotation (Steel Path)\n6️⃣ Notification Settings\n7️⃣ Alerts\n8️⃣ Event Booster\n9️⃣ Invasions'
        }]
    }).then(msg => {
        msg.react('1️⃣').catch(console.error)
        msg.react('2️⃣').catch(console.error)
        msg.react('3️⃣').catch(console.error)
        msg.react('4️⃣').catch(console.error)
        msg.react('5️⃣').catch(console.error)
        msg.react('6️⃣').catch(console.error)
        msg.react('7️⃣').catch(console.error)
        msg.react('8️⃣').catch(console.error)
        msg.react('9️⃣').catch(console.error)
    }).catch(console.error)
}

async function setupReaction(reaction, user, type) {
    const channel_id = reaction.message.channel.id
    if (reaction.emoji.name == "1️⃣" && type == "add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(console.error)
            return
        }
        // ----- baroAlert 
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                description: `React with ${emotes.baro.string} to be notified when baro arrives`,
                color: colors.baro
            }]
        }).then(msg => {
            msg.react(emotes.baro.string).catch(console.error)
            db.query(`UPDATE worldstatealert SET baro_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })
        }).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })
        // ----- baroRole
        reaction.message.guild.roles.create({
            name: 'Baro Alert',
            reason: 'Automatic role creation',
        }).then(role => {
            db.query(`UPDATE worldstatealert SET baro_role = ${role.id} WHERE channel_id = ${channel_id}`).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })
        }).catch(console.error)
        clearTimeout(baroTimer)
        var timer = 10000
        baroTimer = setTimeout(baro_check, 10000)
        console.log('baro_check invokes in ' + msToTime(timer))
        return
    }
    if (reaction.emoji.name == "2️⃣" && type == "add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(console.error)
            return
        }
        // ----- cyclesAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Open World Cycles',
                description: `React to be notified upon cycle changes`,
                color: colors.cycles
            }]
        }).then(async msg => {
            db.query(`UPDATE worldstatealert SET cycles_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })
            await msg.react("☀️").catch(console.error)
            await msg.react("🌙").catch(console.error)
            await msg.react("❄️").catch(console.error)
            await msg.react("🔥").catch(console.error)
            await msg.react(emotes.fass.string).catch(console.error)
            await msg.react(emotes.vome.string).catch(console.error)
        }).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })

        clearTimeout(cyclesTimer)
        var timer = 10000
        cyclesTimer = setTimeout(cycles_check, 10000)
        console.log('cycles_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "3️⃣" && type == "add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(console.error)
            return
        }
        // ---- arbitrationAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Arbitration',
                description: `React to subscribe to specific mission types\n\n${emotes.defection.string} Defection | ${emotes.defense.string} Defense | ${emotes.interception.string} Interception | ${emotes.salvage.string} Salvage\n${emotes.survival.string} Survival | ${emotes.excavation.string} Excavation | ${emotes.disruption.string} Disruption`,
                color: colors.arbitration
            }]
        }).then(async msg => {
            db.query(`UPDATE worldstatealert SET arbitration_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })
            await msg.react(emotes.defection.string).catch(console.error)
            await msg.react(emotes.defense.string).catch(console.error)
            await msg.react(emotes.interception.string).catch(console.error)
            await msg.react(emotes.salvage.string).catch(console.error)
            await msg.react(emotes.survival.string).catch(console.error)
            await msg.react(emotes.excavation.string).catch(console.error)
            await msg.react(emotes.disruption.string).catch(console.error)
        }).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })

        var timer = 10000
        clearTimeout(arbitrationTimer)
        arbitrationTimer = setTimeout(arbitration_check, 10000)
        console.log('arbitration_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "4️⃣" && type == "add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(console.error)
            return
        }
        // ---- fissuresAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Fissures',
                description: `Active fissures`,
                color: colors.fissures
            }, {
                title: 'Void Storms',
                description: `Active railjack fissures`,
                color: colors.fissures
            }]
        }).then(async msg => {
            db.query(`UPDATE worldstatealert SET fissures_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })
        }).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })

        clearTimeout(fissuresTimer)
        var timer = 10000
        fissuresTimer = setTimeout(fissures_check, 10000)
        console.log('fissures_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "5️⃣" && type == "add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(console.error)
            return
        }
        // ---- teshinAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Teshin Rotation (Steel Path)',
                description: `React to subscribe to a specific item rotation`,
                color: colors.teshin
            }]
        }).then(async msg => {
            await db.query(`UPDATE worldstatealert SET teshin_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })
            await msg.react(emotes.umbra_forma.string).catch(console.error)
            await msg.react(emotes.kuva.string).catch(console.error)
            await msg.react(emotes.kitgun_riven.string).catch(console.error)
            await msg.react(emotes.forma.string).catch(console.error)
            await msg.react(emotes.zaw_riven.string).catch(console.error)
            await msg.react(emotes.endo.string).catch(console.error)
            await msg.react(emotes.rifle_riven.string).catch(console.error)
            await msg.react(emotes.shotgun_riven.string).catch(console.error)
        }).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })

        clearTimeout(teshinTimer)
        var timer = 10000
        teshinTimer = setTimeout(teshin_check, 10000)
        console.log('teshin_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "6️⃣" && type == "add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(console.error)
            return
        }
        // ---- notificationSettings
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Notification Settings',
                description: `React to suppress notifications depending upon Discord online status\n*This does not apply to Baro, Teshin and Event Booster alerts*\n\n🔴 Disable on 'Do Not Disturb'\n🟣 Disable on 'Invisible/Offline'`,
                color: colors.notification
            }]
        }).then(async msg => {
            await msg.react('🔴').catch(console.error)
            await msg.react('🟣').catch(console.error)
        }).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })
    }
    if (reaction.emoji.name == "7️⃣" && type == "add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(console.error)
            return
        }
        // ---- alerts 
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Alerts',
                description: `In-game alerts will show up here`,
                color: colors.alerts
            }]
        }).then(async msg => {
            await db.query(`UPDATE worldstatealert SET alerts_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })
            await msg.react(emotes.orokin_reactor.string).catch(console.error)
            await msg.react(emotes.orokin_catalyst.string).catch(console.error)
            await msg.react(emotes.umbra_forma.string).catch(console.error)
            await msg.react(emotes.forma.string).catch(console.error)
        }).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })

        clearTimeout(alertsTimer)
        var timer = 10000
        alertsTimer = setTimeout(alerts_check, 10000)
        console.log('alerts_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "8️⃣" && type == "add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(console.error)
            return
        }
        // ---- alerts 
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Event Booster',
                description: `Event Booster will show up here`,
                color: colors.global_upgrades
            }]
        }).then(async msg => {
            await db.query(`UPDATE worldstatealert SET global_upgrades_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })
            await msg.react(emotes.affinity_booster.string).catch(console.error)
            await msg.react(emotes.credit_booster.string).catch(console.error)
            await msg.react(emotes.resource_booster.string).catch(console.error)
            await msg.react(emotes.resource_chance_booster.string).catch(console.error)
        }).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })

        clearTimeout(global_upgrades_timer)
        var timer = 10000
        global_upgrades_timer = setTimeout(global_upgrades_check, 10000)
        console.log('global_upgrades_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "9️⃣" && type == "add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
            return
        var status = await db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            return true
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(console.error)
            return
        }
        // ---- alerts 
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Invasions',
                description: `React to subscribe to specific rewards\n\n${emotes.forma.string} Forma BP${'\u3000'.repeat(5)}${emotes.orokin_catalyst.string} Orokin Catalyst BP${'\u3000'.repeat(5)}${emotes.orokin_reactor.string} Orokin Reactor BP\n${emotes.fieldron.string} Fieldron${'\u3000'.repeat(5)}${'\u202F'.repeat(6)}${emotes.detonite_injector.string} Detonite Injector${'\u3000'.repeat(5)}${'\u202F'.repeat(6)}${emotes.mutagen_mass.string} Mutagen Mass\n${emotes.exilus_adapter_blueprint.string} Exilus Adapater BP${'\u3000'.repeat(1)}${'\u202F'.repeat(2)}${emotes.mutalist_alad_v_nav_coordinate.string} Mutalist Alad V Nav Coordinate\n${emotes.snipetron_vandal.string} Snipetron Vandal BP & Parts${'\u3000'.repeat(5)}${emotes.dera_vandal.string} Dera Vandal BP & Parts\n${emotes.twin_vipers_wraith.string} Twin Vipers Wraith BP & Parts${'\u3000'.repeat(4)}${'\u202F'.repeat(1)}${emotes.sheev.string} Sheev BP & Parts\n${emotes.latron_wraith.string} Latron Wraith BP & Parts${'\u3000'.repeat(6)}${'\u202F'.repeat(3)}${emotes.karak_wraith.string} Karak Wraith BP & Parts\n${emotes.strun_wraith.string} Strun Wraith BP & Parts`,
                color: colors.invasions
            }]
        }).then(async msg => {
            await db.query(`UPDATE worldstatealert SET invasions_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })
            await msg.react(emotes.forma.string).catch(console.error)
            await msg.react(emotes.orokin_catalyst.string).catch(console.error)
            await msg.react(emotes.orokin_reactor.string).catch(console.error)
            await msg.react(emotes.fieldron.string).catch(console.error)
            await msg.react(emotes.detonite_injector.string).catch(console.error)
            await msg.react(emotes.mutagen_mass.string).catch(console.error)
            await msg.react(emotes.exilus_adapter_blueprint.string).catch(console.error)
            await msg.react(emotes.mutalist_alad_v_nav_coordinate.string).catch(console.error)
            await msg.react(emotes.snipetron_vandal.string).catch(console.error)
            await msg.react(emotes.dera_vandal.string).catch(console.error)
            await msg.react(emotes.twin_vipers_wraith.string).catch(console.error)
            await msg.react(emotes.sheev.string).catch(console.error)
            await msg.react(emotes.latron_wraith.string).catch(console.error)
            await msg.react(emotes.karak_wraith.string).catch(console.error)
            await msg.react(emotes.strun_wraith.string).catch(console.error)
        }).catch(err => { console.log(err); reaction.message.channel.send('Some error occured').catch(console.error) })

        clearTimeout(invasions_timer)
        var timer = 10000
        invasions_timer = setTimeout(invasions_check, 10000)
        console.log('invasions_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.identifier == emotes.baro.identifier) {
        console.log('baro reaction')
        await db.query(`SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}`).then(res => {
            console.log(res.rows)
            if (res.rowCount != 1)
                return
            if (reaction.message.id != res.rows[0].baro_alert)
                return
            const role = reaction.message.guild.roles.cache.find(role => role.id === res.rows[0].baro_role)
            if (type == "add") {
                reaction.message.guild.members.cache.get(user.id)?.roles.add(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**')
                            .catch(err => {
                                console.log(err)
                            })
                    })
                    .catch(function (error) {
                        console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                        user.send('Error occured adding role. Please try again.\nError Code: 500')
                        inform_dc(`Error adding role ${role.name} for user ${user.username}`)
                    })
            } else if (type == "remove") {
                reaction.message.guild.members.cache.get(user.id)?.roles.remove(role)
                    .then(response => {
                        console.log(JSON.stringify(response))
                        user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**')
                            .catch(err => {
                                console.log(err)
                            })
                    })
                    .catch(function (error) {
                        console.log(`${error} Error removing role ${role.name} for user ${user.username}`)
                        user.send('Error occured removing role. Please try again.\nError Code: 500')
                        inform_dc(`Error removing role ${role.name} for user ${user.username}`)
                    })
            }
        })
    }
    if (reaction.emoji.name == emotes.day.string) {
        console.log('day reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{day,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Day cycle").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{day}', (cycles_users->'day') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Day cycle").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.name == emotes.night.string) {
        console.log('night reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{night,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Night cycle").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{night}', (cycles_users->'night') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Night cycle").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.name == emotes.cold.string) {
        console.log('cold reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{cold,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Cold cycle").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{cold}', (cycles_users->'cold') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Cold cycle").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.name == emotes.warm.string) {
        console.log('warm reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{warm,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Warm cycle").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{warm}', (cycles_users->'warm') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Warm cycle").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.fass.identifier) {
        console.log('fass reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{fass,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Fass cycle").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{fass}', (cycles_users->'fass') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Fass cycle").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.vome.identifier) {
        console.log('vome reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{vome,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Vome cycle").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{vome}', (cycles_users->'vome') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Vome cycle").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.defection.identifier) {
        console.log('defection reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{defection,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration defection").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{defection}', (arbitration_users->'defection') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration defection").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.defense.identifier) {
        console.log('defense reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{defense,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration defense").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{defense}', (arbitration_users->'defense') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration defense").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.interception.identifier) {
        console.log('interception reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{interception,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration interception").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{interception}', (arbitration_users->'interception') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration interception").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.salvage.identifier) {
        console.log('salvage reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{salvage,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration salvage").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{salvage}', (arbitration_users->'salvage') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration salvage").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.survival.identifier) {
        console.log('survival reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{survival,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration survival").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{survival}', (arbitration_users->'survival') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration survival").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.excavation.identifier) {
        console.log('excavation reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{excavation,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration excavation").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{excavation}', (arbitration_users->'excavation') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration excavation").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.disruption.identifier) {
        console.log('disruption reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{disruption,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration disruption").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{disruption}', (arbitration_users->'disruption') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration disruption").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.umbra_forma.identifier) {
        console.log('umbra_forma reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title == "Teshin Rotation (Steel Path)") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET teshin_users = jsonb_set(teshin_users, '{umbra_forma,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Teshin umbra_forma").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET teshin_users = jsonb_set(teshin_users, '{umbra_forma}', (teshin_users->'umbra_forma') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Teshin umbra_forma").catch(console.error)).catch(console.error)
            }
        }
        if (reaction.message.embeds[0].title == "Alerts") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET alerts_users = jsonb_set(alerts_users, '{umbra_forma,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Alerts umbra_forma").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET alerts_users = jsonb_set(alerts_users, '{umbra_forma}', (alerts_users->'umbra_forma') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Alerts umbra_forma").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.kuva.identifier) {
        console.log('kuva reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Teshin Rotation (Steel Path)")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{kuva,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Teshin kuva").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{kuva}', (teshin_users->'kuva') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Teshin kuva").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.kitgun_riven.identifier) {
        console.log('kitgun_riven reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Teshin Rotation (Steel Path)")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{kitgun_riven,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Teshin kitgun_riven").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{kitgun_riven}', (teshin_users->'kitgun_riven') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Teshin kitgun_riven").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.forma.identifier) {
        console.log('forma reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title == "Teshin Rotation (Steel Path)") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET teshin_users = jsonb_set(teshin_users, '{forma,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Teshin forma").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET teshin_users = jsonb_set(teshin_users, '{forma}', (teshin_users->'forma') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Teshin forma").catch(console.error)).catch(console.error)
            }
        }
        if (reaction.message.embeds[0].title == "Alerts") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET alerts_users = jsonb_set(alerts_users, '{forma,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Alerts forma").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET alerts_users = jsonb_set(alerts_users, '{forma}', (alerts_users->'forma') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Alerts forma").catch(console.error)).catch(console.error)
            }
        }
        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{forma_blueprint,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions forma blueprint").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{forma_blueprint}', (invasions_users->'forma_blueprint') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions forma blueprint").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.zaw_riven.identifier) {
        console.log('zaw_riven reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Teshin Rotation (Steel Path)")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{zaw_riven,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Teshin zaw_riven").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{zaw_riven}', (teshin_users->'zaw_riven') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Teshin zaw_riven").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.endo.identifier) {
        console.log('endo reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Teshin Rotation (Steel Path)")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{endo,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Teshin endo").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{endo}', (teshin_users->'endo') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Teshin endo").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.rifle_riven.identifier) {
        console.log('rifle_riven reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Teshin Rotation (Steel Path)")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{rifle_riven,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Teshin rifle_riven").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{rifle_riven}', (teshin_users->'rifle_riven') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Teshin rifle_riven").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.shotgun_riven.identifier) {
        console.log('shotgun_riven reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Teshin Rotation (Steel Path)")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{shotgun_riven,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Teshin shotgun_riven").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET teshin_users = jsonb_set(teshin_users, '{shotgun_riven}', (teshin_users->'shotgun_riven') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Teshin shotgun_riven").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.name == "🔴") {
        console.log('dnd reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Notification Settings")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET ping_filter = jsonb_set(ping_filter, '{dnd,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Disabled pinging on DnD").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET ping_filter = jsonb_set(ping_filter, '{dnd}', (ping_filter->'dnd') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Re-enabled pinging on DnD").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.name == "🟣") {
        console.log('offline/invisible reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Notification Settings")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET ping_filter = jsonb_set(ping_filter, '{offline,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Disabled pinging on invisible/offline").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET ping_filter = jsonb_set(ping_filter, '{offline}', (ping_filter->'offline') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Re-enabled pinging on invisible/offline").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.affinity_booster.identifier) {
        console.log('affinity_booster reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Event Booster")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{affinity_booster,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Affinity Event Booster").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{affinity_booster}', (global_upgrades_users->'affinity_booster') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Affinity Event Booster").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.credit_booster.identifier) {
        console.log('credit_booster reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Event Booster")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{credit_booster,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Credits Event Booster").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{credit_booster}', (global_upgrades_users->'credit_booster') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Credits Event Booster").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.resource_booster.identifier) {
        console.log('resource_booster reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Event Booster")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{resource_drop_amount_booster,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Resource Event Booster").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{resource_drop_amount_booster}', (global_upgrades_users->'resource_drop_amount_booster') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Resource Event Booster").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.resource_chance_booster.identifier) {
        console.log('resource_chance_booster reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Event Booster")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{resource_drop_chance_booster,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Resource Chance Event Booster").catch(console.error)).catch(console.error)
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET global_upgrades_users = jsonb_set(global_upgrades_users, '{resource_drop_chance_booster}', (global_upgrades_users->'resource_drop_chance_booster') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Resource Chance Event Booster").catch(console.error)).catch(console.error)
        }
    }
    if (reaction.emoji.identifier == emotes.orokin_reactor.identifier) {
        console.log('orokin_reactor reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Alerts") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET alerts_users = jsonb_set(alerts_users, '{orokin_reactor,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Alerts Orokin Reactor").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET alerts_users = jsonb_set(alerts_users, '{orokin_reactor}', (alerts_users->'orokin_reactor') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Alerts Orokin Reactor").catch(console.error)).catch(console.error)
            }
        }
        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{orokin_reactor_blueprint,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions orokin catalyst blueprint").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{orokin_reactor_blueprint}', (invasions_users->'orokin_reactor_blueprint') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions orokin catalyst blueprint").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.orokin_catalyst.identifier) {
        console.log('orokin_catalyst reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Alerts") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET alerts_users = jsonb_set(alerts_users, '{orokin_catalyst,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Alerts Orokin Catalyst").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET alerts_users = jsonb_set(alerts_users, '{orokin_catalyst}', (alerts_users->'orokin_catalyst') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Alerts Orokin Catalyst").catch(console.error)).catch(console.error)
            }
        }

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{orokin_catalyst_blueprint,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions orokin catalyst blueprint").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{orokin_catalyst_blueprint}', (invasions_users->'orokin_catalyst_blueprint') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions orokin catalyst blueprint").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.exilus_adapter_blueprint.identifier) {
        console.log('exilus_adapter_blueprint reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{exilus_adapter_blueprint,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions exilus adapter blueprint").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{exilus_adapter_blueprint}', (invasions_users->'exilus_adapter_blueprint') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions exilus adapter blueprint").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.fieldron.identifier) {
        console.log('fieldron reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{fieldron,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions fieldron").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{fieldron}', (invasions_users->'fieldron') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions fieldron").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.detonite_injector.identifier) {
        console.log('detonite_injector reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{detonite_injector,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions detonite injector").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{detonite_injector}', (invasions_users->'detonite_injector') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions detonite injector").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.mutagen_mass.identifier) {
        console.log('mutagen_mass reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{mutagen_mass,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions mutagen mass").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{mutagen_mass}', (invasions_users->'mutagen_mass') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions mutagen mass").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.mutalist_alad_v_nav_coordinate.identifier) {
        console.log('mutalist_alad_v_nav_coordinate reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{mutalist_alad_v_nav_coordinate,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions mutalist alad v nav coordinate").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{mutalist_alad_v_nav_coordinate}', (invasions_users->'mutalist_alad_v_nav_coordinate') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions mutalist alad v nav coordinate").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.snipetron_vandal.identifier) {
        console.log('snipetron_vandal reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{snipetron_vandal_blueprint,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{snipetron_vandal_barrel,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{snipetron_vandal_stock,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{snipetron_vandal_receiver,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions snipetron vandal").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{snipetron_vandal_blueprint}', (invasions_users->'snipetron_vandal_blueprint') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{snipetron_vandal_barrel}', (invasions_users->'snipetron_vandal_barrel') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{snipetron_vandal_stock}', (invasions_users->'snipetron_vandal_stock') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{snipetron_vandal_receiver}', (invasions_users->'snipetron_vandal_receiver') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions snipetron vandal").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.dera_vandal.identifier) {
        console.log('dera_vandal reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{dera_vandal_blueprint,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{dera_vandal_barrel,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{dera_vandal_stock,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{dera_vandal_receiver,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions dera vandal").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{dera_vandal_blueprint}', (invasions_users->'dera_vandal_blueprint') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{dera_vandal_barrel}', (invasions_users->'dera_vandal_barrel') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{dera_vandal_stock}', (invasions_users->'dera_vandal_stock') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{dera_vandal_receiver}', (invasions_users->'dera_vandal_receiver') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions dera vandal").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.twin_vipers_wraith.identifier) {
        console.log('twin_vipers_wraith reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{twin_vipers_wraith_blueprint,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{twin_vipers_wraith_barrels,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{twin_vipers_wraith_link,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{twin_vipers_wraith_receivers,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions twin vipers wraith").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{twin_vipers_wraith_blueprint}', (invasions_users->'twin_vipers_wraith_blueprint') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{twin_vipers_wraith_barrels}', (invasions_users->'twin_vipers_wraith_barrels') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{twin_vipers_wraith_link}', (invasions_users->'twin_vipers_wraith_link') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{twin_vipers_wraith_receivers}', (invasions_users->'twin_vipers_wraith_receivers') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions twin vipers wraith").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.sheev.identifier) {
        console.log('sheev reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{sheev_blueprint,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{sheev_hilt,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{sheev_blade,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{sheev_heatsink,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions sheev").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{sheev_blueprint}', (invasions_users->'sheev_blueprint') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{sheev_hilt}', (invasions_users->'sheev_hilt') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{sheev_blade}', (invasions_users->'sheev_blade') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{sheev_heatsink}', (invasions_users->'sheev_heatsink') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions sheev").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.latron_wraith.identifier) {
        console.log('latron_wraith reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{latron_wraith_blueprint,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{latron_wraith_barrel,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{latron_wraith_stock,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{latron_wraith_receiver,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions latron wraith").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{latron_wraith_blueprint}', (invasions_users->'latron_wraith_blueprint') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{latron_wraith_barrel}', (invasions_users->'latron_wraith_barrel') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{latron_wraith_stock}', (invasions_users->'latron_wraith_stock') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{latron_wraith_receiver}', (invasions_users->'latron_wraith_receiver') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions latron wraith").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.karak_wraith.identifier) {
        console.log('karak_wraith reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{karak_wraith_blueprint,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{karak_wraith_barrel,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{karak_wraith_stock,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{karak_wraith_receiver,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions karak wraith").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{karak_wraith_blueprint}', (invasions_users->'karak_wraith_blueprint') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{karak_wraith_barrel}', (invasions_users->'karak_wraith_barrel') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{karak_wraith_stock}', (invasions_users->'karak_wraith_stock') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{karak_wraith_receiver}', (invasions_users->'karak_wraith_receiver') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions karak wraith").catch(console.error)).catch(console.error)
            }
        }
    }
    if (reaction.emoji.identifier == emotes.strun_wraith.identifier) {
        console.log('strun_wraith reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error)
        if (reaction.message.author.id != client.user.id)
            return

        if (reaction.message.embeds[0].title == "Invasions") {
            if (type == "add") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{strun_wraith_blueprint,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{strun_wraith_barrel,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{strun_wraith_stock,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{strun_wraith_receiver,999999}', '"${user.id}"', true)
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Added tracker: Invasions strun wraith").catch(console.error)).catch(console.error)
            } else if (type == "remove") {
                db.query(`
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{strun_wraith_blueprint}', (invasions_users->'strun_wraith_blueprint') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{strun_wraith_barrel}', (invasions_users->'strun_wraith_barrel') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{strun_wraith_stock}', (invasions_users->'strun_wraith_stock') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                    UPDATE worldstatealert
                    SET invasions_users = jsonb_set(invasions_users, '{strun_wraith_receiver}', (invasions_users->'strun_wraith_receiver') - '${user.id}')
                    WHERE channel_id = ${channel_id};
                `).then(() => user.send("Removed tracker: Invasions strun wraith").catch(console.error)).catch(console.error)
            }
        }
    }
}

async function cleanUpDB() {
    db.query('SELECT * FROM worldstatealert')
        .then(res => {
            // verify channels
            res.rows.forEach(row => {
                const cnl_id = row.channel_id
                client.channels.fetch(cnl_id).then(cnl => {
                    ['baro_alert', 'cycles_alert', 'arbitration_alert', 'fissures_alert', 'teshin_alert', 'alerts_alert', 'global_upgrades_alert', 'invasions_alert']
                        .forEach(alert_type => {
                            const msg_id = row[alert_type]
                            if (!msg_id) return
                            cnl.messages.fetch(msg_id).catch(err => {
                                if (err.code == 10008 || err.code == 50001) {
                                    db.query(`UPDATE worldstatealert SET ${alert_type} = NULL WHERE channel_id = ${cnl_id}`).catch(console.error)
                                    console.log('[worldstatealerts.cleanUpDB] removed message channel_id =', cnl_id, 'message_id =', msg_id)
                                } else console.log('[worldstatealerts.cleanUpDB] unknown error', err)
                            })
                        })
                }).catch(err => {
                    if (err.code == 10003 || err.code == 50001) {
                        db.query(`DELETE FROM worldstatealert WHERE channel_id = ${cnl_id}`).catch(console.error)
                        console.log('[worldstatealerts.cleanUpDB] removed channel channel_id =', cnl_id)
                    } else console.log('[worldstatealerts.cleanUpDB] unknown error', err)
                })
            })

            // verify users
            res.rows.forEach(row => {
                const channel_id = row.channel_id

                const columns = ['cycles_users', 'arbitration_users', 'teshin_users', 'ping_filter', 'global_upgrades_users', 'alerts_users', 'invasions_users', 'fissures_users']

                // note: Set() removes duplicate values
                const users = [...new Set(columns.reduce((users, column) => users.concat(Object.values(row[column]).reduce((arr, v) => arr.concat(v.users || v), [])), []))]

                client.channels.fetch(channel_id).then(channel => {
                    client.guilds.fetch(channel.guildId).then(guild => {
                        users.forEach(user => {
                            guild.members.fetch(user).catch(err => {
                                if (err.code == 10007) {
                                    db.query(
                                        columns.map(column =>
                                            Object.keys(row[column]).map(alert_type => `
                                            UPDATE worldstatealert
                                            SET ${column} = jsonb_set(${column}, '{${alert_type}${column == 'fissures_users' ? ',users' : ''}}', (${column}->'${alert_type}'${column == "fissures_users" ? "->'users'" : ''}) - '${user}')
                                            WHERE channel_id = ${channel_id};
                                        `).join('\n')
                                        ).join('\n')
                                    ).then(res => console.log('[worldstatealert.cleanUpDB] removed user', user, 'from alerts')).catch(console.error)
                                } else console.error('[worldstatealert.cleanUpDB] unknown error', err)
                            })
                        })
                    }).catch(console.error)
                }).catch(console.error)
            })
        }).catch(console.error)
}

//----tracking----

async function baro_check() {
    console.log('baro_check called');
    getWorldState('voidTrader')
        .then(async voidTrader => {
            if (!voidTrader) {
                console.log('Baro check: no data available')
                var timer = 300000
                baroTimer = setTimeout(baro_check, timer)
                console.log(`baro_check reset in ${msToTime(timer)}`)
                return
            }

            if (voidTrader.active) {
                if (new Date(voidTrader.expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
                    console.log('Baro check: negative expiry')
                    var timer = 10000
                    baroTimer = setTimeout(baro_check, timer)
                    console.log(`baro_check reset in ${msToTime(timer)}`)
                    return
                }
            } else {
                if (new Date(voidTrader.activation).getTime() < new Date().getTime()) {     //negative activation, retry
                    console.log('Baro check: negative activation')
                    var timer = 10000
                    baroTimer = setTimeout(baro_check, timer)
                    console.log(`baro_check reset in ${msToTime(timer)}`)
                    return
                }
            }
            db.query(`SELECT * FROM worldstatealert`).then(res => {
                if (res.rowCount == 0)
                    return
                if (voidTrader.active) {
                    if (res.rows[0].baro_status == false) {
                        db.query(`UPDATE worldstatealert SET baro_status = true`).catch(console.error)
                        res.rows.forEach(row => {
                            if (row.baro_alert)
                                client.channels.cache.get(row.channel_id)?.send(`Baro has arrived! <@&${row.baro_role}>`).then(msg => setTimeout(() => msg.delete().catch(console.error), 10000)).catch(console.error)
                        })
                    }
                    var embed = [{
                        title: "Baro Ki'teer",
                        description: `Baro has arrived! Leaving <t:${new Date(voidTrader.expiry).getTime() / 1000}:R>\n**Node:** ${voidTrader.location}`,
                        fields: [],
                        color: colors.baro
                    }]
                    var emb_index = 0
                    voidTrader.inventory.sort(dynamicSort("item"))
                    voidTrader.inventory.forEach((item, index) => {
                        //update db info about the item
                        db.query(`UPDATE items_list SET vault_status='B',vault_timestamp=${new Date(voidTrader.activation).getTime()} WHERE item_url='${item.item.toLowerCase().replace(/ /g, '_').replace('_(intact)', '').replace(/'/g, `''`)}'`).catch(console.error)
                        if (index % 24 == 0) {
                            embed.push({
                                fields: [],
                                color: colors.baro
                            })
                            emb_index++
                        }
                        embed[emb_index].fields.push({
                            name: item.item,
                            value: `C: ${item.credits}\nD: ${item.ducats}`,
                            inline: true
                        })
                    })
                    console.log(JSON.stringify(embed))
                    res.rows.forEach(row => {
                        if (row.baro_alert) {
                            client.channels.cache.get(row.channel_id)?.messages.fetch(row.baro_alert).then(msg => {
                                msg.edit({
                                    content: `<@&${row.baro_role}>`,
                                    embeds: embed
                                }).catch(console.error)
                            }).catch(console.error)
                        }
                    })
                } else {
                    db.query(`UPDATE worldstatealert SET baro_status = false`).catch(console.error)
                    res.rows.forEach(row => {
                        if (row.baro_alert) {
                            client.channels.cache.get(row.channel_id)?.messages.fetch(row.baro_alert).then(msg => {
                                msg.edit({
                                    content: ' ',
                                    embeds: [{
                                        title: "Baro Ki'teer",
                                        description: `React with ${emotes.baro.string} to be notified when baro arrives\n\nNext arrival <t:${new Date(voidTrader.activation).getTime() / 1000}:R>\n**Node:** ${voidTrader.location}`,
                                        color: colors.baro
                                    }]
                                }).catch(console.error)
                            }).catch(console.error)
                        }
                    })
                }
            }).catch(console.error)
            if (voidTrader.active) {
                var timer = (new Date(voidTrader.expiry).getTime() - new Date().getTime()) + 120000
                baroTimer = setTimeout(baro_check, timer)
                console.log('baro_check invokes in ' + msToTime(timer))
            } else {
                var timer = (new Date(voidTrader.activation).getTime() - new Date().getTime()) + 120000
                baroTimer = setTimeout(baro_check, timer)
                console.log('baro_check invokes in ' + msToTime(timer))
            }
            return
        }).catch(err => {
            console.error(err)
            clearTimeout(baroTimer)
            baroTimer = setTimeout(baro_check, 60000)
        })
}

var ping_10m_before_cetus_cycle_change_timeout = null
async function cycles_check() {
    console.log('cycles_check called');
    getWorldState('all')
        .then(async worldstateData => {
            const cetusCycle = worldstateData.cetusCycle;
            const vallisCycle = worldstateData.vallisCycle;
            const cambionCycle = worldstateData.cambionCycle;

            if (!cetusCycle || !vallisCycle || !cambionCycle) {
                console.log('Cycles check: no data available for a certain node')
                var timer = 300000
                arbitrationTimer = setTimeout(cycles_check, timer)
                console.log(`cycles_check reset in ${msToTime(timer)}`)
                return
            }

            if (new Date(cetusCycle.expiry).getTime() < new Date().getTime() || new Date(vallisCycle.expiry).getTime() < new Date().getTime() || new Date(cambionCycle.expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
                console.log('Cycles check: negative expiry')
                var timer = 10000
                cyclesTimer = setTimeout(cycles_check, timer)
                console.log(`cycles_check reset in ${msToTime(timer)}`)
                return
            }
            db.query(`SELECT * FROM worldstatealert`).then(async res => {
                if (res.rowCount == 0)
                    return
                var users = {}
                var ping_users = {}
                var cycles_changed = []
                // ----- cetus check 
                await db.query(`UPDATE worldstatealert SET cetus_status = '${cetusCycle.state}'`).catch(console.error)
                res.rows.forEach(row => {
                    row.cycles_users[cetusCycle.state].forEach(user => {
                        if (!users[row.channel_id])
                            users[row.channel_id] = []
                        if (!users[row.channel_id].includes(`<@${user}>`))
                            users[row.channel_id].push(`<@${user}>`)
                        if (row.cetus_status != cetusCycle.state) {
                            if (!cycles_changed.includes(`Cetus: ${cetusCycle.state}`))
                                cycles_changed.push(`Cetus: ${cetusCycle.state}`)
                            if (!ping_users[row.channel_id])
                                ping_users[row.channel_id] = []
                            if (row.ping_filter.dnd.includes(user) || row.ping_filter.offline.includes(user)) {
                                // get user discord status
                                const user_presc = client.channels.cache.get(row.channel_id)?.guild.presences.cache.find(mem => mem.userId == user)
                                if (!user_presc || user_presc.status == 'offline') {
                                    if (!row.ping_filter.offline.includes(user)) {
                                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                            ping_users[row.channel_id].push(`<@${user}>`)
                                    }
                                } else if (user_presc.status == 'dnd') {
                                    if (!row.ping_filter.dnd.includes(user)) {
                                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                            ping_users[row.channel_id].push(`<@${user}>`)
                                    }
                                } else {
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            } else {
                                if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                    ping_users[row.channel_id].push(`<@${user}>`)
                            }
                        }
                    })
                })
                // ping 10m before cetus cycle change
                if ((new Date(cetusCycle.expiry).getTime() - new Date().getTime()) > 600000) {
                    console.log('launching cetus cycle change 10m timeout in', new Date(cetusCycle.expiry).getTime() - new Date().getTime() - 600000, 'ms')
                    clearTimeout(ping_10m_before_cetus_cycle_change_timeout)
                    ping_10m_before_cetus_cycle_change_timeout = setTimeout(() => {
                        console.log('cetus cycle change 10m timeout launched')
                        var user_ids = {}
                        res.rows.forEach(row => {
                            row.cycles_users[cetusCycle.state == 'day' ? 'night' : 'day'].forEach(user => {
                                if (!user_ids[row.channel_id])
                                    user_ids[row.channel_id] = []
                                if (row.ping_filter.dnd.includes(user) || row.ping_filter.offline.includes(user)) {
                                    // get user discord status
                                    const user_presc = client.channels.cache.get(row.channel_id)?.guild.presences.cache.find(mem => mem.userId == user)
                                    if (!user_presc || user_presc.status == 'offline') {
                                        if (!row.ping_filter.offline.includes(user)) {
                                            if (!user_ids[row.channel_id].includes(`<@${user}>`))
                                                user_ids[row.channel_id].push(`<@${user}>`)
                                        }
                                    } else if (user_presc.status == 'dnd') {
                                        if (!row.ping_filter.dnd.includes(user)) {
                                            if (!user_ids[row.channel_id].includes(`<@${user}>`))
                                                user_ids[row.channel_id].push(`<@${user}>`)
                                        }
                                    } else {
                                        if (!user_ids[row.channel_id].includes(`<@${user}>`))
                                            user_ids[row.channel_id].push(`<@${user}>`)
                                    }
                                } else {
                                    if (!user_ids[row.channel_id].includes(`<@${user}>`))
                                        user_ids[row.channel_id].push(`<@${user}>`)
                                }
                            })
                        })
                        // console.log('user_ids',user_ids)
                        res.rows.forEach(row => {
                            if (row.cycles_alert) {
                                if (user_ids[row.channel_id] && user_ids[row.channel_id].length > 0) {
                                    arrToStringsArrWithLimit(`Cetus: ${cetusCycle.state == 'day' ? 'night' : 'day'} starts in 10 minutes`, user_ids[row.channel_id], 2000).forEach(str => {
                                        client.channels.cache.get(row.channel_id)?.send(str).then(msg => db_schedule_msg_deletion(msg.id, msg.channel.id, 60000)).catch(console.error)
                                    })
                                }
                            }
                        })
                    }, (new Date(cetusCycle.expiry).getTime() - new Date().getTime()) - 600000);
                }
                // ----- vallis check
                await db.query(`UPDATE worldstatealert SET vallis_status = '${vallisCycle.state}'`).catch(console.error)
                res.rows.forEach(row => {
                    row.cycles_users[vallisCycle.state].forEach(user => {
                        if (!users[row.channel_id])
                            users[row.channel_id] = []
                        if (!users[row.channel_id].includes(`<@${user}>`))
                            users[row.channel_id].push(`<@${user}>`)
                        if (row.vallis_status != vallisCycle.state) {
                            if (!cycles_changed.includes(`Orb Vallis: ${vallisCycle.state}`))
                                cycles_changed.push(`Orb Vallis: ${vallisCycle.state}`)
                            if (!ping_users[row.channel_id])
                                ping_users[row.channel_id] = []
                            if (row.ping_filter.dnd.includes(user) || row.ping_filter.offline.includes(user)) {
                                // get user discord status
                                const user_presc = client.channels.cache.get(row.channel_id)?.guild.presences.cache.find(mem => mem.userId == user)
                                if (!user_presc || user_presc.status == 'offline') {
                                    if (!row.ping_filter.offline.includes(user)) {
                                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                            ping_users[row.channel_id].push(`<@${user}>`)
                                    }
                                } else if (user_presc.status == 'dnd') {
                                    if (!row.ping_filter.dnd.includes(user)) {
                                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                            ping_users[row.channel_id].push(`<@${user}>`)
                                    }
                                } else {
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            } else {
                                if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                    ping_users[row.channel_id].push(`<@${user}>`)
                            }
                        }
                    })
                })
                // ----- cambion check
                await db.query(`UPDATE worldstatealert SET cambion_status = '${cambionCycle.active}'`).catch(console.error)
                res.rows.forEach(row => {
                    row.cycles_users[cambionCycle.active].forEach(user => {
                        if (!users[row.channel_id])
                            users[row.channel_id] = []
                        if (!users[row.channel_id].includes(`<@${user}>`))
                            users[row.channel_id].push(`<@${user}>`)
                        if (row.cambion_status != cambionCycle.active) {
                            if (!cycles_changed.includes(`Cambion Drift: ${cambionCycle.active}`))
                                cycles_changed.push(`Cambion Drift: ${cambionCycle.active}`)
                            if (!ping_users[row.channel_id])
                                ping_users[row.channel_id] = []
                            if (row.ping_filter.dnd.includes(user) || row.ping_filter.offline.includes(user)) {
                                // get user discord status
                                const user_presc = client.channels.cache.get(row.channel_id)?.guild.presences.cache.find(mem => mem.userId == user)
                                if (!user_presc || user_presc.status == 'offline') {
                                    if (!row.ping_filter.offline.includes(user)) {
                                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                            ping_users[row.channel_id].push(`<@${user}>`)
                                    }
                                } else if (user_presc.status == 'dnd') {
                                    if (!row.ping_filter.dnd.includes(user)) {
                                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                            ping_users[row.channel_id].push(`<@${user}>`)
                                    }
                                } else {
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            } else {
                                if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                    ping_users[row.channel_id].push(`<@${user}>`)
                            }
                        }
                    })
                })
                console.log('Cycles check: user mention lists' + JSON.stringify(users) + JSON.stringify(ping_users))
                // ---- construct embed
                var embed = {
                    title: 'Open World Cycles',
                    description: 'React to be notified upon cycle changes',
                    fields: [{
                        name: '__Cetus__',
                        value: `${emotes[cetusCycle.state].string} ${cetusCycle.state.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n${cetusCycle.state == "day" ? `${emotes.night.string} Starts <t:${Math.round(new Date(cetusCycle.expiry).getTime() / 1000)}:R>` : `${emotes.day.string} Starts <t:${Math.round(new Date(cetusCycle.expiry).getTime() / 1000)}:R>`}`,
                        inline: true
                    }, {
                        name: '__Orb Vallis__',
                        value: `${emotes[vallisCycle.state].string} ${vallisCycle.state.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n${vallisCycle.state == "cold" ? `Becomes ${emotes.warm.string} <t:${Math.round(new Date(vallisCycle.expiry).getTime() / 1000)}:R>` : `Becomes ${emotes.cold.string} <t:${Math.round(new Date(vallisCycle.expiry).getTime() / 1000)}:R>`}`,
                        inline: true
                    }, {
                        name: '__Cambion Drift__',
                        value: `${emotes[cambionCycle.active].string} ${cambionCycle.active.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n${cambionCycle.active == "fass" ? `${emotes.vome.string} Spawns <t:${Math.round(new Date(cambionCycle.expiry).getTime() / 1000)}:R>` : `${emotes.fass.string} Spawns <t:${Math.round(new Date(cambionCycle.expiry).getTime() / 1000)}:R>`}`,
                        inline: true
                    }],
                    color: colors.cycles
                }
                //console.log(JSON.stringify(embed))
                // ---- send msg
                res.rows.forEach(row => {
                    if (row.cycles_alert) {
                        client.channels.cache.get(row.channel_id)?.messages.fetch(row.cycles_alert).then(msg => {
                            msg.edit({
                                content: users[row.channel_id] ? users[row.channel_id].join(' ').substring(0, 2000) : ' ',
                                embeds: [embed]
                            }).catch(console.error)
                        }).catch(console.error)
                        if (ping_users[row.channel_id] && ping_users[row.channel_id].length > 0) {
                            arrToStringsArrWithLimit(`${cycles_changed.join(', ')}`, ping_users[row.channel_id], 2000).forEach(str => {
                                client.channels.cache.get(row.channel_id)?.send(str).then(msg => db_schedule_msg_deletion(msg.id, msg.channel.id, 60000)).catch(console.error)
                            })
                        }
                    }
                })
            }).catch(console.error)
            var expiry = new Date(cetusCycle.expiry).getTime()
            if (expiry > new Date(vallisCycle.expiry).getTime())
                expiry = new Date(vallisCycle.expiry).getTime()
            if (expiry > new Date(cambionCycle.expiry).getTime())
                expiry = new Date(cambionCycle.expiry).getTime()

            var timer = expiry - new Date().getTime()
            cyclesTimer = setTimeout(cycles_check, timer)
            console.log('cycles_check invokes in ' + msToTime(timer))
            return
        }).catch(err => {
            console.error(err)
            clearTimeout(cyclesTimer)
            cyclesTimer = setTimeout(cycles_check, 60000)
        })
}

async function arbitration_check() {
    console.log('arbitration_check called');

    var arbitration;

    await axios('https://api.warframestat.us/pc/arbitration')    // get data from warframestat.us
        .then(res => {
            return res.data
        }).catch(console.error)

    if (!arbitration) {
        //console.log('Arbitration check: no data available')
        var timer = 300000
        clearTimeout(arbitrationTimer)
        arbitrationTimer = setTimeout(arbitration_check, timer)
        console.log(`arbitration_check reset in ${msToTime(timer)}`)
        return
    }

    if (!arbitration.type || typeof (arbitration.type) != "string") {
        //console.log('Arbitration check: arbitrary data')
        var timer = 20000
        clearTimeout(arbitrationTimer)
        arbitrationTimer = setTimeout(arbitration_check, timer)
        //console.log(`arbitration_check reset in ${msToTime(timer)}`)
        return
    }

    if (new Date(arbitration.expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
        //console.log('Arbitration check: negative expiry')
        var timer = 20000
        clearTimeout(arbitrationTimer)
        arbitrationTimer = setTimeout(arbitration_check, timer)
        console.log(`arbitration_check reset in ${msToTime(timer)}`)
        return
    }

    const res = await db.query(`SELECT * FROM worldstatealert`).catch(console.error)

    if (!res || res.rowCount == 0) return console.error('arbitration check: unable to retrieve worldstate from db')

    var users = {}
    var ping_users = {}
    var mission = "unknown"
    try {
        if (arbitration.type.toLowerCase().match('defection'))
            mission = 'defection'
        else if (arbitration.type.toLowerCase().match('mobile defense'))
            mission = 'salvage'
        else if (arbitration.type.toLowerCase().match('defense'))
            mission = 'defense'
        else if (arbitration.type.toLowerCase().match('interception'))
            mission = 'interception'
        else if (arbitration.type.toLowerCase().match('salvage'))
            mission = 'salvage'
        else if (arbitration.type.toLowerCase().match('survival'))
            mission = 'survival'
        else if (arbitration.type.toLowerCase().match('excavation'))
            mission = 'excavation'
        else if (arbitration.type.toLowerCase().match('disruption'))
            mission = 'disruption'
        else if (arbitration.type.toLowerCase().match('solnode450'))
            mission = 'mirror_defense'
        if (mission == "unknown") {
            inform_dc('Arbitration check: mission is ' + mission + ` (${arbitration.type})`)
            console.log('Arbitration check: mission type unknown')
            var timer = 600000
            clearTimeout(arbitrationTimer)
            arbitrationTimer = setTimeout(arbitration_check, timer)
            console.log(`arbitration_check reset in ${msToTime(timer)}`)
            return
        }
        console.log('Arbitration check: mission is ' + mission + ` (${arbitration.type})`)
    } catch (e) {
        console.log(e)
        console.log('Arbitration check: unknown error')
        console.log(arbitration)
        var timer = 600000
        clearTimeout(arbitrationTimer)
        arbitrationTimer = setTimeout(arbitration_check, timer)
        console.log(`arbitration_check reset in ${msToTime(timer)}`)
        return
    }
    // -----
    db.query(`UPDATE worldstatealert SET arbitration_mission = '${mission}_${arbitration.enemy}'`).catch(console.error)
    res.rows.forEach(row => {
        row.arbitration_users[mission].forEach(user => {
            if (!users[row.channel_id])
                users[row.channel_id] = []
            if (!users[row.channel_id].includes(`<@${user}>`))
                users[row.channel_id].push(`<@${user}>`)
            if (row.arbitration_mission != `${mission}_${arbitration.enemy}`) {
                if (!ping_users[row.channel_id])
                    ping_users[row.channel_id] = []
                if (row.ping_filter.dnd.includes(user) || row.ping_filter.offline.includes(user)) {
                    // get user discord status
                    const user_presc = client.channels.cache.get(row.channel_id)?.guild.presences.cache.find(mem => mem.userId == user)
                    if (!user_presc || user_presc.status == 'offline') {
                        if (!row.ping_filter.offline.includes(user)) {
                            if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                ping_users[row.channel_id].push(`<@${user}>`)
                        }
                    } else if (user_presc.status == 'dnd') {
                        if (!row.ping_filter.dnd.includes(user)) {
                            if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                ping_users[row.channel_id].push(`<@${user}>`)
                        }
                    } else {
                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                            ping_users[row.channel_id].push(`<@${user}>`)
                    }
                } else {
                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                        ping_users[row.channel_id].push(`<@${user}>`)
                }
            }
        })
    })
    console.log('Arbitration check: user mention lists [users] :: ' + JSON.stringify(users) + ' [ping users] :: ' + JSON.stringify(ping_users))
    // ---- construct embed
    var embed = {
        title: 'Arbitration',
        description: `React to subscribe to specific mission types\n\n${emotes.defection.string} Defection | ${emotes.defense.string} Defense | ${emotes.interception.string} Interception | ${emotes.salvage.string} Salvage\n${emotes.survival.string} Survival | ${emotes.excavation.string} Excavation | ${emotes.disruption.string} Disruption\n\n**Mission**: ${convertUpper(mission)}\n**Faction**: ${arbitration.enemy}\n**Node**: ${arbitration.node}\nExpires <t:${new Date(arbitration.expiry).getTime() / 1000}:R>`,
        color: colors.arbitration
    }
    console.log(JSON.stringify(embed))
    // ---- send msg
    res.rows.forEach(row => {
        if (row.arbitration_alert) {
            client.channels.cache.get(row.channel_id)?.messages.fetch(row.arbitration_alert).then(msg => {
                msg.edit({
                    content: users[row.channel_id] ? users[row.channel_id].join(' ').substring(0, 2000) : ' ',
                    embeds: [embed]
                }).catch(console.error)
            }).catch(console.error)
            if (ping_users[row.channel_id] && ping_users[row.channel_id].length > 0) {
                arrToStringsArrWithLimit(`Arbitration ${arbitration.type} has started`, ping_users[row.channel_id], 2000).forEach(str => {
                    client.channels.cache.get(row.channel_id)?.send(str).then(msg => db_schedule_msg_deletion(msg.id, msg.channel.id, 60000)).catch(console.error)
                })
            }
        }
    })

    var timer = new Date(arbitration.expiry).getTime() - new Date().getTime()
    clearTimeout(arbitrationTimer)
    arbitrationTimer = setTimeout(arbitration_check, timer)
    console.log('arbitration_check invokes in ' + msToTime(timer))
    return

}

async function fissures_check() {
    console.log('fissures_check called');
    getWorldState('fissures')
        .then(async fissures => {

            if (!fissures) {
                console.log('Fissures check: no data available')
                var timer = 300000
                fissuresTimer = setTimeout(fissures_check, timer)
                console.log(`fissures_check reset in ${msToTime(timer)}`)
                return
            }

            db.query(`SELECT * FROM worldstatealert`).then(res => {
                if (res.rowCount == 0)
                    return

                var users = {}
                var ping_users = {}

                var fissures_list = { normal: [], steelPath: [], voidStorm: [], omnia: [] }
                var min_expiry = Infinity
                fissures.forEach(fissure => {
                    var expiry = new Date(fissure.expiry).getTime()
                    if ((expiry - new Date().getTime()) > 0) {
                        if (expiry < min_expiry)
                            min_expiry = expiry
                        if (fissure.tier == 'Omnia')
                            fissures_list.omnia.push(fissure)
                        else if (fissure.isStorm)
                            fissures_list.voidStorm.push(fissure)
                        else if (fissure.isHard)
                            fissures_list.steelPath.push(fissure)
                        else
                            fissures_list.normal.push(fissure)
                    }
                })
                fissures_list.normal.sort(dynamicSort("tierNum"))
                fissures_list.steelPath.sort(dynamicSort("tierNum"))
                fissures_list.voidStorm.sort(dynamicSort("tierNum"))
                fissures_list.omnia.sort(dynamicSort("tierNum"))

                var embed1 = {
                    title: "Fissures",
                    fields: [{
                        name: "Tier",
                        value: "",
                        inline: true
                    }, {
                        name: "Mission",
                        value: "",
                        inline: true
                    }, {
                        name: "Expires",
                        value: "",
                        inline: true
                    }],
                    color: colors.fissures
                }
                var embed2 = {
                    title: "Steel Path Fissures",
                    fields: [{
                        name: "Tier",
                        value: "",
                        inline: true
                    }, {
                        name: "Mission",
                        value: "",
                        inline: true
                    }, {
                        name: "Expires",
                        value: "",
                        inline: true
                    }],
                    color: colors.fissures
                }
                var embed3 = {
                    title: "Railjack Fissures",
                    fields: [{
                        name: "Tier",
                        value: "",
                        inline: true
                    }, {
                        name: "Mission",
                        value: "",
                        inline: true
                    }, {
                        name: "Expires",
                        value: "",
                        inline: true
                    }],
                    color: colors.fissures
                }
                var embed4 = {
                    title: "Omnia Fissures",
                    fields: [{
                        name: "Tier",
                        value: "",
                        inline: true
                    }, {
                        name: "Mission",
                        value: "",
                        inline: true
                    }, {
                        name: "Expires",
                        value: "",
                        inline: true
                    }],
                    color: colors.fissures
                }


                function LU(text) {
                    return text?.trim().toLowerCase().replace(/ /g, '_')
                }

                var ping_string = []

                var query = []
                function user_trackers(tracker_id, fissure) {
                    res.rows.forEach(row => {
                        if (row.fissures_users[tracker_id]) {
                            if (new Date(fissure.activation).getTime() > row.fissures_users[tracker_id].last_appeared) {
                                query.push(`
                                UPDATE worldstatealert
                                SET fissures_users = jsonb_set(fissures_users, '{${tracker_id.replace(`'`, `''`)},last_appeared}', '${new Date(fissure.activation).getTime()}', true);
                            `)
                            }
                            row.fissures_users[tracker_id].users.forEach(user => {
                                if (!users[row.channel_id])
                                    users[row.channel_id] = []
                                if (!users[row.channel_id].includes(`<@${user}>`))
                                    users[row.channel_id].push(`<@${user}>`)
                                if (new Date(fissure.activation).getTime() > row.fissures_users[tracker_id].last_appeared) {
                                    const str = `${fissure.isHard ? '[SP] ' : ''}${fissure.tier} ${fissure.missionType} - ${fissure.node}`
                                    if (!ping_string.includes(str))
                                        ping_string.push(str)
                                    if (!ping_users[row.channel_id])
                                        ping_users[row.channel_id] = []
                                    if (row.ping_filter.dnd.includes(user) || row.ping_filter.offline.includes(user)) {
                                        // get user discord status
                                        const user_presc = client.channels.cache.get(row.channel_id)?.guild.presences.cache.find(mem => mem.userId == user)
                                        if (!user_presc || user_presc.status == 'offline') {
                                            if (!row.ping_filter.offline.includes(user)) {
                                                if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                                    ping_users[row.channel_id].push(`<@${user}>`)
                                            }
                                        } else if (user_presc.status == 'dnd') {
                                            if (!row.ping_filter.dnd.includes(user)) {
                                                if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                                    ping_users[row.channel_id].push(`<@${user}>`)
                                            }
                                        } else {
                                            if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                                ping_users[row.channel_id].push(`<@${user}>`)
                                        }
                                    } else {
                                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                            ping_users[row.channel_id].push(`<@${user}>`)
                                    }
                                }
                            })
                        }
                    })
                }

                fissures_list.normal.forEach(fissure => {
                    embed1.fields[0].value += `${emotes[fissure.tier]?.string} ${fissure.tier}\n`
                    embed1.fields[1].value += `${fissure.missionType} - ${fissure.node}\n`
                    embed1.fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
                    // check only mission type
                    user_trackers(`normal_${LU(fissure.tier)}_${LU(fissure.missionType)}`, fissure)
                    // check only mission type + planet
                    user_trackers(`normal_${LU(fissure.tier)}_${LU(fissure.missionType)}_${LU(fissure.node.split('(')[1]?.replace(')', ''))}`, fissure)
                    // check only mission type + planet + node
                    user_trackers(`normal_${LU(fissure.tier)}_${LU(fissure.missionType)}_${LU(fissure.node.replace('(', '')?.replace(')', ''))}`, fissure)
                })
                fissures_list.steelPath.forEach(fissure => {
                    embed2.fields[0].value += `${emotes[fissure.tier]?.string} ${fissure.tier}\n`
                    embed2.fields[1].value += `${fissure.missionType} - ${fissure.node}\n`
                    embed2.fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
                    // check only mission type
                    user_trackers(`steelpath_${LU(fissure.tier)}_${LU(fissure.missionType)}`, fissure)
                    // check only mission type + planet
                    user_trackers(`steelpath_${LU(fissure.tier)}_${LU(fissure.missionType)}_${LU(fissure.node.split('(')[1]?.replace(')', ''))}`, fissure)
                    // check only mission type + planet + node
                    user_trackers(`steelpath_${LU(fissure.tier)}_${LU(fissure.missionType)}_${LU(fissure.node.replace('(', '')?.replace(')', ''))}`, fissure)
                })
                fissures_list.voidStorm.forEach(fissure => {
                    embed3.fields[0].value += `${emotes[fissure.tier]?.string} ${fissure.tier}\n`
                    embed3.fields[1].value += `${fissure.missionType} - ${fissure.node}\n`
                    embed3.fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
                    // check only mission type
                    user_trackers(`railjack_${LU(fissure.tier)}_${LU(fissure.missionType)}`, fissure)
                    // check only mission type + planet
                    user_trackers(`railjack_${LU(fissure.tier)}_${LU(fissure.missionType)}_${LU(fissure.node.split('(')[1]?.replace(')', ''))}`, fissure)
                    // check only mission type + planet + node
                    user_trackers(`railjack_${LU(fissure.tier)}_${LU(fissure.missionType)}_${LU(fissure.node.replace('(', '')?.replace(')', ''))}`, fissure)
                })
                fissures_list.omnia.forEach(fissure => {
                    embed4.fields[0].value += `${emotes[fissure.tier]?.string} ${fissure.tier}\n`
                    embed4.fields[1].value += `${fissure.missionType} - ${fissure.node}\n`
                    embed4.fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
                    // check only mission type
                    user_trackers(`omnia_${LU(fissure.tier)}_${LU(fissure.missionType)}`, fissure)
                    // check only mission type + planet
                    user_trackers(`omnia_${LU(fissure.tier)}_${LU(fissure.missionType)}_${LU(fissure.node.split('(')[1]?.replace(')', ''))}`, fissure)
                    // check only mission type + planet + node
                    user_trackers(`omnia_${LU(fissure.tier)}_${LU(fissure.missionType)}_${LU(fissure.node.replace('(', '')?.replace(')', ''))}`, fissure)
                })
                // last_appeared query
                console.log('[Fissure Tracker] query:', query.join(' '))
                db.query(query.join(' ')).catch(console.error)

                res.rows.forEach(row => {
                    if (row.fissures_alert) {
                        client.channels.cache.get(row.channel_id)?.messages.fetch(row.fissures_alert).then(msg => {
                            msg.edit({
                                content: users[row.channel_id] ? users[row.channel_id].join(' ').substring(0, 2000) : ' ',
                                embeds: [
                                    row.fissures_types.includes('normal') && embed1,
                                    row.fissures_types.includes('steelpath') && embed2,
                                    row.fissures_types.includes('railjack') && embed3,
                                    row.fissures_types.includes('omnia') && embed4
                                ].filter(o => o),
                                components: [
                                    {
                                        type: 1,
                                        components: [
                                            {
                                                type: 2,
                                                label: "Track Fissures",
                                                style: 3,
                                                custom_id: "worldstatealerts_fissures_show_modal"
                                            }, {
                                                type: 2,
                                                label: "Show Trackers",
                                                style: 1,
                                                custom_id: "worldstatealerts_fissures_show_trackers"
                                            },
                                        ]

                                    }
                                ]
                            }).catch(console.error)
                        }).catch(console.error)
                        if (ping_users[row.channel_id] && ping_users[row.channel_id].length > 0) {
                            arrToStringsArrWithLimit(`${ping_string.join(' ')}`, ping_users[row.channel_id], 2000).forEach(str => {
                                client.channels.cache.get(row.channel_id)?.send(str).then(msg => db_schedule_msg_deletion(msg.id, msg.channel.id, 60000)).catch(console.error)
                            })
                        }
                    }
                })

                var timer = min_expiry - new Date().getTime()
                if (timer < 30000 || timer == Infinity) timer = 30000
                fissuresTimer = setTimeout(fissures_check, timer)
                console.log('fissures_check invokes in ' + msToTime(timer))
            }).catch(err => {
                console.log(err)
                fissuresTimer = setTimeout(fissures_check, 60000)
            })
            return
        }).catch(err => {
            console.error(err)
            clearTimeout(fissuresTimer)
            fissuresTimer = setTimeout(fissures_check, 60000)
        })
}

async function teshin_check() {
    console.log('teshin_check called');
    getWorldState('steelPath')
        .then(async steelPath => {

            if (!steelPath) {
                console.log('Teshin check: no data available')
                var timer = 300000
                teshinTimer = setTimeout(teshin_check, timer)
                console.log(`teshin_check reset in ${msToTime(timer)}`)
                return
            }

            if (new Date(steelPath.expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
                console.log('Teshin check: negative expiry')
                var timer = 10000
                teshinTimer = setTimeout(teshin_check, timer)
                console.log(`teshin_check reset in ${msToTime(timer)}`)
                return
            }

            db.query(`SELECT * FROM worldstatealert`).then(res => {
                if (res.rowCount == 0)
                    return

                const currentReward = teshin_item_replace(steelPath.currentReward.name)

                db.query(`UPDATE worldstatealert SET teshin_rotation = '${currentReward}'`).catch(console.error)

                var users = {}
                var ping_users = {}

                res.rows.forEach(row => {
                    row.teshin_users[currentReward].forEach(user => {
                        if (!users[row.channel_id])
                            users[row.channel_id] = []
                        if (!users[row.channel_id].includes(`<@${user}>`))
                            users[row.channel_id].push(`<@${user}>`)
                        if (row.teshin_rotation != currentReward) {
                            if (!ping_users[row.channel_id])
                                ping_users[row.channel_id] = []
                            if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                ping_users[row.channel_id].push(`<@${user}>`)
                        }
                    })
                })

                const next_rotation = (function () {
                    var flag = false
                    for (const item of steelPath.rotation) {
                        if (flag)
                            return teshin_item_replace(item.name)
                        if (steelPath.currentReward.name == item.name)
                            flag = true
                    }
                    return teshin_item_replace(steelPath.rotation[0].name)
                })();

                var embed = {
                    title: 'Teshin Rotation (Steel Path)',
                    description: `React to subscribe to a specific item rotation`,
                    fields: [{
                        name: "Current rotation",
                        value: `${emotes[currentReward].string} __${steelPath.currentReward.name}__`,
                        inline: true
                    }, {
                        name: "Cost",
                        value: `${emotes.steel_essence.string} ${steelPath.currentReward.cost}`,
                        inline: true
                    }, {
                        name: "Full rotation",
                        value: "",
                        inline: false
                    }, {
                        name: "Next rotation",
                        value: `${emotes[next_rotation].string} <t:${Math.round(new Date(steelPath.expiry).getTime() / 1000)}:R>`,
                        inline: false
                    }],
                    color: colors.teshin
                }

                steelPath.rotation.forEach(rotation => {
                    embed.fields[2].value += teshin_item_replace(rotation.name) == currentReward ? `${emotes[teshin_item_replace(rotation.name)].string} \`${rotation.name}\`\n` : `${emotes[teshin_item_replace(rotation.name)].string} ${rotation.name}\n`
                })

                res.rows.forEach(row => {
                    if (row.teshin_alert) {
                        client.channels.cache.get(row.channel_id)?.messages.fetch(row.teshin_alert).then(msg => {
                            msg.edit({
                                content: users[row.channel_id] ? users[row.channel_id].join(' ').substring(0, 2000) : ' ',
                                embeds: [embed]
                            }).catch(console.error)
                        }).catch(console.error)
                        if (ping_users[row.channel_id] && ping_users[row.channel_id].length > 0) {
                            arrToStringsArrWithLimit(`Teshin rotation: ${steelPath.currentReward.name}`, ping_users[row.channel_id], 2000).forEach(str => {
                                client.channels.cache.get(row.channel_id)?.send(str).then(msg => db_schedule_msg_deletion(msg.id, msg.channel.id, 60000)).catch(console.error)
                            })
                        }
                    }
                })

                function teshin_item_replace(string) {
                    return string
                        .replace("Umbra Forma Blueprint", "umbra_forma")
                        .replace("50,000 Kuva", "kuva")
                        .replace("Kitgun Riven Mod", "kitgun_riven")
                        .replace("3x Forma", "forma")
                        .replace("Zaw Riven Mod", "zaw_riven")
                        .replace("30,000 Endo", "endo")
                        .replace("Rifle Riven Mod", "rifle_riven")
                        .replace("Shotgun Riven Mod", "shotgun_riven")
                }
            }).catch(console.error)

            var timer = (new Date(steelPath.expiry).getTime() - new Date().getTime())
            teshinTimer = setTimeout(teshin_check, timer)
            console.log('teshin_check invokes in ' + msToTime(timer))
            return
        }).catch(err => {
            console.error(err)
            clearTimeout(teshinTimer)
            teshinTimer = setTimeout(teshin_check, 60000)
        })
}

async function alerts_check() {
    console.log('alerts_check called');
    getWorldState('alerts')
        .then(async alerts => {

            db.query(`SELECT * FROM worldstatealert`).then(res => {
                if (res.rowCount == 0)
                    return

                if (!alerts || alerts.length == 0) {
                    // check back in 60m
                    var timer = 3600000
                    alertsTimer = setTimeout(alerts_check, timer)
                    console.log(`alerts_check: no data available, reset in ${msToTime(timer)}`)
                    db.query(`UPDATE worldstatealert SET alerts_rewards = '[]'`).catch(console.error)
                    res.rows.forEach(row => {
                        if (row.alerts_alert) {
                            client.channels.cache.get(row.channel_id)?.messages.fetch(row.alerts_alert).then(msg => {
                                msg.edit({
                                    content: ' ',
                                    embeds: [{
                                        title: 'Alerts',
                                        description: `React to subscribe to specific rewards\n\nNo alerts to show right now. Checking back <t:${Math.round((new Date().getTime() + timer) / 1000)}:R>`,
                                        color: colors.alerts
                                    }]
                                }).catch(console.error)
                            }).catch(console.error)
                        }
                    })
                    return
                }
                if (new Date(alerts[0].expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
                    var timer = 10000
                    alertsTimer = setTimeout(alerts_check, timer)
                    console.log(`alerts_check: negative expiry, reset in ${msToTime(timer)}`)
                    return
                }

                var users = {}
                var ping_users = {}

                var mission_list = []
                var alerts_rewards = []
                alerts.forEach(alert => {
                    mission_list.push({
                        title: alert.mission.description,
                        node: `${alert.mission.node} - ${alert.mission.type}`,
                        reward: alert.mission.reward.asString,
                        expiry: Math.round(new Date(alert.expiry).getTime() / 1000),
                    })
                    var active_reward = alert.mission.reward.asString.toLowerCase().replace(/ /g, '_')
                    if (active_reward.match('orokin_reactor')) active_reward = 'orokin_reactor'
                    else if (active_reward.match('orokin_catalyst')) active_reward = 'orokin_catalyst'
                    else if (active_reward.match('umbra_forma')) active_reward = 'umbra_forma'
                    else if (active_reward.match('forma_umbra')) active_reward = 'umbra_forma'
                    else if (active_reward.match('forma')) active_reward = 'forma'
                    alerts_rewards.push(active_reward)

                    res.rows.forEach(row => {
                        if (row.alerts_users[active_reward]) {
                            row.alerts_users[active_reward].forEach(user => {
                                if (!users[row.channel_id])
                                    users[row.channel_id] = []
                                if (!users[row.channel_id].includes(`<@${user}>`))
                                    users[row.channel_id].push(`<@${user}>`)
                                if (!row.alerts_rewards.includes(active_reward)) {
                                    if (!ping_users[row.channel_id])
                                        ping_users[row.channel_id] = []
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            })
                        }
                    })
                })

                db.query(`UPDATE worldstatealert SET alerts_rewards = '${JSON.stringify(alerts_rewards)}'`).catch(console.error)

                var embed = {
                    title: 'Alerts',
                    description: `React to subscribe to specific rewards`,
                    fields: [{
                        name: "Mission",
                        value: '',
                        inline: true
                    }, {
                        name: "Reward",
                        value: '',
                        inline: true
                    }, {
                        name: "Expires",
                        value: '',
                        inline: true
                    }],
                    color: colors.alerts
                }
                mission_list.forEach(mission => {
                    embed.fields[0].value += mission.node + '\n'
                    embed.fields[1].value += mission.reward + '\n'
                    embed.fields[2].value += '<t:' + mission.expiry + ':R>' + '\n'
                })

                res.rows.forEach(row => {
                    if (row.alerts_alert) {
                        client.channels.cache.get(row.channel_id)?.messages.fetch(row.alerts_alert).then(msg => {
                            msg.edit({
                                content: users[row.channel_id] ? users[row.channel_id].join(' ').substring(0, 2000) : ' ',
                                embeds: [embed]
                            }).catch(console.error)
                        }).catch(console.error)
                        if (ping_users[row.channel_id] && ping_users[row.channel_id].length > 0) {
                            arrToStringsArrWithLimit(`Alert reward: ${convertUpper(alerts_rewards.join(', '))}`, ping_users[row.channel_id], 2000).forEach(str => {
                                client.channels.cache.get(row.channel_id)?.send(str).then(msg => db_schedule_msg_deletion(msg.id, msg.channel.id, 60000)).catch(console.error)
                            })
                        }
                    }
                })
                var timer = 3600000
                alertsTimer = setTimeout(alerts_check, timer)
                console.log(`alerts_check invokes in ${msToTime(timer)}`)
            }).catch(console.error)
        }).catch(err => {
            console.error(err)
            clearTimeout(alertsTimer)
            alertsTimer = setTimeout(alerts_check, 60000)
        })
}

async function global_upgrades_check() {
    console.log('global_upgrades_check called');
    getWorldState('globalUpgrades')
        .then(async global_upgrades => {

            db.query(`SELECT * FROM worldstatealert`).then(res => {
                if (res.rowCount == 0)
                    return

                if (!global_upgrades || global_upgrades.length == 0) {
                    // check back in 60m
                    var timer = 3600000
                    global_upgrades_timer = setTimeout(global_upgrades_check, timer)
                    console.log(`global_upgrades_check: no data available, reset in ${msToTime(timer)}`)
                    res.rows.forEach(row => {
                        if (row.global_upgrades_alert) {
                            client.channels.cache.get(row.channel_id)?.messages.fetch(row.global_upgrades_alert).then(msg => {
                                msg.edit({
                                    content: ' ',
                                    embeds: [{
                                        title: 'Event Booster',
                                        description: `React to be notified when a booster is active\n\nNo booster active right now. Checking back <t:${Math.round((new Date().getTime() + timer) / 1000)}:R>`,
                                        //footer: {text: 'Note: This alert is unstable at the moment'},
                                        color: colors.global_upgrades
                                    }]
                                }).catch(console.error)
                            }).catch(console.error)
                        }
                    })
                    return
                }

                if (new Date(global_upgrades[0].end).getTime() < new Date().getTime()) {     //negative expiry, retry
                    var timer = 10000
                    global_upgrades_timer = setTimeout(global_upgrades_check, timer)
                    console.log(`global_upgrades_check: negative expiry, reset in ${msToTime(timer)}`)
                    return
                }

                var active_booster = [];

                global_upgrades.forEach(booster => {
                    active_booster.push(booster.upgrade.toLowerCase().replace(/ /g, '_')
                        .replace('mission_kill_xp', 'affinity_booster')
                        .replace('resource_drop_amount', 'resource_drop_amount_booster')
                        .replace('credit_drop_chance', 'credit_booster')
                        .replace('credit_drop_amount', 'credit_booster')
                    )
                })

                db.query(`UPDATE worldstatealert SET active_booster = '${JSON.stringify(active_booster)}'`).catch(console.error)

                var users = {}
                var ping_users = {}

                res.rows.forEach(row => {
                    active_booster.forEach(booster => {
                        row.global_upgrades_users[booster.toLowerCase()].forEach(user => {
                            if (!users[row.channel_id])
                                users[row.channel_id] = []
                            if (!users[row.channel_id].includes(`<@${user}>`))
                                users[row.channel_id].push(`<@${user}>`)
                            if (!row.active_booster.includes(booster)) {
                                if (!ping_users[row.channel_id])
                                    ping_users[row.channel_id] = []
                                if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                    ping_users[row.channel_id].push(`<@${user}>`)
                            }
                        })
                    })
                })

                var embed = {
                    title: 'Event Booster',
                    description: `React to be notified when a booster is active`,
                    fields: [{
                        name: "Active booster",
                        value: active_booster.map(booster => `${convertUpper(booster)}\n`).toString().replace(/,/g, ''),
                        inline: true
                    }, {
                        name: "Expires",
                        value: global_upgrades.map(upgrade => `<t:${Math.round(new Date(upgrade.end).getTime() / 1000)}:R>\n`).toString().replace(/,/g, ''),
                        inline: true
                    }],
                    color: colors.global_upgrades
                }

                res.rows.forEach(row => {
                    if (row.global_upgrades_alert) {
                        client.channels.cache.get(row.channel_id)?.messages.fetch(row.global_upgrades_alert).then(msg => {
                            msg.edit({
                                content: users[row.channel_id] ? users[row.channel_id].join(' ').substring(0, 2000) : ' ',
                                embeds: [embed]
                            }).catch(console.error)
                        }).catch(console.error)
                        if (ping_users[row.channel_id] && ping_users[row.channel_id].length > 0) {
                            arrToStringsArrWithLimit(`Event booster: ${convertUpper(active_booster.toString())}`, ping_users[row.channel_id], 2000).forEach(str => {
                                client.channels.cache.get(row.channel_id)?.send(str).then(msg => db_schedule_msg_deletion(msg.id, msg.channel.id, 60000)).catch(console.error)
                            })
                        }
                    }
                })
                var timer = 3600000
                global_upgrades_timer = setTimeout(global_upgrades_check, timer)
                console.log('global_upgrades_check invokes in ' + msToTime(timer))
                return
            }).catch(console.error)
        }).catch(err => {
            console.error(err)
            clearTimeout(global_upgrades_timer)
            global_upgrades_timer = setTimeout(global_upgrades_check, 60000)
        })
}

async function invasions_check() {
    console.log('invasions_check called');
    getWorldState('invasions')
        .then(async invasions => {

            db.query(`SELECT * FROM worldstatealert`).then(res => {
                if (res.rowCount == 0)
                    return

                if (!invasions || invasions.length == 0) {
                    // check back in 5m
                    var timer = 300000
                    invasions_timer = setTimeout(invasions_check, timer)
                    console.log(`invasions_check: no data available, reset in ${msToTime(timer)}`)
                    res.rows.forEach(row => {
                        if (row.invasions_alert) {
                            client.channels.cache.get(row.channel_id)?.messages.fetch(row.invasions_alert).then(msg => {
                                msg.edit({
                                    content: ' ',
                                    embeds: [{
                                        title: 'Invasions',
                                        description: `React to subscribe to specific rewards\n\n${emotes.forma.string} Forma BP${'\u3000'.repeat(5)}${emotes.orokin_catalyst.string} Orokin Catalyst BP${'\u3000'.repeat(5)}${emotes.orokin_reactor.string} Orokin Reactor BP\n${emotes.fieldron.string} Fieldron${'\u3000'.repeat(5)}${'\u202F'.repeat(6)}${emotes.detonite_injector.string} Detonite Injector${'\u3000'.repeat(5)}${'\u202F'.repeat(6)}${emotes.mutagen_mass.string} Mutagen Mass\n${emotes.exilus_adapter_blueprint.string} Exilus Adapater BP${'\u3000'.repeat(1)}${'\u202F'.repeat(2)}${emotes.mutalist_alad_v_nav_coordinate.string} Mutalist Alad V Nav Coordinate\n${emotes.snipetron_vandal.string} Snipetron Vandal BP & Parts${'\u3000'.repeat(5)}${emotes.dera_vandal.string} Dera Vandal BP & Parts\n${emotes.twin_vipers_wraith.string} Twin Vipers Wraith BP & Parts${'\u3000'.repeat(4)}${'\u202F'.repeat(1)}${emotes.sheev.string} Sheev BP & Parts\n${emotes.latron_wraith.string} Latron Wraith BP & Parts${'\u3000'.repeat(6)}${'\u202F'.repeat(3)}${emotes.karak_wraith.string} Karak Wraith BP & Parts\n${emotes.strun_wraith.string} Strun Wraith BP & Parts`,
                                        color: colors.invasions
                                    }]
                                }).catch(console.error)
                            }).catch(console.error)
                        }
                    })
                    return
                }

                var rewards_list = []

                var users = {}
                var ping_users = {}
                var invasions_list = []
                var invasions_rewards = []
                var ping_rewards = []

                invasions.forEach(invasion => {
                    if (invasion.completed) return

                    invasions_list.push({
                        title: invasion.desc,
                        node: `${invasion.node}`,
                        reward: `${invasion.attacker.reward ? invasion.attacker.reward.asString.replace('Wraith Twin Vipers', 'Twin Vipers Wraith') : ''} ${(invasion.attacker.reward && invasion.defender.reward) ? 'vs' : ''} ${invasion.defender.reward ? invasion.defender.reward.asString.replace('Wraith Twin Vipers', 'Twin Vipers Wraith') : ''}`.trim(),
                        // expiry: Math.round((new Date().getTime() + invasion.getRemainingTime()) / 1000),
                        expiry: invasion.eta,
                        completed: invasion.completed
                    })

                    invasion.attacker.reward?.countedItems.forEach(item => {
                        var str = item.key.toLowerCase().replace(/ /g, '_') + '_' + new Date(invasion.activation).getTime()
                        str = str.replace('wraith_twin_vipers', 'twin_vipers_wraith')
                        if (!rewards_list.includes(str))
                            invasions_rewards.push(str)

                    })
                    invasion.defender.reward?.countedItems.forEach(item => {
                        var str = item.key.toLowerCase().replace(/ /g, '_') + '_' + new Date(invasion.activation).getTime()
                        str = str.replace('wraith_twin_vipers', 'twin_vipers_wraith')
                        if (!rewards_list.includes(str))
                            invasions_rewards.push(str)
                    })

                })

                db.query(`UPDATE worldstatealert SET invasions_rewards = '${JSON.stringify(invasions_rewards)}'`).catch(console.error)

                invasions_rewards.forEach(active_reward => {
                    var active_reward_key = active_reward.split('_')
                    active_reward_key.pop()
                    active_reward_key = active_reward_key.join('_')
                    res.rows.forEach(row => {
                        if (row.invasions_users[active_reward_key]) {
                            row.invasions_users[active_reward_key].forEach(user => {
                                if (!users[row.channel_id])
                                    users[row.channel_id] = []
                                if (!users[row.channel_id].includes(`<@${user}>`))
                                    users[row.channel_id].push(`<@${user}>`)
                                if (!row.invasions_rewards.includes(active_reward)) {
                                    if (!ping_rewards.includes(active_reward_key))
                                        ping_rewards.push(active_reward_key)
                                    if (!ping_users[row.channel_id])
                                        ping_users[row.channel_id] = []
                                    if (!ping_users[row.channel_id].includes(`<@${user}>`))
                                        ping_users[row.channel_id].push(`<@${user}>`)
                                }
                            })
                        }
                    })
                })

                var embed = {
                    title: 'Invasions',
                    description: `React to subscribe to specific rewards\n\n${emotes.forma.string} Forma BP${'\u3000'.repeat(5)}${emotes.orokin_catalyst.string} Orokin Catalyst BP${'\u3000'.repeat(5)}${emotes.orokin_reactor.string} Orokin Reactor BP\n${emotes.fieldron.string} Fieldron${'\u3000'.repeat(5)}${'\u202F'.repeat(6)}${emotes.detonite_injector.string} Detonite Injector${'\u3000'.repeat(5)}${'\u202F'.repeat(6)}${emotes.mutagen_mass.string} Mutagen Mass\n${emotes.exilus_adapter_blueprint.string} Exilus Adapater BP${'\u3000'.repeat(1)}${'\u202F'.repeat(2)}${emotes.mutalist_alad_v_nav_coordinate.string} Mutalist Alad V Nav Coordinate\n${emotes.snipetron_vandal.string} Snipetron Vandal BP & Parts${'\u3000'.repeat(5)}${emotes.dera_vandal.string} Dera Vandal BP & Parts\n${emotes.twin_vipers_wraith.string} Twin Vipers Wraith BP & Parts${'\u3000'.repeat(4)}${'\u202F'.repeat(1)}${emotes.sheev.string} Sheev BP & Parts\n${emotes.latron_wraith.string} Latron Wraith BP & Parts${'\u3000'.repeat(6)}${'\u202F'.repeat(3)}${emotes.karak_wraith.string} Karak Wraith BP & Parts\n${emotes.strun_wraith.string} Strun Wraith BP & Parts`,
                    fields: [{
                        name: "Node",
                        value: '',
                        inline: true
                    }, {
                        name: "Reward",
                        value: '',
                        inline: true
                    }, {
                        name: "Estimated Expiry",
                        value: '',
                        inline: true
                    }],
                    //footer: {text: 'Note: This alert is unstable at the moment'},
                    color: colors.invasions
                }
                invasions_list = invasions_list.sort(dynamicSort("expiry"))
                invasions_list.forEach(invasion => {
                    embed.fields[0].value += invasion.node + '\n'
                    embed.fields[1].value += rewardIcon(invasion.reward) + '\n'
                    embed.fields[2].value += invasion.expiry + '\n'
                    // if (invasion.expiry == Infinity || invasion.expiry == -Infinity || invasion.expiry > ((new Date().getTime() + 172800000) / 1000))
                    //     embed.fields[2].value += 'Not estimated yet' + '\n'
                    // else
                    //     embed.fields[2].value += '<t:' + invasion.expiry + ':R>' + '\n'
                })

                res.rows.forEach(row => {
                    if (row.invasions_alert) {
                        client.channels.cache.get(row.channel_id)?.messages.fetch(row.invasions_alert).then(msg => {
                            msg.edit({
                                content: users[row.channel_id] ? users[row.channel_id].join(' ').substring(0, 2000) : ' ',
                                embeds: [embed]
                            }).catch(console.error)
                        }).catch(console.error)
                        if (ping_users[row.channel_id] && ping_users[row.channel_id].length > 0) {
                            arrToStringsArrWithLimit(`Invasion reward: ${convertUpper(ping_rewards.join(', ').replace(/_/g, ' '))}`, ping_users[row.channel_id], 2000).forEach(str => {
                                client.channels.cache.get(row.channel_id)?.send(str).then(msg => db_schedule_msg_deletion(msg.id, msg.channel.id, 60000)).catch(console.error)
                            })
                        }
                    }
                })

                function rewardIcon(rewardString) {
                    rewardString = rewardString.toLowerCase().replace(/ /g, '_')
                    Object.keys(emotes).forEach(emote => {
                        if (rewardString.match(emote)) {
                            rewardString = rewardString.replace(emote, emotes[emote].string.replace(/_/g, '@@'))
                        }
                    })
                    rewardString = convertUpper(rewardString)
                    rewardString = rewardString.replace(/@@/g, '_')
                    return rewardString
                }

                var timer = 300000
                invasions_timer = setTimeout(invasions_check, timer)
                console.log('invasions_check invokes in ' + msToTime(timer))
            }).catch((err) => {
                console.log(err)
                invasions_timer = setTimeout(invasions_check, 60000)
            })
        }).catch(err => {
            console.error(err)
            clearTimeout(invasions_timer)
            invasions_timer = setTimeout(invasions_check, 60000)
        })
}

module.exports = { wssetup, setupReaction, bot_initialize, interaction_handler };