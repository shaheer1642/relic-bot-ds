const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');

async function trade_tut(message,args) {
    var postdata = {
        content: " ",
        embeds: [{
            description: 
`
Posting new/existing order
**wtb volt 160p**

Posting existing orders
**my orders**

Posting multiple orders
**wtb loki p systems 100p, limbo, nekros prime bp**

Matching top price
**wts ash auto**

Closing all orders
**close all**
`,
            color: "FFFFFF"
        }]
    }
    client.channels.cache.get('892160436881993758').messages.fetch('893138411861446676')
    .then(msg => {
        msg.edit(postdata).catch(err => console.log(err))
    })
    .catch(err => console.log(err))
    client.channels.cache.get('893133821313187881').messages.fetch('893138412301860865')
    .then(msg => {
        msg.edit(postdata).catch(err => console.log(err))
    })
    .catch(err => console.log(err))
    client.channels.cache.get('892108718358007820').messages.fetch('893138411995689080')
    .then(msg => {
        msg.edit(postdata).catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

async function lich_tut(message,args) {
    var postdata = {
        content: " ",
        embeds: [{
            description: 
`
Posting new lich
**/lich**

Editing existing lich
(under dev.)

Posting existing orders
**my orders**

Close all orders
**close all**
`,
            color: "FFFFFF"
        }]
    }
    client.channels.cache.get('892003772698611723').messages.fetch('914453068978978842')
    .then(msg => {
        msg.edit(postdata).catch(err => console.log(err))
    })
    .catch(err => console.log(err))
    client.channels.cache.get('906555131254956042').messages.fetch('914453068983201884')
    .then(msg => {
        msg.edit(postdata).catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

async function ducat_template(message) {
    if (message.author.id != '253525146923433984') {
        message.channel.send(`You do not have permission to use this command`).catch(err => console.log(err))
        return
    }
    var postdata = {content: ''}
    postdata.content = '```md\nNotes:\nThis data will be updated every 5 mins\n\nColors & filters:\nIf price per part is less than 4, whipser is filtered out (usually troll orders)\nIf quantity is 1, it is filtered out\n<If quantity is 2, it is highlighted yellow>\nIf quantity is 2 but price is greater than 19p, it is filtered out\nIf quantity is 3 but price is greater than 30p, it is filtered out\n[If quantity is equal to 3 but price is lower than 25p, it is highlighted cyan][]\n[If quantity is equal to 4 but price is lower than 48p, it is highlighted cyan][]\n[If quantity is greater than 4, it is highlighted cyan][]\n```\nReact with the following emotes to obtain the given roles below. These roles are mentioned whenever a *new* trader appears with the given criteria. Removing reaction should remove the role. (If any suggestions, dm MrSofty)\n\n:star:   `(Ducats-1) :: Quantity >= 6 AND AvgPrice <= 10.00p`\n:gem:   `(Ducats-2) :: Quantity >= 4 AND AvgPrice <= 8.00p`\n\n:red_circle:   `:: Ping on \'Do not Disturb\'`\n:purple_circle:   `:: Ping on \'Invisible\'/offline`\n\nUse the following command to let your fellow buyers know if you have already bought ducats from a seller\n`.bought seller_name`\nUse the following command to force update if needed\n`.update`'
    const channel = client.channels.cache.get('899290597259640853')
    await channel.messages.fetch()
    channel.messages.cache.get('899402069159608320').edit(postdata).catch(err => console.log(err))
    .then(res => {
        res.react('⭐').catch(err => console.log(err))
        res.react('💎').catch(err => console.log(err))
        res.react('🔴').catch(err => console.log(err))
        res.react('🟣').catch(err => console.log(err))
    })
}

async function getMessage(message,args) {
    if (message.author.id != '253525146923433984') {
        message.channel.send('You do not have permission to use this command').catch(err => console.log(err))
        return
    }
    if (!args[0])
        return
    if (!args[1])
        return
    if (args[2])
        return
    client.channels.cache.get(args[0]).messages.fetch(args[1])
    .then(msg => {
        console.log(msg)
        console.log('getmessage executed')
    })
    .catch(err => console.log(err))
    return
}

async function launchNuke(message,args) {
    message.channel.send({
        content: ' ',
        embeds: [
            {
                description: `Nuking VRC <t:${Math.round((new Date().getTime() + 3600000)/1000)}:R> (<t:${Math.round((new Date().getTime() + 3600000)/1000)}:f>)`
            }
        ]
    }).catch(err => console.log(err));
    return
}

async function saySomething(message,args) {
    message.channel.send({
        content: message.content.replace('.say ',''),
        embeds: []
    }).catch(err => console.log(err));
    return
}

async function qnaFaq(message,args) {
    message.channel.send('https://cdn.discordapp.com/attachments/912395290701602866/919978179458908160/qna_faq.png').catch(err => console.log(err))
    message.channel.send({
        content: ' ',
        embeds: [{
            description: 
`
**Q: How to post an order?**
A: Use the [wts/wtb](https://discord.com/channels/832677897411493949/864199722676125757/919961847019470928) command in #active-trade-orders

**Q: How do I close all my active orders?**
A: Use the [close all](https://discord.com/channels/832677897411493949/864199722676125757/919973578634592287) command in #active-trade-orders

**Q: Why can I not sell my item above average price?**
A: The average prices are calculated from WFM on daily basis. If your price exceeds by a decent margin, the order is not allowed to be posted. Try lowering your sell price

**Q: How do I contact a seller?**
A: Please react with the desired seller's emoji number, and then the bot will open a trade chat for you and the trader.

**Q: How does the rating system work?**
A: Your profile rating is based upon the amount of successful orders you have filled. If you got reported and a morderator doesn't approve of your trade, your rating will go down

**Q: I am facing some issues registering my IGN. Can I get help?**
A: Please directly contact MrSofty#7926
`,
            color: '#fcd303'
        }]
    }).catch(err => console.log(err))
}

async function tbcommandslist(message,args) {
    const wtswtb = 'https://discord.com/channels/832677897411493949/864199722676125757/919961847019470928'
    const myorders = 'https://discord.com/channels/832677897411493949/864199722676125757/919970534014472192'
    const closeall = 'https://discord.com/channels/832677897411493949/864199722676125757/919973578634592287'
    const leaderboard = 'https://discord.com/channels/832677897411493949/864199722676125757/919974517844086865'
    const wtswtbactive = 'https://discord.com/channels/832677897411493949/864199722676125757/919961893345558538'
    const myordersactive = 'https://discord.com/channels/832677897411493949/864199722676125757/919970568508436532'
    const closeallactive = 'https://discord.com/channels/832677897411493949/864199722676125757/919973620678287420'
    const wtswtbspam = 'https://discord.com/channels/832677897411493949/864199722676125757/919966480693604483'
    const myordersspam = 'https://discord.com/channels/832677897411493949/864199722676125757/919971651976835093'
    const leaderboardspam = 'https://discord.com/channels/832677897411493949/864199722676125757/919974553713770568'
    message.channel.send('https://cdn.discordapp.com/attachments/912395290701602866/919982233777995816/list_of_commands.png').catch(err => console.log(err))
    message.channel.send({
        content: ' ',
        embeds: [{
            fields: [
                {
                    name: 'Command',
                    value: `[Wts/Wtb](${wtswtb})\n[My orders](${myorders})\n[Close all](${closeall})\n[Leaderboard](${leaderboard})`,
                    inline: true
                },
                {
                    name: '\u200b',
                    value: `[#active-trade-orders](${wtswtbactive})\n[#active-trade-orders](${myordersactive})\n[#active-trade-orders](${closeallactive})`,
                    inline: true
                },
                {
                    name: '\u200b',
                    value: `[#trade-bot-spam](${wtswtbspam})\n[#trade-bot-spam](${myordersspam})\n\n[#trade-bot-spam](${leaderboardspam})`,
                    inline: true
                }
            ],
            color: '#fcd303'
        }]
    }).catch(err => console.log(err))
}

function posttbcommandtut(message,args) {
    if (message.author.id != '253525146923433984')
        return
    message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919961846847533096/wtb_wts.png')
    .then(res => {
        const wtswtb = `https://discord.com/channels/${message.guildId}/${message.channelId}/${res.id}`
        message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919959670649675827/active_trade_orders.png')
        .then(res => {
            const wtswtbactive = `https://discord.com/channels/${message.guildId}/${message.channelId}/${res.id}`
message.channel.send(`_ _
**Description:** 
            Post or edit an order for any tradable item

**Commands:**
            \`wts volt\`                    <---- Avg item price is selected
            \`wts volt 140p\`
            \`wtb volt, loki 200p, arcane energize\`          <---- Multiple orders are posted
            \`wts primed chamber auto\`         <----- Match currently active order top price
            \`wts blind rage maxed\`

**Usage example:**`)
            .then(res => {
                message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919964109427068938/screen_1.PNG')
                .then(res => {
message.channel.send(`_ _
**Notes:**
            If a relevant active seller is found for your given price, a trade will automatically be opened
            You cannot post order for a price greater than 120% or less than 80% of the average price
            Your active orders will be auto closed after 3 hours.
            Your orders will immediately be closed if detected offline on discord`)
.then(res => {
                        message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919966480383238224/trade_bot_spam.png')
                        .then(res => {
                            const wtswtbspam = `https://discord.com/channels/${message.guildId}/${message.channelId}/${res.id}`
message.channel.send(`_ _
**Description:** 
            Retrieve traders for a given item

**Commands:**
            \`wts volt\`
            \`wtb primed chamber\`

**Usage example:**`)
                            .then(res => {
                                message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919968714751897660/screen_3.PNG')
                                .then(res => {
                                    message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919969176255340574/screen_2.PNG')
                                    .then(res => {
                                        message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919970533817331782/my_orders.png')
                                        .then(res => {
                                            const myorders = `https://discord.com/channels/${message.guildId}/${message.channelId}/${res.id}`
                                            message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919970568600698970/active_trade_orders.png')
                                            .then(res => {
                                                const myordersactive = `https://discord.com/channels/${message.guildId}/${message.channelId}/${res.id}`
message.channel.send(`_ _
**Description:** 
            Repost all your orders to make them active

**Command:**
            \`my orders\`

_ _`)
                                                .then(res => {
                                                    message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919971652199149578/trade_bot_spam.png')
                                                    .then(res => {
                                                        const myordersspam = `https://discord.com/channels/${message.guildId}/${message.channelId}/${res.id}`
message.channel.send(`_ _
**Description:** 
            Show your profile and orders with the ability to remove them. Provide username to view another person profile

**Commands:**
            \`my profile\`
            \`my orders\`
            \`profile WFPlayer\`

**Usage example:**`)
                                                        .then(res => {
                                                            message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919972178097733632/screen_4.PNG')
                                                            .then(res => {
                                                                message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919973191143784518/screen_5.PNG')
                                                                .then(res => {
                                                                    message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919973578420674630/close_all.png')
                                                                    .then(res => {
                                                                        const closeall = `https://discord.com/channels/${message.guildId}/${message.channelId}/${res.id}`
                                                                        message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919973620527300628/active_trade_orders.png')
                                                                        .then(res => {
                                                                            const closeallactive = `https://discord.com/channels/${message.guildId}/${message.channelId}/${res.id}`
message.channel.send(`_ _
**Description:** 
            Close all your active orders and set them invisible

**Command:**
            \`close all\`

_ _`)
                                                                            .then(res => {
                                                                                message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919974517764399144/leaderboard.png')
                                                                                .then(res => {
                                                                                    const leaderboard = `https://discord.com/channels/${message.guildId}/${message.channelId}/${res.id}`
                                                                                    message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919974553759920188/trade_bot_spam.png')
                                                                                    .then(res => {
                                                                                        const leaderboardspam = `https://discord.com/channels/${message.guildId}/${message.channelId}/${res.id}`
message.channel.send(`_ _
**Description:**
            Show users list based on their plat gained and spent

**Commands:**
            \`leaderboard\`

**Usage example:**`)
                                                                                        .then(res => {
                                                                                            message.channel.send('https://cdn.discordapp.com/attachments/864199722676125757/919975034720763904/screen_6.PNG')
                                                                                            .then(res => {
                                                                                                message.channel.send('https://cdn.discordapp.com/attachments/912395290701602866/919978179458908160/qna_faq.png')
                                                                                                .then(res => {
message.channel.send({
    content: ' ',
    embeds: [{
        description: 
`
**Q: How to post an order?**
A: Use the [wts/wtb](${wtswtb}) command in #active-trade-orders
                                                                                            
**Q: How do I close all my active orders?**
A: Use the [close all](${closeall}) command in #active-trade-orders

**Q: Why can I not sell my item above average price?**
A: The average prices are calculated from WFM on daily basis. If your price exceeds by a decent margin, the order is not allowed to be posted. Try lowering your sell price

**Q: How do I contact a seller?**
A: Please react with the desired seller's emoji number, and then the bot will open a trade chat for you and the trader.

**Q: How does the rating system work?**
A: Your profile rating is based upon the amount of successful orders you have filled. If you got reported and a morderator doesn't approve of your trade, your rating will go down

**Q: I am facing some issues registering my IGN. Can I get help?**
A: Please directly contact MrSofty#7926
`,
        color: '#fcd303'
    }]
})
                                                                                                    .then(res => {
                                                                                                        message.channel.send('https://cdn.discordapp.com/attachments/912395290701602866/919982233777995816/list_of_commands.png')
                                                                                                        .then(res => {
message.channel.send({
    content: ' ',
    embeds: [{
        fields: [
            {
                name: 'Command',
                value: `[Wts/Wtb](${wtswtb})\n[My orders](${myorders})\n[Close all](${closeall})\n[Leaderboard](${leaderboard})`,
                inline: true
            },
            {
                name: '\u200b',
                value: `[#active-trade-orders](${wtswtbactive})\n[#active-trade-orders](${myordersactive})\n[#active-trade-orders](${closeallactive})`,
                inline: true
            },
            {
                name: '\u200b',
                value: `[#trade-bot-spam](${wtswtbspam})\n[#trade-bot-spam](${myordersspam})\n\n[#trade-bot-spam](${leaderboardspam})`,
                inline: true
            }
        ],
        color: '#fcd303'
    }]
})
                                                                                                            .then(res => {
                                                                                                                message.channel.send('finished.')
                                                                                                            })
                                                                                                        })
                                                                                                    })
                                                                                                })
                                                                                            })
                                                                                        })
                                                                                    })
                                                                                })
                                                                            })
                                                                        })
                                                                    })
                                                                })
                                                            })
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })
}



async function admin_test(message,args) {
    if (message.author.id != '253525146923433984')
        return
    message.channel.send('pin this!').then(msg => {
        msg.pin().catch(err => console.log(err))
    }).catch(err => console.log(err))
    return
    client.channels.cache.get('793207311891562556').messages.fetch('892630748958437416')
    .then(msg => {
        msg.react('<:four2:918420407097364480>').catch(err => console.log(err))
    }).catch(err => console.log(err))
    client.channels.cache.get('793207311891562556').messages.fetch('915914251066015774')
    .then(msg => {
        msg.react('<:five2:918420406472421387>').catch(err => console.log(err))
    }).catch(err => console.log(err))
}

async function sendMessage(message,args) {
    if (message.author.id != '253525146923433984')
        return
    var channel = args[0]
    args.shift()
    console.log(args)
    const msg = args.join(' ')
    client.channels.cache.get(channel).send(msg).catch(err => console.log(err))
    return
}

async function canvasTest(message,args) {
    var canvas = new Canvas.createCanvas(200,200)
    , ctx = canvas.getContext('2d');

    ctx.font = '30px Arial';
    ctx.rotate(-0.1);
    ctx.fillText(`${args.toString().replace(/,/g, " ")}!`, 50, 100);

    var te = ctx.measureText(`${args.toString().replace(/,/g, " ")}!`);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.lineTo(50, 102);
    ctx.lineTo(50 + te.width, 102);
    ctx.stroke();

    message.channel.send({
        content: " ", 
        files: [
            {
                attachment: canvas.toBuffer(),
                name: 'canvas.png'
            }
        ]
    }).catch(err => console.log(err))
}

module.exports = {trade_tut,lich_tut,ducat_template,getMessage,launchNuke,saySomething,admin_test,canvasTest,sendMessage,qnaFaq,tbcommandslist,posttbcommandtut};