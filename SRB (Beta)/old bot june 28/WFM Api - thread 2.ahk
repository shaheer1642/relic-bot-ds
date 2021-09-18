#include Jxon.ahk

sleep 2000
updatePrices1(158, 314, 121, 240)
RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, updatePriceThread2, 1
ExitApp

updatePrices1(starting1, ending1, starting2, ending2)
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
        Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Crucial Error occured in script " A_ScriptName " at line " A_LineNumber "`r`n" , Error log.dat
        return
    }
    itemsUrlArr := []
    relicsUrlArr := []
    i := 1
    j := 1
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
            i++
        }
        if InStr(itemsResponse[A_Index], "url_name") && InStr(itemsResponse[A_Index], "relic") && !(InStr(itemsResponse[A_Index], "scene"))
        {
            pos1 := InStr(itemsResponse[A_Index], """url_name")
            pos2 := InStr(itemsResponse[A_Index], ",",,pos1)
            length := pos2-pos1
            post := SubStr(itemsResponse[A_Index], pos1 , length)
            post := StrReplace(post, """url_name"": ", "")
            post := StrReplace(post, """", "")
            post := StrReplace(post, "}", "")
            relicsUrlArr[j] := post
            j++
        }
    }

    ;prime items loop
    string := "["     ;starting brace
    commaFlag := 0
    loop % ending1 ;% itemsUrlArr.MaxIndex()   ;average plat value of all items in the array
    {
        if (A_index < starting1)
            continue
        item_Url := itemsUrlArr[A_index]
	    RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, updateStatus, % "Updating price for " item_Url "..."		;updating registry
        ;GuiControl, main_interface:, priceText , % "Updating price for " itemsUrlArr[A_index] "..."
        url := "https://api.warframe.market/v1/items/" . item_Url . "/orders?include=item"
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
        }
        catch e
        {
            msgbox % e.message
            Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured in script " A_ScriptName " at line " A_LineNumber "`r`n" , Error log.dat
            continue
        }
        ordersArr := Jxon_Load(WebRequest.ResponseText)         ; Jxon_Load loads the string into ordersArr object
        values := ""
        ;----
        ;obtaining plat value
        loop % ordersArr.payload.orders.MaxIndex()
        {
            orderIndex := A_index
            if ((ordersArr.payload.orders[A_Index].user.status == "ingame") && (ordersArr.payload.orders[A_Index].user.region == "en") && (ordersArr.payload.orders[A_Index].order_type == "sell"))
            {
                price := ordersArr.payload.orders[A_Index].platinum
                values := values . price . "`r`n"
            }
        }
        ;obtaining ducat values
        ducat_value := "N/A"
        loop % ordersArr.include.item.items_in_set.MaxIndex()
        {
            if (ordersArr.include.item.items_in_set[A_Index].url_name == item_Url)
            {
                ducat_value := ordersArr.include.item.items_in_set[A_Index].ducats
                break
            }
        }
        Sort, values, N
        ;-----
        /*
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
        */
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
        ;obtaining relics for the item
        relics := ""
        if InStr(itemsUrlArr[A_index], "set")       ;not acquiring relics for sets
        {
            relics := "N/A"
            goto writeToFile
        }
        loop % ordersArr.include.item.items_in_set.MaxIndex()
        {
            if (ordersArr.include.item.items_in_set[A_Index].url_name == item_Url)
            {
                items_in_set_Index := A_Index
                loop % ordersArr.include.item.items_in_set[items_in_set_Index].en.drop.MaxIndex()
                {
                    relics := relics . StrReplace(ordersArr.include.item.items_in_set[items_in_set_Index].en.drop[A_Index].link, "_relic", "/",,1)
                }
                relics := SubStr(relics, 1, -1)
                break
            }
        }
        ;-----
        /*
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
        string := string . "`r`n"
        */
        writeToFile:
        if (commaFlag)
            string := string . ","
        commaFlag := 1
        string := string . "{""item_url"": """ item_Url """,""price"": " average ",""ducat"": " ducat_value ",""relics"": """ relics """}"
    }
    string := string . "]"    ;ending brace
    ;creating new file
    file := FileOpen("pricesDBMT2.json", "w")
    if !IsObject(file)
    {
        MsgBox % "Can't open file for writing in script " A_ScriptName " at line " A_LineNumber
        return
    }
    file.write(string)
    file.close()
    Return
    
    ;relics loop
    ;creating new file
    file := FileOpen("relicsDB1.dat", "w")
    if !IsObject(file)
    {
        MsgBox Can't open file for writing in thread 1
        return
    }
    loop % ending2 ;% itemsUrlArr.MaxIndex()   ;average plat value of all items in the array
    {
        if (A_index < starting2)
            continue
	    RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, updateStatus, % "Updating price for " relicsUrlArr[A_index] "..."		;updating registry
        url := "https://api.warframe.market/v1/items/" . relicsUrlArr[A_index] . "/orders?include=item"
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
        item_Url := relicsUrlArr[A_index]
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
        if (average==0)
            average := "N/A"
        ;obtaining vault status for the relic
        searchRelic := relicsUrlArr[A_index]
        searchRelic := StrReplace(searchRelic, "_relic", "")
        loop, 26
	    {
		    if (SubStr(searchRelic, 1, 1) == chr(A_Index + 96))
			    searchRelic := StrReplace(searchRelic, chr(A_Index + 96), chr(A_Index + 64),, 1)
            searchRelic := StrReplace(searchRelic, "_"chr(A_Index + 96), "_"chr(A_Index + 64),, 1)
	    }
        whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
        whr.Open("GET", "https://warframe.fandom.com/wiki/" . searchRelic, true)
        ; Using 'true' above and the call below allows the script to remain responsive.
        loop, 15
        {
            try
            {
                whr.Send()
                whr.WaitForResponse(15)
                if !(InStr(whr.ResponseText, "Service Temporarily Unavailable"))
                    break
            }
            catch e
            {
                continue
            }
        }
        webSource := whr.ResponseText
        vaultStatus := ""
        FileRead, newVaultCheck, vaultExclusiveRelics.dat
        FileRead, nextVaultCheck, vaultExpectedRelics.dat
        if InStr(webSource, "is no longer obtainable from the drop tables.")
            vaultStatus := "(V)"
        else if InStr(webSource, "Baro Ki'Teer Exclusive")
            vaultStatus := "(B)"
        else if InStr(newVaultCheck, searchRelic)
            vaultStatus := "(P)"
        else if InStr(nextVaultCheck, searchRelic)
            vaultStatus := "(E)"
        ;----
        string := relicsUrlArr[A_index] . vaultStatus . ": " . average . "`r`n"
        file.write(string)
    }
    ;adding missing relics from the website
    file.close()
    return
}

