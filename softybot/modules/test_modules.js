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

module.exports = {trade_tut,lich_tut,ducat_template,getMessage,launchNuke,saySomething,admin_test,canvasTest,sendMessage};