const axios = require('axios');
const axiosRetry = require('axios-retry');
const {db} = require('./db_connection.js');
const fs = require('fs')

async function authorize(user,pass) {
    console.log('authorizing user')
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

async function patients_list(userid) {
    console.log('retrieving patients list')
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM patients WHERE doc_id=${userid} ORDER BY mrno DESC`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount > 0) {
                res.rows.forEach((obj,i) => {
                    res.rows[i].dor = new Date(obj.dor).toLocaleString()
                    res.rows[i].dob = ((new Date() - new Date(obj.dob))/31556952000).toFixed()
                })
                resolve({code: 1, status: 'Records retrieved', data: res.rows})
            }
            else
                resolve({code: 2, status: 'No records found yet', data: null})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

async function addPatient(userid,fields) {
    console.log('inserting new patient')
    return new Promise((resolve, reject) => {
        db.query(`INSERT INTO patients (name,gender,reason_of_visit,dob,dor,doc_id) 
        VALUES ('${fields.patientName}','${fields.patientGender}','${fields.patientReason}',${new Date(fields.patientDoB).getTime()},${new Date().getTime()},${userid})
        RETURNING *`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1) {
                res.rows[0].dor = new Date(res.rows[0].dor).toLocaleString()
                res.rows[0].dob = ((new Date() - new Date(res.rows[0].dob))/31556952000).toFixed()
                resolve({code: 1, status: 'Patient added', data: res.rows[0]})
            }
            else
                reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

async function editPatient(userid,fields) {
    console.log('editing patient')
    return new Promise((resolve, reject) => {
        db.query(`UPDATE patients 
        SET name='${fields.patientName}', gender='${fields.patientGender}', reason_of_visit='${fields.patientReason}'
        WHERE doc_id=${userid} AND mrno=${fields.patientMRNo}
        RETURNING *`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1) {
                res.rows[0].dor = new Date(res.rows[0].dor).toLocaleString()
                res.rows[0].dob = ((new Date() - new Date(res.rows[0].dob))/31556952000).toFixed()
                resolve({code: 1, status: 'Patient edited', data: res.rows[0]})
            }
            else
                reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

async function deletePatient(userid,fields) {
    console.log('deleting patient')
    return new Promise((resolve, reject) => {
        db.query(`DELETE FROM patients WHERE doc_id=${userid} AND mrno=${fields.patientMRNo}`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1)
                resolve({code: 1, status: 'Patient deleted', data: null})
            else
                reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

module.exports = {authorize,patients_list,addPatient,editPatient,deletePatient};