const DB = require('pg');
const { event_emitter } = require('./event_emitter')

const db = new DB.Client({
    connectionString: process.env.DATABASE_URL,
    // ssl: process.env.ENVIRONMENT_TYPE == 'dev' ? null : {
    //     rejectUnauthorized: false
    // },
    keepAlive: true
})

db.connect().then(async res => {
    console.log('DB Connection established.')
    db.emit('connected')
    event_emitter.emit('db_connected')
    // Listening to triggers
    if (process.env.ENVIRONMENT_TYPE == 'dev' && false) {
        console.log('WARNING: ENVIRONMENT_TYPE is dev. Not listening to DB notifications')
        return
    } else {
        db.query(`
            LISTEN hubapp_messages_insert;
    
            LISTEN hubapp_users_update;
    
            LISTEN hub_recruitbot_squads_insert;
            LISTEN hub_recruitbot_squads_update;
            LISTEN hub_recruitbot_squads_delete;
    
            LISTEN as_users_list_insert;
            LISTEN as_users_list_update;
            LISTEN as_users_list_delete;
            
            LISTEN tradebot_users_orders_insert;
            LISTEN tradebot_users_orders_update;
            LISTEN tradebot_users_orders_delete;
    
            LISTEN tradebot_filled_users_orders_insert;
            LISTEN tradebot_filled_users_orders_update_new_message;
            LISTEN tradebot_filled_users_orders_update_archived;
    
            LISTEN hubapp_messages_channels_update;
    
            LISTEN as_rb_squads_insert;
            LISTEN as_rb_squads_update;
    
            LISTEN scheduled_queries_insert;
    
            LISTEN as_rb_squads_messages_insert;
            LISTEN as_sb_squads_messages_insert;
    
            LISTEN as_rb_hosting_table_insert;
            LISTEN as_rb_hosting_table_update;
            LISTEN as_rb_hosting_table_delete;
    
            LISTEN wfhub_keywords_insert;
            LISTEN wfhub_keywords_update;
            LISTEN wfhub_keywords_delete;
    
            LISTEN as_sb_squads_insert;
            LISTEN as_sb_squads_update;
    
            LISTEN as_clan_affiliates_insert;
            LISTEN as_clan_affiliates_update;
            LISTEN as_clan_affiliates_delete;
    
            LISTEN as_faq_insert;
            LISTEN as_faq_update;
            LISTEN as_faq_delete;
            
            LISTEN as_users_ratings_insert;
            LISTEN as_users_ratings_update;
            LISTEN as_users_ratings_delete;
            
            LISTEN global_variables_list_insert;
            LISTEN global_variables_list_update;
            LISTEN global_variables_list_delete;

            LISTEN as_push_notify_insert;
        `).then(res => {
            db.query(`SELECT * FROM scheduled_queries`).then(res => {
                res.rows.forEach(row => {
                    setTimeout(() => {
                        db.query(`
                            ${row.query}
                            DELETE FROM scheduled_queries WHERE id=${row.id};
                        `).catch(console.error)
                    }, row.call_timestamp - new Date().getTime());
                })
            }).catch(console.error)
        }).catch(err => console.log(err))
    }
}).catch(err => {
    console.log('DB Connection failure.\n' + err)
    process.exit()
});

db.on('error', err => {
    console.log('=============== DB Connection error. ==============', err)
    process.exit()
})

setInterval(() => {
    db.query(`SELECT * FROM challenges`).then(res => {
        console.log('Pinged the DB. Received rows:', res.rowCount)
    }).catch(console.error)
}, 900000);

module.exports = { db };