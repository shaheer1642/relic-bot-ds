const {client} = require('./discord_client.js');
const { MessageAttachment, Message } = require('discord.js');
const fs = require('fs');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore,mod_log} = require('./extras.js');

const admin_channelId = '870385402916249611'
const report_channelId = '1000036014867353711'

function bot_initialize() {
    client.guilds.cache.get('776804537095684108').members.fetch().catch(err => console.log(err))
}

function message_handler(message) {
    if (message.channel.id == report_channelId)
        generate_report(message)
}

function generate_report(message) {
    setTimeout(() => {
        message.delete().catch(err => {
            console.log(err);
            mod_log(`Error deleting message in <#${report_channelId}>`)
        })
    }, 2000);
    client.channels.cache.get(admin_channelId).send({
        content: ' ',
        embeds: [{
            title: `Report #${Math.round(new Date().getTime() / 1000)}`,
            description: `Reported by <@${message.author.id}> (${message.author.username})\n\n${message.content}`,
            color: 'RANDOM'
        }],
        files: Array.from(message.attachments.values())
    }).catch(err => {
        console.log(err);
        console.log('report_id:',Math.round(new Date().getTime() / 1000))
        console.log(JSON.stringify(message))
        mod_log('Error generating report, <@253525146923433984> check logs')
    })
}

async function updateMasteryDistr() {
    // Create chart for mastery distribution
    const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

    const width = 300; //px
    const height = 300; //px
    const backgroundColour = 'transparent'; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour, plugins: {
        modern: ['chartjs-plugin-datalabels']
    } });

    var data_backgroundColor = ["#00000","#00000","#00000","#00000","#00000"]
    var data = [0,0,0,0,0]

    //get data from server
    try {
        client.guilds.cache.get('776804537095684108').roles.cache.map(role => {
            if (role.name == "MR 8+") {
                data_backgroundColor[0] = role.hexColor
                data[0] = role.members.size
            } else if (role.name == "MR 16+") {
                data_backgroundColor[1] = role.hexColor
                data[1] = role.members.size
            } else if (role.name == "MR 20+") {
                data_backgroundColor[2] = role.hexColor
                data[2] = role.members.size
            } else if (role.name == "MR 25+") {
                data_backgroundColor[3] = role.hexColor
                data[3] = role.members.size
            } else if (role.name == "MR 30+") {
                data_backgroundColor[4] = role.hexColor
                data[4] = role.members.size
            }

        })
    } catch (e) {
        console.log(e)
        return
    }

    const configuration = {
        type: 'doughnut',
        data: {
        labels: ['8+', '16+', '20+', '25+', '30+'],
        datasets: [{
            data: data,
            backgroundColor: data_backgroundColor
        }],
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    display: true,
                    formatter: (val, ctx) => {
                        return ctx.chart.data.labels[ctx.dataIndex];
                    },
                    color: '#000000',
                    font: {
                        size: 25
                    }
                },
            }
        }
    }
    console.log(JSON.stringify(configuration))
    
    chartJSNodeCanvas.renderToDataURL(configuration).then(dataUrl => {
        const base64Image = dataUrl
    
        var base64Data = base64Image.replace(/^data:image\/png;base64,/, "");
    
        fs.writeFile("masterydistr.png", base64Data, 'base64', function (err) {
            if (err) {
                console.log(err);
            }
        })

        const file = new MessageAttachment('masterydistr.png');

        client.channels.cache.get('891923650649939989').messages.fetch('892084165405716541').then(msg => {
            msg.removeAttachments().then(res => {
                msg.edit({
                    content: ' ',
                    embeds: [{
                        description: 
`
React to this message with desired emoji to obtain your mastery role.
<:MR8:892062162376327198> <@&891984426693697537>
<:MR16:892062164813225994> <@&891984653928525834>
<:MR20:892062164389625898> <@&891985679804928000>
<:MR25:892062165115224074> <@&891986636672487484>
<:MR30:892062165501087765> <@&891986953145290772>
`,
                        thumbnail: {
                            url: 'attachment://masterydistr.png'
                        },
                    }],
                    files: [file]
                }).catch(err => console.log(err))
            }).catch(err => console.log(err))
        })
    }).catch(err => console.log(err))
}

async function messageUpdate(oldMessage, newMessage) {
    if (newMessage.channel.id == "793207311891562556") {
        if (!newMessage.author)
            await newMessage.channel.messages.fetch(newMessage.id).catch(err => console.log(err))
        if (newMessage.author.id == "294882584201003009") {
            client.channels.cache.get('964217621266456586').send({
                content: newMessage.content,
                embeds: newMessage.embeds
            }).catch(err => console.log(err))
        }
    }
}

async function guildMemberUpdate(oldMember, newMember) {
    if ((oldMember.nickname || oldMember.displayName) == (newMember.nickname || newMember.displayName))
        return
    try {
        mod_log(`Member <@${newMember.id}> has changed their nickname\n\n${oldMember.nickname || oldMember.displayName} -> ${newMember.nickname || newMember.displayName}`,'#4287f5')
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    updateMasteryDistr,
    messageUpdate,
    guildMemberUpdate,
    bot_initialize,
    message_handler
}