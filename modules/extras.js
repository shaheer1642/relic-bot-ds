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
    const embed = {
        description: str,
        color: color,
        timestamp: new Date()
    }
    await client.channels.cache.get('892072612002418718').send({content: " ", embeds: [embed]}).catch(err => console.log(err+'\nError posting moderation update.'))
}

function msToTime(s) {

    // Pad to 2 or 3 digits, default is 2
    function pad(n, z) {
      z = z || 2;
      return ('00' + n).slice(-z);
    }
  
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;
  
    if (hrs != 0)
        return pad(hrs,hrs>99? 3:2) + ' hours ' + pad(mins) + ' minutes ' + pad(secs) + ' seconds';
    if (mins != 0)
        return pad(mins) + ' minutes ' + pad(secs) + ' seconds';
    return pad(secs) + ' seconds';
}

function msToFullTime(ms) {
    console.log(ms)
    var seconds = Math.floor(ms / 1000),
    minutes = Math.floor(seconds / 60),
    hours   = Math.floor(minutes / 60),
    days    = Math.floor(hours / 24),
    months  = Math.floor(days / 30),
    years   = Math.floor(days / 365);
    seconds %= 60;
    minutes %= 60;
    hours %= 24;
    days %= 30;
    months %= 12;

    var str = ''
    if (years != 0)
        if (years > 1)
            str += years + ' years'
        else
            str += years + ' year'
    if (months != 0)
        if (months > 1)
            str += ' ' + months + ' months'
        else
            str += ' ' + months + ' month'
    if (days != 0)
        if (days > 1)
            str += ' ' + days + ' days'
        else
            str += ' ' + days + ' day'

    if (str == '')
        str = `${hours} hours ${minutes} minutes ${seconds} seconds`

    return str;
}

function getRandomColor() {
    var letters = '0123456789abcdef';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function embedScore(text) {
    return text.replace(/_/g,'\\_')
}

function convertUpper(str) {
    if (!str) return ''
    return str.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
}

function lowerAndScore(str) {
    return str.toLowerCase().replace(/ /g, '_')
}

function ms_to_days_hours(ms) {
    const days = Math.floor(ms / (24*60*60*1000));
    const daysms = ms % (24*60*60*1000);
    const hours = Math.floor(daysms / (60*60*1000));
    const hoursms = ms % (60*60*1000);
    const minutes = Math.floor(hoursms / (60*1000));
    const minutesms = ms % (60*1000);
    const sec = Math.floor(minutesms / 1000);
    return days + " days " + hours + " hours";
}

function ms_till_monday_12am() {
    const ms = ((((7 - (new Date().getDay() == 0 ? 7 : new Date().getDay())) * 86400) + (((23 - new Date().getHours()) * 60 * 60 )) + ((60 - new Date().getMinutes()) * 60)) * 1000)
    if (ms < 0) return 86400000
    return ms
}
function ms_till_12am() {
    return (new Date().setHours(23,59,59,999) - new Date().getTime())
}

function sortCaseInsensitive(arr,descending) {
    return arr.sort((a,b) => a.replace(/"/g,'').toLowerCase() < b.replace(/"/g,'').toLowerCase() ? descending ? 1 : -1 : descending ? -1 : 1)
}

function arrToStringsArrWithLimit(key_term,list,limit) {
    const strings_arr = []
    var str = `${key_term} `
    list.forEach(element => {
        if ((str + element).length >= limit) {
            strings_arr.push(str.trim())
            str = `${key_term} `
        }
        str = `${str} ${element}`
    });
    strings_arr.push(str)
    return strings_arr;
}

function calcArrAvg(arr) {
    var sum = 0
    arr.forEach(value => {
        sum += value
    })
    return sum / arr.length
}

async function getGuildMembersStatus(members, guild_id) {
    // note: the members is an array of object: {id: '', allowed_mentions: ['']}
    return new Promise(async (resolve,reject) => {
        const mentions_list = []
        const guild = client.guilds.cache.get(guild_id) || await client.guilds.fetch(guild_id).catch(console.error)
        if (!guild || !guild.presences) {
            return resolve(mentions_list)
        }
        members.forEach(async member => {
            if (!guild.members.cache.get(member.id)) return
            const presence = guild.presences.cache.get(member.id)
            const presence_status = presence?.status || 'offline'
            // console.log(presence_status,member.id)
            if (member.allowed_mentions?.some(status => status == presence_status)) {
                mentions_list.push(member.id)
            }
        })
        return resolve(mentions_list)
    })
}

function timeStringToMs(time_string) {
    if (!time_string) return 0
    var ms = 0
    time_string.split(' ').map(word => {
        if (word.match('y')) ms += 31104000000 * Number(word.replace('y',''))
        if (word.match('M')) ms += 2592000000 * Number(word.replace('M',''))
        if (word.match('w')) ms += 604800000 * Number(word.replace('w',''))
        if (word.match('d')) ms += 86400000 * Number(word.replace('d',''))
        if (word.match('h')) ms += 3600000 * Number(word.replace('h',''))
        if (word.match('m')) ms += 60000 * Number(word.replace('m',''))
        if (word.match('s')) ms += 1000 * Number(word.replace('s',''))
    })
    return ms
}

function generateId() {
    let ID = "";
    let characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    for ( var i = 0; i < 6; i++ ) {
      ID += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return ID;
}

function responsiveEmbedFields({ field1, field2, field3 }) {
    if (!field1) {
        console.log('[responsiveEmbedFields] fieldOneArr is undefined')
        return []
    }
    if (field1.valueArr.length == 0) {
        console.log('[responsiveEmbedFields] size is 0')
        return []
    }
    if (field2 && field1.valueArr.length != field2.valueArr.length) {
        console.log('[responsiveEmbedFields] size mismatch')
        return []
    }
    if (field3 && field2.valueArr.length != field3.valueArr.length) {
        console.log('[responsiveEmbedFields] size mismatch')
        return []
    }
    const fields = []
    const fieldsCounter = {
        one: 0,
        two: 1,
        three: 2
    }
    field1.valueArr.forEach((v,i) => {
        if (!fields[fieldsCounter.one]) {
            fields.push({ name: fieldsCounter.one == 0 ? field1.label : '\u200b', value: '', inline: true })
        }
        if (!fields[fieldsCounter.two]) {
            if (field2) fields.push({ name: fieldsCounter.two == 1 ? field2.label : '\u200b', value: '', inline: true })
            else fields.push({ name: '\u200b', value: '\u200b', inline: true })
        }
        if (!fields[fieldsCounter.three]) {
            if (field3) fields.push({ name: fieldsCounter.three == 2 ? field3.label : '\u200b', value: '', inline: true })
            else fields.push({ name: '\u200b', value: '\u200b', inline: true })
        }
        if (field1) fields[fieldsCounter.one].value += `${field1.valueArr[i]}\n`
        if (field2) fields[fieldsCounter.two].value += `${field2.valueArr[i]}\n`
        if (field3) fields[fieldsCounter.three].value += `${field3.valueArr[i]}\n`
        if (fields[fieldsCounter.one].value.length > 950 || fields[fieldsCounter.two].value.length > 950 || fields[fieldsCounter.three].value.length > 950) {
            if (field1.valueFormatter) fields[fieldsCounter.one].value = field1.valueFormatter(fields[fieldsCounter.one].value)
            if (field2.valueFormatter) fields[fieldsCounter.two].value = field2.valueFormatter(fields[fieldsCounter.two].value)
            if (field3.valueFormatter) fields[fieldsCounter.three].value = field3.valueFormatter(fields[fieldsCounter.three].value)
            fieldsCounter.one += 3
            fieldsCounter.two += 3
            fieldsCounter.three += 3
        }
    })
    if (field1.valueFormatter) fields[fieldsCounter.one].value = field1.valueFormatter(fields[fieldsCounter.one].value)
    if (field2.valueFormatter) fields[fieldsCounter.two].value = field2.valueFormatter(fields[fieldsCounter.two].value)
    if (field3.valueFormatter) fields[fieldsCounter.three].value = field3.valueFormatter(fields[fieldsCounter.three].value)
    return fields
}


module.exports = {
    dynamicSort,
    dynamicSortDesc,
    inform_dc,mod_log,
    msToTime,msToFullTime,
    getRandomColor,
    embedScore,
    convertUpper,
    ms_to_days_hours,
    ms_till_monday_12am,
    sortCaseInsensitive,
    arrToStringsArrWithLimit,
    calcArrAvg,
    getGuildMembersStatus,
    lowerAndScore,
    timeStringToMs,
    ms_till_12am,
    generateId,
    responsiveEmbedFields
};