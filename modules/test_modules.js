const { post } = require('request-promise');
const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');

async function trade_tut(message,args) {
    if (message)
        if (message.author.id != '253525146923433984') {
            message.channel.send('<:LMFAOOOO:909820191314149396>').catch(err => console.log(err))
            return
        }

    var postdata = {
        content: " ",
        embeds: [{
            title: 'Trade Instructions',
            description: 'For detailed tutorial, check <#919952480266248253>',
            fields: [{
                name: '__Post order__', 
                value: 
`\`wts volt 140p\`${'\u205F'.repeat(9)}\`wtb volt, loki 200p\`${'\u205F'.repeat(9)}\`wts blind rage maxed\`
\`wts ghoulsaw\`${'\u205F'.repeat(15)}Avg Price
\`wts ghoulsaw auto\`${'\u205F'.repeat(6)}Match top price`,
                inline: true
            },{
                name: '__Open trade__',
                value: 'React with emotes like <:sell_1st:897556451533402132> <:buy_3rd:897556454842716160> ',
                inline: false
            },{
                name: '\u200b',
                value: '<#892843006560981032> commands:',
                inline: false
            },{
                name: 'Quick find trader',
                value: '`wtb/wts item_name`',
                inline: true
            },{
                name: 'User profile',
                value: '`profile player_name`',
                inline: true
            },{
                name: 'Top traders',
                value: '`leaderboard`',
                inline: true
            }],
            footer: {
                text: 'Your orders will auto-close in 3 hours, or when you go offline on Discord'
            },
            color: "FFFFFF"
        }],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "Verify",
                        style: 1,
                        custom_id: "tb_verify"
                    },
                    {
                        type: 2,
                        label: "Profile",
                        style: 2,
                        custom_id: "tb_my_profile"
                    },
                    {
                        type: 2,
                        label: "Activate Orders",
                        style: 3,
                        custom_id: "tb_actv_orders"
                    },
                    {
                        type: 2,
                        label: "Close Orders",
                        style: 4,
                        custom_id: "tb_close_orders"
                    }
                ]
    
            }
        ]
    }
    
    if (process.env.DEBUG_MODE == 1) {
        client.channels.cache.get('864199722676125757').send(postdata).catch(err => console.log(err))
        return
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
    if (message)
        if (message.author.id != '253525146923433984') {
            message.channel.send('<:LMFAOOOO:909820191314149396>').catch(err => console.log(err))
            return
        }

    var postdata = {
        content: " ",
        embeds: [{
            title: 'Lich Trading Instructions',
            description: 'For detailed tutorial, check <#919952480266248253>',
            fields: [{
                name: '__Post order__', 
                value: 'Use the command `/lich`',
                inline: true
            },{
                name: '\u200b',
                value: '\u200b',
                inline: true
            },{
                name: '__Open trade__',
                value: 'React with emotes like <:sell_1st:897556451533402132> <:buy_3rd:897556454842716160> ',
                inline: true
            },{
                name: '\u200b',
                value: '<#892843006560981032> commands:',
                inline: false
            },{
                name: 'Quick find trader',
                value: '`wtb/wts weapon_name`',
                inline: true
            }],
            footer: {
                text: 'Your orders will auto-close in 3 hours, or when you go offline on Discord'
            },
            color: "FFFFFF"
        }],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "Verify",
                        style: 1,
                        custom_id: "tb_verify"
                    },
                    {
                        type: 2,
                        label: "Profile",
                        style: 2,
                        custom_id: "tb_my_profile"
                    },
                    {
                        type: 2,
                        label: "Activate Orders",
                        style: 3,
                        custom_id: "tb_actv_lich_orders"
                    },
                    {
                        type: 2,
                        label: "Close Orders",
                        style: 4,
                        custom_id: "tb_close_lich_orders"
                    }
                ]
    
            }
        ]
    }
    
    if (process.env.DEBUG_MODE == 1) {
        client.channels.cache.get('864199722676125757').send(postdata).catch(err => console.log(err))
        return
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

async function riven_tut(message,args) {
    if (message)
        if (message.author.id != '253525146923433984') {
            message.channel.send('<:LMFAOOOO:909820191314149396>').catch(err => console.log(err))
            return
        }

    var postdata = {
        content: " ",
        embeds: [{
            title: 'Riven Trading Instructions',
            description: '(This channel is under dev.)'
        }],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "Verify",
                        style: 1,
                        custom_id: "tb_verify"
                    },
                    {
                        type: 2,
                        label: "Profile",
                        style: 2,
                        custom_id: "tb_my_profile"
                    },
                    {
                        type: 2,
                        label: "Activate Orders",
                        style: 3,
                        custom_id: "tb_actv_riven_orders"
                    },
                    {
                        type: 2,
                        label: "Close Orders",
                        style: 4,
                        custom_id: "tb_close_riven_orders"
                    }
                ]
    
            }
        ]
    }
    
    if (process.env.DEBUG_MODE == 1) {
        client.channels.cache.get('864199722676125757').send(postdata).catch(err => console.log(err))
        return
    }
    
    client.channels.cache.get('892003731523113063').messages.fetch('929501491356639292')
    .then(msg => {
        msg.edit(postdata).catch(err => console.log(err))
    })
    .catch(err => console.log(err))
    client.channels.cache.get('929499295751737455').messages.fetch('929501491310510120')
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

async function tbFullTutorial(message,args) {
    const data = {
        postOrder: {
            name: 'Posting an order',
            title: 'https://cdn.discordapp.com/attachments/912395290701602866/929879493185765406/posting_an_order.png',
            content: 
`
__**General Tradable Items**__
Use the command \`wts/wtb item_name\` in <#892160436881993758>

With price:                                 \`wts volt 140p\`         
w/o price (selects avg):         \`wtb volt\`
Match top price:                       \`wts ghoulsaw auto\`
Multiple items:                          \`wtb volt, loki 200p\`
Item rank:                                   \`wts blind rage maxed\`

__**Lich Trading**__
Use the command \`/lich\` in <#892003772698611723>

__**Riven Trading**__
(This feature is under dev.)
`,
            examples: [
                'https://cdn.discordapp.com/attachments/912395290701602866/929881903123808286/screen_1.PNG',
                'https://cdn.discordapp.com/attachments/912395290701602866/929889944732831834/lich_screen_1.PNG',
                'https://cdn.discordapp.com/attachments/912395290701602866/929889956661436466/lich_screen_2.PNG'
            ],
            hyperlink: ''
        },
        removeOrder: {
            name: 'Removing orders',
            title: 'https://cdn.discordapp.com/attachments/912395290701602866/929879493928177754/removing_orders.png',
            content: 
`
Click the Profile button in <#892160436881993758>
Or type the command \`profile\` in <#892843006560981032>

Then select your orders to remove using the select menu
`,
            examples: [
                'https://cdn.discordapp.com/attachments/912395290701602866/929873983774543942/button_profile.PNG',
                'https://cdn.discordapp.com/attachments/912395290701602866/929893499430662154/unknown.png'
            ],
            hyperlink: ''
        },
        openTrade: {
            name: 'Opening trade',
            title: 'https://cdn.discordapp.com/attachments/912395290701602866/929879495048036443/opening_trade.png',
            content: 
`
React with emotes like <:buy_2nd:897556455098580992> <:sell_5th:897556455371177984> to buy/sell the item
The emote number should match the trader's rank on the message
This will open a private channel for you and the trader to start trading
Note that your chat will be logged, in-case the trade gets reported. Which you can do by clicking the :warning: emote when trade opens. React with <:order_success:894992959177654332> if successful otherwise
Each trade will last 15m and will be archived afterwards
You should receive a DM from the bot whenever someone wants to trade you
`,
            examples: [
                'https://cdn.discordapp.com/attachments/912395290701602866/929897441661190144/unknown.png'
            ],
            hyperlink: ''
        },
        quickFind: {
            name: 'Quick find trader',
            title: 'https://cdn.discordapp.com/attachments/912395290701602866/929879493693304872/quick_find_trader.png',
            content: 
`
Use the command \`wts/wtb item_name\` in <#892843006560981032>

\`wtb arcane energize\`
\`wts kuva bramma\`

This will show you a list of traders currently online and offline
You can then open trade by clicking trader's emote
`,
            examples: [
                'https://cdn.discordapp.com/attachments/912395290701602866/929899669612527616/screen_2.5.png'
            ],
            hyperlink: ''
        },
        userProfile: {
            name: 'User profile',
            title: 'https://cdn.discordapp.com/attachments/912395290701602866/929879494150455296/user_profile.png',
            content: 
`
View another user's profile by using the command \`profile player_name\` in <#892843006560981032>
`,
            examples: [
                'https://cdn.discordapp.com/attachments/912395290701602866/929900365044916255/unknown.png'
            ],
            hyperlink: ''
        },
        leaderboard: {
            name: 'Leaderboard',
            title: 'https://cdn.discordapp.com/attachments/912395290701602866/929879494838341692/leaderboard.png',
            content: 
`
View top traders using the command \`leaderboard\` in <#892843006560981032>
`,
            examples: [
                'https://cdn.discordapp.com/attachments/912395290701602866/929901452820873246/screen_6.PNG'
            ],
            hyperlink: ''
        },
        botNotify: {
            name: 'Bot notifications',
            title: 'https://cdn.discordapp.com/attachments/912395290701602866/929879494427283496/bot_notifications.png',
            content: 
`
__**Trade Open**__
You should always receive a DM whenever someone wants to trade you

__**Order close**__
You will receive a DM whenever your order has been auto-closed after 3 hours, or if you are detected offline on Discord (You will not receive on DnD status)

__**Order remove**__
You will receive a DM if your order was auto-removed by the bot because of a change in average price (You will not receive on DnD status)

__**Notification setting**__
DM the command \`notifications\` to the bot in order to stop receiving any notification
`,
            examples: [
                'https://cdn.discordapp.com/attachments/912395290701602866/929903650397110333/unknown.png'
            ],
            hyperlink: ''
        },
        importantNotes: {
            name: 'Important notes',
            title: 'https://cdn.discordapp.com/attachments/912395290701602866/929879494641213460/important_notes.png',
            content: {
                content: ' ',
                embeds: [{
                    description: 
`
• You cannot trade if you are not verified, click the verify button below
• If a relevant active seller is found for your given price, a trade will automatically be opened when posting new order
• You cannot post order for a price greater than 120% or less than 80% of the average item price, and will be removed in-case the average price goes out of range
• You cannot post sell and buy order for a single item at the same time
• Your active orders will be auto closed after 3 hours
• Your orders will immediately be closed if detected offline on Discord
• You cannot trade if your status is invisible on Discord
`
                }],
                components: [{
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: "Verify",
                                style: 1,
                                custom_id: "tb_verify"
                            }
                        ]

                }]
            },
            examples: [],
            hyperlink: ''
        },
        qnaFaq: {
            name: 'QnA Faq',
            title: 'https://cdn.discordapp.com/attachments/912395290701602866/929879493458403418/qna_faq.png',
            content: '',
            examples: [],
            hyperlink: '',
            generate: true
        },
        tutorialCon: {
            name: 'Tutorial contents',
            title: 'https://cdn.discordapp.com/attachments/912395290701602866/929912096127324210/tutorial_contents.png',
            content: '',
            examples: [],
            hyperlink: '',
            generate: true
        }
    }

    if (message.author.id != '253525146923433984')
        return

    const edit = 1
    // editing
    if (edit) {
        //hyperlink set
        const set = {
            postOrder: 'https://discord.com/channels/865904902941048862/919952480266248253/929919375216095233',
            removeOrder: 'https://discord.com/channels/865904902941048862/919952480266248253/929919399303970816',
            openTrade: 'https://discord.com/channels/865904902941048862/919952480266248253/929919402684592148',
            quickFind: 'https://discord.com/channels/865904902941048862/919952480266248253/929919425182847036',
            userProfile: 'https://discord.com/channels/865904902941048862/919952480266248253/929919446976434197',
            leaderboard: 'https://discord.com/channels/865904902941048862/919952480266248253/929919449702731837',
            botNotify: 'https://discord.com/channels/865904902941048862/919952480266248253/929919472251310150',
            importantNotes: 'https://discord.com/channels/865904902941048862/919952480266248253/929919474675646504',
            qnaFaq: 'https://discord.com/channels/865904902941048862/919952480266248253/929919496448274543',
            tutorialCon: 'https://discord.com/channels/865904902941048862/919952480266248253/929919497589112906',
        }
        for (const key in data) {
            data[key].hyperlink = set[key]
        }
        client.channels.cache.get('919952480266248253').messages.fetch('929919497157103647')
        .then(msg => {
            msg.edit(generateContent('qnaFaq')).catch(err => console.log(err))
        }).catch(err => console.log(err))
        return
    }

    for (const key in data) {
        // send title
        var status = await message.channel.send(data[key].title)
        .then(res => {
            data[key].hyperlink = `https://discord.com/channels/${message.guildId}/${message.channelId}/${res.id}`
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status)
            break
        // send content
        if (data[key].generate)
            data[key].content = generateContent(key)
        var status = await message.channel.send(data[key].content)
        .then(res => {
            return true
        })
        .catch(err => {
            console.log(err)
            return false
        })
        if (!status)
            break
        //send examples
        if (data[key].examples.length > 0) {
            for (const example of data[key].examples) {
                var status = await message.channel.send(example)
                .then(res => {
                    return true
                })
                .catch(err => {
                    console.log(err)
                    return false
                })
                if (!status)
                    break
            }
        }
    }

    function generateContent (key) {
        if (key == "qnaFaq") {
            return {
                content: ' ',
                embeds: [{
                    description: 
`
**Q: How to [post an order](${data.postOrder.hyperlink})?**
A: Use the command \`wts/wtb item_name\` in <#892160436881993758>

**Q: How do I [remove an order](${data.removeOrder.hyperlink})?**
A: Click the 'profile' button in <#892160436881993758>
                                                                            
**Q: What does 'close all' button do?**
A: It will close all your currently active orders in that channel
                                 
**Q: What does 'activate orders' button do?**
A: It will re-activate all your profile orders in the respective channel 

**Q: Why can I not sell my item [above average price](${data.importantNotes.hyperlink})?**
A: The average prices are calculated from WFM on daily basis. If your price exceeds by a decent margin, the order is not allowed to be posted. Try lowering your sell price

**Q: How do I [contact a seller](${data.openTrade.hyperlink})?**
A: Please react with the desired seller's emoji number, and then the bot will open a trade chat for you and the trader.

**Q: How does the rating system work?**
A: Your profile rating is based upon the amount of successful orders you have filled. If you got reported and a morderator doesn't approve of your trade, your rating will go down

**Q: I am facing some issues registering my IGN. Can I get help?**
A: Please directly contact <@253525146923433984>
`,
                    color: '#fcd303'
                }]
            }
        }
        if (key == 'tutorialCon') {
            var toc = {content: ' ', embeds: [{description: '', color: '#fcd303'}]}
            for (const key in data) {
                if (data[key].content != '') {
                    toc.embeds[0].description += `**[${data[key].name}](${data[key].hyperlink})**\n`
                }
            }
            return toc
        }
    }

    message.channel.send('finished.')
    console.log(data)
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
    return
    client.channels.cache.get('793207311891562556').messages.fetch('963329927199985724').then(msg => {
        client.channels.cache.get('964217621266456586').send({
            content: msg.content,
            embeds: msg.embeds
        }).catch(err => console.log(err))
    })
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

async function sendUet(message,args) {
    if (message.author.id != '253525146923433984')
        return
    var channel = args[0]
    args.shift()
    console.log(args)
    const name = args[0]
    const url = args[1]
    client.channels.cache.get(channel).send({
        content: ' ',
        embeds: [{
            title: name,
            description: 'Google Docs',
            url: url
    }]
    }).catch(err => console.log(err))
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

async function baroArrival(message,args) {
    var time = 1637326800
    if (time <= new Date().getTime()/1000) {
        message.channel.send('Time not calculated yet.\n<@253525146923433984> Please calculate next timer daddy').catch(err => console.log(err))
        return
    }
    message.channel.send({
        content: ' ',
        embeds: [
            {
                description: `The wait is over, Tenno. Baro Ki\'Teer has arrived.\nOr did he\n\nNext arrival <t:${Math.round(time)}:R> (<t:${Math.round(time)}:f>)`,
                thumbnail: {url: 'https://cdn.discordapp.com/attachments/864199722676125757/901175987528691712/baro.png'}
            }
        ]
    }).catch(err => console.log(err));
    return
}

async function react(message,args) {
    // .react channel_id message_id emote
    client.channels.fetch(args[0]).catch(err => console.log(err)).then(channel => {
        channel.messages.fetch(args[1]).catch(err => console.log(err)).then(msg => {
            msg.react(args[2]).catch(err => console.log(err))
        })
    })
}

async function edit(message,args) {
    // .react channel_id message_id emote
    client.channels.cache.get(args[0]).messages.fetch(args[1]).then(msg => {
        msg.edit(args[2]).catch(err => console.log(err))
    }).catch(err => console.log(err))
}

module.exports = {
    trade_tut,
    lich_tut,
    riven_tut,
    ducat_template,
    getMessage,
    launchNuke,
    saySomething,
    admin_test,
    canvasTest,
    sendMessage,
    qnaFaq,
    tbcommandslist,
    tbFullTutorial,
    posttbcommandtut,
    sendUet,
    baroArrival,
    react,
    edit
};