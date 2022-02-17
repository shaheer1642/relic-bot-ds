//-----investigation-----

function validateFormInvest() {
    console.log('validateFormInvest()')
    if (document.forms["addInvestigationForm"]["invest_type"].value == "Select") {
        alert('Please select type')
        return false;
    }
    return true
}

function addInvestigation(patientMRNo) {
    if (!validateFormInvest())
        return
    console.log('addInvestigation()')
    $('#addInvestigationForm').append(`<div id='loading'><img src="/images/loading.gif" width="10%" height="auto"></div>`)
    $('#btnAddInvestigation').prop('disabled', true);
    $.post("/doctor/panel/view/investigation/add", {
            patientMRNo: patientMRNo,
            invest_type: document.getElementById("invest_type").value,
        }, 
        function(res) {
            console.log(res)
            if (res.code == 1) {
                $('#addInvestigationForm').append(`<div id='investigationAddSuccess' class = "alert alert-success">${res.status}</div>`)
                $('#investigationTable').prepend(`<tr id="investigation${res.data.invest_id}"><th scope="row">${res.data.invest_id}</th><td>${res.data.invest_type}</td><td>${res.data.doi}</td><td><div class="btn-toolbar"><button class="btn btn-danger" type="submit" onclick="deleteInvestigation(${res.data.mrno},${res.data.invest_id})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
                $('#addInvestigationForm').trigger("reset");

                setTimeout(() => {
                console.log('alert remove timeout')
                $('#investigationAddSuccess').fadeOut(300, function() { $(this).remove(); })
                }, 3000);
            }
            else {
                $('#addInvestigationForm').append(`<div id='investigationAddFail' class = "alert alert-danger">${res.status}</div>`)
                setTimeout(() => {
                    console.log('alert remove timeout')
                    $('#investigationAddFail').fadeOut(300, function () { $(this).remove(); })
                }, 3000);
            }
            $('#loading').remove()
            $('#btnAddInvestigation').prop('disabled', false);
        }
    )
}

function deleteInvestigation(patientMRNo,invest_id) {
    if (confirm(`Are you sure you want to delete investigation#${invest_id}?`)) {
        console.log('deleteInvestigation()')
        $.post("/doctor/panel/view/investigation/delete", {
                patientMRNo: patientMRNo,
                invest_id: invest_id
            }, 
            function(res) {
                console.log(res)
                if (res.code == 1)
                    $(`#investigation${invest_id}`).fadeOut(300, function () { $(this).remove(); })
                else
                    alert(res.status)
            }
        )
    }
}

//-----surgery-----

function validateFormSurgery() {
    console.log('validateFormSurgery()')
    if (document.forms["addSurgeryForm"]["surgeon_name"].value == "") {
        alert('Please enter surgeon\'s name')
        return false;
    }
    if (document.forms["addSurgeryForm"]["surgery_type"].value == "Select") {
        alert('Please select type')
        return false;
    }
    return true
}

function addSurgery(patientMRNo) {
    console.log('addSurgery()')
    if (!validateFormSurgery())
        return
    $('#addSurgeryForm').append(`<div id='loading'><img src="/images/loading.gif" width="10%" height="auto"></div>`)
    $('#btnAddSurgery').prop('disabled', true);
    $.post("/doctor/panel/view/surgery/add", {
            patientMRNo: patientMRNo,
            surgeon_name: document.getElementById("surgeon_name").value,
            surgery_type: document.getElementById("surgery_type").value
        }, 
        function(res) {
            console.log(res)
            if (res.code == 1) {
                $('#addSurgeryForm').append(`<div id='surgeryAddSuccess' class = "alert alert-success">${res.status}</div>`)
                $('#surgeryTable').prepend(`<tr id="surgery${res.data.surgery_id}"><th scope="row">${res.data.surgery_id}</th><td>${res.data.surgeon_name}</td><td>${res.data.surgery_type}</td><td>${res.data.dos}</td><td><div class="btn-toolbar"><button class="btn btn-danger" type="submit" onclick="deleteSurgery(${res.data.mrno},${res.data.surgery_id})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
                $('#addSurgeryForm').trigger("reset");

                setTimeout(() => {
                console.log('alert remove timeout')
                $('#surgeryAddSuccess').fadeOut(300, function() { $(this).remove(); })
                }, 3000);
            }
            else {
                $('#addSurgeryForm').append(`<div id='surgeryAddFail' class = "alert alert-danger">${res.status}</div>`)
                setTimeout(() => {
                    console.log('alert remove timeout')
                    $('#surgeryAddFail').fadeOut(300, function () { $(this).remove(); })
                }, 3000);
            }
            $('#loading').remove()
            $('#btnAddSurgery').prop('disabled', false);
        }
    )
}

function deleteSurgery(patientMRNo,surgery_id) {
    if (confirm(`Are you sure you want to delete surgery#${surgery_id}?`)) {
        console.log('deleteSurgery()')
        $.post("/doctor/panel/view/surgery/delete", {
                patientMRNo: patientMRNo,
                surgery_id: surgery_id
            }, 
            function(res) {
                console.log(res)
                if (res.code == 1)
                    $(`#surgery${surgery_id}`).fadeOut(300, function () { $(this).remove(); })
                else
                    alert(res.status)
            }
        )
    }
}

//-----consultation-----

function validateFormConsult() {
    console.log('validateFormConsult()')
    if (document.forms["addConsultationForm"]["complaint"].value == "") {
        alert('Please enter complaint')
        return false;
    }
    if (document.forms["addConsultationForm"]["examination"].value == "") {
        alert('Please enter examination')
        return false;
    }
    if (document.forms["addConsultationForm"]["advice"].value == "") {
        alert('Please enter advice')
        return false;
    }
    return true
}

async function addConsultation(patientMRNo) {
    console.log('addConsultation()')
    
    if (!validateFormConsult())
        return

    $('#addConsultationForm').append(`<div id='loading'><img src="/images/loading.gif" width="10%" height="auto"></div>`)
    $('#btnAddConsultation').prop('disabled', true);

    var form = $('#addConsultationForm')[0];
    var fd = new FormData(form);
    fd.append('patientMRNo',patientMRNo)

    $.ajax({
        url: "/doctor/panel/view/consultation/add",
        type: 'post',
        enctype: 'multipart/form-data',
        data: fd,
        contentType: false,
        processData: false,
        success: function(res){
            //console.log(res)
            if (res.code == 1) {
                $('#addConsultationForm').append(`<div id='consultationAddSuccess' class = "alert alert-success">${res.status}</div>`)
                $('#consultationTable').prepend(`<tr id="consultation${res.data.consult_id}"><th scope="row">${res.data.consult_id}</th><td>${res.data.complaint}</td><td>${res.data.examination}</td><td>${res.data.advice}</td><td><img src="${res.data.image}" width=100% height=auto></td><td>${res.data.doc}</td><td><div class="btn-toolbar"><button class="btn btn-info" type="button" onclick="viewConsultationModal(${patientMRNo},${res.data.consult_id})"><i class="fa fa-navicon"> <span></span></i></button><button class="btn btn-danger" type="submit" onclick="deleteConsultation(${res.data.mrno},${res.data.consult_id})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
                $('#addConsultationForm').trigger("reset");

                setTimeout(() => {
                    console.log('alert remove timeout')
                    $('#consultationAddSuccess').fadeOut(300, function() { $(this).remove(); })
                }, 3000);
            }
            else {
                $('#addConsultationForm').append(`<div id='consultationAddFail' class = "alert alert-danger">${res.status}</div>`)
                setTimeout(() => {
                    console.log('alert remove timeout')
                    $('#consultationAddFail').fadeOut(300, function () { $(this).remove(); })
                }, 3000);
            }
            $('#loading').remove()
            $('#btnAddConsultation').prop('disabled', false);
        },
    });
}

function deleteConsultation(patientMRNo,consult_id) {
    if (confirm(`Are you sure you want to delete consultation#${consult_id}?`)) {
        console.log('deleteConsultation()')
        $.post("/doctor/panel/view/consultation/delete", {
                patientMRNo: patientMRNo,
                consult_id: consult_id
            }, 
            function(res) {
                console.log(res)
                if (res.code == 1)
                    $(`#consultation${consult_id}`).fadeOut(300, function () { $(this).remove(); })
                else
                    alert(res.status)
            }
        )
    }
}

function viewConsultationModal(patientMRNo,consult_id) {
    console.log('viewConsultationModal()')

    $.post("/doctor/panel/view/consultation/get", {
            patientMRNo: patientMRNo,
            consult_id: consult_id
        }, 
        function(res) {
            document.getElementById("consultation_consult_id").innerHTML = 'Consultation ID: ' + res.data.consultation.consult_id
            document.getElementById("consultation_complaint").innerHTML = 'Complaint: ' + res.data.consultation.complaint
            document.getElementById("consultation_examination").innerHTML = 'Examination: ' + res.data.consultation.examination
            document.getElementById("consultation_advice").innerHTML = 'Advice: ' + res.data.consultation.advice
            document.getElementById("consultation_image").src = res.data.consultation.image
            document.getElementById("consultation_doc").innerHTML = 'Date: ' + res.data.consultation.doc
            $('#treatmentTable tbody').empty();
            res.data.treatments.forEach(treatment => {
                if (treatment.treat_id)
                    $('#treatmentTable').append(`<tr id="treatment${treatment.treat_id}"><th scope="row">${treatment.treat_id}</th><td>${treatment.med_name}</td><td>${treatment.med_str}</td><td>${treatment.med_frq}</td><td>${treatment.med_dur}</td><td><div class="btn-toolbar"><button class="btn btn-danger" type="submit" onclick="deleteTreatment(${treatment.consult_id},${treatment.treat_id})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
            });
            $('#prescriptionTable tbody').empty();
            res.data.prescriptions.forEach(prescription => {
                if (prescription.presc_id)
                    $('#prescriptionTable').append(`<tr id="prescription${prescription.presc_id}"><th scope="row">${prescription.presc_id}</th><td>${prescription.presc_type}</td><td>${prescription.l_spherical}</td><td>${prescription.r_spherical}</td><td>${prescription.l_cylindrical}</td><td>${prescription.r_cylindrical}</td><td>${prescription.l_axis}</td><td>${prescription.r_axis}</td><td>${prescription.l_visual_acuity}</td><td>${prescription.r_visual_acuity}</td><td><div class="btn-toolbar"><button class="btn btn-danger" type="submit" onclick="deletePrescription(${prescription.consult_id},${prescription.presc_id})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
            });
            $('#viewConsultation').modal('show');
        }
    )

}

//-----treatment-----

function validateFormTreat() {
    console.log('validateFormTreat()')
    if (document.forms["addTreatmentForm"]["med_name"].value == "") {
        alert('Please enter medicine name')
        return false;
    }
    if (document.forms["addTreatmentForm"]["med_str1"].value == "") {
        alert('Please enter medicine strength')
        return false;
    }
    if (document.forms["addTreatmentForm"]["med_dur1"].value == "") {
        alert('Please enter medicine duration')
        return false;
    }
    return true
}

function addTreatment() {
    console.log('addTreatment()')
    console.log(document.getElementById("consultation_consult_id").innerText)
    if (!validateFormTreat())
        return
    $('#addTreatmentForm').append(`<div id='loading'><img src="/images/loading.gif" width="10%" height="auto"></div>`)
    $('#btnAddTreatment').prop('disabled', true);
    $.post("/doctor/panel/view/consultation/treatment/add", {
            consult_id: document.getElementById("consultation_consult_id").innerText.replace('Consultation ID:','').trim(),
            med_name: document.getElementById("med_name").value,
            med_str: `${document.getElementById("med_str1").value} ${document.getElementById("med_str2").value}`,
            med_frq: document.getElementById("med_frq").value,
            med_dur: `${document.getElementById("med_dur1").value} ${document.getElementById("med_dur2").value}`
        }, 
        function(res) {
            console.log(res)
            if (res.code == 1) {
                $('#addTreatmentForm').append(`<div id='treatmentAddSuccess' class = "alert alert-success">${res.status}</div>`)
                $('#treatmentTable').prepend(`<tr id="treatment${res.data.treat_id}"><th scope="row">${res.data.treat_id}</th><td>${res.data.med_name}</td><td>${res.data.med_str}</td><td>${res.data.med_frq}</td><td>${res.data.med_dur}</td><td><div class="btn-toolbar"><button class="btn btn-danger" type="submit" onclick="deleteTreatment(${res.data.consult_id},${res.data.treat_id})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
                $('#addTreatmentForm').trigger("reset");

                setTimeout(() => {
                console.log('alert remove timeout')
                $('#treatmentAddSuccess').fadeOut(300, function() { $(this).remove(); })
                }, 3000);
            }
            else {
                $('#addTreatmentForm').append(`<div id='treatmentAddFail' class = "alert alert-danger">${res.status}</div>`)
                setTimeout(() => {
                    console.log('alert remove timeout')
                    $('#treatmentAddFail').fadeOut(300, function () { $(this).remove(); })
                }, 3000);
            }
            $('#loading').remove()
            $('#btnAddTreatment').prop('disabled', false);
        }
    )
}

function deleteTreatment(consult_id,treat_id) {
    if (confirm(`Are you sure you want to delete treatment#${treat_id}?`)) {
        console.log('deleteTreatment()')
        $.post("/doctor/panel/view/consultation/treatment/delete", {
                consult_id: consult_id,
                treat_id: treat_id
            }, 
            function(res) {
                console.log(res)
                if (res.code == 1)
                    $(`#treatment${treat_id}`).fadeOut(300, function () { $(this).remove(); })
                else
                    alert(res.status)
            }
        )
    }
}

//-----prescription-----

function validateFormPresc() {
    console.log('validateFormPresc()')
    if (document.forms["addPrescriptionForm"]["l_spherical"].value == "" || document.forms["addPrescriptionForm"]["r_spherical"].value == ""  || document.forms["addPrescriptionForm"]["l_cylindrical"].value == ""  || document.forms["addPrescriptionForm"]["r_cylindrical"].value == ""  || document.forms["addPrescriptionForm"]["l_axis"].value == ""  || document.forms["addPrescriptionForm"]["r_axis"].value == ""  || document.forms["addPrescriptionForm"]["l_visual_acuity"].value == ""  || document.forms["addPrescriptionForm"]["r_visual_acuity"].value == "" ) {
        alert('Please fill the form')
        return false;
    }
    return true
}

function addPrescription() {
    console.log('addPrescription()')
    console.log(document.getElementById("consultation_consult_id").innerText)
    if (!validateFormPresc())
        return
    $('#addPrescriptionForm').append(`<div id='loading'><img src="/images/loading.gif" width="10%" height="auto"></div>`)
    $('#btnAddPrescription').prop('disabled', true);
    $.post("/doctor/panel/view/consultation/prescription/add", {
            consult_id: document.getElementById("consultation_consult_id").innerText.replace('Consultation ID:','').trim(),
            presc_type: document.getElementById("presc_type").value,
            l_spherical: document.getElementById("l_spherical").value,
            r_spherical: document.getElementById("r_spherical").value,
            l_cylindrical: document.getElementById("l_cylindrical").value,
            r_cylindrical: document.getElementById("r_cylindrical").value,
            l_axis: document.getElementById("l_axis").value,
            r_axis: document.getElementById("r_axis").value,
            l_visual_acuity: document.getElementById("l_visual_acuity").value,
            r_visual_acuity: document.getElementById("r_visual_acuity").value
        }, 
        function(res) {
            console.log(res)
            if (res.code == 1) {
                $('#addPrescriptionForm').append(`<div id='prescriptionAddSuccess' class = "alert alert-success">${res.status}</div>`)
                $('#prescriptionTable').prepend(`<tr id="prescription${res.data.presc_id}"><th scope="row">${res.data.presc_id}</th><td>${res.data.presc_type}</td><td>${res.data.l_spherical}</td><td>${res.data.r_spherical}</td><td>${res.data.l_cylindrical}</td><td>${res.data.r_cylindrical}</td><td>${res.data.l_axis}</td><td>${res.data.r_axis}</td><td>${res.data.l_visual_acuity}</td><td>${res.data.r_visual_acuity}</td><td><div class="btn-toolbar"><button class="btn btn-danger" type="submit" onclick="deletePrescription(${res.data.consult_id},${res.data.presc_id})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
                $('#addPrescriptionForm').trigger("reset");

                setTimeout(() => {
                console.log('alert remove timeout')
                $('#prescriptionAddSuccess').fadeOut(300, function() { $(this).remove(); })
                }, 3000);
            }
            else {
                $('#addPrescriptionForm').append(`<div id='prescriptionAddFail' class = "alert alert-danger">${res.status}</div>`)
                setTimeout(() => {
                    console.log('alert remove timeout')
                    $('#prescriptionAddFail').fadeOut(300, function () { $(this).remove(); })
                }, 3000);
            }
            $('#loading').remove()
            $('#btnAddPrescription').prop('disabled', false);
        }
    )
}

function deletePrescription(consult_id,presc_id) {
    if (confirm(`Are you sure you want to delete prescription#${presc_id}?`)) {
        console.log('deletePrescription()')
        $.post("/doctor/panel/view/consultation/prescription/delete", {
                consult_id: consult_id,
                presc_id: presc_id
            }, 
            function(res) {
                console.log(res)
                if (res.code == 1)
                    $(`#prescription${presc_id}`).fadeOut(300, function () { $(this).remove(); })
                else
                    alert(res.status)
            }
        )
    }
}

//-----invoice-----

function validateFormInvoice() {
    console.log('validateFormInvoice()')
    if (document.forms["addInvoiceForm"]["payment"].value == "") {
        alert('Please enter payment amount')
        return false;
    }
    if (document.forms["addInvoiceForm"]["discount"].value == "") {
        alert('Please enter discount %')
        return false;
    }
    return true
}

function addInvoice(patientMRNo) {
    console.log('addInvoice()')
    if (!validateFormInvoice())
        return
    $('#addInvoiceForm').append(`<div id='loading'><img src="/images/loading.gif" width="10%" height="auto"></div>`)
    $('#btnAddInvoice').prop('disabled', true);
    $.post("/doctor/panel/view/invoice/add", {
            patientMRNo: patientMRNo,
            payment: document.getElementById("payment").value,
            discount: document.getElementById("discount").value
        }, 
        function(res) {
            console.log(res)
            if (res.code == 1) {
                $('#addInvoiceForm').append(`<div id='invoiceAddSuccess' class = "alert alert-success">${res.status}</div>`)
                $('#invoiceTable').prepend(`<tr id="invoice${res.data.invoice_id}"><th scope="row">${res.data.invoice_id}</th><td>${res.data.payment}</td><td>${res.data.discount}</td><td>${res.data.total}</td><td>${res.data.dop}</td><td><div class="btn-toolbar"><button class="btn btn-danger" type="submit" onclick="deleteInvoice(${res.data.mrno},${res.data.invoice_id})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
                $('#addInvoiceForm').trigger("reset");

                setTimeout(() => {
                console.log('alert remove timeout')
                $('#invoiceAddSuccess').fadeOut(300, function() { $(this).remove(); })
                }, 3000);
            }
            else {
                $('#addInvoiceForm').append(`<div id='invoiceAddFail' class = "alert alert-danger">${res.status}</div>`)
                setTimeout(() => {
                    console.log('alert remove timeout')
                    $('#invoiceAddFail').fadeOut(300, function () { $(this).remove(); })
                }, 3000);
            }
            $('#loading').remove()
            $('#btnAddInvoice').prop('disabled', false);
        }
    )
}

function deleteInvoice(patientMRNo,invoice_id) {
    if (confirm(`Are you sure you want to delete invoice#${invoice_id}?`)) {
        console.log('deleteInvoice()')
        $.post("/doctor/panel/view/invoice/delete", {
                patientMRNo: patientMRNo,
                invoice_id: invoice_id
            }, 
            function(res) {
                console.log(res)
                if (res.code == 1)
                    $(`#invoice${invoice_id}`).fadeOut(300, function () { $(this).remove(); })
                else
                    alert(res.status)
            }
        )
    }
}