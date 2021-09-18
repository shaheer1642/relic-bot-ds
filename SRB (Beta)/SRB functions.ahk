
#include JSON.ahk
#include objectSort.ahk

class srbFunctions
{

    getOrder(item_url,file_name)
    {
        loop 
        {
            try
            {
                loop 
                {
                    if (A_index!=1)
                        sleep 500
                    WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
                    WebRequest.Open("GET", "https://api.warframe.market/v1/items/" . item_url . "/orders", true)
                    WebRequest.SetRequestHeader("Content-Type", "application/json")
                    WebRequest.SetRequestHeader("Platform", "pc")
                    WebRequest.Send()
                    WebRequest.WaitForResponse()
                    if (SubStr(WebRequest.Status, 1, 1) == 5)   ;internal server error
                        continue
                    if (InStr(WebRequest.ResponseText, "error")) && (InStr(WebRequest.ResponseText, "[GET]"))   ;invalid URL
                        return -3
                    if (WebRequest.Status != 200)
                        continue
                    if !(InStr(WebRequest.ResponseText, "Service Temporarily Unavailable"))
                        break
                }
                ordersArr := JSON.Load(WebRequest.ResponseText)				; Jxon_Load loads the string into ordersArr object
                break
            }
            catch e
            {
                if InStr(e.message, "0x80072EE7")
                    continue
                if InStr(e.message, "0x8000000A")
                    continue
                errorText := "[" . A_DD . "/" . A_MMM . "/" . A_YYYY . " " . A_Hour . ":" . A_Min . "] " . "Error at Line " . A_LineNumber . ": Failed to retreive item orders info from API in function getOrder(). Catch message: " e.message . "`r`n"
                Fileappend, %errorText% , Error log.dat
                return -1
            }
        }
        
        file := FileOpen(file_name, "a")
        string := """" item_url """: ["
        commaFlag := 0
        loop % ordersArr.payload.orders.MaxIndex()
        {
            orderIndex := A_index
            if ((ordersArr.payload.orders[A_Index].user.status == "ingame") && (ordersArr.payload.orders[A_Index].order_type == "sell") && (ordersArr.payload.orders[A_Index].user.region == "en") && (ordersArr.payload.orders[A_Index].visible == 1))
            {
                seller := ordersArr.payload.orders[A_Index].user.ingame_name
                quantity := ordersArr.payload.orders[A_Index].quantity
                price := ordersArr.payload.orders[A_Index].platinum
                if (commaFlag)
                    string := string . ","
                string := string . "{""seller"": """ seller """,""quantity"": " quantity ",""price"": " price "}"
                commaFlag := 1
            }
        }
        if (seller=="")
            return -2
        string := string . "]"
        file.write(string)
        file.close()
        string := ""
        return 0
    }

    getAuction(item_url,file_name)
    {
        loop
        {
            try
            {
                loop 
                {
                    if (A_index!=1)
                        sleep 500
                    WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
                    WebRequest.Open("GET", "https://api.warframe.market/v1/auctions/search?type=lich&weapon_url_name=" item_url, true)
                    WebRequest.SetRequestHeader("Content-Type", "application/json")
                    WebRequest.SetRequestHeader("Platform", "pc")
                    WebRequest.Send()
                    WebRequest.WaitForResponse()
                    if (SubStr(WebRequest.Status, 1, 1) == 5)   ;internal server error
                        continue
                    if (InStr(WebRequest.ResponseText, "error")) && (InStr(WebRequest.ResponseText, "app.form.invalid"))   ;invalid URL
                        return -3
                    if !(InStr(WebRequest.ResponseText, "Service Temporarily Unavailable"))
                        break
                }
                auctionsArr := JSON.Load(WebRequest.ResponseText)				; Jxon_Load loads the string into ordersArr object
                break
            }
            catch e
            {
                if InStr(e.message, "0x80072EE7")
                    continue
                errorText := "[" . A_DD . "/" . A_MMM . "/" . A_YYYY . " " . A_Hour . ":" . A_Min . "] " . "Error at Line " . A_LineNumber . ": Failed to retreive item orders info from API in function getOrder(). Catch message: " e.message . "`r`n"
                Fileappend, %errorText% , Error log.dat
                return -1
            }
        }
        file := FileOpen(file_name, "a")
        dataArr := {}
        dataArr[item_url] := {}
        ;string := """" item_url """: ["
        ;commaFlag := 0
        loop % auctionsArr.payload.auctions.MaxIndex()
        {
            orderIndex := A_index
            if ((auctionsArr.payload.auctions[A_Index].owner.status == "ingame") && (auctionsArr.payload.auctions[A_Index].owner.region == "en") && (auctionsArr.payload.auctions[A_Index].visible==1) && (auctionsArr.payload.auctions[A_Index].private==0) && (auctionsArr.payload.auctions[A_Index].closed==0))
            {
                owner := auctionsArr.payload.auctions[A_Index].owner.ingame_name
                auction_id := auctionsArr.payload.auctions[A_Index].id
                damage := auctionsArr.payload.auctions[A_Index].item.damage
                element := auctionsArr.payload.auctions[A_Index].item.element
                ephemera := auctionsArr.payload.auctions[A_Index].item.having_ephemera
                buyout_price := auctionsArr.payload.auctions[A_Index].buyout_price
                starting_price := auctionsArr.payload.auctions[A_Index].starting_price
                top_bid := auctionsArr.payload.auctions[A_Index].top_bid
                ;if (commaFlag)
                ;    string := string . ","
                dataArr[item_url].push({owner: owner, auction_id: auction_id, damage: damage, element: element, ephemera: ephemera, buyout_price: buyout_price, starting_price: starting_price, top_bid: top_bid})
                ;string := string . "{""seller"": """ seller """,""quantity"": " quantity ",""price"": " price "}"
                ;commaFlag := 1
            }
        }
        if (owner=="")
            return -2
        ;string := string . "]"
        dataArr := JSON.Dump(dataArr)
        file.write(dataArr)
        file.close()
        ;string := ""
        return 0
    }
}