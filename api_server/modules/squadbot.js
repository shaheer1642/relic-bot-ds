const { db } = require("./db_connection")
const uuid = require('uuid')
const { convertUpper, dynamicSort, dynamicSortDesc } = require('./functions')
const db_modules = require('./db_modules')
const { event_emitter } = require('./event_emitter')
const JSONbig = require('json-bigint');
const { as_users_list } = require("./allsquads/as_users_list")

const endpoints = {
    'squadbot/squads/create': squadsCreate,
    'squadbot/squads/fetch': squadsFetch,
    'squadbot/squads/update': squadsUpdate,
    'squadbot/squads/addmember': squadsAddMember,
    // 'squadbot/squads/removemember': squadsRemoveMember,
    'squadbot/squads/leaveall': squadsLeaveAll,
    'squadbot/squads/validate': squadsValidate,
    'squadbot/squads/invalidate': squadsInvalidate,
    'squadbot/squads/selecthost': squadsSelectHost,

    'squadbot/squads/autofill/fetch': squadsAutofillFetch,
    'squadbot/squads/autofill/execute': squadsAutofillExecute,

    'squadbot/squads/messageCreate': squadsMessageCreate,
    'squadbot/squads/messagesFetch': squadsMessagesFetch,

    'squadbot/trackers/create': trackersCreate,
    'squadbot/trackers/fetch': trackersFetch,
    'squadbot/trackers/delete': trackersDelete,
    'squadbot/trackers/fetchSubscribers': trackersfetchSubscribers,

    'squadbot/keywords/create': keywordsCreate,
    'squadbot/keywords/fetch': keywordsFetch,
    'squadbot/keywords/delete': keywordsDelete,
}

const squad_expiry = 3600000 // in ms
const squad_closures = {  // listed in minutes
    default: 20,

    sortie: 15,
    incursion: 20,
    alert: 20,
    eidolon: 40,
    help: 15,
    index: 15,
    profit_taker: 15,
    bounty: 15,
    bounties: 30,
    leveling: 15,
    arbitration: 20,
    nightwave: 15,
    lich: 15,
    sister: 15,
    endo: 15,
    archon: 20,
    aya_farm: 20
}

function getSquadClosure(squad_string) {
    var squad_closure = squad_closures.default
    Object.keys(squad_closures).forEach(key => {
        if (squad_string.match(key))
            squad_closure = squad_closures[key]
    })
    return squad_closure * 60 * 1000
}

var keywords_list = []
var explicitwords_list = []
event_emitter.on('db_connected', () => {
    db.query(`SELECT * FROM wfhub_keywords`)
        .then(res => {
            keywords_list = []
            explicitwords_list = []
            res.rows.forEach(row => {
                if (row.include)
                    keywords_list.push(row.name)
                else
                    explicitwords_list.push(row.name)
            })
        }).catch(console.error)
})

function keywordsCreate(data, callback) {
    console.log('[keywordsCreate] data:', data)
    if (!data.name) return callback({ code: 400, message: 'No name provided' })
    if (!data.include) return callback({ code: 400, message: 'No include provided' })
    db.query(`
        INSERT INTO wfhub_keywords (
            name,
            include
        ) VALUES (
            '${data.name.toLowerCase()}',
            ${data.include}
        )
    `).then(res => {
        if (res.rowCount == 1) {
            return callback({
                code: 200,
                message: 'Success'
            })
        } else {
            return callback({
                code: 500,
                message: 'Unexpected error'
            })
        }
    }).catch(err => {
        console.log(err)
        return callback({
            code: 500,
            message: err.detail || err.stack
        })
    })
}

function keywordsFetch(data, callback) {
    console.log('[keywordsFetch] data:', data)
    db.query(`
        SELECT * FROM wfhub_keywords;
    `).then(res => {
        return callback({
            code: 200,
            data: res.rows
        })
    }).catch(err => {
        console.log(err)
        return callback({
            code: 500,
            message: err.stack
        })
    })
}

function keywordsDelete(data, callback) {
    console.log('[keywordsDelete] data:', data)
    if (!data.id) {
        if (callback) callback({ code: 400, message: 'No id provided' })
        return
    }
    db.query(`DELETE FROM wfhub_keywords WHERE id=${data.id}`)
        .then(res => {
            if (!callback) return
            if (res.rowCount == 0) {
                return callback({
                    code: 500,
                    message: 'Unexpected error'
                })
            } else {
                return callback({
                    code: 200,
                    message: 'Record deleted'
                })
            }
        }).catch(err => {
            console.log(err)
            if (!callback) return
            return callback({
                code: 500,
                message: err.stack
            })
        })
}

function squadsMessageCreate(data, callback) {
    console.log('[squadbot/squadsMessageCreate] data:', data)
    if (!data.thread_id) return callback({ code: 400, message: 'No thread_id provided' })
    const fromWeb = data.thread_id.match('web') ? true : false
    if (fromWeb && !data.squad_id) return callback({ code: 400, message: 'No squad_id provided' })
    db.query(`
        INSERT INTO as_sb_squads_messages (message_id,message,user_id,thread_id,squad_id,squad_thread_ids)
        VALUES (
            '${data.message_id}',
            '${data.message.replace(/'/g, `''`)}',
            '${data.user_id}',
            ${fromWeb ? 'null' : `'${data.thread_id}'`},
            ${fromWeb ? `'${data.squad_id}'` : `(select squad_id FROM as_sb_squads WHERE thread_ids @> '"${data.thread_id}"' AND status='opened')`},
            ${fromWeb ? `(select thread_ids FROM as_sb_squads WHERE squad_id = '${data.squad_id}' AND status='opened')` : `(select thread_ids FROM as_sb_squads WHERE thread_ids @> '"${data.thread_id}"' AND status='opened')`}
            
        )
    `).then(res => {
        if (res.rowCount == 1) {
            if (callback) {
                callback({
                    code: 200,
                })
            }
        } else {
            if (callback) {
                callback({
                    code: 500,
                    message: 'unexpected db response'
                })
            }
        }
    }).catch(err => {
        if (err.code != '23502') // message not sent in a tracked thread
            console.log(err)
    })
}

function squadsMessagesFetch(data, callback) {
    console.log('[squadbot/squadsMessagesFetch] data:', data)
    if (!data.squad_id) return callback({ code: 400, message: 'No squad_id provided' })
    db.query(`
        SELECT * FROM as_sb_squads_messages WHERE squad_id = '${data.squad_id}' ORDER BY creation_timestamp ASC;
    `).then(res => {
        return callback({
            code: 200,
            data: res.rows
        })
    }).catch(err => {
        return callback({
            code: 500,
            err: err
        })
    })
}

function squadsAutofillFetch(data, callback) {
    console.log('[squadbot.squadsAutofillFetch] data:', data)
    if (!data.user_id) return callback({ code: 500, err: 'No user_id provided' })
    db.query(`
        SELECT * FROM as_sb_squads WHERE status='active' AND members @> '"${data.user_id}"' AND jsonb_array_length(members) > 1 ORDER BY creation_timestamp ASC;
    `).then(res => {
        if (res.rowCount == 0) {
            return callback({
                code: 400,
                message: 'You are not in any eligible squad that can be auto-filled'
            })
        } else {
            return callback({
                code: 200,
                message: 'Select a squad you want to force open',
                data: res.rows,
            })
        }
    }).catch(err => {
        console.log(err)
        return callback({
            code: 500,
            message: err.stack
        })
    })
}


function squadsAutofillExecute(data, callback) {
    console.log('[squadbot.squadsAutofillExecute] data:', data)
    if (!data.user_id) return callback({ code: 500, err: 'No user_id provided' })
    if (!data.squad_id) return callback({ code: 500, err: 'No squad_id provided' })
    db.query(`
        UPDATE as_sb_squads SET spots = jsonb_array_length(members), autofilled_by = '${data.user_id}' WHERE status='active' AND members @> '"${data.user_id}"' AND jsonb_array_length(members) > 1 AND squad_id = '${data.squad_id}';
    `).then(res => {
        if (res.rowCount == 1) {
            return callback({
                code: 200,
                message: 'Squad auto-filled'
            })
        } else {
            db.query(`
                SELECT * FROM as_sb_squads WHERE status='active' AND members @> '"${data.user_id}"' AND jsonb_array_length(members) > 1 ORDER BY creation_timestamp ASC;
            `).then(res => {
                if (res.rowCount == 0) {
                    return callback({
                        code: 400,
                        message: 'You are not in any eligible squad that can be auto-filled'
                    })
                } else {
                    return callback({
                        code: 400,
                        message: 'Failed to fill that squad. Its status may have changed. Please try again',
                        data: res.rows
                    })
                }
            }).catch(err => {
                console.log(err)
                return callback({
                    code: 500,
                    message: err.stack
                })
            })
        }
    }).catch(err => {
        console.log(err)
        return callback({
            code: 500,
            message: err.stack
        })
    })
}

function squadsCreate(data, callback) {
    console.log('[squadbot/squadsCreate] data:', data)
    if (!data.message) return callback({ code: 500, err: 'No message provided' })
    if (!data.user_id) return callback({ code: 500, err: 'No user_id provided' })
    const lines = data.message.toLowerCase().trim().split('\n')
    Promise.all(lines.map(line => {
        return new Promise((resolve, reject) => {
            const spots = line.match('/4') ? 4 : line.match('/3') ? 3 : line.match('/2') ? 2 : 4
            const squad_string = line.replace(/ [1-9]\/4/g, '').replace(/ [1-9]\/3/g, '').replace(/ [1-9]\/2/g, '').replace(/ [1-9]\/1/g, '').trim().replace(/ /g, '_')
            if (squad_string.length > 70) {
                return resolve({
                    code: 400,
                    message: `Squad name must be less than 70 characters long`
                })
            }
            var hasKeyword = false
            for (const word of keywords_list) {
                if (line.match(word)) {
                    hasKeyword = true
                    break
                }
            }
            if (!hasKeyword) {
                return resolve({
                    code: 400,
                    message: `Squad must contain a valid keyword`
                })
            }
            var hasExplicitWord = false
            for (const word of explicitwords_list) {
                if (line.match(word)) {
                    hasExplicitWord = true
                    break
                }
            }
            if (hasExplicitWord) {
                return resolve({
                    code: 400,
                    message: `Squad must not contain explicit words`
                })
            }

            const squad_id = uuid.v4()
            const squad_code = `${squad_string}_${spots}_${data.merge_squad == false ? `${new Date().getTime()}` : `${new Date(new Date().setHours(0, 0, 0, 0)).getTime()}`}`
            console.log('squad_code:', squad_code)

            db.query(`INSERT INTO as_sb_squads (squad_id,squad_code,squad_string,spots,members,original_host,joined_from_channel_ids,squad_closure,logs)
            VALUES (
                (SELECT CASE WHEN (COUNT(squad_id) >= 75) THEN NULL ELSE '${squad_id}'::uuid END AS counted FROM as_sb_squads WHERE status='active'),
                '${squad_code}',
                '${squad_string}',
                ${spots},
                '["${data.user_id}"]',
                '${data.user_id}',
                '${data.channel_id ? `{"${data.user_id}":"${data.channel_id}"}` : '{}'}',
                ${getSquadClosure(squad_string)},
                '["${new Date().getTime()} ${data.user_id} created squad"]')
            `).then(res => {
                if (res.rowCount == 1) {
                    db_modules.schedule_query(`UPDATE as_sb_squads SET members = members-'${data.user_id}', logs = logs || '"${new Date().getTime()} ${data.user_id} removed from squad due to timeout"' WHERE members @> '"${data.user_id}"' AND status='active' AND squad_id = '${squad_id}'`, as_users_list[data.user_id].squad_timeout)
                    return resolve({ code: 200 })
                } else return resolve({
                    code: 500,
                    message: 'unexpected db response'
                })
            }).catch(err => {
                console.log(err)
                if (err.code == '23502') {
                    return resolve({
                        code: 400,
                        message: `Squads limit has been reached. Please try __hosting later__ or __join an existing squad__`
                    })
                } else if (err.code == '23505') {
                    db.query(`SELECT * FROM as_sb_squads WHERE squad_code='${squad_code}' AND status='active'`)
                        .then(res => {
                            if (res.rowCount > 0) {
                                if (res.rows.some(row => row.members.includes(data.user_id))) return resolve({ code: 200 })
                                else return resolve({
                                    code: 399,
                                    message: `**${convertUpper(squad_string)}** already exists. Would you like to __join existing squad__ or __host a new one__?`,
                                    squad_id: res.rows[0].squad_id,
                                    squad_code: res.rows[0].squad_code,
                                    squad_string: squad_string
                                })
                            }
                        }).catch(console.error)
                } else {
                    console.log(err)
                    return resolve({
                        code: 500,
                        message: err.stack
                    })
                }
            })
        })
    })).then(res => {
        return callback(res)
    }).catch(err => {
        console.log(err)
        return callback([{
            code: 500,
            message: err.stack
        }])
    })
}

function squadsFetch(data, callback) {
    console.log('[squadbot/squadsFetch] data:', data)
    db.query(`
        SELECT * FROM as_sb_squads WHERE status='active' ORDER BY creation_timestamp ASC;
    `).then(res => {
        return callback({
            code: 200,
            data: res.rows
        })
    }).catch(err => {
        console.log(err)
        return callback({
            code: 500,
            message: err.stack
        })
    })
}

function squadsUpdate(data, callback) {
    if (!data.params) return callback({ code: 500, err: 'No params provided' })
    db.query(`UPDATE as_sb_squads SET ${data.params}`).then(res => {
        if (!callback) return
        if (res.rowCount == 1) {
            return callback({
                code: 200
            })
        } else return callback({
            code: 500,
            message: 'unexpected db response'
        })
    }).catch(console.error)
}

function squadsAddMember(data, callback) {
    console.log('[squadsAddMember] data:', data)
    if (!data.squad_id) return callback({ code: 500, err: 'No squad_id provided' })
    if (!data.user_id) return callback({ code: 500, err: 'No user_id provided' })
    db.query(`
        UPDATE as_sb_squads SET members =
        CASE WHEN members @> '"${data.user_id}"'
        THEN members-'${data.user_id}'
        ELSE members||'"${data.user_id}"' END
        ${data.channel_id ? `,joined_from_channel_ids = 
        CASE WHEN members @> '"${data.user_id}"'
        THEN joined_from_channel_ids - '${data.user_id}'
        ELSE jsonb_set(joined_from_channel_ids, '{${data.user_id}}', '"${data.channel_id}"') END
        ` : ''},
        logs = CASE WHEN members @> '"${data.user_id}"'
        THEN logs || '"${new Date().getTime()} ${data.user_id} left squad"'
        ELSE logs || '"${new Date().getTime()} ${data.user_id} joined squad"' END
        WHERE status = 'active' AND squad_id = '${data.squad_id}'
        returning*;
    `).then(res => {
        if (res.rowCount == 1) {
            if (res.rows[0].members.includes(data.user_id)) {
                db_modules.schedule_query(`UPDATE as_sb_squads SET members = members-'${data.user_id}', logs = logs || '"${new Date().getTime()} ${data.user_id} removed from squad due to timeout"' WHERE members @> '"${data.user_id}"' AND status='active' AND squad_id = '${data.squad_id}'`, as_users_list[data.user_id].squad_timeout)
            }
            return callback({ code: 200 })
        } else return callback({ code: 500, message: 'unexpected db response' })
    }).catch(err => {
        console.log(err)
        return callback({
            code: 500,
            message: err.stack
        })
    })
}

function squadsLeaveAll(data, callback) {
    console.log('[squadbot/squadsLeaveAll] data:', data)
    if (!data.user_id) return callback({ code: 500, err: 'No user_id provided' })
    db.query(`UPDATE as_sb_squads SET members=members-'${data.user_id}', logs = logs || '"${new Date().getTime()} ${data.user_id} left squad"' WHERE status='active' AND members @> '"${data.user_id}"'`)
        .then(res => {
            return callback({
                code: 200
            })
        }).catch(err => {
            console.log(err)
            return callback({
                code: 500,
                message: err.stack
            })
        })
}

function squadsValidate(data, callback) {
    console.log('[squadbot.squadsValidate] data:', data)
    if (!data.squad_id) return callback({ code: 500, err: 'No squad_id provided' })
    if (!data.user_id) return callback({ code: 500, err: 'No user_id provided' })
    db.query(`
        UPDATE as_sb_squads SET validated_by = '${data.user_id}' WHERE status = 'closed' AND squad_id = '${data.squad_id}' AND validated_by is null AND invalidated_by is null;
    `).then(res => {
        if (res.rowCount == 1) {
            return callback({
                code: 200
            })
        } else return callback({
            code: 500,
            message: 'unexpected db response'
        })
    }).catch(err => {
        console.log(err)
        return callback({
            code: 500,
            message: err.stack
        })
    })
}

function squadsInvalidate(data, callback) {
    console.log('[squadbot.squadsInvalidate] data:', data)
    if (!data.squad_id) return callback({ code: 500, err: 'No squad_id provided' })
    if (!data.user_id) return callback({ code: 500, err: 'No user_id provided' })
    if (!data.reason) return callback({ code: 500, err: 'No reason provided' })
    db.query(`
        UPDATE as_sb_squads SET status = '${data.invalidated_members ? 'closed' : 'invalidated'}', invalidated_by = '${data.user_id}', invalidation_reason = '${data.reason}', invalidated_members = '${JSON.stringify(data.invalidated_members) || '[]'}' WHERE status = 'closed' AND squad_id = '${data.squad_id}' AND validated_by is null AND invalidated_by is null;
    `).then(res => {
        if (res.rowCount == 1) {
            return callback({
                code: 200
            })
        } else return callback({
            code: 500,
            message: 'unexpected db response'
        })
    }).catch(err => {
        console.log(err)
        return callback({
            code: 500,
            message: err.stack
        })
    })
}

function squadsSelectHost(data, callback) {
    console.log('[squadbot.squadsSelectHost] data:', data)
    if (!data.squad_id) return callback({ code: 500, err: 'No squad_id provided' })
    if (!data.user_id) return callback({ code: 500, err: 'No user_id provided' })
    db.query(`
        UPDATE as_sb_squads SET squad_host = '${data.user_id}' WHERE status = 'opened' AND squad_id = '${data.squad_id}' AND members @> '"${data.user_id}"';
    `).then(res => {
        if (res.rowCount == 1) {
            return callback({
                code: 200
            })
        } else return callback({
            code: 500,
            message: 'unexpected db response'
        })
    }).catch(err => {
        console.log(err)
        return callback({
            code: 500,
            message: err.stack
        })
    })
}

function trackersCreate(data, callback) {
    console.log('[squadbot/trackersCreate] data:', data)
    if (!data.message) return callback({ code: 400, err: 'No message provided' })
    if (!data.user_id) return callback({ code: 400, err: 'No user_id provided' })
    if (!data.channel_id) return callback({ code: 400, err: 'No channel_id provided' })
    const lines = Array.isArray(data.message) ? data.message : data.message.toLowerCase().trim().split('\n')
    Promise.all(lines.map(line => {
        return new Promise((resolve, reject) => {
            const tracker_id = uuid.v4()
            const squad_string = line.toLowerCase().trim().replace(/ /g, '_')

            db.query(`INSERT INTO as_sb_trackers (tracker_id,user_id,channel_id,squad_string) 
            VALUES (
                '${tracker_id}',
                '${data.user_id}',
                '${data.channel_id}',
                '${squad_string}'
            )`).then(res => {
                if (res.rowCount == 1) {
                    return resolve({
                        code: 200
                    })
                } else return resolve({
                    code: 500,
                    message: 'unexpected db response'
                })
            }).catch(err => {
                if (err.code == '23505') {
                    return resolve({
                        code: 200
                    })
                } else {
                    console.log(err)
                    return resolve({
                        code: 500,
                        message: err.stack
                    })
                }
            })
        })
    })).then(res => {
        return callback(res)
    }).catch(err => {
        console.log(err)
        return callback({
            code: 500,
            message: err.stack
        })
    })
}

function trackersFetch(data, callback) {
    console.log('[squadbot/trackersFetch] data:', data)
    if (!data.user_id) return callback({ code: 500, err: 'No user_id provided' })
    db.query(`
        SELECT * FROM as_sb_trackers WHERE user_id='${data.user_id}';
    `).then(res => {
        return callback({
            code: 200,
            data: res.rows
        })
    }).catch(err => {
        console.log(err)
        return callback({
            code: 500,
            message: err.stack
        })
    })
}

function trackersfetchSubscribers(data, callback) {
    console.log('[squadbot/trackersfetchSubscribers] data:', data)
    if (!data.squad) return callback({ code: 500, err: 'No squad obj provided' })
    const squad = data.squad
    db.query(`SELECT * FROM as_sb_trackers WHERE user_id != '${squad.original_host}'; SELECT * FROM as_ping_mutes;`)
        .then(res => {
            const channel_ids = {};
            const hosted_squad = squad.squad_string
            const trackers = res[0].rows
            const ping_mutes = res[1].rows
            trackers.forEach(tracker => {
                for (const mute of ping_mutes) {
                    if (mute.user_id == tracker.user_id) {
                        if (mute.squad_string == 'global') return
                        if (tracker.squad_string.match(mute.squad_string) || mute.squad_string.match(tracker.squad_string)) return
                    }
                }
                if (tracker.squad_string.match(hosted_squad) || hosted_squad.match(tracker.squad_string)) {
                    if (!channel_ids[tracker.channel_id])
                        channel_ids[tracker.channel_id] = []
                    if (!channel_ids[tracker.channel_id].includes(tracker.user_id))
                        channel_ids[tracker.channel_id].push(tracker.user_id)
                }
            })
            return callback({
                code: 200,
                data: channel_ids
            })
        }).catch(err => {
            console.log(err)
            return callback({
                code: 500,
                message: err.stack
            })
        })
}

function trackersDelete(data, callback) {
    console.log('[squadbot/trackersDelete] data:', data)
    if (!data.user_id && !data.tracker_ids) return callback({ code: 500, err: 'No user_id or tracker_ids provided' })
    var query = ''
    if (data.user_id) {
        query = `DELETE FROM as_sb_trackers WHERE user_id='${data.user_id}';`
    } else {
        data.tracker_ids.forEach(tracker_id => {
            query += `DELETE FROM as_sb_trackers WHERE tracker_id='${tracker_id}';`
        })
    }
    db.query(query).then(res => {
        return callback({
            code: 200,
        })
    }).catch(err => {
        console.log(err)
        return callback({
            code: 500,
            message: err.stack
        })
    })
}

db.on('notification', (notification) => {
    const payload = JSONbig.parse(notification.payload);
    if (['wfhub_keywords_insert', 'wfhub_keywords_update', 'wfhub_keywords_delete'].includes(notification.channel)) {
        db.query(`SELECT * FROM wfhub_keywords`)
            .then(res => {
                keywords_list = []
                explicitwords_list = []
                res.rows.forEach(row => {
                    if (row.include) keywords_list.push(row.name)
                    else explicitwords_list.push(row.name)
                })
            }).catch(console.error)
    }
})

module.exports = {
    endpoints,
    trackersfetchSubscribers
}