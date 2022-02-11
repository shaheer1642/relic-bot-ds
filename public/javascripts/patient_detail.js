
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
    console.log('addInvestigation()')
    if (!validateFormInvest())
        return
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
        alert('Please select type')
        return false;
    }
    if (document.forms["addConsultationForm"]["examination"].value == "") {
        alert('Please select type')
        return false;
    }
    if (document.forms["addConsultationForm"]["advice"].value == "") {
        alert('Please select type')
        return false;
    }
    return true
}

function addConsultation(patientMRNo) {
    console.log('addConsultation()')
    if (!validateFormConsult())
        return
    $.post("/doctor/panel/view/consultation/add", {
            patientMRNo: patientMRNo,
            complaint: document.getElementById("complaint").value,
            examination: document.getElementById("examination").value,
            advice: document.getElementById("advice").value,
            image: document.getElementById("image").value,
        }, 
        function(res) {
            console.log(res)
            if (res.code == 1) {
                $('#addConsultationForm').append(`<div id='consultationAddSuccess' class = "alert alert-success">${res.status}</div>`)
                $('#consultationTable').prepend(`<tr id="consultation${res.data.consult_id}"><th scope="row">${res.data.consult_id}</th><td>${res.data.complaint}</td><td>${res.data.examination}</td><td>${res.data.advice}</td><td>${res.data.image}</td><td>${res.data.doc}</td><td><div class="btn-toolbar"><button class="btn btn-danger" type="submit" onclick="deleteConsultation(${res.data.mrno},${res.data.consult_id})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
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
        }
    )
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