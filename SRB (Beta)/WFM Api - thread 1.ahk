#include Jxon.ahk
#include JSON.ahk

updatePrices1(1, 157, 1, 120, 1, 15)
RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, updatePriceThread1, 1
ExitApp

updatePrices1(starting1, ending1, starting2, ending2, starting3, ending3)
{
    FileRead, itemsUrlArr, FullItemsList.dat
    FileRead, relicsUrlArr, FullRelicsList.dat
    FileRead, modsUrlArr, FullModsList.dat
    itemsUrlArr := StrSplit(itemsUrlArr, "`r`n")
    relicsUrlArr := StrSplit(relicsUrlArr, "`r`n")
    modsUrlArr := StrSplit(modsUrlArr, "`r`n")
    
    ;prime items loop
    partsPricesArray := {}
    loop % ending1 ;% itemsUrlArr.MaxIndex()   ;average plat value of all items in the array
    {
        if (A_index < starting1)
            continue
        item_Url := itemsUrlArr[A_index]
	    RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, updateStatus, % "Updating price for " item_Url "..."		;updating registry
        WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
        url := "https://api.warframe.market/v1/items/" . item_Url . "/statistics?include=item"
        ordersArr := ""
        loop
        {
            try
            {
                loop 
                {
                    WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
                    WebRequest.Open("GET", url, true)
                    WebRequest.Send()
                    WebRequest.WaitForResponse()
                    if !(InStr(WebRequest.ResponseText, "Service Temporarily Unavailable"))
                        break
                }
                ordersArr := Jxon_Load(WebRequest.ResponseText)         ; Jxon_Load loads the string into ordersArr object
            }
            catch e
            {
                if InStr(e.message, "0x80072EE7")
                    continue
                Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured in script " A_ScriptName " at line " A_LineNumber " exception: " e.message "`r`n" , Error log.dat
                continue
            }
            break
        }
        average := 0
        average := Round(ordersArr.payload.statistics_closed.90days[ordersArr.payload.statistics_closed.90days.MaxIndex()].moving_avg)
        if (average==0)
            average := Round(ordersArr.payload.statistics_closed.90days[ordersArr.payload.statistics_closed.90days.MaxIndex()].median)
        /*
        values := {}
        ;----
        ;obtaining plat value
        loop % ordersArr.payload.statistics_closed.48hours.MaxIndex()
        {
            orderIndex := A_index
            price := ordersArr.payload.statistics_closed.48hours[orderIndex].median
            values.push(price)
        }
        ;-----
        average := 0
        loop % values.MaxIndex()
        {
            average := average + values[A_index]
        }
        average := Round(average / values.MaxIndex())
        if (average==0)
            average := Round(ordersArr.payload.statistics_closed.90days[ordersArr.payload.statistics_closed.90days.MaxIndex()].median)      ;retreive latest median price from past 90 days
        /*
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
        */
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
        ;obtaining relics for the item
        relics := "N/A"
        if !InStr(itemsUrlArr[A_index], "set")       ;not acquiring relics for sets
        {
            relics := ""
            loop % ordersArr.include.item.items_in_set.MaxIndex()
            {
                if (ordersArr.include.item.items_in_set[A_Index].url_name == item_Url)
                {
                    items_in_set_Index := A_Index
                    loop % ordersArr.include.item.items_in_set[items_in_set_Index].en.drop.MaxIndex()
                    {
                        name := ordersArr.include.item.items_in_set[items_in_set_Index].en.drop[A_Index].name
                        link := ordersArr.include.item.items_in_set[items_in_set_Index].en.drop[A_Index].link
                        relics := relics . StrReplace(link, "_relic", "/",,1)
                        ;-----
                        file_path := "Relics Info\" link ".json"
                        FileRead, fileContents, % file_path
                        if ErrorLevel      ; Create relic file if does not exist{
                            file := FileOpen(file_path, "w"), file.write("{}"), file.close()
                        FileRead, fileContents, % file_path
                        fileContents := JSON.Load(fileContents)
                        dropTier := StrReplace(SubStr(name, InStr(name, "(")+1), ")")
                        if !(InStr(JSON.Dump(fileContents[(dropTier)]), item_Url))
                        {
                            if (JSON.Dump(fileContents[(dropTier)])=="""""")    ; Key does not exist
                                fileContents[(dropTier)] := {}
                            fileContents[(dropTier)].push(item_Url)
                            file := FileOpen(file_path, "w")
                            if !IsObject(file)
                            {
                                MsgBox % "Can't open file for writing in script " A_ScriptName " at line " A_LineNumber
                                return
                            }
                            file.write(JSON.Dump(fileContents))
                            file.close()
                        }
                        ;-----
                        file_path := "Prime Parts Info\" item_Url ".json"
                        FileRead, fileContents, % file_path
                        if ErrorLevel      ; Create relic file if does not exist{
                            file := FileOpen(file_path, "w"), file.write("{}"), file.close()
                        FileRead, fileContents, % file_path
                        fileContents := JSON.Load(fileContents)
                        if !(InStr(JSON.Dump(fileContents["Relics"]), link))
                        {
                            if (JSON.Dump(fileContents["Relics"])=="""""")    ; Key does not exist
                                fileContents["Relics"] := {}
                            fileContents["Relics"].push(link)
                            file := FileOpen(file_path, "w")
                            if !IsObject(file)
                            {
                                MsgBox % "Can't open file for writing in script " A_ScriptName " at line " A_LineNumber
                                return
                            }
                            file.write(JSON.Dump(fileContents))
                            file.close()
                        }
                        ;-----
                    }
                    relics := SubStr(relics, 1, -1)
                    break
                }
            }
        }
        ;pushing to the array
        partsPricesArray.push({item_url: item_Url, price: average, ducat: ducat_value, relics: relics})
    }
    partsPricesArray := jxon_dump(partsPricesArray)     
    partsPricesArray := StrReplace(partsPricesArray, "\/", "/")
    ;creating new file
    file := FileOpen("pricesDBMT1.json", "w")
    if !IsObject(file)
    {
        MsgBox % "Can't open file for writing in script " A_ScriptName " at line " A_LineNumber
        return
    }
    file.write(partsPricesArray)
    file.close()
    
    ;relics loop
    relicsPricesArray := {}
    loop % ending2 ;% itemsUrlArr.MaxIndex()   ;average plat value of all items in the array
    {
        if (A_index < starting2)
            continue
        Relic_Url := relicsUrlArr[A_index]
	    RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, updateStatus, % "Updating price for " Relic_Url "..."		;updating registry
        url := "https://api.warframe.market/v1/items/" . Relic_Url . "/statistics"
        relicsArr := ""
        loop
        {
            try
            {
                loop 
                {
                    WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
                    WebRequest.Open("GET", url, true)
                    WebRequest.Send()
                    WebRequest.WaitForResponse()
                    if !(InStr(WebRequest.ResponseText, "Service Temporarily Unavailable"))
                        break
                }
                relicsArr := JSON.Load(WebRequest.ResponseText)         ; Jxon_Load loads the string into ordersArr object
            }
            catch e
            {
                if InStr(e.message, "0x80072EE7")
                    continue
                Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured in script " A_ScriptName " at line " A_LineNumber " exception: " e.message "`r`n" , Error log.dat
                continue
            }
            break
        }
        average := 0
        average := Round(relicsArr.payload.statistics_closed.90days[relicsArr.payload.statistics_closed.90days.MaxIndex()].moving_avg)
        if (average==0)
            average := Round(relicsArr.payload.statistics_closed.90days[relicsArr.payload.statistics_closed.90days.MaxIndex()].median)
        /*
        values := {}
        ;obtaining plat value
        loop % relicsArr.payload.statistics_closed.48hours.MaxIndex()
        {
            orderIndex := A_index
            price := relicsArr.payload.statistics_closed.48hours[orderIndex].median
            values.push(price)
        }
        ;-----
        average := 0
        loop % values.MaxIndex()
        {
            average := average + values[A_index]
        }
        average := Round(average / values.MaxIndex())
        if (average==0)
            average := Round(relicsArr.payload.statistics_closed.90days[relicsArr.payload.statistics_closed.90days.MaxIndex()].median)      ;retreive latest median price from past 90 days
        /*
        values := ""
        loop % relicsArr.payload.orders.MaxIndex()
        {
            orderIndex := A_index
            if ((relicsArr.payload.orders[A_Index].user.status == "ingame") && (relicsArr.payload.orders[A_Index].user.region == "en") && (relicsArr.payload.orders[A_Index].order_type == "sell"))
            {
                price := relicsArr.payload.orders[A_Index].platinum
                values := values . price . "`r`n"
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
        */
        ;obtaining vault status for the relic
        searchRelic := Relic_Url
        searchRelic := StrReplace(searchRelic, "_relic", "")
        loop, 26
	    {
		    if (SubStr(searchRelic, 1, 1) == chr(A_Index + 96))
			    searchRelic := StrReplace(searchRelic, chr(A_Index + 96), chr(A_Index + 64),, 1)
            searchRelic := StrReplace(searchRelic, "_"chr(A_Index + 96), "_"chr(A_Index + 64),, 1)
	    }
        ; Using 'true' above and the call below allows the script to remain responsive.
        loop
        {
            try
            {
                whr := ComObjCreate("WinHttp.WinHttpRequest.5.1")
                whr.Open("GET", "https://warframe.fandom.com/wiki/" . searchRelic, true)
                whr.Send()
                whr.WaitForResponse()
                if !(InStr(whr.ResponseText, "Service Temporarily Unavailable"))
                    break
            }
            catch e
            {
                if InStr(e.message, "0x80072EE7")
                    continue
                msgbox,,, % e.message, 5
                Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured in script " A_ScriptName " at line " A_LineNumber " exception: " e.message "`r`n" , Error log.dat
                continue
            }
            if (A_index==500)
                msgbox stuck in a loop in thread 1
        }
        webSource := whr.ResponseText
        vaultStatus := ""
        FileRead, newVaultCheck, vaultExclusiveRelics.dat
        FileRead, nextVaultCheck, vaultExpectedRelics.dat
        if InStr(webSource, "is no longer obtainable from the <a href=""/wiki/Drop_Tables"" title=""Drop Tables"">Drop Tables</a>")
            vaultStatus := "(V)"
        else if InStr(webSource, "Baro Ki'Teer Exclusive")
            vaultStatus := "(B)"
        else if InStr(newVaultCheck, searchRelic)
            vaultStatus := "(P)"
        else if InStr(nextVaultCheck, searchRelic)
            vaultStatus := "(E)"
        ;----
        relicsPricesArray.push({item_url: Relic_Url, price: average, vault_status: vaultStatus})
    }
    relicsPricesArray := JSON.Dump(relicsPricesArray)
    ;creating new file
    file := FileOpen("relicsDB1.json", "w")
    if !IsObject(file)
    {
        MsgBox % "Can't open file for writing in script " A_ScriptName " at line " A_LineNumber
        return
    }
    file.write(relicsPricesArray)
    file.close()

    ;mods loop
    modsPricesArray := {}
    loop % ending3 ;% itemsUrlArr.MaxIndex()   ;average plat value of all items in the array
    {
        if (A_index < starting3)
            continue
        Mods_Url := modsUrlArr[A_index]
	    RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, updateStatus, % "Updating price for " Mods_Url "..."		;updating registry
        url := "https://api.warframe.market/v1/items/" . Mods_Url . "/statistics"
        modsArr := ""
        loop
        {
            try
            {
                loop 
                {
                    WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
                    WebRequest.Open("GET", url, true)
                    WebRequest.Send()
                    WebRequest.WaitForResponse()
                    if !(InStr(WebRequest.ResponseText, "Service Temporarily Unavailable"))
                        break
                }
                modsArr := JSON.Load(WebRequest.ResponseText)         ; Jxon_Load loads the string into ordersArr object
            }
            catch e
            {
                if InStr(e.message, "0x80072EE7")
                    continue
                Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured in script " A_ScriptName " at line " A_LineNumber " exception: " e.message "`r`n" , Error log.dat
                continue
            }
            break
        }
        averageR0 := 0
        averageR10 := 0
        maxIndex := modsArr.payload.statistics_closed.90days.MaxIndex() + 1
        While, (averageR0 == 0 || averageR10 == 0)
        {
            if (A_index==2000)
                break
            if (A_index == maxIndex)
                break
            if (modsArr.payload.statistics_closed.90days[(maxIndex - A_index)].mod_rank == 0) && (averageR0 == 0)
            {
                averageR0 := Round(modsArr.payload.statistics_closed.90days[(maxIndex - A_index)].moving_avg)
                if (averageR0 == 0)
                    averageR0 := Round(modsArr.payload.statistics_closed.90days[(maxIndex - A_index)].median)
            }
            if (modsArr.payload.statistics_closed.90days[(maxIndex - A_index)].mod_rank == 10) && (averageR10 == 0)
            {
                averageR10 := Round(modsArr.payload.statistics_closed.90days[(maxIndex - A_index)].moving_avg)
                if (averageR10 == 0)
                    averageR10 := Round(modsArr.payload.statistics_closed.90days[(maxIndex - A_index)].median)
            }
            if (modsArr.payload.statistics_closed.90days[(maxIndex - A_index)].mod_rank == 3) && (averageR10 == 0)      ; For primed chamber
            {
                averageR10 := Round(modsArr.payload.statistics_closed.90days[(maxIndex - A_index)].moving_avg)
                if (averageR10 == 0)
                    averageR10 := Round(modsArr.payload.statistics_closed.90days[(maxIndex - A_index)].median)
            }
        }
        ;----
        modsPricesArray.push({item_url: Mods_Url, price_r0: averageR0, price_r10: averageR10})
    }
    file := FileOpen("modsDB1.json", "w")
    if !IsObject(file)
    {
        MsgBox % "Can't open file for writing in script " A_ScriptName " at line " A_LineNumber
        return
    }
    file.write(JSON.Dump(modsPricesArray))
    file.close()
    return
}