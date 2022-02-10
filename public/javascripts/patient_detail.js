function validateFormInvest() {
    console.log('validateFormInvest()')
    if (document.forms["addInvestigationForm"]["invest_type"].value == "Select") {
        alert('Please select type')
        return false;
    }
    return true
}

function addInvestigation(mrno) {
    console.log('addInvestigation()')
    if (!validateFormInvest())
        return
    $.post("/doctor/panel/view/investigation/add", {
        patientMRNo: mrno,
        invest_type: document.getElementById("invest_type").value,
        }, 
        function(res) {
            console.log(res)
            if (res.code == 1) {
                $('#addInvestigationForm').append(`<div id='investigationAddSuccess' class = "alert alert-success">${res.status}</div>`)
                //$('#investigationTable').prepend(`<tr id="investigation${res.data.invest_id}"><th scope="row">${res.data.invest_id}</th><td>${res.data.invest_type}</td><td>${res.data.doi}</td><td><div class="btn-toolbar"><button class="btn btn-danger" type="submit" onclick="deleteInvestigation(${res.data.mrno},${res.data.invest_id})"><i class="fa fa-trash"> <span></span></i></button></div></td></tr>`);
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