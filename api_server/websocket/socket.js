const {server} = require('../api/api')
const { Server } = require("socket.io");
const {as_users_list} = require('../modules/allsquads/as_users_list')
const io = new Server(server, {
  transports: ['websocket']
});
const {db} = require('../modules/db_connection')
const uuid = require('uuid');
const JSONbig = require('json-bigint');
const {convertUpper, dynamicSort, dynamicSortDesc, msToFullTime} = require('../modules/functions')
const db_modules = require('../modules/db_modules')
const relicbot = require('../modules/relicbot')
const squadbot = require('../modules/squadbot')
const allsquads = require('../modules/allsquads')
const global_variables = require('../modules/global_variables');
const miniframe = require('../modules/miniframe');
const { pushNotify } = require('../modules/firebase/FCM');
const { event_emitter } = require('../modules/event_emitter');

var clients = {}

io.on('connection', (socket) => {
    console.log('[websocket] a user connected',socket.id);
    clients[socket.id] = socket
    console.log('[websocket] connected clients',new Date(),Object.keys(clients).length)

    socket.on('disconnect', (reason) => {
      console.log('[websocket] a user disconnected. reason:',reason);
      delete clients[socket.id]
      console.log('[websocket] connected clients',new Date(),Object.keys(clients).length)
      socket.removeAllListeners()

      miniframe.socketCleanUp(socket.id)
    });

    Object.keys(relicbot.endpoints).forEach(key => {
      socket.addListener(key, (data,callback) => {
        const ts = new Date().getTime()
        if (Object.keys(data).includes('user_id')) {
          if (as_users_list[data.user_id] && as_users_list[data.user_id].ingame_name) {
            if (as_users_list[data.user_id].is_suspended) {
              return callback ? callback({
                code: 480,
                message: `You have been temporarily suspended from this service. Your suspension will be lifted in ${msToFullTime(as_users_list[data.user_id].suspension_expiry - new Date().getTime())}.\nIf you would like to appeal, please contact <@${as_users_list[as_users_list[data.user_id].suspended_by].discord_id}>`
              }) : null
            }
            relicbot.endpoints[key](data, (res) => { logReponseTime(ts,key); callback ? callback(res) : null })
          } else {
            return callback ? callback({
              code: 499,
              message: 'unauthorized'
            }) : null
          }
        } else {
          relicbot.endpoints[key](data, (res) => { logReponseTime(ts,key); callback ? callback(res) : null })
        }
      })
    })
    Object.keys(squadbot.endpoints).forEach(key => {
      socket.addListener(key, (data,callback) => {
        const ts = new Date().getTime()
        if (Object.keys(data).includes('user_id')) {
          if (as_users_list[data.user_id] && as_users_list[data.user_id].ingame_name) {
            if (as_users_list[data.user_id].is_suspended) {
              return callback ? callback({
                code: 480,
                message: `You have been temporarily suspended from this service. Your suspension will be lifted in ${msToFullTime(as_users_list[data.user_id].suspension_expiry - new Date().getTime())}.\nIf you would like to appeal, please contact <@${as_users_list[as_users_list[data.user_id].suspended_by].discord_id}>`
              }) : null
            }
            squadbot.endpoints[key](data, (res) => { logReponseTime(ts,key); callback ? callback(res) : null })
          } else {
            return callback ? callback({
              code: 499,
              message: 'unauthorized'
            }) : null
          }
        } else {
          squadbot.endpoints[key](data, (res) => { logReponseTime(ts,key); callback ? callback(res) : null })
        }
      })
    })
    Object.keys(allsquads.endpoints).forEach(key => {
      socket.addListener(key, (data,callback) => {
        const ts = new Date().getTime()
        if (Object.keys(data).includes('user_id')) {
          if (as_users_list[data.user_id] && as_users_list[data.user_id].ingame_name) {
            if (as_users_list[data.user_id].is_suspended) {
              return callback ? callback({
                code: 480,
                message: `You have been temporarily suspended from this service. Your suspension will be lifted in ${msToFullTime(as_users_list[data.user_id].suspension_expiry - new Date().getTime())}.\nIf you would like to appeal, please contact <@${as_users_list[as_users_list[data.user_id].suspended_by].discord_id}>`
              }) : null
            }
            allsquads.endpoints[key](data, (res) => { logReponseTime(ts,key); callback ? callback(res) : null })
          } else {
            return callback ? callback({
              code: 499,
              message: 'unauthorized'
            }) : null
          }
        } else {
          allsquads.endpoints[key](data, (res) => { logReponseTime(ts,key); callback ? callback(res) : null })
        }
      })
    })
    Object.keys(global_variables.endpoints).forEach(key => {
      socket.addListener(key, (data,callback) => {
        const ts = new Date().getTime()
        if (Object.keys(data).includes('user_id')) {
          if (as_users_list[data.user_id] && as_users_list[data.user_id].ingame_name) {
            global_variables.endpoints[key](data, (res) => { logReponseTime(ts,key); callback ? callback(res) : null })
          } else {
            return callback ? callback({
              code: 499,
              message: 'unauthorized'
            }) : null
          }
        } else {
          global_variables.endpoints[key](data, (res) => { logReponseTime(ts,key); callback ? callback(res) : null })
        }
      })
    })
    Object.keys(miniframe.endpoints).forEach(key => {
      socket.addListener(key, (data,callback) => {
        const ts = new Date().getTime()
        miniframe.endpoints[key]({...data, socket_id: socket.id}, (res) => { logReponseTime(ts,key); callback ? callback(res) : null })
      })
    })
});

function logReponseTime(ts,key) {
  const response_time = new Date().getTime() - ts
  if (response_time > 1000)
    console.error('[websocket] Request:',key,'Response time:', response_time, 'ms');
  else 
    console.log('[websocket] Request:',key,'Response time:', response_time, 'ms');
}

db.on('notification', (notification) => {
  console.log('[DB notification]',notification.channel)
  // console.log(notification.payload)
  // console.log(notification.channel)
  const payload = JSONbig.parse(notification.payload);

  if (notification.channel == 'as_rb_squads_insert') {
    io.emit('squadCreate', payload)
  }
  
  if (notification.channel == 'as_rb_squads_update') {
    if (payload[0].members.length == 0 && payload[1].members.length > 0) {
      db.query(`UPDATE as_rb_squads SET status = 'abandoned' WHERE status = 'active' AND squad_id = '${payload[0].squad_id}'`).catch(console.error)
    }
    if (payload[0].members.length == payload[0].spots && payload[0].status == 'active') {
      const host_recommendation = allsquads.calculateBestPingRating(payload[0].members)
      db.query(`
        UPDATE as_rb_squads SET status='opened', open_timestamp=${new Date().getTime()}, host_recommendation = '${JSON.stringify(host_recommendation)}' WHERE status = 'active' AND squad_id = '${payload[0].squad_id}' AND jsonb_array_length(members) = spots;
      `).then(res => {
        if (res.rowCount != 1) return
        db.query(`
          UPDATE as_rb_squads SET status='disbanded' WHERE status = 'opened' AND (${payload[0].members.map(user_id => `members @> '"${user_id}"' `).join(' OR ')}) AND squad_id != '${payload[0].squad_id}';
          UPDATE as_rb_squads SET members=members${payload[0].members.map(user_id => `-'${user_id}'`).join('')} WHERE status='active' AND squad_id != '${payload[0].squad_id}' AND (${payload[0].members.map(user_id => `members @> '"${user_id}"'`).join(' OR ')});
          UPDATE as_sb_squads SET members=members${payload[0].members.map(user_id => `-'${user_id}'`).join('')} WHERE status='active' AND (${payload[0].members.map(user_id => `members @> '"${user_id}"'`).join(' OR ')});
        `).catch(console.error)
        db_modules.schedule_query(`UPDATE as_rb_squads SET status='closed' WHERE squad_id = '${payload[0].squad_id}' AND status='opened'`,relicbot.squad_closure)
      }).catch(console.error)
    }
    if (payload[0].status != 'active' && payload[1].status == 'active') {
      db.query(`UPDATE as_rb_squads SET squad_code='${payload[0].squad_code}_${payload[0].creation_timestamp}' WHERE squad_id='${payload[0].squad_id}'`).catch(console.error)
    }
    io.emit('squadUpdate', payload)
    if (payload[0].status == 'opened' && payload[1].status == 'active') io.emit('relicbot/squads/opened', payload[0])
    if (payload[0].status == 'closed' && payload[1].status == 'opened') io.emit('relicbot/squads/closed', payload[0])
    if (payload[0].status == 'disbanded' && payload[1].status == 'opened') io.emit('relicbot/squads/disbanded', payload[0])
    if (payload[0].status == 'invalidated' && payload[1].status == 'closed') io.emit('relicbot/squads/invalidated', payload[0])
    if (payload[0].squad_host && !payload[1].squad_host) io.emit('relicbot/squads/selectedhost', payload[0])
    // ---- send push notification ----
    if (payload[0].status == 'opened' && payload[1].status == 'active') {
      pushNotify({
        user_ids: payload[0].members,
        title: 'Squad Filled',
        body: relicbot.relicBotSquadToString(payload[0],true)
      })
    }
  }

  if (notification.channel == 'as_rb_squads_messages_insert') {
    io.emit('squadMessageCreate', payload)
  }
  
  if (['as_rb_hosting_table_insert','as_rb_hosting_table_update','as_rb_hosting_table_delete'].includes(notification.channel)) {
    io.emit('defaultHostingTableUpdate', payload)
  }

  if (['wfhub_keywords_insert','wfhub_keywords_update','wfhub_keywords_delete'].includes(notification.channel)) {
    io.emit('squadKeywordsUpdate', payload)
  }

  if (['global_variables_list_insert','global_variables_list_update','global_variables_list_delete'].includes(notification.channel)) {
    io.emit('globalVariableUpdated', payload)
  }
  
  if (notification.channel == 'as_sb_squads_insert') {
    io.emit('squadbot/squadCreate', payload)
  }

  if (notification.channel == 'as_sb_squads_update') {
    if (payload[0].members.length == 0 && payload[1].members.length > 0) {
      db.query(`UPDATE as_sb_squads SET status = 'abandoned' WHERE status = 'active' AND squad_id = '${payload[0].squad_id}'`).catch(console.error)
    }
    if (payload[0].members.length == payload[0].spots && payload[0].status == 'active') {
      const host_recommendation = allsquads.calculateBestPingRating(payload[0].members)
      db.query(`
        UPDATE as_sb_squads SET status='opened', open_timestamp=${new Date().getTime()}, host_recommendation = '${JSON.stringify(host_recommendation)}' WHERE status = 'active' AND squad_id = '${payload[0].squad_id}' AND jsonb_array_length(members) = spots;
      `).then(res => {
        if (res.rowCount != 1) return
        db.query(`
          UPDATE as_sb_squads SET status='disbanded' WHERE status = 'opened' AND (${payload[0].members.map(user_id => `members @> '"${user_id}"' `).join(' OR ')}) AND squad_id != '${payload[0].squad_id}';
          UPDATE as_sb_squads SET members=members${payload[0].members.map(user_id => `-'${user_id}'`).join('')} WHERE status='active' AND squad_id != '${payload[0].squad_id}' AND (${payload[0].members.map(user_id => `members @> '"${user_id}"'`).join(' OR ')});
          UPDATE as_rb_squads SET members=members${payload[0].members.map(user_id => `-'${user_id}'`).join('')} WHERE status='active' AND (${payload[0].members.map(user_id => `members @> '"${user_id}"'`).join(' OR ')});
        `).catch(console.error)
        db_modules.schedule_query(`UPDATE as_sb_squads SET status='closed' WHERE squad_id = '${payload[0].squad_id}' AND status='opened'`,payload[0].squad_closure)
        allsquads.pingmuteOnSquadOpen(payload[0])
      }).catch(console.error)
    }
    if (payload[0].status != 'active' && payload[1].status == 'active') {
      db.query(`UPDATE as_sb_squads SET squad_code='${payload[0].squad_code}_${payload[0].creation_timestamp}' WHERE squad_id='${payload[0].squad_id}'`).catch(console.error)
    }
    io.emit('squadbot/squadUpdate', payload)
    if (payload[0].status == 'opened' && payload[1].status == 'active') io.emit('squadbot/squads/opened', payload[0])
    if (payload[0].status == 'closed' && payload[1].status == 'opened') io.emit('squadbot/squads/closed', payload[0])
    if (payload[0].status == 'disbanded' && payload[1].status == 'opened') io.emit('squadbot/squads/disbanded', payload[0])
    if (payload[0].status == 'invalidated' && payload[1].status == 'closed') io.emit('squadbot/squads/invalidated', payload[0])
    if (payload[0].squad_host && !payload[1].squad_host) io.emit('squadbot/squads/selectedhost', payload[0])
    // ---- send push notification ----
    if (payload[0].status == 'opened' && payload[1].status == 'active') {
      pushNotify({
        user_ids: payload[0].members,
        title: 'Squad Filled',
        body: convertUpper(payload[0].squad_string)
      })
    }
  }
  
  if (notification.channel == 'as_sb_squads_messages_insert') {
    io.emit('squadbot/squadMessageCreate', payload)
  }
})

event_emitter.on('socketNotifyAll',(data) => {
  // console.log('[socketNotifyAll]',data)
  io.emit(data.event,data.data)
})
