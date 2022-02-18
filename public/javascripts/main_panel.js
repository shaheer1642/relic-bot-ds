var serverData = []
$(document).ready(function() {
    if (document.getElementById("serverData").value == "null")
        serverData = []
    else
        serverData = JSON.parse(document.getElementById("serverData").value)
});

function searchByName(element) {
    $('#patientsTable tbody').empty();
    serverData.forEach(patient => {
        var res = {data: patient}
        if (element.value ? patient.name.toLowerCase().match(element.value.toLowerCase()) : true)
            $('#patientsTable').append(`<tr id="patient${res.data.mrno}"><th scope="row">${res.data.mrno}</th><td>${res.data.name}</td><td>${res.data.gender}</td><td>${res.data.dob}</td><td>${res.data.reason_of_visit}</td><td>${res.data.dor}</td><td><div class="btn-toolbar"><form method="post" action="/doctor/panel/view?patient=${res.data.mrno}"><button class="btn btn-info" type="submit"><i class="fa fa-navicon"> <span></span></i></button></form><button class="btn btn-info" type="submit" onclick="editPatientModal(${res.data.mrno})"><i class="fa fa-pencil"> <span></span></i></button><button class="btn btn-danger" type="submit" onclick="deletePatient(${res.data.mrno})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
    });
}
function searchByMrno(element) {
    $('#patientsTable tbody').empty();
    serverData.forEach(patient => {
        var res = {data: patient}
        if (element.value ? patient.mrno == element.value : true)
            $('#patientsTable').append(`<tr id="patient${res.data.mrno}"><th scope="row">${res.data.mrno}</th><td>${res.data.name}</td><td>${res.data.gender}</td><td>${res.data.dob}</td><td>${res.data.reason_of_visit}</td><td>${res.data.dor}</td><td><div class="btn-toolbar"><form method="post" action="/doctor/panel/view?patient=${res.data.mrno}"><button class="btn btn-info" type="submit"><i class="fa fa-navicon"> <span></span></i></button></form><button class="btn btn-info" type="submit" onclick="editPatientModal(${res.data.mrno})"><i class="fa fa-pencil"> <span></span></i></button><button class="btn btn-danger" type="submit" onclick="deletePatient(${res.data.mrno})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
    });
}

function validateForm() {
    console.log('validateForm()')
    if (document.forms["addPatientForm"]["patientName"].value == "") {
        alert('Please enter name')
        return false;
    }
    if (document.forms["addPatientForm"]["patientGender"].value == "Select") {
        alert('Please select gender')
        return false;
    }
    if (document.forms["addPatientForm"]["patientReason"].value == "Select") {
        alert('Please select reason of visit')
        return false;
    }
    return true
}

function validateFormEdit() {
    console.log('validateFormEdit()')
    if (document.forms["editPatientForm"]["patientNameEdit"].value == "") {
        alert('Please enter name')
        return false;
    }
    if (document.forms["editPatientForm"]["patientGenderEdit"].value == "Select") {
        alert('Please select gender')
        return false;
    }
    if (document.forms["editPatientForm"]["patientReasonEdit"].value == "Select") {
        alert('Please select reason of visit')
        return false;
    }
    return true
}

function addPatient() {
    if (!validateForm())
        return
    console.log('addPatient()')
    $('#addPatientForm').append(`<div id='loading'><img src="/images/loading.gif" width="10%" height="auto"></div>`)
    $('#btnAddPatient').prop('disabled', true);
    $.post("/doctor/panel/add", {
            patientName: document.getElementById("patientName").value,
            patientGender: document.getElementById("patientGender").value,
            patientReason: document.getElementById("patientReason").value,
            patientDoB: document.getElementById("patientDoB").value
        }, 
        function(res) {
            console.log(res)
            if (res.code == 1) {
                $('#addPatientForm').append(`<div id='patientAddSuccess' class = "alert alert-success">${res.status}</div>`)
                $('#patientsTable').prepend(`<tr id="patient${res.data.mrno}"><th scope="row">${res.data.mrno}</th><td>${res.data.name}</td><td>${res.data.gender}</td><td>${res.data.dob}</td><td>${res.data.reason_of_visit}</td><td>${res.data.dor}</td><td><div class="btn-toolbar"><form method="post" action="/doctor/panel/view?patient=${res.data.mrno}"><button class="btn btn-info" type="submit"><i class="fa fa-navicon"> <span></span></i></button></form><button class="btn btn-info" type="submit" onclick="editPatientModal(${res.data.mrno})"><i class="fa fa-pencil"> <span></span></i></button><button class="btn btn-danger" type="submit" onclick="deletePatient(${res.data.mrno})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
                $('#addPatientForm').trigger("reset");

                setTimeout(() => {
                console.log('alert remove timeout')
                $('#patientAddSuccess').fadeOut(300, function() { $(this).remove(); })
                }, 3000);

                serverData.push({
                    mrno: res.data.mrno,
                    name: res.data.name,
                    gender: res.data.gender,
                    dob: res.data.dob,
                    dor: res.data.dor,
                    reason_of_visit: res.data.reason_of_visit,
                    doc_id: res.data.doc_id
                })
                document.getElementById("totalPatients").innerText = "Total: " + serverData.length
            }
            else {
                $('#addPatientForm').append(`<div id='patientAddFail' class = "alert alert-danger">${res.status}</div>`)
                setTimeout(() => {
                    console.log('alert remove timeout')
                    $('#patientAddFail').fadeOut(300, function () { $(this).remove(); })
                }, 3000);
            }
            $('#loading').remove()
            $('#btnAddPatient').prop('disabled', false);
        }
    )
}

function deletePatient(patientMRNo) {
    if (confirm(`Are you sure you want to delete patient#${patientMRNo} record?`)) {
        console.log('deletePatient()')
        $.post("/doctor/panel/delete", {
                patientMRNo: patientMRNo
            }, 
            function(res) {
                console.log(res)
                if (res.code == 1) {
                    $(`#patient${patientMRNo}`).fadeOut(300, function () { $(this).remove(); })
                    serverData = serverData.filter(function(el) { return el.mrno != patientMRNo; });
                    document.getElementById("totalPatients").innerText = "Total: " + serverData.length
                }
                else
                    alert(res.status)
            }
        )
    }
}

function editPatientModal(patientMRNo) {
    console.log('editPatientModal()')
    console.log(patientMRNo)
    $('#editPatient').modal('show')
    document.getElementById("patientMRNoEdit").innerHTML = 'MR#' + patientMRNo
    document.getElementById("patientNameEdit").value = $(`#patient${patientMRNo}`).find("td:eq(0)").text()
    document.getElementById("patientGenderEdit").value = $(`#patient${patientMRNo}`).find("td:eq(1)").text()
    document.getElementById("patientReasonEdit").value = $(`#patient${patientMRNo}`).find("td:eq(3)").text()
}

function editPatient() {
    if (!validateFormEdit())
        return
    console.log('editPatient()')
    $('#editPatientForm').append(`<div id='loading'><img src="/images/loading.gif" width="10%" height="auto"></div>`)
    $('#btnEditPatient').prop('disabled', true);
    $.post("/doctor/panel/edit", {
            patientMRNo: document.getElementById("patientMRNoEdit").innerHTML.replace('MR#',''),
            patientName: document.getElementById("patientNameEdit").value,
            patientGender: document.getElementById("patientGenderEdit").value,
            patientReason: document.getElementById("patientReasonEdit").value
        }, 
        function(res) {
            console.log(res)
            if (res.code == 1) {
                $('#editPatientForm').append(`<div id='patientEditSuccess' class = "alert alert-success">${res.status}</div>`)
                $(`#patient${res.data.mrno}`).find("td:eq(0)").text(res.data.name)
                $(`#patient${res.data.mrno}`).find("td:eq(1)").text(res.data.gender)
                $(`#patient${res.data.mrno}`).find("td:eq(3)").text(res.data.reason_of_visit)

                setTimeout(() => {
                console.log('alert remove timeout')
                $('#patientEditSuccess').fadeOut(300, function () { $(this).remove(); })
                }, 3000);
            }
            else {
                $('#editPatientForm').append(`<div id='patientEditFail' class = "alert alert-danger">${res.status}</div>`)
                setTimeout(() => {
                    console.log('alert remove timeout')
                    $('#patientEditFail').fadeOut(300, function () { $(this).remove(); })
                }, 3000);
            }
            $('#loading').remove()
            $('#btnEditPatient').prop('disabled', false);
        }
    )
}