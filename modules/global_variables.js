const {db} = require('./db_connection')
const {event_emitter} = require('./event_emitter')
const JSONbig = require('json-bigint');

var global_variables = {}

event_emitter.on('db_connected', () => {
    updateGlobalVariablesList()
})

function updateGlobalVariablesList() {
    console.log('[global_variables.updateGlobalVariablesList] called')
    db.query(`SELECT * FROM global_variables_list`).then(res => {
        res.rows.forEach(row => {
            global_variables[row.var_name] = row.var_data_type == 'object' || row.var_data_type == 'array' ? JSON.parse(row.var_value) : row.var_data_type == 'number' ? Number(row.var_value) : row.var_value
        })
    }).catch(console.error)
}

db.on('notification',(notification) => {
    const payload = JSONbig.parse(notification.payload);
    if (['global_variables_list_insert','global_variables_list_update','global_variables_list_delete'].includes(notification.channel)) {
        updateGlobalVariablesList()
    }
    if (notification.channel == 'global_variables_list_update') {
        event_emitter.emit(`globalVariableUpdated/${payload[0].var_name}`, {})
    }
})

module.exports = {
    global_variables
}