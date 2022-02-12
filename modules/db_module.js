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

//-------Add patient-----------

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

async function getPatient(userid,mrno) {
    console.log('getting patient')
    return new Promise((resolve, reject) => {
        var data = {patient: null,consultations: null,investigations: null,surgeries: null}

        //patient data
        db.query(`
            SELECT * FROM patients WHERE doc_id=${userid} AND mrno=${mrno};
            SELECT * FROM investigation WHERE mrno=${mrno} ORDER BY doi DESC;
            SELECT * FROM surgery WHERE mrno=${mrno} ORDER BY dos DESC;
            SELECT * FROM consultation WHERE mrno=${mrno} ORDER BY doc DESC;
        `)
        .then(res => {
            // res[0] = patient data
            if (res[0].rowCount == 1) {
                res[0].rows[0].dor = new Date(res[0].rows[0].dor).toLocaleString()
                res[0].rows[0].dob = ((new Date() - new Date(res[0].rows[0].dob))/31556952000).toFixed()
                data.patient = res[0].rows[0]
            }
            else
                reject({code: 3, status: 'Internal Server Error. Try again', data: null})
            // res[1] = investigation data
            if (res[1].rowCount > 0) {
                res[1].rows.forEach((e,i) => {
                    res[1].rows[i].doi = new Date(res[1].rows[i].doi).toLocaleString()
                })
                data.investigations = res[1].rows
            }
            // res[2] = surgery data
            if (res[2].rowCount > 0) {
                res[2].rows.forEach((e,i) => {
                    res[2].rows[i].dos = new Date(res[2].rows[i].dos).toLocaleString()
                })
                data.surgeries = res[2].rows
            }
            // res[3] = consultation data
            if (res[3].rowCount > 0) {
                res[3].rows.forEach((e,i) => {
                    res[3].rows[i].doc = new Date(res[3].rows[i].doc).toLocaleString()
                })
                data.consultations = res[3].rows
            }
            resolve({code: 1, status: 'Patient data retrieved', data})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

//-------investigation-----------

async function addInvestigation(userid,fields) {
    console.log('inserting new investigation')
    return new Promise((resolve, reject) => {
        db.query(`INSERT INTO investigation (mrno,invest_type,doi) 
        VALUES (${fields.patientMRNo},'${fields.invest_type}',${new Date().getTime()})
        RETURNING *`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1) {
                res.rows[0].doi = new Date(res.rows[0].doi).toLocaleString()
                resolve({code: 1, status: 'Record added', data: res.rows[0]})
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

async function deleteInvestigation(userid,fields) {
    console.log('deleting investigation')
    return new Promise((resolve, reject) => {
        db.query(`DELETE FROM investigation WHERE mrno=${fields.patientMRNo} AND invest_id=${fields.invest_id}`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1)
                resolve({code: 1, status: 'Record deleted', data: null})
            else
                reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

//-------surgery-----------

async function addSurgery(userid,fields) {
    console.log('inserting new surgery')
    return new Promise((resolve, reject) => {
        db.query(`INSERT INTO surgery (mrno,surgeon_name,surgery_type,dos) 
        VALUES (${fields.patientMRNo},'${fields.surgeon_name}','${fields.surgery_type}',${new Date().getTime()})
        RETURNING *`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1) {
                res.rows[0].dos = new Date(res.rows[0].dos).toLocaleString()
                resolve({code: 1, status: 'Record added', data: res.rows[0]})
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

async function deleteSurgery(userid,fields) {
    console.log('deleting surgery')
    return new Promise((resolve, reject) => {
        db.query(`DELETE FROM surgery WHERE mrno=${fields.patientMRNo} AND surgery_id=${fields.surgery_id}`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1)
                resolve({code: 1, status: 'Record deleted', data: null})
            else
                reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

//-------consultation-----------

async function addConsultation(userid,fields) {
    console.log('inserting new consultation')
    return new Promise((resolve, reject) => {
        db.query(`INSERT INTO consultation (mrno,complaint,examination,advice,image,doc) 
        VALUES (${fields.patientMRNo},'${fields.complaint}','${fields.examination}','${fields.advice}','${fields.image}',${new Date().getTime()})
        RETURNING *`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1) {
                res.rows[0].doc = new Date(res.rows[0].doc).toLocaleString()
                resolve({code: 1, status: 'Record added', data: res.rows[0]})
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

async function deleteConsultation(userid,fields) {
    console.log('deleting consultation')
    return new Promise((resolve, reject) => {
        db.query(`DELETE FROM consultation WHERE mrno=${fields.patientMRNo} AND consult_id=${fields.consult_id}`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1)
                resolve({code: 1, status: 'Record deleted', data: null})
            else
                reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

async function getConsultations(userid,fields) {
    console.log('getting patient consultations')
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM consultation 
        JOIN treatment ON treatment.consult_id = consultation.consult_id
        WHERE consultation.mrno=${fields.patientMRNo} AND consultation.consult_id=${fields.consult_id} 
        ORDER BY doc DESC;`)
        .then(async res => {
            if (res.rowCount == 0)
                res = await db.query(`SELECT * FROM consultation WHERE mrno=${fields.patientMRNo} AND consult_id=${fields.consult_id} `)
            res.rows.forEach((e,i) => {
                res.rows[i].doc = new Date(res.rows[i].doc).toLocaleString()
            })
            resolve({code: 1, status: 'Consultations data retrieved', data: res.rows})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

//-------treatment-----------

async function addTreatment(userid,fields) {
    console.log('inserting new treatment')
    return new Promise((resolve, reject) => {
        db.query(`INSERT INTO treatment (consult_id,med_name,med_str,med_frq,med_dur) 
        VALUES (${fields.consult_id},'${fields.med_name}','${fields.med_str}','${fields.med_frq}','${fields.med_dur}')
        RETURNING *`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1)
                resolve({code: 1, status: 'Medicine added', data: res.rows[0]})
            else
                reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

async function deleteTreatment(userid,fields) {
    console.log('deleting treatment')
    return new Promise((resolve, reject) => {
        db.query(`DELETE FROM treatment WHERE consult_id=${fields.consult_id} AND treat_id=${fields.treat_id}`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1)
                resolve({code: 1, status: 'Medicine deleted', data: null})
            else
                reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

module.exports = {authorize,patients_list,addPatient,editPatient,deletePatient,getPatient,addInvestigation,deleteInvestigation,addSurgery,deleteSurgery,addConsultation,deleteConsultation,getConsultations,addTreatment,deleteTreatment};