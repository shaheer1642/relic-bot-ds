const {client} = require('./discord_client.js');

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function dynamicSortDesc(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] > b[property]) ? -1 : (a[property] < b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

async function inform_dc (str) {
    await client.channels.cache.get('891756819045826621').send(str).catch(err => console.log(err+'\nError posting bot update.'))
}

async function mod_log (str,color='RANDOM') {
    const embed = new MessageEmbed()
        .setColor(color)
        .setDescription(str)
        .setTimestamp()
    await client.channels.cache.get('892072612002418718').send({content: " ", embeds: [embed]}).catch(err => console.log(err+'\nError posting moderation update.'))
}

module.exports = {dynamicSort,dynamicSortDesc,inform_dc,mod_log};