const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore} = require('./extras.js');

function send_msg(msg, args) {
    client.channels.cache.get('950400363410915348').send({content: 'empty'}).catch*(err => console.log(err))
    //
    
}

async function edit_main_msg() {
    var squads = {
        sq_fissures: {
            name: 'Fissures',
            id: 'sq_fissures',
            spots: 4,
            filled: 0
        },
        sq_sortie: {
            name: 'Sortie',
            id: 'sq_sortie',
            spots: 4,
            filled: 0
        },
        sq_incursions: {
            name: 'Incursions',
            id: 'sq_incursions',
            spots: 4,
            filled: 0
        },
        sq_alerts: {
            name: 'Alerts',
            id: 'sq_alerts',
            spots: 4,
            filled: 0
        },
        sq_eidolons: {
            name: 'Eidolons',
            id: 'sq_eidolons',
            spots: 4,
            filled: 0
        },
        sq_taxi_help: {
            name: 'Taxi/Help',
            id: 'sq_taxi_help',
            spots: 2,
            filled: 0
        },
        sq_mining_fishing: {
            name: 'Mining/Fishing',
            id: 'sq_mining_fishing',
            spots: 2,
            filled: 0
        },
        sq_bounties: {
            name: 'Bounties',
            id: 'sq_bounties',
            spots: 4,
            filled: 0
        },
        sq_leveling: {
            name: 'Leveling',
            id: 'sq_leveling',
            spots: 4,
            filled: 0
        },
        sq_index: {
            name: 'Index',
            id: 'sq_index',
            spots: 4,
            filled: 0
        },
        sq_arbitration: {
            name: 'Arbitration',
            id: 'sq_arbitration',
            spots: 4,
            filled: 0
        },
        sq_nightwave: {
            name: 'Nightwave',
            id: 'sq_nightwave',
            spots: 2,
            filled: 0
        },
    }
    var componentIndex = 0

    const channel = await client.channels.fetch('950400363410915348').catch(err => console.log(err))
    channel.messages.cache.get('995482866614009876').edit({
        content: ' ',
        embeds: [{
            title: 'Recruitment',
            description: 'empty'
        }],
        components: [
            {
                type: 1,
                components: getComponents()
            }
        ]
    }).catch(err => console.log(err))
    channel.messages.cache.get('995482896276148266').edit({
        content: '_ _',
        components: [
            {
                type: 1,
                components: getComponents()
            }
        ]
    }).catch(err => console.log(err))
    channel.messages.cache.get('995482901204434984').edit({
        content: '_ _',
        components: [
            {
                type: 1,
                components: getComponents()
            }
        ]
    }).catch(err => console.log(err))

    function getComponents() {
        var components = [];
        const squadsArr = Object.keys(squads)
        for (var index=0; index<squadsArr.length; index++) {
            const squad = squadsArr[index];
            if (index == componentIndex) {
                components.push({
                    type: 2,
                    label: `${squads[squad].filled}/${squads[squad].spots} ${squads[squad].name}`,
                    style: 2,
                    custom_id: squads[squad].id
                })
                componentIndex++;

                if (componentIndex % 5 == 0)
                    break;
            }
        }
        return components;
    }
}

module.exports = {
    send_msg,
    edit_main_msg
}