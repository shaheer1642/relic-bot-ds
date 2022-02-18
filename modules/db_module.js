const axios = require('axios');
const axiosRetry = require('axios-retry');
const {db} = require('./db_connection.js');
const {WebhookClient} = require('discord.js');
const fs = require('fs')

const wh_dbManager = new WebhookClient({url: process.env.DISCORD_IMAGES});

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

async function signup(fields) {
    console.log('signing up user')
    return new Promise((resolve, reject) => {
        if (fields.pass != fields.c_pass)
            reject({code: 2, status: 'Password mismatch'})
        else
            db.query(`INSERT INTO users_list (username,password) VALUES('${fields.user}','${fields.pass}')`)
            .then(res => {
                console.log('rowCount = ' + res.rowCount)
                if (res.rowCount == 1)
                    resolve({code: 1, status: 'Sign up Successful'})
                else
                    reject({code: 3, status: 'Internal Server Error. Try again'})
            })
            .catch(err => {
                console.log(err)
                if (err.code == 23505)
                    reject({code: 2, status: 'That username already exists'})
                else
                    reject({code: 3, status: err})
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
        var data = {patient: null,consultations: null,investigations: null,surgeries: null,invoices: null}

        //patient data
        db.query(`
            SELECT * FROM patients WHERE doc_id=${userid} AND mrno=${mrno};
            SELECT * FROM investigation WHERE mrno=${mrno} ORDER BY doi DESC;
            SELECT * FROM surgery WHERE mrno=${mrno} ORDER BY dos DESC;
            SELECT * FROM consultation WHERE mrno=${mrno} ORDER BY doc DESC;
            SELECT * FROM invoice WHERE mrno=${mrno} ORDER BY dop DESC;
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
            // res[4] = invoice data
            if (res[4].rowCount > 0) {
                res[4].rows.forEach((e,i) => {
                    res[4].rows[i].dop = new Date(res[4].rows[i].dop).toLocaleString()
                    res[4].rows[i].discount = res[4].rows[i].payment*(res[4].rows[i].discount/100)
                })
                data.invoices = res[4].rows
            }
            resolve({code: 1, status: 'Patient data retrieved', data})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

async function getPatient2(fields) {
    console.log('getting patient')
    return new Promise((resolve, reject) => {
        var data = {patient: null,consultations: null,investigations: null,surgeries: null,invoices: null}

        //patient data
        db.query(`
            SELECT * FROM patients WHERE mrno=${fields.mrno} AND dob=${fields.dob ? new Date(fields.dob).getTime():-1} OR LOWER(name)='${fields.name.toLowerCase()}';
            SELECT * FROM investigation WHERE mrno=${fields.mrno} ORDER BY doi DESC;
            SELECT * FROM surgery WHERE mrno=${fields.mrno} ORDER BY dos DESC;
            SELECT * FROM consultation WHERE mrno=${fields.mrno} ORDER BY doc DESC;
            SELECT * FROM invoice WHERE mrno=${fields.mrno} ORDER BY dop DESC;
        `)
        .then(res => {
            // res[0] = patient data
            if (res[0].rowCount == 1) {
                res[0].rows[0].dor = new Date(res[0].rows[0].dor).toLocaleString()
                res[0].rows[0].dob = ((new Date() - new Date(res[0].rows[0].dob))/31556952000).toFixed()
                data.patient = res[0].rows[0]
            }
            else
                reject({code: 2, status: 'No record found', data: null})
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
            // res[4] = invoice data
            if (res[4].rowCount > 0) {
                res[4].rows.forEach((e,i) => {
                    res[4].rows[i].dop = new Date(res[4].rows[i].dop).toLocaleString()
                    res[4].rows[i].discount = res[4].rows[i].payment*(res[4].rows[i].discount/100)
                })
                data.invoices = res[4].rows
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

//-------invoice-----------

async function addInvoice(userid,fields) {
    console.log('inserting new invoice')
    return new Promise((resolve, reject) => {
        db.query(`INSERT INTO invoice (mrno,payment,discount,total,dop) 
        VALUES (${fields.patientMRNo},${fields.payment},${fields.discount},${fields.payment - (fields.payment*(fields.discount/100))},${new Date().getTime()})
        RETURNING *`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1) {
                res.rows[0].dop = new Date(res.rows[0].dop).toLocaleString()
                res.rows[0].discount = res.rows[0].payment*(res.rows[0].discount/100)
                resolve({code: 1, status: 'Invoice added', data: res.rows[0]})
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

async function deleteInvoice(userid,fields) {
    console.log('deleting invoice')
    return new Promise((resolve, reject) => {
        db.query(`DELETE FROM invoice WHERE mrno=${fields.patientMRNo} AND invoice_id=${fields.invoice_id}`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1)
                resolve({code: 1, status: 'Invoice deleted', data: null})
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

async function addConsultation(userid,fields,file) {
    console.log('inserting new consultation')
    return new Promise(async (resolve, reject) => {

        var img_url = ""

        if (file) {
            await wh_dbManager.send({
                content: "hi",
                files: [
                    {
                        attachment: file.path,
                        name: file.originalname
                    }
                ]
            })
            .then(res => {
                img_url = res.attachments[0].url
            }).catch(err => console.log(err))
        }

        db.query(`INSERT INTO consultation (mrno,complaint,examination,advice,image,doc) 
        VALUES (${fields.patientMRNo},'${fields.complaint}','${fields.examination}','${fields.advice}','${img_url}',${new Date().getTime()})
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

async function getConsultation(fields) {
    console.log('getting patient consultation')
    return new Promise((resolve, reject) => {
        db.query(`
            SELECT * FROM consultation WHERE mrno=${fields.patientMRNo} AND consult_id=${fields.consult_id};
            SELECT * FROM consultation 
            JOIN treatment ON treatment.consult_id = consultation.consult_id
            WHERE consultation.mrno=${fields.patientMRNo} AND consultation.consult_id=${fields.consult_id} 
            ORDER BY treatment.treat_id DESC;
            SELECT * FROM consultation 
            JOIN glasses_prescription ON glasses_prescription.consult_id = consultation.consult_id
            WHERE consultation.mrno=${fields.patientMRNo} AND consultation.consult_id=${fields.consult_id} 
            ORDER BY glasses_prescription.presc_id DESC;
        `)
        .then(async res => {
            var data = {consultation: {}, treatments: [], prescriptions: []}

            //res[0] = consultation data
            if (res[0].rowCount != 1)
                reject({code: 3, status: 'Internal Server Error. Try again', data: null})
            res[0].rows[0].doc = new Date(res[0].rows[0].doc).toLocaleString()
            data.consultation = res[0].rows[0]

            //res[1] = treatments data
            data.treatments = res[1].rows

            //res[2] = prescriptions data
            data.prescriptions = res[2].rows

            resolve({code: 1, status: 'Consultations data retrieved', data: data})
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

//-------prescription-----------

async function addPrescription(userid,fields) {
    console.log('inserting new prescription')
    return new Promise((resolve, reject) => {
        db.query(`INSERT INTO glasses_prescription (consult_id,presc_type,l_spherical,r_spherical,l_cylindrical,r_cylindrical,l_axis,r_axis,l_visual_acuity,r_visual_acuity) 
        VALUES (${fields.consult_id},'${fields.presc_type}',${fields.l_spherical},${fields.r_spherical},${fields.l_cylindrical},${fields.r_cylindrical},${fields.l_axis},${fields.r_axis},${fields.l_visual_acuity},${fields.r_visual_acuity})
        RETURNING *`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1)
                resolve({code: 1, status: 'Prescription added', data: res.rows[0]})
            else
                reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

async function deletePrescription(userid,fields) {
    console.log('deleting prescription')
    return new Promise((resolve, reject) => {
        db.query(`DELETE FROM glasses_prescription WHERE consult_id=${fields.consult_id} AND presc_id=${fields.presc_id}`)
        .then(res => {
            console.log('rowCount = ' + res.rowCount)
            if (res.rowCount == 1)
                resolve({code: 1, status: 'Prescription deleted', data: null})
            else
                reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
        .catch(err => {
            console.log(err)
            reject({code: 3, status: 'Internal Server Error. Try again', data: null})
        })
    });
}

module.exports = {authorize,signup,patients_list,addPatient,editPatient,deletePatient,getPatient,getPatient2,addInvestigation,deleteInvestigation,addSurgery,deleteSurgery,addInvoice,deleteInvoice,addConsultation,deleteConsultation,getConsultation,addTreatment,deleteTreatment,addPrescription,deletePrescription};