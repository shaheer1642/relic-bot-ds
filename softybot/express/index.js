var toggleColor = 1

function changeColor() {
    toggleColor = !toggleColor
    if (toggleColor)
        document.getElementById("demo").style.color = "red";
    else
        document.getElementById("demo").style.color = "black";
}