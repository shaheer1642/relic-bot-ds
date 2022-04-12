const {client} = require('./discord_client.js');
const { MessageAttachment, Message } = require('discord.js');
const fs = require('fs');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore} = require('./extras.js');

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
            data: data
        }],
        backgroundColor: data_backgroundColor
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
                color: '#fff',
                backgroundColor: '#404040'
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

module.exports = {
    updateMasteryDistr
}