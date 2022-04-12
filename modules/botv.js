const {client} = require('./discord_client.js');
const { MessageAttachment } = require('discord.js');
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

    var data_backgroundColor = []
    var data = []

    //get data from server
    client.guilds.cache.get('776804537095684108').roles.cache.map(role => {
        if (role.name == "MR8+" || role.name == "MR16+" || role.name == "MR20+" || role.name == "MR25+" || role.name == "MR30+") {
            data_backgroundColor.push(role.color)
            data.push(role.members.length)
        }
    })

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
            msg.edit({
                content: ' ',
                embeds: [{
                    description: `
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
        })
    }).catch(err => console.log(err))
}

module.exports = {
    updateMasteryDistr
}