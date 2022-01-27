var toggleColor = 1

function changeColor() {
    toggleColor = !toggleColor
    if (toggleColor)
        document.getElementById("demo").style.color = "red";
    else
        document.getElementById("demo").style.color = "black";
}

function mainButtons(type) {
    document.getElementById('desig').textContent = 'you selected ' + type
}