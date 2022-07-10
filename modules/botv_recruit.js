const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore} = require('./extras.js');

function send_msg(msg, args) {
    client.channels.cache.get('950400363410915348').send({content: 'empty'}).catch*(err => console.log(err))
    //
    
}

async function edit_main_msg() {
    var msg = await client.channels.cache.get('950400363410915348').messages.fetch('995482866614009876')
    msg.edit({
            content: ' ',
            embeds: [{
                title: 'Recruitment',
                description: 'empty'
            }],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: "1",
                            style: 1,
                            custom_id: "1"
                        },
                        {
                            type: 2,
                            label: "2",
                            style: 2,
                            custom_id: "2"
                        },
                        {
                            type: 2,
                            label: "3",
                            style: 3,
                            custom_id: "3"
                        },
                        {
                            type: 2,
                            label: "4",
                            style: 4,
                            custom_id: "4"
                        },
                        {
                            type: 2,
                            label: "5",
                            style: 4,
                            custom_id: "5"
                        },
                        {
                            type: 2,
                            label: "6",
                            style: 4,
                            custom_id: "6"
                        }
                    ]
        
                }
            ]
    }).catch(err => console.log(err))
}

module.exports = {
    send_msg,
    edit_main_msg
}