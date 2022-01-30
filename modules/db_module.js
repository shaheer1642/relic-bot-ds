const axios = require('axios');
const axiosRetry = require('axios-retry');
const {db} = require('./db_connection.js');
const fs = require('fs')

async function authorize(user,pass) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM users_list WHERE username='${user}' AND password='${pass}'`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1)
                resolve({code: 1, status: 'Login Successful', userid: res.rows[0].userid})
            else if (res.rowCount == 0)
                resolve({code: 2, status: 'Invalid Credentials'})
            else
                reject({code: 3, status: 'Internal Server Error. Try again'})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again'})
        })
    });
}

module.exports = {authorize};