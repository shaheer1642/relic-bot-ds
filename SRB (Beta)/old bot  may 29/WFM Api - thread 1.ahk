updatePrices1(1, 157)
;updatePrices1(1, 10)
RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, updatePriceThread1, 1
ExitApp

updatePrices1(starting, ending)
{
    ;GuiControl, main_interface:, priceText , Communicating with the server...
    WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    WebRequest.Open("GET", "https://api.warframe.market/v1/items", true)
    try
    {
        loop 
        {
            WebRequest.Send()
            WebRequest.WaitForResponse(15)
            if !(InStr(WebRequest.ResponseText, "Service Temporarily Unavailable"))
                break
        }
        itemsResponse := StrSplit(WebRequest.ResponseText, "{")
    }
    catch e
    {
        Fileappend, % "[" A_Sec ":" A_Min ":" A_hour ":" "]" "Crucial Error occured`r`n" , Error log.dat
        return
    }
    itemsUrlArr := []
    i := 1
    loop % itemsResponse.MaxIndex()
    {
        if InStr(itemsResponse[A_Index], "url_name") && InStr(itemsResponse[A_Index], "Prime") && !(InStr(itemsResponse[A_Index], "Primed"))
        {
            pos1 := InStr(itemsResponse[A_Index], """url_name")
            pos2 := InStr(itemsResponse[A_Index], ",",,pos1)
            length := pos2-pos1
            post := SubStr(itemsResponse[A_Index], pos1 , length)
            post := StrReplace(post, """url_name"": ", "")
            post := StrReplace(post, """", "")
            post := StrReplace(post, "}", "")
            itemsUrlArr[i] := post
            ;Fileappend, %post%`r`n, wfm api 2.txt
            i++
        }
    }

    ;creating new file
    file := FileOpen("pricesDBMT1.dat", "w")
    if !IsObject(file)
    {
        MsgBox Can't open file for writing.
        return
    }
    loop % ending ;% itemsUrlArr.MaxIndex()   ;average plat value of all items in the array
    {
        if (A_index < starting)
            continue
	    RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, updateStatus, % "Updating price for " itemsUrlArr[A_index] "..."		;updating registry
        ;GuiControl, main_interface:, priceText , % "Updating price for " itemsUrlArr[A_index] "..."
        url := "https://api.warframe.market/v1/items/" . itemsUrlArr[A_index] . "/orders?include=item"
        WebRequest.Open("GET", url, true)
        try
        {
            loop 
            {
                WebRequest.Send()
                WebRequest.WaitForResponse(15)
                if !(InStr(WebRequest.ResponseText, "Service Temporarily Unavailable"))
                    break
            }
            partResponse := StrSplit(WebRequest.ResponseText, "{")
        }
        catch e
        {
            Fileappend, % "[" A_Sec ":" A_Min ":" A_hour ":" "]" "Error occured`r`n" , Error log.dat
            continue
        }
        values := ""
        item_Url := itemsUrlArr[A_index]
        loop % partResponse.MaxIndex()
        {
            if InStr(partResponse[A_Index], """order_type"": ""sell""") && InStr(partResponse[A_Index+1], """status"": ""ingame""")
            {
                if InStr(partResponse[A_Index], "platinum")
                    lineIndex := A_Index
                else if InStr(partResponse[A_Index+1], "platinum")
                    lineIndex := A_Index+1
                else
                {
                    msgbox % partResponse[A_Index] partResponse[A_Index+1]
                    return
                }
                pos1 := InStr(partResponse[lineIndex], """platinum")
                pos2 := InStr(partResponse[lineIndex], ",",,pos1)
                length := pos2-pos1
                post := SubStr(partResponse[lineIndex], pos1 , length)
                post := StrReplace(post, """platinum"": ", "")
                post := Ceil(post)   ;converting to int
                values := values . post . "`r`n"
            }
            ;obtaining ducats for the item
            if InStr(partResponse[A_Index], """url_name"": """ . item_url . """") && InStr(partResponse[A_Index], "ducats")
            {
                pos1 := InStr(partResponse[A_Index], """ducats"": ")
                pos2 := InStr(partResponse[A_Index], ",",, pos1)
                length := pos2 - pos1
                ducat_value := SubStr(partResponse[A_Index], pos1, length)
                ducat_value := StrReplace(ducat_value, """ducats"": ", "")
            }
        }
        Sort, values, N
        values := StrSplit(values, "`r`n")
        average := 0
        loop % values.MaxIndex()
        {
            if (values[A_index]=="")
            {
              total := A_index-1
              break
            }
            average := average + values[A_index]
            if (A_index==5)   ;only lowest 5 prices
            {
              total := A_index
              break
            }
        }
        average := average/total
        average := floor(average)
        if InStr(itemsUrlArr[A_index], "set")       ;not acquiring relics for sets
        {
            string := itemsUrlArr[A_index] . ": " . average . "`r`n"
            file.write(string)
            continue
        }
        ;obtaining relics for the item
        string := itemsUrlArr[A_index] . ": " . average . ": Relics; "
        partResponse := WebRequest.ResponseText
        item_url := itemsUrlArr[A_index]
        item_url := StrReplace(item_url, "_", " ")
        item_url := StrReplace(item_url, " and ", " & ")
        pos1 := InStr(partResponse, """item_name"": """ . item_url . """")
        pos2 := InStr(partResponse, "]",, pos1)
        length := (pos2 - pos1) + 1
        partResponse := SubStr(partResponse, pos1, length)
        partResponse := StrSplit(partResponse, "{")
        loop % partResponse.MaxIndex()
        {
            if InStr(partResponse[A_index], """name"": ")
            {
                pos1 := InStr(partResponse[A_index], """name"": ")
                pos2 := InStr(partResponse[A_index], " Relic",, pos1)
                length := pos2 - pos1
                relic := SubStr(partResponse[A_index], pos1, length)
                relic := StrReplace(relic, """name"": """, "")
                string := string . relic . "/"
            }
        }
        string := SubStr(string, 1, StrLen(string)-1)
        ;obtaining ducats for the item
        string := string . ": Ducats; "
        string := string . ducat_value
        string := string . "`r`n"
        file.write(string)
    }
    file.close()
    ;GuiControl, main_interface:, priceText , Database updated. Collecting results...
    return
}