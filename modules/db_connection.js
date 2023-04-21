const DB = require('pg');
const {event_emitter} = require('./event_emitter')

const db = new DB.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.ENVIRONMENT_TYPE == 'dev' ? null : {
        rejectUnauthorized: false
    },
    keepAlive: true
})

db.connect().then(async res => {
    console.log('DB Connection established.')
    event_emitter.emit('db_connected')

    db.query(`
        LISTEN tradebot_filled_users_orders_insert;
        LISTEN tradebot_filled_users_orders_update_new_message;
        LISTEN tradebot_filled_users_orders_update_archived;

        LISTEN tradebot_users_list_insert;
        LISTEN tradebot_users_list_update;
        LISTEN tradebot_users_list_delete;

        LISTEN tradebot_users_orders_insert;
        LISTEN tradebot_users_orders_update;
        LISTEN tradebot_users_orders_delete;

        LISTEN wfhub_payment_receipts_insert;

        LISTEN challenges_update;
        LISTEN challenges_transactions_insert;
        LISTEN challenges_completed_insert;

        LISTEN rb_squads_insert;
        LISTEN rb_squads_update;
        LISTEN rb_squads_delete;
        LISTEN as_gabot_giveaways_insert;
        LISTEN as_gabot_giveaways_update;
        LISTEN as_gabot_giveaways_delete;

        LISTEN as_bb_blesses_insert;
        LISTEN as_bb_blesses_update;
        LISTEN as_bb_blesses_delete;

        LISTEN as_faq_insert;
        LISTEN as_faq_update;
        LISTEN as_faq_delete;
        
        LISTEN as_users_ratings_insert;
        LISTEN as_users_ratings_update;
        LISTEN as_users_ratings_delete;

        LISTEN discord_msg_auto_delete_insert;

        LISTEN global_variables_list_insert;
        LISTEN global_variables_list_update;
        LISTEN global_variables_list_delete;

        LISTEN as_reports_insert;
        LISTEN as_reports_update;

        LISTEN wfrim_relicsdb_insert;
        LISTEN wfrim_relicsdb_update;
        LISTEN wfrim_relicsdb_delete;
    `).catch(console.error)
})

db.on('error', err => {
    console.log('=============== DB Connection error. ==============', err)
    process.exit()
})

setInterval(() => {
    db.query(`SELECT * FROM items_list`).then(res => {
        console.log('Pinged the DB. Received rows:',res.rowCount)
    }).catch(console.error)
}, 3600000);

module.exports = {db};