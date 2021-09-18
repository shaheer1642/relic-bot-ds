;----function will get online orders info about any item and will store it in a file----
#include Jxon.ahk
getOrder(item_url,file_name)
{
    WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    WebRequest.Open("GET", "https://api.warframe.market/v1/items/" . item_url . "/orders?include=item", true)
    try
    {
        loop 
        {
            WebRequest.Send()
            WebRequest.WaitForResponse(15)
            if !(InStr(WebRequest.ResponseText, "Service Temporarily Unavailable"))
                break
        }
    }
    catch e
    {
        errorText := "[" . A_DD . "/" . A_MMM . "/" . A_YYYY . " " . A_Hour . ":" . A_Min . "] " . "Error at Line " . A_LineNumber . ": Failed to retreive item orders info from API in function getOrder()" . "`r`n"
        Fileappend, %errorText% , Error log.dat
        return -1
    }
    file := FileOpen(file_name, "a")
    ordersArr := Jxon_Load(WebRequest.ResponseText)				; Jxon_Load loads the string into ordersArr object
    string=
(
    
    "%item_url%": [
)
    file.write(string)
    commaFlag := 0
    loop % ordersArr.payload.orders.MaxIndex()
    {
        orderIndex := A_index
        if ((ordersArr.payload.orders[A_Index].user.status == "ingame") && (ordersArr.payload.orders[A_Index].order_type == "sell"))
        {
            seller := ordersArr.payload.orders[A_Index].user.ingame_name
            quantity := ordersArr.payload.orders[A_Index].quantity
            price := ordersArr.payload.orders[A_Index].platinum
            if (commaFlag)
                file.write(",")
            string=
(

        {
            "seller": "%seller%",
            "quantity": %quantity%,
            "price": %price%
        }
)
            file.write(string)
            commaFlag := 1
        }
        /*
        if (orderIndex == ordersArr.payload.orders.MaxIndex())
        {
            file.write("`r`n]")
        }
        */
    }
    string=
(

    ]
)
    file.write(string)
    file.close()
    return 0
}