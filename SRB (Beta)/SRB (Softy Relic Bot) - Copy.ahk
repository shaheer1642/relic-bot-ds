#Include %A_ScriptDir%
#Include Class_LV_Colors.ahk
;-----
#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
SetWorkingDir, C:\Users\Horcrux\Google Drive\SRB (Beta)  ; Ensures a consistent starting directory.
;----icons----
#NoTrayIcon  ;Hide initial icon.
Menu Tray, Icon, %A_ScriptDir%\icon\icon.png  ; Set icon.
Menu Tray, Icon  ; Show icon.
;-------------
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetBatchLines, -1
FileEncoding, UTF-8
FileAppend,, SrbDB.dat      ;creating new file if not existing
FileAppend,, SrbExc.dat      ;creating new file if not existing
FileAppend,, SrbCustom.dat      ;creating new file if not existing
OnClipboardChange("LogRewards")
;----include files----
#include Jxon.ahk
#include JSON.ahk
#include objectSort.ahk
#include SRB functions.ahk
;----class objects----
srbFunctions := new srbFunctions
;bot.__New("ODMyNjgyMzY5ODMxMTQxNDE3.YHnV4w.JRy0L2nCzOY4QIAU6ylkjG_UOm4")         ;connecting to the bot
;----variables/timers----
enableEditing := 0
buySpamMode := 0
sentViaMacro := 0
lithCheck := 1
mesoCheck := 1
neoCheck := 1
axiCheck := 1
apiUpdating := 0
RegRead updateDay, HKCU, Software\Softy Relic Bot, priceUpdateDateTime
FormatTime, updateDay, %updateDay%, dd
FormatTime, currentDay, %A_NowUTC%, dd
SetTimer, checkForPriceUpdate, 300000       ;checking for prices update daily
SetTimer, ducatPartsUpdate, 300000
RegRead 4Cycles, HKCU, Software\Softy Relic Bot, 4Cycles
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, 4Cycles, 0		;default setting
    RegRead 4Cycles, HKCU, Software\Softy Relic Bot, 4Cycles
}
RegRead ducatUpdater, HKCU, Software\Softy Relic Bot, ducatUpdater
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, ducatUpdater, 1		;default setting
    RegRead ducatUpdater, HKCU, Software\Softy Relic Bot, ducatUpdater
}
RegRead primesPricesUpdater, HKCU, Software\Softy Relic Bot, primesPricesUpdater
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, primesPricesUpdater, 1		;default setting
    RegRead primesPricesUpdater, HKCU, Software\Softy Relic Bot, primesPricesUpdater
}
RegRead buySpamMode, HKCU, Software\Softy Relic Bot, buySpamMode
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, buySpamMode, 0		;default setting
    RegRead buySpamMode, HKCU, Software\Softy Relic Bot, buySpamMode
}
RegRead enableMacro, HKCU, Software\Softy Relic Bot, enableMacro
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, enableMacro, 0		;default setting
    RegRead enableMacro, HKCU, Software\Softy Relic Bot, enableMacro
}
RegRead guiX, HKCU, Software\Softy Relic Bot, guiX
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, guiX, % A_ScreenWidth/2		;default setting
    RegRead guiX, HKCU, Software\Softy Relic Bot, guiX
}
RegRead guiY, HKCU, Software\Softy Relic Bot, guiY
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, guiY, % A_ScreenHeight/2		;default setting 
    RegRead guiY, HKCU, Software\Softy Relic Bot, guiY
}
RegRead priceUpdateDateTime, HKCU, Software\Softy Relic Bot, priceUpdateDateTime
if ErrorLevel {
	RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, priceUpdateDateTime, Not available		;default setting 
    RegRead priceUpdateDateTime, HKCU, Software\Softy Relic Bot, priceUpdateDateTime
}
FormatTime, priceUpdateDateTime, %priceUpdateDateTime%, ddd dd-MM-yyyy 'at' hh:mm tt 'UTC'
RegRead priceUpdateTotalTime, HKCU, Software\Softy Relic Bot, priceUpdateTotalTime
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, priceUpdateTotalTime, 0		;default setting 
    RegRead priceUpdateTotalTime, HKCU, Software\Softy Relic Bot, priceUpdateTotalTime
}
RegRead fetchThreshold, HKCU, Software\Softy Relic Bot, fetchThreshold
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, fetchThreshold, 5		;default setting 
    RegRead fetchThreshold, HKCU, Software\Softy Relic Bot, fetchThreshold
}
RegRead hostThreshold, HKCU, Software\Softy Relic Bot, hostThreshold
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, hostThreshold, 5		;default setting 
    RegRead hostThreshold, HKCU, Software\Softy Relic Bot, hostThreshold
}
RegRead buyThreshold, HKCU, Software\Softy Relic Bot, buyThreshold
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, buyThreshold, 15		;default setting 
    RegRead buyThreshold, HKCU, Software\Softy Relic Bot, buyThreshold
}
RegRead partsPriceThreshold, HKCU, Software\Softy Relic Bot, partsPriceThreshold
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, partsPriceThreshold, 70		;default setting 
    RegRead partsPriceThreshold, HKCU, Software\Softy Relic Bot, partsPriceThreshold
}
RegRead setsPriceThreshold, HKCU, Software\Softy Relic Bot, setsPriceThreshold
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, setsPriceThreshold, 100		;default setting 
    RegRead setsPriceThreshold, HKCU, Software\Softy Relic Bot, setsPriceThreshold
}
RegRead copyPaste, HKCU, Software\Softy Relic Bot, copyPaste
if ErrorLevel {
	RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, copyPaste, WTB [axi v8 relic][axi v1 relic][neo o1 relic][neo v1 relic] 12p each [lith v1 relic][lith o2 relic] 5p each		;default setting 
    RegRead copyPaste, HKCU, Software\Softy Relic Bot, copyPaste
}
;-----------------

OnExit, exiting

MainSetup:
;----Load relic data into array-----
FileRead, relicsArr, SrbDB.json
relicsArr := JSON.Load(relicsArr)
relicsArr := objectSort(relicsArr, "name")
/*
relicsArr2 := {}
loop % relicsArr.MaxIndex()
{
    relicsArr2.push({name: relicsArr[A_index].name, quantity: relicsArr[A_index].quantity})
}
    file := FileOpen("SrbDB2.json", "w")
    file.write(JSON.Dump(relicsArr2))
    file.close()
*/
;-------------------------------------------
;----Interface options----
Gui, main_interface:New,, Relics Interface
Gui, main_interface:
Gui, main_interface:Color, 3b3b3b
Gui, main_interface:Color,, 525252
Gui, main_interface:Font, cWhite
;----Add/remove New relic-----
Gui, main_interface:Add, Text, x10 y10, Add new relic (<tier> <name>):
Gui, main_interface:Add, Edit, x10 y30 vNew_relic
Gui, main_interface:Add, Button, x11 y55 gButtonAddNewRelic, Add
Gui, main_interface:Add, Button, x50 y55 gButtonRemoveRelic, Remove
Gui, main_interface:Add, Button, x110 y55 gButtonShowRelics, Show All
;----Fetch----
Gui, main_interface:Add, Text, x340 y120, Fetch
Gui, main_interface:Add, Button, x398 y115 gfetchCopy, Copy
Gui, main_interface:Add, Text, x450 y120, Fetch threshold: 
Gui, main_interface:Add, Edit, x535 y115 w40
Gui, main_interface:Add, UpDown, gupdateFetch vfetchThreshold Range4-20, %fetchThreshold%
Gui, main_interface:Add, Edit, x340 y140 w310 h45 +readonly +hscroll vfetchText, updating...
gosub updateFetch
;----Host----
Gui, main_interface:Add, Text, x340 y10, Host table
Gui, main_interface:Add, Button, x398 y5 ghostCopy, Copy
Gui, main_interface:Add, Text, x450 y10, Host threshold: 
Gui, main_interface:Add, Edit, x535 y5 w40
Gui, main_interface:Add, UpDown, gupdateHost vhostThreshold Range3-20, %hostThreshold%
Gui, main_interface:Add, Edit, x340 y30 w310 h80 +readonly +hscroll +vscroll vhostText, updating...
Gui, main_interface:Add, CheckBox, x590 y10 checked%4Cycles% g4Cycles v4Cycles, 4 cycles
Gui, main_interface:Add, CheckBox, x660 y30 checked%lithCheck% gtierCheck vlithCheck, Lith
Gui, main_interface:Add, CheckBox, x660 y50 checked%mesoCheck% gtierCheck vmesoCheck, Meso
Gui, main_interface:Add, CheckBox, x660 y70 checked%neoCheck% gtierCheck vneoCheck, Neo
Gui, main_interface:Add, CheckBox, x660 y90 checked%axiCheck% gtierCheck vaxiCheck, Axi
Gui, main_interface:Add, Text, x10 y90, Add 2b2 Exc (<tier> <name>):
Gui, main_interface:Add, Edit, x10 y110 vNew_exc
Gui, main_interface:Add, Button, x11 y135 gButtonAddNewExc, Add
Gui, main_interface:Add, Button, x50 y135 gButtonRemoveExc, Remove
Gui, main_interface:Add, Button, x110 y135 gButtonShowExc, Show All
Gui, main_interface:Add, Text, x10 y170, Custom Host (++host <tier> <name> <refinement> <cycles>)
Gui, main_interface:Add, Edit, x10 y190 w280 vNew_Custom
Gui, main_interface:Add, Button, x11 y215 gButtonAddNewCustom, Add
Gui, main_interface:Add, Button, x50 y215 gButtonShowAllCustoms, Show All
gosub updateHost
;----Buy relics----
Gui, main_interface:Add, Text, x340 y195, Buy Relics
Gui, main_interface:Add, Text, x340 y270, Linker List
Gui, main_interface:Add, Button, x398 y190 gbuyCopy, Copy
Gui, main_interface:Add, Text, x450 y195, Buy threshold: 
Gui, main_interface:Add, CheckBox, x590 y195 checked%buySpamMode% gbuySpamMode vbuySpamMode, Spam Mode
Gui, main_interface:Add, CheckBox, x400 y270 checked%enableMacro% genableMacro venableMacro, Enable macro
Gui, main_interface:Add, Edit, x535 y190 w40
Gui, main_interface:Add, UpDown, gupdateBuy vbuyThreshold Range10-30, %buyThreshold%
Gui, main_interface:Add, Edit, x340 y215 w310 h45 +readonly +hscroll vbuyText, updating...
Gui, main_interface:Add, Edit, x340 y290 w310 h80 +readonly +hscroll +vscroll vlinkerText, updating...
Gui, main_interface:Add, Text, x10 y250, Always Buying (<tier> <name>)
Gui, main_interface:Add, Edit, x10 y270 w280 vNew_Always_Buying
Gui, main_interface:Add, Button, x11 y295 gButtonAddNewAlwaysBuying, Add
Gui, main_interface:Add, Button, x50 y295 gButtonRemoveAlwaysBuying, Remove
Gui, main_interface:Add, Button, x110 y295 gButtonShowAllAlwaysBuying, Show All
gosub updateBuy
;----Prices----
Gui, main_interface:Add, Text, x720 y25, Prime Parts Prices
Gui, main_interface:Add, Text, x880 y10, Parts price threshold: 
Gui, main_interface:Add, Text, x880 y35, Sets price threshold: 
Gui, main_interface:Add, Edit, x985 y5 w45 
Gui, main_interface:Add, UpDown, gupdatePrice vpartsPriceThreshold Range1-500, %partsPriceThreshold%
Gui, main_interface:Add, Edit, x985 y30 w45
Gui, main_interface:Add, UpDown, gupdatePrice vsetsPriceThreshold Range1-500, %setsPriceThreshold%
Gui, main_interface:Add, Text, x720 y215 w225 vpriceUpdateDateTime, Last check: Not available
Gui, main_interface:Add, Text, x720 y230 vpriceUpdateTotalTime, Update duration: Not available
Gui, main_interface:Add, Button, x815 y20 gupdatePriceDB, Update
Gui, main_interface:Add, Edit, x720 y60 w310 h150 +readonly +hscroll vpriceText, updating...
gosub updatePrice
;----Copy/paste----
Gui, main_interface:Add, Text, x720 y270, Copy/paste
Gui, main_interface:Add, Button, x790 y265 gcopyPasteCopy, Copy
Gui, main_interface:Add, Button, x830 y265 gcopyPasteChange, Change
Gui, main_interface:Add, Edit, x720 y290 w310 h45 +readonly +hscroll vcopyPasteText, %copyPaste%
;----Quantity Buttons----
Gui, main_interface:Font, cWhite
relicsX := 120
relicsY := 860
loop, 4
{
    Gui, main_interface:Add, Button , % "gShowRelicDrops" " " "vShowRelicDrops"A_index " " "x"relicsX-45 " " "y"relicsY-5, Drops
    Gui, main_interface:Add, Button , % "gButtonAddOneRelic" " " "vaddOneButton"A_index " " "x"relicsX " " "y"relicsY-5, +1
    Gui, main_interface:Add, Button , % "gButtonRemoveOneRelic" " " "vremoveOneButton"A_index " " "x"relicsX+25 " " "y"relicsY-5, -1
    Gui, main_interface:Add, Button , % "gButtonAddFiveRelics" " " "vaddFiveButton"A_index " " "x"relicsX+50 " " "y"relicsY-5, +5
    Gui, main_interface:Add, Button , % "gButtonRemoveFiveRelics" " " "vremoveFiveButton"A_index " " "x"relicsX+75 " " "y"relicsY-5, -5
    relicsX += 220
}
;----others----
Gui, main_interface:Add, CheckBox, x10 y370 genableEditing venableEditing, Enable editing
Gui, main_interface:Add, Text, x150 y370 w100 vtotalRelics, Total Relics: 
Gui, main_interface:Add, Edit, x10 y395 vfilter_text gfilterRelics w150
Gui, main_interface:Add, Button, x165 y395 h20 gfilterRelics, Filter
gosub totalRelics
Gui, main_interface:Add, Button, x10 y340 goffcycleRelics, Show Offcycle Relcs
;--------------
Gui, main_interface:Color,, 3b3b3b
Gui, main_interface:Font, s10
Gui, main_interface:Add, ListView, AltSubmit -multi x10 y420 r20 w900 gRelicsListViewEvents vRelicsListView hwndRelicsListView, Name|Quantity|Name|Quantity|Name|Quantity|Name|Quantity
ListColors := New LV_Colors(RelicsListView)
gosub updateListView
Gui, main_interface:Show, X%guiX% Y%guiY%
return

updateListView:
    Gui, ListView, RelicsListView
    rowNum := 1
    colNum := 1
    LV_Delete()         ; Clear list
    relicsArr := objectSort(relicsArr, "name")
    Loop % relicsArr.MaxIndex()
    {
        newCategory := SubStr(relicsArr[A_index].name, 1, 1)
        if (newCategory != lastCategory) && (A_index!=1)    ;begin a new column     ;skip for first index
        {
            colNum += 2, rowNum := 1
        }
        status := LV_Modify(rowNum, "Col" colNum, relicsArr[A_index].name, relicsArr[A_index].quantity)
        if !status      ; Row does not exist
        {
            LV_Add()
            LV_Modify(rowNum, "Col" colNum, relicsArr[A_index].name, relicsArr[A_index].quantity)
        }
        if (relicsArr[A_index].quantity > hostThreshold-1)
            ListColors.Cell(rowNum,colNum,,"0x7ef542"), ListColors.Cell(rowNum,colNum+1,,"0x7ef542")
        else if (relicsArr[A_index].quantity < 1)
            ListColors.Cell(rowNum,colNum,,"0xc1ba5f5"), ListColors.Cell(rowNum,colNum+1,,"0xc1ba5f5")
        else
            ListColors.Cell(rowNum,colNum), ListColors.Cell(rowNum,colNum+1)
        lastCategory := SubStr(relicsArr[A_index].name, 1, 1)
        rowNum++
    }
    ; Name Columns
    LV_ModifyCol(1, "100 Center")
    LV_ModifyCol(3, "100 Center")
    LV_ModifyCol(5, "100 Center")
    LV_ModifyCol(7, "100 Center")
    ; Quantity Columns
    LV_ModifyCol(2, "120 Center")
    LV_ModifyCol(4, "120 Center")
    LV_ModifyCol(6, "120 Center")
    LV_ModifyCol(8, "120 Center")
    return

ButtonAddNewRelic:
    GuiControlGet, New_relic
    if (New_relic=="")
    {
        msgbox, Please enter a value
        return
    }
	StringUpper, New_relic, New_relic, T
    ;Emptying fields
    GuiControl, main_interface:, New_relic
    GuiControl, main_interface:focus, New_relic
    ;checking if already in the array
    loop % relicsArr.MaxIndex()
    {
        if (relicsArr[A_index].name == New_relic)
        {
            msgbox, Relic already exists.
            return
        }
    }
    relicsArr.push({name: New_relic, quantity: 0})
    ;adding to the database
    file := FileOpen("SrbDB.json", "w")
    file.write(JSON.Dump(relicsArr))
    file.close()
    gosub updateListView
    return

ButtonShowRelics:
    str := ""
    Loop % relicsArr.MaxIndex()
    {
        str .= relicsArr[A_index].name "`n"
    }
    str := SubStr(str, 1, StrLen(str)-1)
    Gui, ShowAll:New,,Relics
    Gui, ShowAll:Add, Edit, w100 h300 +readonly +vscroll, %str%
    Gui, ShowAll:Add, Button, gButtonShowOk, OK
    GuiControl, ShowAll:focus, Button1
    Gui, ShowAll:Show
    return

ButtonRemoveRelic:
    GuiControlGet, New_relic
    if (New_relic=="")
    {
        msgbox, Please enter a value
        return
    }
    Msgbox, 4,, Are you sure you want to remove %New_relic% relic?
    IfMsgBox, No
	    return
	StringUpper, New_relic, New_relic, T
    ;Emptying fields
    GuiControl, main_interface:, New_relic
    GuiControl, main_interface:focus, New_relic
    ;removing from the array
    Loop % relicsArr.MaxIndex()
    {
        if (relicsArr[A_index].name == New_relic)
        {
            relicsArr.removeat(A_index)
            file := FileOpen("SrbDB.json", "w")
            file.write(JSON.Dump(relicsArr))
            file.close()
            gosub updateListView
            return
        }
    }
    Msgbox, Relic does not exist.
    return

ButtonAddNewExc:
    GuiControlGet, New_exc
    if (New_exc=="")
    {
        msgbox, Please enter a value
        return
    }
    loop, 26
    {
        New_exc := StrReplace(New_exc, chr(A_Index + 96), chr(A_Index + 64))    ;capitalize tier letter
    }
    New_exc := StrReplace(New_exc, "lith", "Lith")
    New_exc := StrReplace(New_exc, "meso", "Meso")
    New_exc := StrReplace(New_exc, "neo", "Neo")
    New_exc := StrReplace(New_exc, "axi", "Axi")
    ;Emptying fields
    GuiControl, main_interface:, New_exc
    GuiControl, main_interface:focus, New_exc
    ;checking if already in the list
    FileRead, excRelicsInfo, SrbExc.dat
    if InStr(excRelicsInfo, New_exc)
    {
        msgbox, Relic already exists.
        return
    }
    ;adding to the exc relics
    ;FileAppend, %New_exc%`r`n, SrbExc.dat
    file := FileOpen("SrbExc.dat", "a")
    file.write(New_exc . "`r`n")
    file.close()
    ;updating host table
    gosub updateHost
    return

ButtonShowExc:
    FileRead, excRelicsInfo, SrbExc.dat
    Sort, excRelicsInfo
    Gui, ShowAll:New,,2b2 Exclusives
    Gui, ShowAll:Add, Edit, w100 h300 +readonly +vscroll, %excRelicsInfo%
    Gui, ShowAll:Add, Button, gButtonShowOk, OK
    GuiControl, ShowAll:focus, Button1
    Gui, ShowAll:Show
    return

ButtonRemoveExc:
    GuiControlGet, New_exc
    if (New_exc=="")
    {
        msgbox, Please enter a value
        return
    }
    Msgbox, 4,, Are you sure you want to remove %New_exc% relic from 2b2 exclusives?
    IfMsgBox, No
	    return
    ;Emptying fields
    GuiControl, main_interface:, New_exc
    GuiControl, main_interface:focus, New_exc
    ;removing from the exc relics
    fileContents := ""
    Loop
    {
        FileReadLine, excRelicInfo, SrbExc.dat, %A_Index%
        if ErrorLevel		;end of file reached
            Break
        if InStr(excRelicInfo, New_exc)
            continue
        fileContents := fileContents . excRelicInfo . "`r`n"
    }
    ;---- The end of the file has been reached or there was a problem.
    ;FileDelete, SrbExc.dat
    ;FileAppend, %fileContents%, SrbExc.dat
    file := FileOpen("SrbExc.dat", "w")
    file.write(fileContents)
    file.close()
    ;updating host table
    gosub updateHost
    return

ButtonAddNewCustom:
    GuiControlGet, New_Custom
    if (New_Custom=="")
    {
        msgbox, Please enter a value
        return
    }
    loop, 26
    {
        New_Custom := StrReplace(New_Custom, chr(A_Index + 96), chr(A_Index + 64))    ;capitalize tier letter
    }
    New_Custom := StrReplace(New_Custom, "lith", "Lith")
    New_Custom := StrReplace(New_Custom, "meso", "Meso")
    New_Custom := StrReplace(New_Custom, "neo", "Neo")
    New_Custom := StrReplace(New_Custom, "axi", "Axi")
    New_Custom := StrReplace(New_Custom, "host", "host")
    New_Custom := StrReplace(New_Custom, "int", "int")
    New_Custom := StrReplace(New_Custom, "exc", "exc")
    New_Custom := StrReplace(New_Custom, "flaw", "flaw")
    New_Custom := StrReplace(New_Custom, "rad", "rad")
    New_Custom := StrReplace(New_Custom, "1b1", "1b1")
    New_Custom := StrReplace(New_Custom, "2b2", "2b2")
    New_Custom := StrReplace(New_Custom, "3b3", "3b3")
    New_Custom := StrReplace(New_Custom, "4b4", "4b4")
    ;Emptying fields
    GuiControl, main_interface:, New_Custom
    GuiControl, main_interface:focus, New_Custom
    ;checking if already in the list
    FileRead, customRelicsInfo, SrbCustom.dat
    if InStr(customRelicsInfo, New_Custom)
    {
        msgbox, Host already exists.
        return
    }
    ;adding to the custom host
    file := FileOpen("SrbCustom.dat", "a")
    file.write(New_Custom . "`r`n")
    file.close()
    ;updating host table
    gosub updateHost
    return

ButtonShowAllCustoms:
    FileRead, srbCustomInfo, SrbCustom.dat
    Sort, srbCustomInfo
    Gui, ShowAll:New,,Custom hosts
    Gui, ShowAll:Add, Edit, w300 h300 +readonly +vscroll, %srbCustomInfo%
    Gui, ShowAll:Add, Button, gButtonShowOk, OK
    GuiControl, ShowAll:focus, Button1
    Gui, ShowAll:Show
    return

ButtonAddNewAlwaysBuying:
    GuiControlGet, New_Always_Buying
    if (New_Always_Buying=="")
    {
        msgbox, Please enter a value
        return
    }
    loop, 26
    {
        New_Always_Buying := StrReplace(New_Always_Buying, chr(A_Index + 96), chr(A_Index + 64))    ;capitalize tier letter
    }
    New_Always_Buying := StrReplace(New_Always_Buying, "lith", "Lith")
    New_Always_Buying := StrReplace(New_Always_Buying, "meso", "Meso")
    New_Always_Buying := StrReplace(New_Always_Buying, "neo", "Neo")
    New_Always_Buying := StrReplace(New_Always_Buying, "axi", "Axi")
    ;Emptying fields
    GuiControl, main_interface:, New_Always_Buying
    GuiControl, main_interface:focus, New_Always_Buying
    ;checking if already in the list
    FileRead, alwaysBuyingRelicsInfo, SrbAlwaysBuying.dat
    if InStr(alwaysBuyingRelicsInfo, New_Always_Buying)
    {
        msgbox, Relic already exists.
        return
    }
    ;adding to the list
    file := FileOpen("SrbAlwaysBuying.dat", "a")
    file.write(New_Always_Buying . "`r`n")
    file.close()
    ;updating buy
    gosub updateBuy
    return

ButtonRemoveAlwaysBuying:
    GuiControlGet, New_Always_Buying
    if (New_Always_Buying=="")
    {
        msgbox, Please enter a value
        return
    }
    Msgbox, 4,, Are you sure you want to remove %New_Always_Buying% relic from buy list?
    IfMsgBox, No
	    return
    ;Emptying fields
    GuiControl, main_interface:, New_Always_Buying
    GuiControl, main_interface:focus, New_Always_Buying
    ;removing from the list
    fileContents := ""
    Loop
    {
        FileReadLine, alwaysBuyingRelicsInfo, SrbAlwaysBuying.dat, %A_Index%
        if ErrorLevel		;end of file reached
            Break
        if InStr(alwaysBuyingRelicsInfo, New_Always_Buying)
            continue
        fileContents := fileContents . alwaysBuyingRelicsInfo . "`r`n"
    }
    ;---- The end of the file has been reached or there was a problem.
    file := FileOpen("SrbAlwaysBuying.dat", "w")
    file.write(fileContents)
    file.close()
    ;updating buy
    gosub updateBuy
    return

ButtonShowAllAlwaysBuying:
    FileRead, alwaysBuyingRelicsInfo, SrbAlwaysBuying.dat
    Sort, alwaysBuyingRelicsInfo
    Gui, ShowAll:New,,Buy list
    Gui, ShowAll:Add, Edit, w300 h300 +readonly +vscroll, %alwaysBuyingRelicsInfo%
    Gui, ShowAll:Add, Button, gButtonShowOk, OK
    GuiControl, ShowAll:focus, Button1
    Gui, ShowAll:Show
    return

ButtonAddOneRelic:
    if (enableEditing==0)
        return
    GuiControlGet, addVar, FocusV
    addVar := StrReplace(addVar, "addOneButton", "")
    colNum := addVar
    if (addVar == 2)
        addVar := 3
    else if (addVar == 3)
        addVar := 5
    else if (addVar == 4)
        addVar := 7
    colNum := addVar
    Gui, ListView, RelicsListView
    rowNum := LV_GetNext()
    if (rowNum==0)
    {
        Msgbox Please select a record
        return
    }
    LV_GetText(rowContent, rowNum, colNum)
    if (rowContent == "")
        return
    loop % relicsArr.MaxIndex()
    {
        if (relicsArr[A_index].name = rowContent)
            addVar := A_index, break
    }
    relicsArr[addVar].quantity++  ;incrementing by 1
    ;updating database
    FileRead, OrelicsArr, SrbDB.json
    OrelicsArr := JSON.Load(OrelicsArr)
    loop % OrelicsArr.MaxIndex()
    {
        if (OrelicsArr[A_index].name = rowContent)
            OrelicsArr[A_index].quantity++, break
    }
    file := FileOpen("SrbDB.json", "w")
    file.write(JSON.Dump(OrelicsArr))
    file.close()
    OrelicsArr := ""
    ;----
    if (relicsArr[addVar].quantity > fetchThreshold-1)
        ListColors.Cell(rowNum,colNum,,"0x7ef542"), ListColors.Cell(rowNum,colNum+1,,"0x7ef542")      ; Green Color
    else if (relicsArr[addVar].quantity < 1)
        ListColors.Cell(rowNum,colNum,,"0xc1ba5f5"), ListColors.Cell(rowNum,colNum+1,,"0xc1ba5f5")    ; Blue Color
    else 
        ListColors.Cell(rowNum,colNum), ListColors.Cell(rowNum,colNum+1)    ; No Color
    LV_Modify(rowNum, "Col" colNum+1, relicsArr[addVar].quantity)
    /*
    Else
    {
    
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    */
    ;GuiControl, main_interface:Text, % "relicName"addVar , % relicsArr[addVar].name "        " relicsArr[addVar].quantity

    gosub updateFetch
    gosub updateHost
    gosub updateBuy
    gosub totalRelics
    return

ButtonRemoveOneRelic:
    if (enableEditing==0)
        return
    GuiControlGet, addVar, FocusV
    addVar := StrReplace(addVar, "removeOneButton", "")
    colNum := addVar
    if (addVar == 2)
        addVar := 3
    else if (addVar == 3)
        addVar := 5
    else if (addVar == 4)
        addVar := 7
    colNum := addVar
    Gui, ListView, RelicsListView
    rowNum := LV_GetNext()
    if (rowNum==0)
    {
        Msgbox Please select a record
        return
    }
    LV_GetText(rowContent, rowNum, colNum)
    if (rowContent == "")
        return
    loop % relicsArr.MaxIndex()
    {
        if (relicsArr[A_index].name = rowContent)
            addVar := A_index, break
    }
    relicsArr[addVar].quantity--  ;decrementing by 1
    ;updating database
    FileRead, OrelicsArr, SrbDB.json
    OrelicsArr := JSON.Load(OrelicsArr)
    loop % OrelicsArr.MaxIndex()
    {
        if (OrelicsArr[A_index].name = rowContent)
            OrelicsArr[A_index].quantity--, break
    }
    file := FileOpen("SrbDB.json", "w")
    file.write(JSON.Dump(OrelicsArr))
    file.close()
    OrelicsArr := ""
    ;----
    if (relicsArr[addVar].quantity > fetchThreshold-1)
        ListColors.Cell(rowNum,colNum,,"0x7ef542"), ListColors.Cell(rowNum,colNum+1,,"0x7ef542")      ; Green Color
    else if (relicsArr[addVar].quantity < 1)
        ListColors.Cell(rowNum,colNum,,"0xc1ba5f5"), ListColors.Cell(rowNum,colNum+1,,"0xc1ba5f5")    ; Blue Color
    else 
        ListColors.Cell(rowNum,colNum), ListColors.Cell(rowNum,colNum+1)    ; No Color
    LV_Modify(rowNum, "Col" colNum+1, relicsArr[addVar].quantity)
    /*
    Else
    {
    
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    */
    ;GuiControl, main_interface:Text, % "relicName"addVar , % relicsArr[addVar].name "        " relicsArr[addVar].quantity

    gosub updateFetch
    gosub updateHost
    gosub updateBuy
    gosub totalRelics
    return

ButtonAddFiveRelics:
    if (enableEditing==0)
        return
    GuiControlGet, addVar, FocusV
    addVar := StrReplace(addVar, "addFiveButton", "")
    colNum := addVar
    if (addVar == 2)
        addVar := 3
    else if (addVar == 3)
        addVar := 5
    else if (addVar == 4)
        addVar := 7
    colNum := addVar
    Gui, ListView, RelicsListView
    rowNum := LV_GetNext()
    if (rowNum==0)
    {
        Msgbox Please select a record
        return
    }
    LV_GetText(rowContent, rowNum, colNum)
    if (rowContent == "")
        return
    loop % relicsArr.MaxIndex()
    {
        if (relicsArr[A_index].name = rowContent)
            addVar := A_index, break
    }
    relicsArr[addVar].quantity += 5  ;incrementing by 5
    ;updating database
    FileRead, OrelicsArr, SrbDB.json
    OrelicsArr := JSON.Load(OrelicsArr)
    loop % OrelicsArr.MaxIndex()
    {
        if (OrelicsArr[A_index].name = rowContent)
            OrelicsArr[A_index].quantity += 5, break
    }
    file := FileOpen("SrbDB.json", "w")
    file.write(JSON.Dump(OrelicsArr))
    file.close()
    OrelicsArr := ""
    ;----
    if (relicsArr[addVar].quantity > fetchThreshold-1)
        ListColors.Cell(rowNum,colNum,,"0x7ef542"), ListColors.Cell(rowNum,colNum+1,,"0x7ef542")      ; Green Color
    else if (relicsArr[addVar].quantity < 1)
        ListColors.Cell(rowNum,colNum,,"0xc1ba5f5"), ListColors.Cell(rowNum,colNum+1,,"0xc1ba5f5")    ; Blue Color
    else 
        ListColors.Cell(rowNum,colNum), ListColors.Cell(rowNum,colNum+1)    ; No Color
    LV_Modify(rowNum, "Col" colNum+1, relicsArr[addVar].quantity)

    gosub updateFetch
    gosub updateHost
    gosub updateBuy
    gosub totalRelics
    return

ButtonRemoveFiveRelics:
    if (enableEditing==0)
        return
    GuiControlGet, addVar, FocusV
    addVar := StrReplace(addVar, "removeFiveButton", "")
    colNum := addVar
    if (addVar == 2)
        addVar := 3
    else if (addVar == 3)
        addVar := 5
    else if (addVar == 4)
        addVar := 7
    colNum := addVar
    Gui, ListView, RelicsListView
    rowNum := LV_GetNext()
    if (rowNum==0)
    {
        Msgbox Please select a record
        return
    }
    LV_GetText(rowContent, rowNum, colNum)
    if (rowContent == "")
        return
    loop % relicsArr.MaxIndex()
    {
        if (relicsArr[A_index].name = rowContent)
            addVar := A_index, break
    }
    relicsArr[addVar].quantity -= 5  ;decrementing by 5
    ;updating database
    FileRead, OrelicsArr, SrbDB.json
    OrelicsArr := JSON.Load(OrelicsArr)
    loop % OrelicsArr.MaxIndex()
    {
        if (OrelicsArr[A_index].name = rowContent)
            OrelicsArr[A_index].quantity -= 5, break
    }
    file := FileOpen("SrbDB.json", "w")
    file.write(JSON.Dump(OrelicsArr))
    file.close()
    OrelicsArr := ""
    ;----
    if (relicsArr[addVar].quantity > fetchThreshold-1)
        ListColors.Cell(rowNum,colNum,,"0x7ef542"), ListColors.Cell(rowNum,colNum+1,,"0x7ef542")      ; Green Color
    else if (relicsArr[addVar].quantity < 1)
        ListColors.Cell(rowNum,colNum,,"0xc1ba5f5"), ListColors.Cell(rowNum,colNum+1,,"0xc1ba5f5")    ; Blue Color
    else 
        ListColors.Cell(rowNum,colNum), ListColors.Cell(rowNum,colNum+1)    ; No Color
    LV_Modify(rowNum, "Col" colNum+1, relicsArr[addVar].quantity)
    /*
    Else
    {
    
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    */
    ;GuiControl, main_interface:Text, % "relicName"addVar , % relicsArr[addVar].name "        " relicsArr[addVar].quantity

    gosub updateFetch
    gosub updateHost
    gosub updateBuy
    gosub totalRelics
    return

ShowRelicDrops:
    GuiControlGet, addVar, FocusV
    addVar := StrReplace(addVar, "ShowRelicDrops", "")
    colNum := addVar
    if (addVar == 2)
        addVar := 3
    else if (addVar == 3)
        addVar := 5
    else if (addVar == 4)
        addVar := 7
    colNum := addVar
    Gui, ListView, RelicsListView
    rowNum := LV_GetNext()
    if (rowNum==0)
    {
        Msgbox Please select a record
        return
    }
    LV_GetText(rowContent, rowNum, colNum)
    if (rowContent == "")
        return
    loop % relicsArr.MaxIndex()
    {
        if (relicsArr[A_index].name = rowContent)
            addVar := A_index, break
    }
    StringLower, relic_name, rowContent
    relic_name := StrReplace(relic_name, " ", "_")
    relic_name .= "_relic"
    file_path := "Relics Info\" relic_name ".json"
    FileRead, relic_drops, % file_path
    if ErrorLevel
    {
        Msgbox Relic not found.
        return
    }
    relic_drops := JSON.Load(relic_drops)
    value1 := ""
    drops_value := 0
    FileRead, pricesDB, pricesDB.json
    pricesDB := JSON.Load(pricesDB)
    loop % relic_drops.Common.MaxIndex()
    {
        link := relic_drops.Common[A_index]
        str := StrReplace(relic_drops.Common[A_index], "_", " ")
        StringUpper, str, str, T
        ;str := StrReplace(str, "blueprint", "BP")
        value1 .= str
        loop % pricesDB.MaxIndex()
        {
            if (pricesDB[A_index].item_url == link)
                value1 .=  "          (" pricesDB[A_index].price "p)`n", drops_value += pricesDB[A_index].price
        }
    }
    if (relic_drops.Common.MaxIndex() < 3)
        value1 .= "Forma Blueprint`n"
    loop % relic_drops.Uncommon.MaxIndex()
    {
        link := relic_drops.Uncommon[A_index]
        str := StrReplace(relic_drops.Uncommon[A_index], "_", " ")
        StringUpper, str, str, T
        ;str := StrReplace(str, "blueprint", "BP")
        value1 .= str
        loop % pricesDB.MaxIndex()
        {
            if (pricesDB[A_index].item_url == link)
                value1 .= "          (" pricesDB[A_index].price "p)`n", drops_value += pricesDB[A_index].price
        }
    }
    if (relic_drops.Uncommon.MaxIndex() < 2)
        value1 .= "Forma Blueprint`n"
    loop % relic_drops.Rare.MaxIndex()
    {
        link := relic_drops.Rare[A_index]
        str := StrReplace(relic_drops.Rare[A_index], "_", " ")
        StringUpper, str, str, T
        ;str := StrReplace(str, "blueprint", "BP")
        value1 .= str
        loop % pricesDB.MaxIndex()
        {
            if (pricesDB[A_index].item_url == link)
                value1 .= "          (" pricesDB[A_index].price "p)`n", drops_value += pricesDB[A_index].price
        }
    }
    if (relic_drops.Rare.MaxIndex() < 1)
        value1 .= "Forma Blueprint`n"
    value1 := SubStr(value1, 1, StrLen(value1)-1)		; Trailing newline
    value2 := SubStr(value2, 1, StrLen(value2)-1)		; Trailing newline
    relic_name := StrReplace(relic_name, "_", " ")
    StringUpper, relic_name, relic_name, T
    value1 := relic_name "`n" value1
    mousegetpos, x, y
    tooltip, % value1, x+20, y+20
    SetTimer, ToolTipUpdate, 100
    SetTimer, RemoveToolTip, -10000
    return

RemoveToolTip:
    SetTimer, ToolTipUpdate, off
    ToolTip
    return

ToolTipUpdate:
    preX := x
    preY := y
    mousegetpos, x, y
    if (preX == x && preY == y)
        return
    tooltip, % value1, x+20, y+20
    return

RelicsListViewEvents:
    return

filterRelics:
    GuiControlGet, filter_text
    if (filter_text=="")
    {
        FileRead, relicsArr, SrbDB.json
        relicsArr := JSON.Load(relicsArr)
        gosub updateListView
        gosub updateFetch
        gosub updateHost
        gosub updateBuy
        gosub totalRelics
        return
    }
    Fileread, wfm_items_list, WFM_Items_List.json
    try
    {
        wfm_items_list := JSON.Load(wfm_items_list)
    }
    catch e 
    {
        Msgbox % "Some error occured in line " A_LineNumber
        return
    }
    filter_text := Trim(filter_text)
    filter_text := StrReplace(filter_text, " ", "_")
    temp_filter_text := filter_text
    filter_text := {}
    loop % wfm_items_list.payload.items.MaxIndex()
    {
        if RegExMatch(wfm_items_list.payload.items[A_Index].url_name, "^" temp_filter_text "\W*")
        {
            if !(instr(wfm_items_list.payload.items[A_Index].url_name, "prime"))
                continue
            if (instr(wfm_items_list.payload.items[A_Index].url_name, "set"))
                continue
            filter_text.push(wfm_items_list.payload.items[A_Index].url_name)
        }
    }
    if (filter_text[1] == "")
    {
        ;msgbox % "Item " temp_filter_text " not found"
        return
    }
    FileRead, relicsArr, SrbDB.json
    relicsArr := JSON.Load(relicsArr)
    loop % relicsArr.MaxIndex()
    {
        relic_name := StrReplace(relicsArr[A_Index].name, " ", "_")
        relic_name .= "_relic"
        StringLower, relic_name, relic_name
        mainLoopIndex := A_index
        file_path := "Relics Info\" relic_name ".json"
        FileRead, relic_drops, % file_path
        if ErrorLevel
        {
            Msgbox % "Could not load`n" JSON.Dump(relicsArr[A_Index]) "`nIndex: " A_Index
        }
        keepRelic := 0
        loop % filter_text.MaxIndex()
        {
            if InStr(relic_drops, filter_text[A_index])
            {
                keepRelic := 1
                break
            }
        }
        if !keepRelic
            relicsArr.delete(mainLoopIndex)
    }
    gosub updateListView
    gosub updateFetch
    gosub updateHost
    gosub updateBuy
    gosub totalRelics
    return

fetchCopy:
    clipboard := ""
    clipboard := fetchContent
    ClipWait, 2
    loop
    {
        mousegetpos, x, y
        tooltip, Copied fetch!, (x + 20), (y + 20), 1
        if (A_index==200)
        {   
            tooltip 
            break
        }
        sleep 20
    }
    ;msgbox,,,Copied fetch!, 1
    return

hostCopy:
    clipboard := ""
    clipboard := hostContent
    ClipWait, 2
    loop
    {
        mousegetpos, x, y
        tooltip, Copied host!, (x + 20), (y + 20), 1
        if (A_index==200)
        {   
            tooltip 
            break
        }
        sleep 20
    }
    ;msgbox,,,Copied host!, 1
    return

buyCopy:
    clipboard := ""
    clipboard := buyContent
    ClipWait, 2
    if buySpamMode
        SetTimer, copyPasteWait, -100
    msgbox,,,Copied buy!, 1
    return

linkerCopy:
    GuiControlGet, linkVar, FocusV
    linkVar := StrReplace(linkVar, "linkerCopyButton", "")
    loop % linkerContentArr.MaxIndex()
    {
        if (A_index==linkVar)
        {
            clipboard := ""
            clipboard := linkerContentArr[A_index]
            ClipWait, 2
            break
        }
    }
    loop
    {
        mousegetpos, x, y
        tooltip, Copied linker list %linkVar%!, (x + 20), (y + 20), 1
        if (A_index==200)
        {   
            tooltip 
            break
        }
        sleep 20
    }
    ;msgbox,,,Copied linker list %linkVar%!, 1
    return

copyPasteCopy:
    clipboard := ""
    clipboard := copyPaste
    ClipWait, 2
    loop
    {
        mousegetpos, x, y
        tooltip, Copied Copy/paste!, (x + 20), (y + 20), 1
        if (A_index==200)
        {   
            tooltip 
            break
        }
        sleep 20
    }
    ;msgbox,,,Copied Copy/paste!, 1
    return

copyPasteChange:
    WinGetPos, guiX, guiY, guiW, guiH, Relics Interface
    guiW := (guiW/2)-120
    guiH := (guiH/2)-50
    cpX := guiX+guiW
    cpH := guiY+guiH
    Gui, changeCopyPaste:New,, CP Change
    Gui, changeCopyPaste:Add, Text,, Enter new paste:
    Gui, changeCopyPaste:Add, Edit, x10 y30 w280 vcopyPaste
    Gui, changeCopyPaste:Add, Button, gcopyPasteChangeOK, Ok
    Gui, changeCopyPaste:Show, w300 X%cpX% Y%cpH%
    return

copyPasteChangeOK:
    GuiControlGet, copyPaste
	RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, copyPaste, %copyPaste%		;write to registry
    GuiControl, main_interface:, copyPasteText, %copyPaste%
    Gui, changeCopyPaste:Destroy
    return

updateFetch:
    GuiControlGet, fetchThreshold
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, fetchThreshold, %fetchThreshold%
    fetchContent := ""
    Loop % relicsArr.MaxIndex()
    {   
        if (relicsArr[A_index].quantity > fetchThreshold-1)
            fetchContent := fetchContent . ",+" . relicsArr[A_index].name
    }
    fetchContent := StrReplace(fetchContent, "," , "",, 1)
    GuiControl,, fetchText , %fetchContent%
    return

updateHost:
    GuiControlGet, hostThreshold
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, hostThreshold, %hostThreshold%
    hostContent := ""
    Loop % relicsArr.MaxIndex()
    {
        if ((InStr(relicsArr[A_index].name, "lith")) && (lithCheck==0))
            continue
        else if ((InStr(relicsArr[A_index].name, "meso")) && (mesoCheck==0))
            continue
        else if ((InStr(relicsArr[A_index].name, "neo")) && (neoCheck==0))
            continue
        else if ((InStr(relicsArr[A_index].name, "axi")) && (axiCheck==0))
            continue
        if (relicsArr[A_index].quantity > hostThreshold-1)
        {
            relicIndex := A_Index
            FileRead, excArr, SrbExc.dat
            FileRead, customArr, SrbCustom.dat
            excArr := StrSplit(excArr, "`r`n")
            customArr := StrSplit(customArr, "`r`n")
            isFoundCustom := 0
            loop % customArr.MaxIndex()-1
            {
                if  InStr(customArr[A_Index], relicsArr[relicIndex].name)
                {
                    if  InStr(hostContent, customArr[A_Index])      ;avoiding repeated hosts
                    {
                        isFoundCustom := 1
                        continue
                    }
                    hostContent := hostContent . customArr[A_Index]
                    if 4Cycles
                        hostContent := hostContent . " (4+ cycles)`r`n"
                    else
                        hostContent := hostContent . "`r`n"
                    isFoundCustom := 1
                }
            }
            if isFoundCustom
                continue
            isFoundExc := 0
            loop % excArr.MaxIndex()-1
            {
                if (relicsArr[relicIndex].name == excArr[A_Index])
                {
                    hostContent := hostContent . "++host " . relicsArr[relicIndex].name . " rad 2b2"
                    if 4Cycles
                        hostContent := hostContent . " (4+ cycles)`r`n"
                    else
                        hostContent := hostContent . "`r`n"
                    isFoundExc := 1
                }
            }
            if isFoundExc
                continue
            hostContent := hostContent . "++host " . relicsArr[A_index].name . " rad 4b4"
            if 4Cycles
                hostContent := hostContent . " (4+ cycles)`r`n"
            else
                hostContent := hostContent . "`r`n"
        }
    }
    GuiControl,, hostText , %hostContent%
    return

updateBuy:
    GuiControlGet, buyThreshold
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, buyThreshold, %buyThreshold%
    FileRead, alwaysBuyingRelicsInfo, SrbAlwaysBuying.dat
    buyContent := "WTB "
    linkerContent := ""
    putLith := 0
    putSlash := 0
    Loop % relicsArr.MaxIndex()
    {
        if !(InStr(relicsArr[A_index].name, "lith"))
            continue
        tier := StrReplace(relicsArr[A_index].name, "lith ", "", i)
        if (relicsArr[A_index].quantity < buyThreshold || InStr(alwaysBuyingRelicsInfo, relicsArr[A_index].name))
        {
            if (putLith==0)
            {
                buyContent := buyContent . "Lith "
                putLith++
            }
            if (putSlash!=0)
                buyContent := buyContent . "/"
            buyContent := buyContent . tier
            if (relicsArr[A_index].quantity > 0)
                linkerContent := linkerContent . "[Lith " . tier . " Relic]"
            else 
                linkerContent := linkerContent . "Lith " . tier
            putSlash++
        }
    }
    if puthLith!=0
    {
        buyContent := buyContent . " - "
    }
    putMeso := 0
    putSlash := 0
    Loop % relicsArr.MaxIndex()
    {
        if !(InStr(relicsArr[A_index].name, "meso"))
            continue
        tier := StrReplace(relicsArr[A_index].name, "meso ", "", i)
        if (relicsArr[A_index].quantity < buyThreshold || InStr(alwaysBuyingRelicsInfo, relicsArr[A_index].name))
        {
            if (putMeso==0)
            {
                buyContent := buyContent . "Meso "
                putMeso++
            }
            if (putSlash!=0)
                buyContent := buyContent . "/"
            buyContent := buyContent . tier
            if (relicsArr[A_index].quantity > 0)
                linkerContent := linkerContent . "[Meso " . tier . " Relic]"
            else 
                linkerContent := linkerContent . "Meso " . tier
            putSlash++
        }
    }
    if putMeso!=0
    {
        buyContent := buyContent . " - "
    }
    putNeo := 0
    putSlash := 0
    Loop % relicsArr.MaxIndex()
    {
        if !(InStr(relicsArr[A_index].name, "neo"))
            continue
        tier := StrReplace(relicsArr[A_index].name, "neo ", "", i)
        if (relicsArr[A_index].quantity < buyThreshold || InStr(alwaysBuyingRelicsInfo, relicsArr[A_index].name))
        {
            if (putNeo==0)
            {
                buyContent := buyContent . "Neo "
                putNeo++
            }
            if (putSlash!=0)
                buyContent := buyContent . "/"
            buyContent := buyContent . tier
            if (relicsArr[A_index].quantity > 0)
                linkerContent := linkerContent . "[Neo " . tier . " Relic]"
            else 
                linkerContent := linkerContent . "Neo " . tier
            putSlash++
        }
    }
    if putNeo!=0
    {
        buyContent := buyContent . " - "
    }
    putAxi := 0
    putSlash := 0
    Loop % relicsArr.MaxIndex()
    {
        if !(InStr(relicsArr[A_index].name, "axi"))
            continue
        tier := StrReplace(relicsArr[A_index].name, "axi ", "", i)
        if (relicsArr[A_index].quantity < buyThreshold || InStr(alwaysBuyingRelicsInfo, relicsArr[A_index].name))
        {
            if (putAxi==0)
            {
                buyContent := buyContent . "Axi "
                putAxi++
            }
            if (putSlash!=0)
                buyContent := buyContent . "/"
            buyContent := buyContent . tier
            if (relicsArr[A_index].quantity > 0)
                linkerContent := linkerContent . "[Axi " . tier . " Relic]"
            else 
                linkerContent := linkerContent . "Axi " . tier
            putSlash++
        }
    }
    if putAxi!=0
    {
        buyContent := buyContent . " - "
    }
    buyContent := buyContent . "5p each. Pm for links"
    ;if the list is larger than 180 characters, then remove a random relic
    original := buyContent
    loop
    {
        if (StrLen(buyContent)>180)
        {
            loop
            {
                Random, randomNum, 10, 150
                if (SubStr(buyContent, randomNum, 1)!="/")
                    continue
                str := SubStr(buyContent, randomNum, InStr(buyContent,"/",,randomNum+1)-randomNum)
                if instr(str, "-")
                    Continue
                buyContent := SubStr(buyContent, 1, randomNum-1) . SubStr(buyContent, randomNum + InStr(buyContent,"/",,randomNum+1)-randomNum)
                break
            }
        }
        else
            break
    }
    ;-----linker list-------
    linkerContentArr := []
    loop
    {
        if (linkerContent=="")
            break
        startPos := 1
        endPos := 180-25-13        ;last is extra characters for WTB and price
        endPos := InStr(linkerContent, "]",, endPos)
        if (endPos==0)
        {
            linkerContentArr[A_index] := linkerContent
            linkerContent := ""
            continue
        }
        linkerContentArr[A_index] := SubStr(linkerContent, startPos, endPos)
        linkerContent := StrReplace(linkerContent, linkerContentArr[A_index], "")
    }
    linkerContent := ""
    x := 340
    y := 375
    loop % linkerContentArr.MaxIndex()
    {
        ;Gui, main_interface:Add, Button, x67 y245 glinkerCopy, Copy
        linkerContentArr[A_Index] := "WTB " . linkerContentArr[A_Index] . " 5p each"
        linkerContent := linkerContent . linkerContentArr[A_Index] . "`r`n"
        ;create copy button
        try
        {
            Gui, main_interface:Add, Button , % "glinkerCopy" " " "vlinkerCopyButton"A_index " " "x"x " " "y"y, % "Copy " A_Index
        }
        catch e
        {
        }
        x := x + 50
    }
    ;-----------------------
    ;ending text
    GuiControl, main_interface:, buyText , %buyContent%
    GuiControl, main_interface:, linkerText , %linkerContent%
    return

updatePrice:
    GuiControlGet, partsPriceThreshold, main_interface:
    GuiControlGet, setsPriceThreshold, main_interface:
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, partsPriceThreshold, %partsPriceThreshold%
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, setsPriceThreshold, %setsPriceThreshold%
    FileRead, priceList, pricesDB.json
    FileRead, relicList, relicsDB.json
    FileRead, modsList, modsDB.json
    priceList := JSON.Load(priceList)
    relicList := JSON.Load(relicList)
    modsList := JSON.Load(modsList)
    priceList := objectSort(priceList, "price",,true)
    relicList := objectSort(relicList, "price",,true)
    modsList := objectSort(modsList, "price_r0",,true)
    primeParts := ""
    primeSets := ""
    ducatPartsList := ""
    fullRelicList := ""
    fullModsList := ""
    priceContent := ""
    FileDelete, ducatPrimeParts.dat
    loop % priceList.MaxIndex()
    {
        lineIndex := A_index
        if (!(InStr(priceList[lineIndex].item_url, "Set")) && (priceList[lineIndex].price >= partsPriceThreshold)) || (InStr(priceList[lineIndex].item_url, "Set") && (priceList[lineIndex].price >= setsPriceThreshold))
        {
            partName := StrReplace(priceList[lineIndex].item_url, "_", " ")
            relicNames := StrReplace(priceList[lineIndex].relics, "_", " ")
            ;capitalizing letters
            loop, 26
	        {
		        if (SubStr(partName, 1, 1) == chr(A_Index + 96))
			        partName := StrReplace(partName, chr(A_Index + 96), chr(A_Index + 64),, 1)
                partName := StrReplace(partName, " "chr(A_Index + 96), " "chr(A_Index + 64),, 1)
                ;----
			    relicNames := StrReplace(relicNames, chr(A_Index + 96), chr(A_Index + 64))
	        }
            relicNames := StrReplace(relicNames, "AXI", "Axi")
            relicNames := StrReplace(relicNames, "NEO", "Neo")
            relicNames := StrReplace(relicNames, "MESO", "Meso")
            relicNames := StrReplace(relicNames, "LITH", "Lith")
            ;-----
            price_value := priceList[lineIndex].price
            ducat_value := priceList[lineIndex].ducat
            if (price_value == 0)
                price_value := " N/A"
            loop
            {
                if (StrLen(price_value)>2)
                    break
                price_value := " " . price_value      ;leading spaces for formatting
            }
            loop
            {
                if (StrLen(ducat_value)>2)
                    break
                ducat_value := " " . ducat_value      ;leading spaces for formatting
            }
            ;-----
            if InStr(partName, "Set")
            {
                primeSets := primeSets . partName . "$" . A_tab . price_value . "p" . A_tab A_tab A_tab . "Ducats: " . ducat_value . "`r`n"
                continue
            }
            primeParts := primeParts . partName . "$" . A_tab . price_value . "p" .  A_tab . "Ducats: " . ducat_value . A_tab . "Relics: " . relicNames . "`r`n"
        }
        if (!(InStr(priceList[lineIndex].item_url, "Set")) && (priceList[lineIndex].price <= 15) && (priceList[lineIndex].ducat == 100))
        {
            partName := priceList[lineIndex].item_url
            partLink := "https://warframe.market/items/" . partName
            partName := StrReplace(partName, "_", " ")
            ;capitalizing first letters
            loop, 26
	        {
		        if (SubStr(partName, 1, 1) == chr(A_Index + 96))
			        partName := StrReplace(partName, chr(A_Index + 96), chr(A_Index + 64),, 1)
                partName := StrReplace(partName, " "chr(A_Index + 96), " "chr(A_Index + 64),, 1)
	        }
            ;-----
            ducatPartsList :=  ducatPartsList . "[" . partName . "](" . partLink . ")" . "$" . A_tab . priceList[lineIndex].price . "p" . A_tab . "Ducats: " . priceList[lineIndex].ducat . "`r`n"
            file := FileOpen("ducatPrimeParts.dat", "a")
            string := priceList[lineIndex].item_url . "`r`n"
            file.Write(string)
            file.Close()
        }
    }
    ;removing trialing newlines
    ducatPartsList := SubStr(ducatPartsList, 1, StrLen(ducatPartsList)-2)   
    primeSets := SubStr(primeSets, 1, StrLen(primeSets)-2)      
    primeParts := SubStr(primeParts, 1, StrLen(primeParts)-2)
    ;relics list
    loop % relicList.MaxIndex()
    {
        lineIndex := A_index
        relicName := StrReplace(relicList[lineIndex].item_url, "_", " ")
        ;capitalizing first letters
        loop, 26
	    {
		    if (SubStr(relicName, 1, 1) == chr(A_Index + 96))
			    relicName := StrReplace(relicName, chr(A_Index + 96), chr(A_Index + 64),, 1)
            relicName := StrReplace(relicName, " "chr(A_Index + 96), " "chr(A_Index + 64),, 1)
	    }
        ;-----
        price_value := relicList[lineIndex].price
        if (price_value == 0)
            price_value := " N/A"
        loop
        {
            if (StrLen(price_value)>2)
                break
            price_value := " " . price_value      ;leading spaces for formatting
        }
        ;-----
        fullRelicList := fullRelicList . relicName relicList[lineIndex].vault_status ":" . A_tab . price_value . "p`r`n"
    }
    fullRelicList := StrReplace(fullRelicList, "N/Ap", "N/A")
    fullRelicList := SubStr(fullRelicList, 1, StrLen(fullRelicList)-2)
    ;mods list
    loop % modsList.MaxIndex()
    {
        lineIndex := A_index
        modName := StrReplace(modsList[lineIndex].item_url, "_", " ")
        StringUpper, modName, modName, T
        price_r0 := modsList[lineIndex].price_r0
        price_r10 := modsList[lineIndex].price_r10
        if (price_r0 == 0)
            price_r0 := " N/A"
        if (price_r10 == 0)
            price_r10 := " N/A"
        loop
        {
            if (StrLen(price_r0)>2)
                break
            price_r0 := " " . price_r0      ;leading spaces for formatting
        }
        loop
        {
            if (StrLen(price_r10)>2)
                break
            price_r10 := " " . price_r10      ;leading spaces for formatting
        }
        ;-----
        fullModsList := fullModsList modName ":" A_tab price_r0 "p" A_tab A_tab A_tab price_r10 "p`r`n"
    }
    fullModsList := StrReplace(fullModsList, "N/Ap", "N/A")
    fullModsList := SubStr(fullModsList, 1, StrLen(fullModsList)-2)
    ;sorting parts list
    primeParts := StrSplit(primeParts, "`r`n")
    loop % primeParts.MaxIndex()
    {
        pos := InStr(primeParts[A_index], A_tab)
        lineIndex := A_index
        if pos<50
        {
            loop
            {
                if InStr(primeParts[lineIndex], A_tab) == 41
                    break
                primeParts[lineIndex] := StrReplace(primeParts[lineIndex], "$" , "$ ",,1)
            }
        }
    }
    loop % primeParts.MaxIndex()
    {
        pos := InStr(primeParts[A_index], A_tab . "D")
        lineIndex := A_index
        if pos<60
        {
            loop
            {
                if InStr(primeParts[lineIndex], A_tab . "D") == 60
                    break
                primeParts[lineIndex] := StrReplace(primeParts[lineIndex], A_tab . "D" , A_space . A_tab . "D",,1)
            }
        }
    }
    partsContentSorted := ""
    loop % primeParts.MaxIndex()
    {
        partsContentSorted := partsContentSorted . primeParts[A_index] . "`r`n"
    }
    partsContentSorted := SubStr(partsContentSorted, 1, StrLen(partsContentSorted)-2)
    ;Sort, partsContentSorted, N P41 R
    partsContentSorted := StrReplace(partsContentSorted, "$", "")
    partsContentSorted := "Prime parts >= " . partsPriceThreshold . "p:`r`n" . partsContentSorted
    ;-------
    ;sorting sets list
    primeSets := StrSplit(primeSets, "`r`n")
    loop % primeSets.MaxIndex()
    {
        pos := InStr(primeSets[A_index], A_tab)
        lineIndex := A_index
        if pos<50
        {
            loop
            {
                if InStr(primeSets[lineIndex], A_tab) == 45
                    break
                primeSets[lineIndex] := StrReplace(primeSets[lineIndex], "$" , "$ ",,1)
            }
        }
    }
    loop % primeSets.MaxIndex()
    {
        pos := InStr(primeSets[A_index], A_tab . "D")
        lineIndex := A_index
        if pos<60
        {
            loop
            {
                if InStr(primeSets[lineIndex], A_tab . "D") == 60
                    break
                primeSets[lineIndex] := StrReplace(primeSets[lineIndex], A_tab . "D" , A_space . A_tab . "D",,1)
            }
        }
    }
    setsContentSorted := ""
    loop % primeSets.MaxIndex()
    {
        setsContentSorted := setsContentSorted . primeSets[A_index] . "`r`n"
    }
    setsContentSorted := SubStr(setsContentSorted, 1, StrLen(setsContentSorted)-2) 
    ;Sort, setsContentSorted, N P45 R
    setsContentSorted := StrReplace(setsContentSorted, "$", "")
    setsContentSorted := "Prime sets >= " . setsPriceThreshold . "p:`r`n" . setsContentSorted
    priceContentSorted := partsContentSorted . "`r`n`r`n" . setsContentSorted
    ;----------
    ;sorting ducats list
    ducatPartsList := StrSplit(ducatPartsList, "`r`n")
    loop % ducatPartsList.MaxIndex()
    {
        pos := InStr(ducatPartsList[A_index], A_tab)
        lineIndex := A_index
        if pos<100
        {
            loop
            {
                if InStr(ducatPartsList[lineIndex], A_tab) == 91
                    break
                ducatPartsList[lineIndex] := StrReplace(ducatPartsList[lineIndex], ")$" , ")$ ",,1)
            }
        }
    }
    loop % ducatPartsList.MaxIndex()
    {
        pos := InStr(ducatPartsList[A_index], A_tab . "D")
        lineIndex := A_index
        if pos<110
        {
            loop
            {
                if InStr(ducatPartsList[lineIndex], A_tab . "D") == 110
                    break
                ducatPartsList[lineIndex] := StrReplace(ducatPartsList[lineIndex], A_tab . "D" , A_space . A_tab . "D",,1)
            }
        }
    }
    ducatsContentSorted := ""
    loop % ducatPartsList.MaxIndex()
    {
        ducatsContentSorted := ducatsContentSorted . ducatPartsList[A_index] . "`r`n"
    }
    ducatsContentSorted := SubStr(ducatsContentSorted, 1, StrLen(ducatsContentSorted)-2) 
    ;Sort, ducatsContentSorted, N P91 R
    ducatsContentSorted := StrReplace(ducatsContentSorted, "$", "")
    ;ducatsContentSorted := "Prime parts <= 15p and worth 100 ducats:`r`n" . ducatsContentSorted
    ;----------
    ;sorting relics list
    fullRelicList := StrSplit(fullRelicList, "`r`n")
    loop % fullRelicList.MaxIndex()
    {
        pos := InStr(fullRelicList[A_index], A_tab)
        lineIndex := A_index
        if pos<40
        {
            loop
            {
                if InStr(fullRelicList[lineIndex], A_tab) == 20
                    break
                fullRelicList[lineIndex] := StrReplace(fullRelicList[lineIndex], ":" , ": ",,1)
            }
        }
    }
    fullRelicListSorted := ""
    loop % fullRelicList.MaxIndex()
    {
        fullRelicListSorted := fullRelicListSorted . fullRelicList[A_index] . "`r`n"
    }
    fullRelicListSorted := SubStr(fullRelicListSorted, 1, StrLen(fullRelicListSorted)-2) 
    ;Sort, fullRelicListSorted, N P31 R
    ;sorting mods list
    fullModsList := StrSplit(fullModsList, "`r`n")
    loop % fullModsList.MaxIndex()
    {
        pos := InStr(fullModsList[A_index], A_tab)
        lineIndex := A_index
        if pos<60
        {
            loop
            {
                if InStr(fullModsList[lineIndex], A_tab) == 31
                    break
                fullModsList[lineIndex] := StrReplace(fullModsList[lineIndex], ":" , ": ",,1)
            }
        }
    }
    fullModsListSorted := ""
    loop % fullModsList.MaxIndex()
    {
        fullModsListSorted := fullModsListSorted . fullModsList[A_index] . "`r`n"
    }
    fullModsListSorted := SubStr(fullModsListSorted, 1, StrLen(fullModsListSorted)-2) 
    ;-------
    ;preparing full list
    primeParts := ""
    primeSets := ""
    priceContent := ""
    loop % priceList.MaxIndex()
    {
        lineIndex := A_index
        partName := StrReplace(priceList[lineIndex].item_url, "_", " ")
        relicNames := StrReplace(priceList[lineIndex].relics, "_", " ")
        ;capitalizing letters
        loop, 26
        {
            if (SubStr(partName, 1, 1) == chr(A_Index + 96))
                partName := StrReplace(partName, chr(A_Index + 96), chr(A_Index + 64),, 1)
            partName := StrReplace(partName, " "chr(A_Index + 96), " "chr(A_Index + 64),, 1)
            ;----
            relicNames := StrReplace(relicNames, chr(A_Index + 96), chr(A_Index + 64))
        }
        relicNames := StrReplace(relicNames, "AXI", "Axi")
        relicNames := StrReplace(relicNames, "NEO", "Neo")
        relicNames := StrReplace(relicNames, "MESO", "Meso")
        relicNames := StrReplace(relicNames, "LITH", "Lith")
        ;-----
        price_value := priceList[lineIndex].price
        ducat_value := priceList[lineIndex].ducat
        if (price_value == 0)
            price_value := " N/A"
        loop
        {
            if (StrLen(price_value)>2)
                break
            price_value := " " . price_value      ;leading spaces for formatting
        }
        loop
        {
            if (StrLen(ducat_value)>2)
                break
            ducat_value := " " . ducat_value      ;leading spaces for formatting
        }
        ;-----
        if InStr(partName, "Set")
            {
                primeSets := primeSets . partName . "$" . A_tab . price_value . "p" . A_tab A_tab A_tab . "Ducats: " . ducat_value . "`r`n"
                continue
            }
        primeParts := primeParts . partName . "$" . A_tab . price_value . "p" .  A_tab . "Ducats: " . ducat_value . A_tab . "Relics: " . relicNames . "`r`n"
    }
    ;removing trialing newlines 
    primeSets := SubStr(primeSets, 1, StrLen(primeSets)-2)      
    primeParts := SubStr(primeParts, 1, StrLen(primeParts)-2)
    ;---------
    GuiControl, main_interface:, priceText, %priceContentSorted%
    RegRead priceUpdateDateTime, HKCU, Software\Softy Relic Bot, priceUpdateDateTime
    FormatTime, priceUpdateDateTime, %priceUpdateDateTime%, ddd dd-MM-yyyy 'at' hh:mm tt 'UTC'
    RegRead priceUpdateTotalTime, HKCU, Software\Softy Relic Bot, priceUpdateTotalTime
    GuiControl, main_interface:, priceUpdateDateTime, Last check: %priceUpdateDateTime%
    GuiControl, main_interface:, priceUpdateTotalTime, Update duration: %priceUpdateTotalTime%s
    return

updatePriceDB:
    if !primesPricesUpdater
        return
    if (updateDay == currentDay)
    {
        msgbox,4,, This process might take upto 15 minutes but will run in the background. Would you like to continue?
        IfMsgBox, No
            return
    }
    apiUpdating := 1
    GuiControl, main_interface:, priceText , updating...
    time_taken := A_TickCount
    fetchItemsList()
    RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, updatePriceThread1, 0
    RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, updatePriceThread2, 0
    RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, updatePriceThread3, 0
    Run, WFM Api - thread 1.ahk
    Run, WFM Api - thread 2.ahk
    Run, WFM Api - thread 3.ahk
    loop
    {
        sleep 500
        RegRead updateStatus, HKCU, Software\Softy Relic Bot, updateStatus
        GuiControl, main_interface:, priceText , %updateStatus%
        RegRead updatePriceThread1, HKCU, Software\Softy Relic Bot, updatePriceThread1
        RegRead updatePriceThread2, HKCU, Software\Softy Relic Bot, updatePriceThread2
        RegRead updatePriceThread3, HKCU, Software\Softy Relic Bot, updatePriceThread3
        if (updatePriceThread1==1 AND updatePriceThread2==1 AND updatePriceThread3==1)
            break
    }
    priceUpdateTotalTime := (A_TickCount-time_taken)/1000
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, priceUpdateTotalTime, %priceUpdateTotalTime%		;updating registry
	RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, priceUpdateDateTime, %A_NowUTC%		;updating registry
    ;combining primes DB
    FileRead, pricesDB1, pricesDBMT1.json
    FileRead, pricesDB2, pricesDBMT2.json
    FileRead, pricesDB3, pricesDBMT3.json
    pricesDB1 := SubStr(pricesDB1, 1, -1)                       ;removing ending brace
    pricesDB2 := SubStr(pricesDB2, 2, -1)                       ;removing starting and ending brace
    pricesDB3 := SubStr(pricesDB3, 2, StrLen(pricesDB3))        ;removing starting
    string := pricesDB1 . "," . pricesDB2  . "," . pricesDB3
    file := FileOpen("pricesDB.json", "w")
    if !IsObject(file)
    {
        MsgBox % "Can't open file for writing in script " A_ScriptName " at line " A_LineNumber
        return
    }
    file.write(string)
    file.close()
    ;combining relics DB
    FileRead, relicsDB1, relicsDB1.json
    FileRead, relicsDB2, relicsDB2.json
    FileRead, relicsDB3, relicsDB3.json
    relicsDB1 := SubStr(relicsDB1, 1, -1)                       ;removing ending brace
    relicsDB2 := SubStr(relicsDB2, 2, -1)                       ;removing starting and ending brace
    relicsDB3 := SubStr(relicsDB3, 2, StrLen(relicsDB3))        ;removing starting
    string := relicsDB1 . "," . relicsDB2  . "," . relicsDB3
    file := FileOpen("relicsDB.json", "w")
    if !IsObject(file)
    {
        MsgBox % "Can't open file for writing in script " A_ScriptName " at line " A_LineNumber
        return
    }
    file.write(string)
    file.close()
    ;combining mods DB
    FileRead, modsDB1, modsDB1.json
    FileRead, modsDB2, modsDB2.json
    FileRead, modsDB3, modsDB3.json
    modsDB1 := SubStr(modsDB1, 1, -1)                       ;removing ending brace
    modsDB2 := SubStr(modsDB2, 2, -1)                       ;removing starting and ending brace
    modsDB3 := SubStr(modsDB3, 2, StrLen(modsDB3))        ;removing starting
    string := modsDB1 . "," . modsDB2  . "," . modsDB3
    file := FileOpen("modsDB.json", "w")
    if !IsObject(file)
    {
        MsgBox % "Can't open file for writing in script " A_ScriptName " at line " A_LineNumber
        return
    }
    file.write(string)
    file.close()
    ;----
    gosub updatePrice
    gosub discordPost
    RegRead updateDay, HKCU, Software\Softy Relic Bot, priceUpdateDateTime
    FormatTime, updateDay, %updateDay%, dd
    apiUpdating := 0
    ;updating ducat parts right after
    SetTimer, ducatPartsUpdate, 300000
    gosub ducatPartsUpdate
    return

discordPost:
    threeApos := "``"
    priceListArr := []
    priceContentSorted := StrSplit(priceContentSorted, "`r`n")
    i := 1
    j := 1
    loop
    {
        loop
        {
            if (j>priceContentSorted.MaxIndex())
                break
            if (StrLen(priceListArr[i] . priceContentSorted[j]) > 1980)
            {
                priceListArr[i] := SubStr(priceListArr[i], 1, StrLen(priceListArr[i])-2)                ;removing trailing newline
                break
            }
            priceListArr[i] := priceListArr[i] . priceContentSorted[j] . "`r`n"
            j++
        }
        if (j>priceContentSorted.MaxIndex())
        {
            priceListArr[i] := SubStr(priceListArr[i], 1, StrLen(priceListArr[i])-2)                ;removing trailing newline
            break
        }
        i++
    }
    ducatListArr := []
    ducatsContentSorted := StrSplit(ducatsContentSorted, "`r`n")
    i := 1
    j := 1
    loop
    {
        loop
        {
            if (j>ducatsContentSorted.MaxIndex())
                break
            if (StrLen(ducatListArr[i] . ducatsContentSorted[j]) > 1000)
            {
                ducatListArr[i] := SubStr(ducatListArr[i], 1, StrLen(ducatListArr[i])-2)                ;removing trailing newline
                break
            }
            ducatListArr[i] := ducatListArr[i] . ducatsContentSorted[j] . "`r`n"
            j++
        }
        if (j>ducatsContentSorted.MaxIndex())
        {
            ducatListArr[i] := SubStr(ducatListArr[i], 1, StrLen(ducatListArr[i])-2)                ;removing trailing newline
            break
        }
        i++
    }
    relicListArr := []
    fullRelicListSorted := StrSplit(fullRelicListSorted, "`r`n")
    i := 1
    j := 1
    loop
    {
        loop
        {
            if (j>fullRelicListSorted.MaxIndex())
                break
            if (StrLen(relicListArr[i] . fullRelicListSorted[j]) > 1980)
            {
                relicListArr[i] := SubStr(relicListArr[i], 1, StrLen(relicListArr[i])-2)                ;removing trailing newline
                break
            }
            relicListArr[i] := relicListArr[i] . fullRelicListSorted[j] . "`r`n"
            j++
        }
        if (j>fullRelicListSorted.MaxIndex())
        {
            relicListArr[i] := SubStr(relicListArr[i], 1, StrLen(relicListArr[i])-2)                ;removing trailing newline
            break
        }
        i++
    }
    modsListArr := []
    fullModsListSorted := StrSplit(fullModsListSorted, "`r`n")
    i := 1
    j := 1
    loop
    {
        loop
        {
            if (j>fullModsListSorted.MaxIndex())
                break
            if (StrLen(modsListArr[i] . fullModsListSorted[j]) > 1980)
            {
                modsListArr[i] := SubStr(modsListArr[i], 1, StrLen(modsListArr[i])-2)                ;removing trailing newline
                break
            }
            modsListArr[i] := modsListArr[i] . fullModsListSorted[j] . "`r`n"
            j++
        }
        if (j>fullModsListSorted.MaxIndex())
        {
            modsListArr[i] := SubStr(modsListArr[i], 1, StrLen(modsListArr[i])-2)                ;removing trailing newline
            break
        }
        i++
    }
    loop % ducatListArr.MaxIndex()
    {
        ducatListArr[A_index] := StrSplit(ducatListArr[A_index], "`r`n")
        if (A_index==500)
            msgbox stuck in a loop
    }
    loop % ducatListArr.MaxIndex()
    {
        ducatListArrIndex := A_index
        loop % ducatListArr[ducatListArrIndex].MaxIndex()
        {
            ducatListArr[ducatListArrIndex][A_Index] := StrSplit(ducatListArr[ducatListArrIndex][A_Index], A_tab)
        }
        if (A_index==500)
            msgbox stuck in a loop
    }
	WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    ;----posting good prices to relic stocks server----
	postdata=
	(
		{
  			"content": "``````\nBelow is a list of all prime items equal to or above the given threshold. Their prices are calcuated from WFM based on the sell orders in past 24 hours. The list will be edited on daily basis. For any concerns, contact MrSofty#7926\n----------\nLast check: %priceUpdateDateTime%\n``````"
		}
	)
    messageIdStartIndex := 100
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    regStatus := ErrorLevel
    mainLoopIndex := -1         ;will not edit rest of webhook ids
    loopEndingIndex := 0        ;will not edit rest of webhook ids
    sendDiscordMessage("https://discord.com/api/webhooks/851461876016611348/qgbNjuUKUJhi0I96xhLqv9-ySh_iVyMfehU3XGMP0Wlp0rfoKb6YqzPNRGal0p5IpdEF", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    loop % priceListArr.MaxIndex()
    {
        mainLoopIndex := A_index
        string := priceListArr[A_index]
        string := StrReplace(string, "`r`n", "\n")
        loop
        {
            if InStr(string, A_tab)
                string := StrReplace(string, A_tab, "\t")
            else
                break
        }
	    postdata=
	    (
		    {
  			"content": "%threeApos%%string%%threeApos%"
		    }
	    )
        messageIdStartIndex := mainLoopIndex + 100
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        regStatus := ErrorLevel
        loopEndingIndex := priceListArr.MaxIndex()
        sendDiscordMessage("https://discord.com/api/webhooks/851461876016611348/qgbNjuUKUJhi0I96xhLqv9-ySh_iVyMfehU3XGMP0Wlp0rfoKb6YqzPNRGal0p5IpdEF", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    }
    ;sorting parts full list
    primeParts := StrSplit(primeParts, "`r`n")
    loop % primeParts.MaxIndex()
    {
        pos := InStr(primeParts[A_index], A_tab)
        lineIndex := A_index
        if pos<50
        {
            loop
            {
                if InStr(primeParts[lineIndex], A_tab) == 41
                    break
                primeParts[lineIndex] := StrReplace(primeParts[lineIndex], "$" , "$ ",,1)
            }
        }
        if (A_index==500)
            msgbox stuck in a loop
    }
    loop % primeParts.MaxIndex()
    {
        pos := InStr(primeParts[A_index], A_tab . "D")
        lineIndex := A_index
        if pos<60
        {
            loop
            {
                if InStr(primeParts[lineIndex], A_tab . "D") == 60
                    break
                primeParts[lineIndex] := StrReplace(primeParts[lineIndex], A_tab . "D" , A_space . A_tab . "D",,1)
            }
        }
        if (A_index==500)
            msgbox stuck in a loop
    }
    partsFullContentSorted := ""
    loop % primeParts.MaxIndex()
    {
        partsFullContentSorted := partsFullContentSorted . primeParts[A_index] . "`r`n"
        if (A_index==500)
            msgbox stuck in a loop
    }
    partsFullContentSorted := StrReplace(partsFullContentSorted, "$", "")
    partsFullContentSorted := "Prime parts:`r`n" . partsFullContentSorted
    ;sorting sets full list
    primeSets := StrSplit(primeSets, "`r`n")
    loop % primeSets.MaxIndex()
    {
        pos := InStr(primeSets[A_index], A_tab)
        lineIndex := A_index
        if pos<50
        {
            loop
            {
                if InStr(primeSets[lineIndex], A_tab) == 35
                    break
                primeSets[lineIndex] := StrReplace(primeSets[lineIndex], "$" , "$ ",,1)
            }
        if (A_index==500)
            msgbox stuck in a loop
        }
        if (A_index==500)
            msgbox stuck in a loop
    }
    setsFullContentSorted := ""
    loop % primeSets.MaxIndex()
    {
        setsFullContentSorted := setsFullContentSorted . primeSets[A_index] . "`r`n"
        if (A_index==500)
            msgbox stuck in a loop
    }
    setsFullContentSorted := SubStr(setsFullContentSorted, 1, StrLen(setsFullContentSorted)-2)      ;removing trailing newline
    setsFullContentSorted := StrReplace(setsFullContentSorted, "$", "")
    setsFullContentSorted := "Prime sets:`r`n" . setsFullContentSorted
    priceFullContentSorted := partsFullContentSorted . "`r`n" . setsFullContentSorted
    
    fullListArr := []
    priceFullContentSorted := StrSplit(priceFullContentSorted, "`r`n")
    i := 1
    j := 1
    loop
    {
        loop
        {
            if (j>priceFullContentSorted.MaxIndex())
                break
            if (StrLen(fullListArr[i] . priceFullContentSorted[j]) > 1980)
            {
                fullListArr[i] := SubStr(fullListArr[i], 1, StrLen(fullListArr[i])-2)                ;removing trailing newline
                break
            }
            fullListArr[i] := fullListArr[i] . priceFullContentSorted[j] . "`r`n"
            j++
        }
        if (j>priceFullContentSorted.MaxIndex())
        {
            fullListArr[i] := SubStr(fullListArr[i], 1, StrLen(fullListArr[i])-2)                ;removing trailing newline
            break
        }
        i++
    }
    /*
    fullListArr := []
    loop
    {
        startPos := 1
        endPos := 1700
        endPos := InStr(priceFullContentSorted, "`r`n",, endPos)-1
        if (priceFullContentSorted=="")
            break
        fullListArr[A_Index] := SubStr(priceFullContentSorted, startPos, endPos)
        priceFullContentSorted := StrReplace(priceFullContentSorted, fullListArr[A_Index], "")
        if (InStr(priceFullContentSorted, "`r`n") < 10 )
            priceFullContentSorted := StrReplace(priceFullContentSorted, "`r`n", "",, 1)
        if (A_index==500)
            msgbox stuck in a loop
    }
    */
    ;----------
    ;----posting full list----
	postdata=
	(
		{
  			"content": "%threeApos%----------\nBelow is the full price list of all prime items in the game. Their prices are calcuated from WFM based on the sell orders in past 24 hours. The list will be edited on daily basis. For any concerns, contact MrSofty#7926\n----------\nLast check: %priceUpdateDateTime%\n----------\n%threeApos%"
		}
	)
    ;----relic stocks----
    messageIdStartIndex := 200
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    regStatus := ErrorLevel
    mainLoopIndex := -1         ;will not edit rest of webhook ids
    loopEndingIndex := 0        ;will not edit rest of webhook ids
    sendDiscordMessage("https://discord.com/api/webhooks/851453670133727242/s5TADpV3dldbS5chP0bD1NGnW7T4YK_IODVeErpSkuEO6uIgFJZIDs67iPFbKE0k2ngk", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    ;----blossoms of the void----
    messageIdStartIndex := 300
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    regStatus := ErrorLevel
    mainLoopIndex := -1         ;will not edit rest of webhook ids
    loopEndingIndex := 0        ;will not edit rest of webhook ids
    sendDiscordMessage("https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    ;--------------------
    loop % fullListArr.MaxIndex()
    {
        mainLoopIndex := A_index
        string := fullListArr[A_index]
        string := StrReplace(string, "`r`n", "\n")
        string := StrReplace(string, "`r", "")
        string := StrReplace(string, "`n", "")
        loop
        {
            if InStr(string, A_tab)
                string := StrReplace(string, A_tab, "\t")
            else
                break
        }
	    postdata=
	    (
		    {
  			"content": "%threeApos%%string%%threeApos%"
		    }
	    )
        ;----relic stocks----
        messageIdStartIndex := mainLoopIndex + 200
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        regStatus := ErrorLevel
        loopEndingIndex := fullListArr.MaxIndex()
        sendDiscordMessage("https://discord.com/api/webhooks/851453670133727242/s5TADpV3dldbS5chP0bD1NGnW7T4YK_IODVeErpSkuEO6uIgFJZIDs67iPFbKE0k2ngk", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
        ;----blossoms of the void----
        messageIdStartIndex := mainLoopIndex + 300
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        regStatus := ErrorLevel
        loopEndingIndex := fullListArr.MaxIndex()
        sendDiscordMessage("https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    }
    ;------------
    ;sending ducat parts
    ducatListPartNames := ""
    ducatListPartPrices := ""
    ducatListPartDucats := ""
    ;----discord message array----
    postdata := {}
    postdata.content := ""
    postdata.embeds := {}
    postdata.embeds.push({fields: {}})
    ;-----------------------------
    loop
    {
        arrayIndex := A_index
        ducatListPartNames := ""
        ducatListPartPrices := ""
        ducatListPartDucats := ""
        loop % ducatListArr[arrayIndex].MaxIndex()
        {
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "$", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "ducats:", "")
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "`r`n", "")
            ducatListArr[arrayIndex][A_index][2] := StrReplace(ducatListArr[arrayIndex][A_index][2], "`r`n", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "`r`n", "")
            ducatListPartNames := ducatListPartNames . ducatListArr[arrayIndex][A_index][1] . "`n"
            ducatListPartPrices := ducatListPartPrices . ducatListArr[arrayIndex][A_index][2] . "`n"
            ducatListPartDucats := ducatListPartDucats . ducatListArr[arrayIndex][A_index][3] . "`n"
            if (A_index==500)
                msgbox stuck in a Loop
        }
        if (ducatListPartNames == "")
            break
        if (arrayIndex==1)
            postdata.embeds[1].fields.push({name: "Prime Part", value: ducatListPartNames, inline: "true"}, {name: "Price", value: ducatListPartPrices, inline: "true"}, {name: "Ducats", value: ducatListPartDucats, inline: "true"})
        else
            postdata.embeds[1].fields.push({name: "\u200b", value: ducatListPartNames, inline: "true"}, {name: "\u200b", value: ducatListPartPrices, inline: "true"}, {name: "\u200b", value: ducatListPartDucats, inline: "true"})
    }
    FormatTime, currentTimeFormatted, %A_NowUTC%, yyyy-MM-ddTHH:mm:ss.000Z
    postdata.embeds[1].timestamp := currentTimeFormatted
    postdata := StrReplace(JSON.Dump(postdata), "\\u", "\u")
    ;----relic stocks----
    messageIdStartIndex := 2000
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    regStatus := ErrorLevel
    mainLoopIndex := -1         ;will not edit rest of webhook ids
    loopEndingIndex := 0        ;will not edit rest of webhook ids
    sendDiscordMessage("https://discord.com/api/webhooks/851462538553983006/gMm_nWRtA-mCDZiwRvke8ay8mupnF6qhv_v3omyssq4cbfrtKpyoUXiAbSfIHxieoPyA", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    ;----blossoms of the void----
    messageIdStartIndex := 3000
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    regStatus := ErrorLevel
    mainLoopIndex := -1         ;will not edit rest of webhook ids
    loopEndingIndex := 0        ;will not edit rest of webhook ids
    sendDiscordMessage("https://discord.com/api/webhooks/863745862798540820/ygIlsGnta1_0YVQXlxIfQToopYM5i_hNSZKUWkClGP9B-6w2h9WxemF_JLMU-bIackoF", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    ;----posting relic list----
	postdata=
	(
		{
  			"content": "%threeApos%%threeApos%%threeApos%----------\nRelic prices are listed below. These prices might not be accurate due to low relic sales and fluctuate from time to time. But you get an idea for a specific relic. If no sell orders in past 90 days, it will be marked N/A.\nAdditionally, the relics have symbols next to them for more info. These are described below:\n(V) Vaulted Relic\n(B) Baro ki'teer Exclusive Relic\n(P) Prime unvault Relic\n(E) Next vault expected Relic\n----------\n%threeApos%%threeApos%%threeApos%"
		}
	)
    ;----relic stocks----
    messageIdStartIndex := 400
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    regStatus := ErrorLevel
    mainLoopIndex := -1         ;will not edit rest of webhook ids
    loopEndingIndex := 0        ;will not edit rest of webhook ids
    sendDiscordMessage("https://discord.com/api/webhooks/851387436101795851/UQ58dKyjJH5dBc2g3BeJdcn6Qk3eEzopdCBP96Tp0UkBq9VIdGGpX2K8FaWlTFhmMo4E", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    ;----blossoms of the void----
    messageIdStartIndex := 500
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    regStatus := ErrorLevel
    mainLoopIndex := -1         ;will not edit rest of webhook ids
    loopEndingIndex := 0        ;will not edit rest of webhook ids
    sendDiscordMessage("https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    ;----
    loop % relicListArr.MaxIndex()
    {
        mainLoopIndex := A_index
        string := relicListArr[A_index]
        string := StrReplace(string, "`r`n", "\n")
        string := StrReplace(string, "`r", "")
        string := StrReplace(string, "`n", "")
        loop
        {
            if InStr(string, A_tab)
                string := StrReplace(string, A_tab, "\t")
            else
                break
        }
	    postdata=
	    (
		    {
  			"content": "%threeApos%%string%%threeApos%"
		    }
	    )
        ;----relic stocks----
        messageIdStartIndex := mainLoopIndex + 400
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        regStatus := ErrorLevel
        loopEndingIndex := relicListArr.MaxIndex()
        sendDiscordMessage("https://discord.com/api/webhooks/851387436101795851/UQ58dKyjJH5dBc2g3BeJdcn6Qk3eEzopdCBP96Tp0UkBq9VIdGGpX2K8FaWlTFhmMo4E", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
        ;----blossoms of the void----
        messageIdStartIndex := mainLoopIndex + 500
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        regStatus := ErrorLevel
        loopEndingIndex := relicListArr.MaxIndex()
        sendDiscordMessage("https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    }
    ;----posting mods list----
	postdata=
	(
		{
  			"content": "``````Primed Mods are listed below. If no sell orders in past 90 days, it will be marked N/A.``````\n``Mod                             Unranked      Max Ranked``"
		}
	)
    ;----relic stocks----
    messageIdStartIndex := 600
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    regStatus := ErrorLevel
    mainLoopIndex := -1         ;will not edit rest of webhook ids
    loopEndingIndex := 0        ;will not edit rest of webhook ids
    sendDiscordMessage("https://discord.com/api/webhooks/851387436101795851/UQ58dKyjJH5dBc2g3BeJdcn6Qk3eEzopdCBP96Tp0UkBq9VIdGGpX2K8FaWlTFhmMo4E", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    ;----blossoms of the void----
    messageIdStartIndex := 700
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    regStatus := ErrorLevel
    mainLoopIndex := -1         ;will not edit rest of webhook ids
    loopEndingIndex := 0        ;will not edit rest of webhook ids
    sendDiscordMessage("https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    ;----
    loop % modsListArr.MaxIndex()
    {
        mainLoopIndex := A_index
        string := modsListArr[A_index]
        string := StrReplace(string, "`r`n", "\n")
        string := StrReplace(string, "`r", "")
        string := StrReplace(string, "`n", "")
        loop
        {
            if InStr(string, A_tab)
                string := StrReplace(string, A_tab, "\t")
            else
                break
        }
	    postdata=
	    (
		    {
  			"content": "``%string%``"
		    }
	    )
        ;----relic stocks----
        messageIdStartIndex := mainLoopIndex + 600
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        regStatus := ErrorLevel
        loopEndingIndex := modsListArr.MaxIndex()
        sendDiscordMessage("https://discord.com/api/webhooks/851387436101795851/UQ58dKyjJH5dBc2g3BeJdcn6Qk3eEzopdCBP96Tp0UkBq9VIdGGpX2K8FaWlTFhmMo4E", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
        ;----blossoms of the void----
        messageIdStartIndex := mainLoopIndex + 700
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        regStatus := ErrorLevel
        loopEndingIndex := modsListArr.MaxIndex()
        sendDiscordMessage("https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    }
    return

totalRelics:
    count := 0
    loop % relicsArr.MaxIndex()
    {
        count += relicsArr[A_index].quantity
    }
    GuiControl, main_interface:, totalRelics , Total Relics:  %count%
    return

offcycleRelics:
    Gui, offcycle_relic_interface:New,, Offcycle Relics
    FileRead, offcycleRelics, relicsDB.json
    offcycleRelics := JSON.Load(offcycleRelics)
    offcycleRelicList := ""
    loop % offcycleRelics.MaxIndex()
    {
        relicIndex := A_index
        if (offcycleRelics[relicIndex].vault_status!="")
            continue
        relicName := offcycleRelics[relicIndex].item_url
        relicName := StrReplace(relicName, "_relic", "")
        loop, 26
	    {
		    if (SubStr(relicName, 1, 1) == chr(A_Index + 96))
			    relicName := StrReplace(relicName, chr(A_Index + 96), chr(A_Index + 64),, 1)
            relicName := StrReplace(relicName, "_"chr(A_Index + 96), "_"chr(A_Index + 64),, 1)
	    }
        relicName := StrReplace(relicName, "_", " ")
        offcycleRelicList := offcycleRelicList . relicName . "`r`n"
    }
    ;sorting the relics
    offcycleRelicListSorted := ""
    Sort, offcycleRelicList
    offcycleRelicList := StrSplit(offcycleRelicList, "`r`n")
    offcycleRelicListSorted := offcycleRelicListSorted . "Lith - "
    loop % offcycleRelicList.MaxIndex()-1
    {
        relicIndex := A_index
        relicName := offcycleRelicList[relicIndex]
        if InStr(relicName, "Lith")
        {
            relicName := StrReplace(relicName, "Lith", "")
            offcycleRelicListSorted := offcycleRelicListSorted . relicName . "/"
        }
    }
    offcycleRelicListSorted := SubStr(offcycleRelicListSorted, 1, -1)
    offcycleRelicListSorted := offcycleRelicListSorted . "`r`n"
    offcycleRelicListSorted := offcycleRelicListSorted . "Meso - "
    loop % offcycleRelicList.MaxIndex()-1
    {
        relicIndex := A_index
        relicName := offcycleRelicList[relicIndex]
        if InStr(relicName, "Meso")
        {
            relicName := StrReplace(relicName, "Meso", "")
            offcycleRelicListSorted := offcycleRelicListSorted . relicName . "/"
        }
    }
    offcycleRelicListSorted := SubStr(offcycleRelicListSorted, 1, -1)
    offcycleRelicListSorted := offcycleRelicListSorted . "`r`n"
    offcycleRelicListSorted := offcycleRelicListSorted . "Neo - "
    loop % offcycleRelicList.MaxIndex()-1
    {
        relicIndex := A_index
        relicName := offcycleRelicList[relicIndex]
        if InStr(relicName, "Neo")
        {
            relicName := StrReplace(relicName, "Neo", "")
            offcycleRelicListSorted := offcycleRelicListSorted . relicName . "/"
        }
    }
    offcycleRelicListSorted := SubStr(offcycleRelicListSorted, 1, -1)
    offcycleRelicListSorted := offcycleRelicListSorted . "`r`n"
    offcycleRelicListSorted := offcycleRelicListSorted . "Axi - "
    loop % offcycleRelicList.MaxIndex()-1
    {
        relicIndex := A_index
        relicName := offcycleRelicList[relicIndex]
        if InStr(relicName, "Axi")
        {
            relicName := StrReplace(relicName, "Axi", "")
            offcycleRelicListSorted := offcycleRelicListSorted . relicName . "/"
        }
    }
    offcycleRelicListSorted := SubStr(offcycleRelicListSorted, 1, -1)
    Gui, offcycle_relic_interface:Add, Text,w250, %offcycleRelicListSorted%
    Gui, offcycle_relic_interface:Show
    return

ButtonShowOk:
    Gui, ShowAll:Destroy
    return

ShowAllGuiClose:
    Gui, ShowAll:Destroy
    return

enableEditing:
    GuiControlGet, enableEditing
    return

buySpamMode:
    GuiControlGet, buySpamMode
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, buySpamMode, %buySpamMode%
    return

enableMacro:
    GuiControlGet, enableMacro
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, enableMacro, %enableMacro%
    return

4Cycles:
    GuiControlGet, 4Cycles
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, 4Cycles, %4Cycles%
    gosub updateHost
    return

tierCheck:
    GuiControlGet, lithCheck
    GuiControlGet, mesoCheck
    GuiControlGet, neoCheck
    GuiControlGet, axiCheck
    gosub updateHost
    return

;----timer labels-----
checkForPriceUpdate:
    FormatTime, currentDay, %A_NowUTC%, dd
    if (updateDay != currentDay)
    {
        gosub updatePriceDB
    }
    return

copyPasteWait:
    KeyWait, Ctrl, D T5
    if ErrorLevel
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Spam timed out. Try again, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        ;msgbox,,, Spam timed out. Try again, 1
        return
    }
    KeyWait, v, D T5
    if ErrorLevel
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Spam timed out. Try again, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        ;msgbox,,, Spam timed out. Try again, 1
        return
    }
    KeyWait, enter, D T5
    if ErrorLevel
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Spam timed out. Try again, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        ;msgbox,,, Spam timed out. Try again, 1
        return
    }
    SetTimer, buySpamMessage, -120000
    return

buySpamMessage:
    loop
    {
        mousegetpos, x, y
        tooltip, Ready to send another message in trade chat, (x + 20), (y + 20), 1
        if (A_index==50)
        {   
            tooltip 
            break
        }
        sleep 20
    }
    ;msgbox,,, Ready to send another message in trade chat, 1
    if !sentViaMacro
        gosub buyCopy
    else
    {
        sentViaMacro := 0
        if !GetKeyState("W")    ; If W is not down (when in a mission)
            msgbox,,, Trade message ready, 0.5
    }
    return

ducatPartsUpdate:       ;will be executed every 5 minutes
    if apiUpdating
        return
    RegRead ducatUpdater, HKCU, Software\Softy Relic Bot, ducatUpdater
    if !ducatUpdater
       return
    FileRead, ducatPartsNames, ducatPrimeParts.dat
    ducatPartsNames := SubStr(ducatPartsNames, 1, StrLen(ducatPartsNames)-2)
    ducatPartsNames := StrSplit(ducatPartsNames, "`r`n")
    file_name := "100ducatSellersInfo.json"
    ;FileDelete, %file_name%
    ;----indicating start of file----
    file := FileOpen(file_name, "w")
    file.write("{")
    file.close
    ;--------------------------------
    loop % ducatPartsNames.MaxIndex()
    {
        estimatedTick := A_TickCount + 5000
        loop
        {
            if ((A_TickCount - estimatedTick) >= 0)
                break
        }
        status := srbFunctions.getOrder(ducatPartsNames[A_index],file_name)
        if (status != 0)
            continue
        ;----adding comma before next order----
        if (A_index != ducatPartsNames.MaxIndex())
        {
            file := FileOpen(file_name, "a")
            file.write(",")
            file.close
        }
    }
    ;----indicating end of file------
    file := FileOpen(file_name, "a")
    file.write("}")
    file.close
    ;--------------------------------
    ;----posting on discord----
    FileRead, ducatSellersInfo, 100ducatSellersInfo.json
    try 
    {
        ducatSellersInfo := JSON.Load(ducatSellersInfo)
    }
    catch e
    {
        msgbox,,, % e.message "`nError at line " e.line,5
        file := FileOpen("ducatErrorLog.json", "w")
        file.write(ducatSellersInfo)
        file.close
        return
    }
    FileRead, ducatPartsNames, ducatPrimeParts.dat
    ducatPartsNames := SubStr(ducatPartsNames, 1, StrLen(ducatPartsNames)-2)
    ducatPartsNames := StrSplit(ducatPartsNames, "`r`n")
    fullDucatSellersArr := []
    i := 1
    j := 1
    loop
    {
        mainLoopIndex := A_index
        postdata := {}
        postdata.content := ""
        postdata.embeds := {}
        k := 1
        Loop
        {
            if (j > ducatPartsNames.MaxIndex())
                break
            if (k>10)
                break
            item_Url := ducatPartsNames[j]
            sellerNames := ""
            partQuantity := ""
            partPrice := ""
            loop % ducatSellersInfo[item_Url].MaxIndex()
            {
                if ((ducatSellersInfo[item_Url][A_index].quantity >= 2 && ducatSellersInfo[item_Url][A_index].price <= 15) || (ducatSellersInfo[item_Url][A_index].quantity >= 1 && ducatSellersInfo[item_Url][A_index].price <= 12))
                {
                    ;fullDucatSellersArr[i] := ducatSellersInfo[item_Url][A_index].seller
                    ;i++
                    fullDucatSellersArr.push(ducatSellersInfo[item_Url][A_index].seller)
                    sellerNames := sellerNames . ducatSellersInfo[item_Url][A_index].seller . "`n"
                    partQuantity := partQuantity . ducatSellersInfo[item_Url][A_index].quantity . "`n"
                    partPrice := partPrice . ducatSellersInfo[item_Url][A_index].price . "`n"
                }
            }
            if InStr(sellerNames, "_")
                sellerNames := StrReplace(sellerNames, "_", "\_")
            if (sellerNames != "")      ;adding a new field in discord embed
            {
                ;postdata := postdata . "{""name"": ""Seller"",""value"": """ sellerNames """,""inline"": ""true""},"
                ;postdata := postdata . "{""name"": ""Quantity"",""value"": """ partQuantity """,""inline"": ""true""},"
                ;postdata := postdata . "{""name"": ""Price"",""value"": """ partPrice """,""inline"": ""true""}],"
                ;----
                partName := StrReplace(item_Url, "_", " ")
                ;capitalizing first letters
                loop, 26
                {
                    if (SubStr(partName, 1, 1) == chr(A_Index + 96))
                        partName := StrReplace(partName, chr(A_Index + 96), chr(A_Index + 64),, 1)
                    partName := StrReplace(partName, " "chr(A_Index + 96), " "chr(A_Index + 64),, 1)
                }
                ;----
                ;postdata := postdata . """title"": """ partName ""","
                FormatTime, currentTimeFormatted, %A_NowUTC%, yyyy-MM-ddTHH:mm:ss.000Z
                ;postdata := postdata . """timestamp"": """ A_YYYY "-" A_MM "-" A_DD "T" (A_Hour-5) ":" A_Min ":" A_Sec ".000Z" ""","
                ;postdata := postdata . """timestamp"": """ currentTimeFormatted ""","
                ;postdata := postdata . """url"": ""https://warframe.market/items/" item_Url """}]}"
                postdata.embeds.push({"title": partName,"timestamp": currentTimeFormatted,"url": "https://warframe.market/items/" item_Url,"fields": [{"name": "Seller","value": sellerNames,"inline": "true"},{"name": "Quantity","value": partQuantity,"inline": "true"},{"name": "Price","value": partPrice,"inline": "true"}]})
                k++
            }
            j++
            ;else
            ;    postdata := "{""content"": ""--"",""embeds"": """"}"
        }
        ;clipboard := JSON.Dump(postdata)
            
        ;FileDelete, discordMessage.json
        ;file := FileOpen("discordMessage.json", "w")
        ;file.Write(postdata)
        ;file.close()
        ;clearing previous embeds
        ;---posting on relic stocks---
        messageIdStartIndex := mainLoopIndex + 2000
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        regStatus := ErrorLevel
        if (j > ducatPartsNames.MaxIndex())
            loopEndingIndex := mainLoopIndex
        else
            loopEndingIndex := -1
        sendDiscordMessage("https://discord.com/api/webhooks/851462538553983006/gMm_nWRtA-mCDZiwRvke8ay8mupnF6qhv_v3omyssq4cbfrtKpyoUXiAbSfIHxieoPyA", JSON.Dump(postdata), regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
        ;---posting on blossoms of the void---
        messageIdStartIndex := mainLoopIndex + 3000
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        regStatus := ErrorLevel
        if (j > ducatPartsNames.MaxIndex())
            loopEndingIndex := mainLoopIndex
        else
            loopEndingIndex := -1
        sendDiscordMessage("https://discord.com/api/webhooks/863745862798540820/ygIlsGnta1_0YVQXlxIfQToopYM5i_hNSZKUWkClGP9B-6w2h9WxemF_JLMU-bIackoF", JSON.Dump(postdata), regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
        if (j > ducatPartsNames.MaxIndex())
            break
        estimatedTick := A_TickCount + 2000
        loop
        {
            if ((A_TickCount - estimatedTick) >= 0)
                break
        }
    }
    allSellersArr := []
    i := 1
    names := ""
    loop % fullDucatSellersArr.MaxIndex()
    {
        if !(InStr(names, fullDucatSellersArr[A_index]))
        {
            allSellersArr[i] := fullDucatSellersArr[A_index]
            i++
        }
        names := names . fullDucatSellersArr[A_index] . "`r`n"
    }
    whisperListArr := []
    mention_role_1_stack := []
    mention_role_2_stack := []
    FileRead, mention_role_1_stack, % A_ScriptDir "\Cache\mention_role_1_stack.json"
    mention_role_1_stack := JSON.Load(mention_role_1_stack)
    FileRead, mention_role_2_stack, % A_ScriptDir "\Cache\mention_role_2_stack.json"
    mention_role_2_stack := JSON.Load(mention_role_2_stack)
    mention_users := 0
    FileRead, ducats_sold_out_stack, % A_ScriptDir "\Cache\ducats_sold_out_stack.json"
    ducats_sold_out_stack := JSON.Load(ducats_sold_out_stack)
    user_mentions := {}
    loop % allSellersArr.MaxIndex()
    {
        loop1Index := A_index
        seller := ""
        total_items := {}
        loop % ducatPartsNames.MaxIndex()
        {
            loop2Index := A_index
            item_Url := ducatPartsNames[loop2Index]
            loop % ducatSellersInfo[item_Url].MaxIndex()
            {
                loop3Index := A_index
                if (ducatSellersInfo[item_Url][loop3Index].seller==allSellersArr[loop1Index])
                {
                    if ((ducatSellersInfo[item_Url][loop3Index].quantity >= 2 && ducatSellersInfo[item_Url][loop3Index].price <= 15) || (ducatSellersInfo[item_Url][loop3Index].quantity >= 1 && ducatSellersInfo[item_Url][loop3Index].price <= 12))
                    {
                        if ((ducatSellersInfo[item_Url][loop3Index].price) < 4)
                            continue
                        ;if !(InStr(whisper, "/w"))
                        ;    whisper := "/w " . ducatSellersInfo[item_Url][loop3Index].seller  . " Hi, WTB"
                        seller := ducatSellersInfo[item_Url][loop3Index].seller
                        ;whisper := whisper . " [" . StrReplace(item_Url, "_", " ") . "]" " x" . ducatSellersInfo[item_Url][loop3Index].quantity . " for " . (ducatSellersInfo[item_Url][loop3Index].quantity)*(ducatSellersInfo[item_Url][loop3Index].price) . "p"
                        total_items.push({"item": StrReplace(item_Url, "_", " "), "price": ducatSellersInfo[item_Url][loop3Index].price, "quantity": ducatSellersInfo[item_Url][loop3Index].quantity})
                        ;if (ducatSellersInfo[item_Url][loop3Index].quantity>1)
                        ;    whisper := whisper " total"
                        ;totalQuantity := totalQuantity + ducatSellersInfo[item_Url][loop3Index].quantity 
                        ;totalPrice := totalPrice + (ducatSellersInfo[item_Url][loop3Index].quantity)*(ducatSellersInfo[item_Url][loop3Index].price)
                    }
                }
            }
        }
        total_items := objectSort(total_items, "price",,false)
        totalQuantity := 0
        totalPrice := 0
        whisper := "/w " seller " Hi, WTB"
        loop % total_items.MaxIndex()
        {
            if (A_index==7)         ; Listing only lowest 6 orders
                break
            if InStr(whisper, total_items[A_index].item)        ; For duplicate entries
                continue
            whisper := whisper " [" total_items[A_index].item . "]" " x" total_items[A_index].quantity " for " total_items[A_index].quantity*total_items[A_index].price "p"
            if (total_items[A_index].quantity>1)
                whisper := whisper " total"
            totalQuantity := totalQuantity + total_items[A_index].quantity 
            totalPrice := totalPrice + total_items[A_index].quantity*total_items[A_index].price
        }
        ;msgbox % whisper "`n" totalQuantity "`n" totalPrice 
        ;continue
        avgPrice := Round(totalPrice/totalQuantity,2)
        if (totalQuantity<2)
            continue
        if (totalQuantity==2 && totalPrice>19)
            continue
        if (totalQuantity==3 && totalPrice>30)
            continue
        if (avgPrice<4)
            continue
        mentioned_role := ""
        colorSymbol := "``````\n"
        if (totalQuantity>=6 && avgPrice<=10)
        {
            FileRead, presence_list, Presence Updates\presence_updates.json
            presence_list := JSON.Load(presence_list)
            FileRead, dnd_filter, Presence Updates\dnd_filter.json
            FileRead, invis_filter, Presence Updates\invis_filter.json
            loop % presence_list.members.MaxIndex()
            {
                if InStr(JSON.Dump(presence_list.members[A_index].roles), "874077155083026473")
                {
                    user_id := presence_list.members[A_index].user.id
                    hasFound := 0
                    loop % presence_list.presences.MaxIndex()
                    {
                        if (presence_list.presences[A_index].user.id == user_id) && (presence_list.presences[A_index].status == "dnd")
                        {
                            hasFound := 1       ; user is on dnd
                            if InStr(dnd_filter, user_id)
                                if !(InStr(JSON.Dump(user_mentions), user_id))
                                    user_mentions.push("<@" user_id ">") 
                            break
                        }
                        else if (presence_list.presences[A_index].user.id == user_id) && (presence_list.presences[A_index].status == "online")
                        {
                            hasFound := 1       ; user is online
                            if !(InStr(JSON.Dump(user_mentions), user_id))
                                user_mentions.push("<@" user_id ">") 
                            break
                        }
                        else if (presence_list.presences[A_index].user.id == user_id) && (presence_list.presences[A_index].status == "idle")
                        {
                            hasFound := 1       ; user is afk
                            if !(InStr(JSON.Dump(user_mentions), user_id))
                                user_mentions.push("<@" user_id ">") 
                            break
                        }
                    }
                    if !hasFound    ;user is invisible/offline
                    {
                        if InStr(invis_filter, user_id)
                            if !(InStr(JSON.Dump(user_mentions), user_id))
                                user_mentions.push("<@" user_id ">") 
                    }
                }
            }
            mentioned_role := mentioned_role . "<@&874077155083026473> "
            inStack_1 := 0
            ;----check if already in stack
            loop % mention_role_1_stack.MaxIndex()
            {
                if (whisper == mention_role_1_stack[A_index])
                {
                    inStack_1 := 1
                    break
                }
            }
            if !inStack_1
            {
                mention_users := 1
                ;push to the stack
                mention_role_1_stack.Push(whisper)
            }
        }
        if (totalQuantity>=4 && avgPrice<=8)
        {
            FileRead, presence_list, Presence Updates\presence_updates.json
            presence_list := JSON.Load(presence_list)
            FileRead, dnd_filter, Presence Updates\dnd_filter.json
            FileRead, invis_filter, Presence Updates\invis_filter.json
            loop % presence_list.members.MaxIndex()
            {
                if InStr(JSON.Dump(presence_list.members[A_index].roles), "876909210271617074")
                {
                    user_id := presence_list.members[A_index].user.id
                    hasFound := 0
                    loop % presence_list.presences.MaxIndex()
                    {
                        if (presence_list.presences[A_index].user.id == user_id) && (presence_list.presences[A_index].status == "dnd")
                        {
                            hasFound := 1       ; user is on dnd
                            if InStr(dnd_filter, user_id)
                                if !(InStr(JSON.Dump(user_mentions), user_id))
                                    user_mentions.push("<@" user_id ">") 
                            break
                        }
                        else if (presence_list.presences[A_index].user.id == user_id) && (presence_list.presences[A_index].status == "online")
                        {
                            hasFound := 1       ; user is online
                            if !(InStr(JSON.Dump(user_mentions), user_id))
                                user_mentions.push("<@" user_id ">") 
                            break
                        }
                        else if (presence_list.presences[A_index].user.id == user_id) && (presence_list.presences[A_index].status == "idle")
                        {
                            hasFound := 1       ; user is afk
                            if !(InStr(JSON.Dump(user_mentions), user_id))
                                user_mentions.push("<@" user_id ">") 
                            break
                        }
                    }
                    if !hasFound    ;user is invisible/offline
                    {
                        if InStr(invis_filter, user_id)
                            if !(InStr(JSON.Dump(user_mentions), user_id))
                                user_mentions.push("<@" user_id ">") 
                    }
                }
            }
            mentioned_role := mentioned_role . "<@&876909210271617074> "
            inStack_2 := 0
            ;----check if already in stack
            loop % mention_role_2_stack.MaxIndex()
            {
                if (whisper == mention_role_2_stack[A_index])
                {
                    inStack_2 := 1
                    break
                }
            }
            if !inStack_2
            {
                mention_users := 1
                ;push to the stack
                mention_role_2_stack.Push(whisper)
            }
        }
        if (totalQuantity==2)       ;yellow color
            colorSymbol := "``````fix\n"
        else if (totalQuantity==3 && totalPrice<25)       ;cyan color
            colorSymbol := "``````yaml\n"
        else if (totalQuantity>4)       ;cyan color
            colorSymbol := "``````yaml\n"
        else if (totalQuantity==4 && totalPrice<48)       ;cyan color
            colorSymbol := "``````yaml\n"
        whisper := StrReplace(whisper, " blueprint]", "] BP")
        inStack := 0
        searchTerm := whisper . " (warframe.market)"
        loop % ducats_sold_out_stack.MaxIndex()
        {
            if (ducats_sold_out_stack[A_index] = searchTerm)    ;= for case insensitive
            {
                inStack := 1
                break
            }
        }
        if inStack
        {
            colorSymbol := StrReplace(colorSymbol, "``````yaml", "")
            colorSymbol := StrReplace(colorSymbol, "``````fix", "")
            colorSymbol := StrReplace(colorSymbol, "``````", "")
            whisper := mentioned_role "\n" colorSymbol "> ~~" whisper " (warframe.market)~~\n> ~~(Quantity:Price - " totalQuantity . ":" totalPrice ")~~\n> ~~(Price per part - " avgPrice ")~~\n> (Sold out!)\n"
            whisper := StrReplace(whisper, "\n\n>", "\n>")
        }
        else
            whisper := mentioned_role "\n" colorSymbol whisper " (warframe.market)\n(Quantity:Price - " totalQuantity . ":" totalPrice ")\n(Price per part - " avgPrice ")``````"
        whisperListArr.push({whisper: whisper, totalQuantity: totalQuantity, totalPrice: totalPrice, avgPrice: avgPrice})
        ;whisperListArr[whisperIndex] := mentioned_role colorSymbol whisperListArr[whisperIndex] " (warframe.market)\n(Quantity:Price - " totalQuantity . ":" totalPrice ")\n(Price per part - " Round(totalPrice/totalQuantity,2) ")``````"
    }
    whisperListArr := objectSort(whisperListArr, "totalQuantity",,false)
    ;-------Stacks pop ups--------
    loop
    {
        if (mention_role_1_stack.MaxIndex()<=10)
            break
        mention_role_1_stack.removeat(1)
    }
    loop
    {
        if (mention_role_2_stack.MaxIndex()<=10)
            break
        mention_role_2_stack.removeat(1)
    } 
    ;----update mentions stack----
    file_name1 := A_ScriptDir "\Cache\mention_role_1_stack.json"
    file1 := FileOpen(file_name1, "w")
    file1.write(JSON.Dump(mention_role_1_stack))
    file1.close()
    ;----
    file_name2 := A_ScriptDir "\Cache\mention_role_2_stack.json"
    file2 := FileOpen(file_name2, "w")
    file2.write(JSON.Dump(mention_role_2_stack))
    file2.close()
    ;-----------------------------
    whisperIndex := 1
    loop
    {
        mainLoopIndex := A_index
        if (whisperIndex>whisperListArr.MaxIndex())
                break
        postdata := "{""content"": ""``````diff\nWhisper List (Beta)``````"
        loop
        {
            if (whisperIndex>whisperListArr.MaxIndex())
                break
            if (StrLen(postdata . whisperListArr[whisperIndex].whisper) > 1950)
                break
            postdata := postdata whisperListArr[whisperIndex].whisper
            whisperIndex++
        }
        ;postdata := SubStr(postdata, 1, StrLen(postdata)-4)     ;removing trailing newline
        postdata := postdata . """, ""embeds"": """"}"
        ;----posting on relic stocks----
        messageIdStartIndex := mainLoopIndex + 2080
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        regStatus := ErrorLevel
        loopEndingIndex := 0        ;will not edit rest of webhook ids
        sendDiscordMessage("https://discord.com/api/webhooks/851462538553983006/gMm_nWRtA-mCDZiwRvke8ay8mupnF6qhv_v3omyssq4cbfrtKpyoUXiAbSfIHxieoPyA", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
        ;----posting on blossoms of the void----
        messageIdStartIndex := mainLoopIndex + 3080
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        regStatus := ErrorLevel
        loopEndingIndex := 0        ;will not edit rest of webhook ids
        sendDiscordMessage("https://discord.com/api/webhooks/863745862798540820/ygIlsGnta1_0YVQXlxIfQToopYM5i_hNSZKUWkClGP9B-6w2h9WxemF_JLMU-bIackoF", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
        estimatedTick := A_TickCount + 2000
        loop
        {
            if ((A_TickCount - estimatedTick) >= 0)
                break
        }
    }
    /*
    ;----additional message----
	postdata=
	(
		{
  			"content": "``````md\nNotes:\nThis data will be updated every 5 mins\nStill make sure of the edit time for a certain message before pming a seller. During bug fixing or when MrSofty is offline, the data will not be updated\n\nColors & filters:\nIf price per part is less than 4, whipser is filtered out (usually troll orders)\nIf quantity is 1, whisper is filtered out\n<If quantity is 2, it is highlighted yellow>\nIf quantity is 2 but price is greater than 20p, it is filtered out\n[If quantity is equal to 3 but price is lower than 25p, it is highlighted cyan][]\n[If quantity is equal to 4 but price is lower than 48p, it is highlighted cyan][]\n[If quantity is greater than 4, it is highlighted cyan][]\n``````",
            "embeds": ""
        }
	)
    ;relic stocks
    messageIdStartIndex := mainLoopIndex + 2080
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    regStatus := ErrorLevel
    loopEndingIndex := 0        ;will not edit rest of webhook ids
    sendDiscordMessage("https://discord.com/api/webhooks/851462538553983006/gMm_nWRtA-mCDZiwRvke8ay8mupnF6qhv_v3omyssq4cbfrtKpyoUXiAbSfIHxieoPyA", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    ;blossoms of the void
    messageIdStartIndex := mainLoopIndex + 3080
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    regStatus := ErrorLevel
    loopEndingIndex := 0        ;will not edit rest of webhook ids
    sendDiscordMessage("https://discord.com/api/webhooks/863745862798540820/ygIlsGnta1_0YVQXlxIfQToopYM5i_hNSZKUWkClGP9B-6w2h9WxemF_JLMU-bIackoF", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    ;-------------------------
    mainLoopIndex++
    */
    ;----clearing previous messages on relics stocks----
    postdata := "{""content"": ""--"",""embeds"": """"}"
    messageIdStartIndex := mainLoopIndex + 2080
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    if (ErrorLevel==0)
    {
        regStatus := ErrorLevel
        loopEndingIndex := mainLoopIndex        ;edit rest of webhook ids
        sendDiscordMessage("https://discord.com/api/webhooks/851462538553983006/gMm_nWRtA-mCDZiwRvke8ay8mupnF6qhv_v3omyssq4cbfrtKpyoUXiAbSfIHxieoPyA", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    }
    ;----clearing previous messages on blossoms of the void----
    postdata := "{""content"": ""--"",""embeds"": """"}"
    messageIdStartIndex := mainLoopIndex + 3080
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
    if (ErrorLevel==0)
    {
        regStatus := ErrorLevel
        loopEndingIndex := mainLoopIndex        ;edit rest of webhook ids
        sendDiscordMessage("https://discord.com/api/webhooks/863745862798540820/ygIlsGnta1_0YVQXlxIfQToopYM5i_hNSZKUWkClGP9B-6w2h9WxemF_JLMU-bIackoF", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
    }
    ;----Ducat roles mention BotV----
    mention_messageId := ""
    postdata := []
    postdata.content := ""
    postdata.embeds := ""
    if (mention_users == 1)
        postdata.content := postdata.content . JSON.Dump(user_mentions)
    if (postdata.content == "")
        return
    url := "https://discord.com/api/webhooks/863745862798540820/ygIlsGnta1_0YVQXlxIfQToopYM5i_hNSZKUWkClGP9B-6w2h9WxemF_JLMU-bIackoF"
    loop
    {
        try
        {
            WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
            WebRequest.Open("post", url . "?wait=true", false)
            WebRequest.SetRequestHeader("Content-Type", "application/json")
            WebRequest.Send(JSON.Dump(postdata))
            WebRequest.WaitForResponse()
            if InStr(WebRequest.ResponseText, "rate limited")
            {
                rateLimit := Jxon_Load(WebRequest.ResponseText)
                rateLimit := rateLimit.retry_after + 1
                estimatedTick := A_TickCount + rateLimit
                loop
                {
                    if ((A_TickCount - estimatedTick) >= 0)
                        break
                }
                continue
            }
            if !InStr(WebRequest.ResponseText, "id")
            {
                msgbox,,, % "Error occured while sending discord message at line " A_LineNumber, 5
                msgbox,,, % WebRequest.ResponseText, 5
                continue
            }
            discordResponse := WebRequest.ResponseText
            discordResponse := Jxon_Load(discordResponse)
            mention_messageId := discordResponse.id
            break
        }
        catch e 
        {
            msgbox,,, % e.message, 5
            Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured sending discord message in script " A_ScriptName " at line " A_LineNumber " exception: " e.message "`r`n" , Error log.dat
        }
    }
    ;----Deleting mention----
    url := "https://discord.com/api/webhooks/863745862798540820/ygIlsGnta1_0YVQXlxIfQToopYM5i_hNSZKUWkClGP9B-6w2h9WxemF_JLMU-bIackoF/messages/"
    loop
    {
        try
        {
            WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
            WebRequest.Open("DELETE", url . mention_messageId, true)
            WebRequest.SetRequestHeader("Content-Type", "application/json")
            WebRequest.Send()
            WebRequest.WaitForResponse()
            if InStr(WebRequest.ResponseText, "rate limited")
            {
                rateLimit := Jxon_Load(WebRequest.ResponseText)
                rateLimit := rateLimit.retry_after + 1
                estimatedTick := A_TickCount + rateLimit
                loop
                {
                    if ((A_TickCount - estimatedTick) >= 0)
                        break
                }
                continue
            }
            if (WebRequest.ResponseText != "")
            {
                msgbox,,, "Error occured while deleting discord message at line " A_LineNumber, 5
                msgbox,,, WebRequest.ResponseText, 5
                continue
            }
            break
        }
        catch e 
        {
            msgbox,,, % e.message, 5
            Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured sending discord message in script " A_ScriptName " at line " A_LineNumber " exception: " e.message "`r`n" , Error log.dat
        }
    }
    return

main_interfaceGuiClose:
    msgbox,4,,Are you sure you want to exit script?
    IfMsgBox, No
        return
    Exitapp

exiting:
    if apiUpdating
    {
        Msgbox, 4,, Prices are updating. Do you still want to exit?
        IfMsgBox, No
	        return
    }
    WinGetPos, guiX, guiY,,, Relics Interface
	RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, guiX, %guiX%
	RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, guiY, %guiY%
    ;closing api threads
    SetTitleMatchMode,2
    DetectHiddenWindows,on
    WinClose, WFM Api - thread 1.ahk - AutoHotkey
    WinClose, WFM Api - thread 2.ahk - AutoHotkey
    WinClose, WFM Api - thread 3.ahk - AutoHotkey
    Exitapp

;----Hotkeys/Macros----
$^Numpad1::
    KeyWait, Ctrl
    if (enableMacro==0)
        return
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Warframe is not active to execute the macro, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    if (linkerContentArr[1]=="")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Macro is not yet available, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    ;sendinput % linkerContentArr[1]
    clipboard := ""
    clipboard := linkerContentArr[1]
    ClipWait, 2
    send {Ctrl Down}
    sleep 30
    send {v}
    sleep 30
    send {Ctrl Up}
    send {enter}
    sleep 100
    send t
    return

$^Numpad2::
    KeyWait, Ctrl
    if (enableMacro==0)
        return
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Warframe is not active to execute the macro, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    if (linkerContentArr[2]=="")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Macro is not yet available, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    ;send % linkerContentArr[2]
    clipboard := ""
    clipboard := linkerContentArr[2]
    ClipWait, 2
    send {Ctrl Down}
    sleep 30
    send {v}
    sleep 30
    send {Ctrl Up}
    send {enter}
    sleep 100
    send t
    return

$^Numpad3::
    KeyWait, Ctrl
    if (enableMacro==0)
        return
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Warframe is not active to execute the macro, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    if (linkerContentArr[3]=="")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Macro is not yet available, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    ;send % linkerContentArr[3]
    clipboard := ""
    clipboard := linkerContentArr[3]
    ClipWait, 2
    send {Ctrl Down}
    sleep 30
    send {v}
    sleep 30
    send {Ctrl Up}
    send {enter}
    sleep 100
    send t
    return

$^Numpad4::
    KeyWait, Ctrl
    if (enableMacro==0)
        return
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Warframe is not active to execute the macro, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    if (linkerContentArr[4]=="")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Macro is not yet available, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    ;send % linkerContentArr[4]
    clipboard := ""
    clipboard := linkerContentArr[4]
    ClipWait, 2
    send {Ctrl Down}
    sleep 30
    send {v}
    sleep 30
    send {Ctrl Up}
    send {enter}
    sleep 100
    send t
    return

$^Numpad5::
    KeyWait, Ctrl
    if (enableMacro==0)
        return
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Warframe is not active to execute the macro, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    if (linkerContentArr[5]=="")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Macro is not yet available, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    ;send % linkerContentArr[5]
    clipboard := ""
    clipboard := linkerContentArr[5]
    ClipWait, 2
    send {Ctrl Down}
    sleep 30
    send {v}
    sleep 30
    send {Ctrl Up}
    send {enter}
    sleep 100
    send t
    return

$^Numpad6::
    KeyWait, Ctrl
    if (enableMacro==0)
        return
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Warframe is not active to execute the macro, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    if (linkerContentArr[6]=="")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Macro is not yet available, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    ;send % linkerContentArr[5]
    clipboard := ""
    clipboard := linkerContentArr[6]
    ClipWait, 2
    send {Ctrl Down}
    sleep 30
    send {v}
    sleep 30
    send {Ctrl Up}
    send {enter}
    sleep 100
    send t
    return

$^Numpad8::
    KeyWait, Ctrl
    if (enableMacro==0)
        return
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Warframe is not active to execute the macro, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    ;send % buyContent
    clipboard := ""
    clipboard := copyPaste
    ClipWait, 2
    send {Ctrl Down}
    sleep 30
    send {v}
    sleep 30
    send {Ctrl Up}
    ;KeyWait, Ctrl, U
    send {enter}
    sleep 100
    send t
    sentViaMacro := 1
    SetTimer, buySpamMessage, -120000
    return

$^Numpad9::
    KeyWait, Ctrl
    if (enableMacro==0)
        return
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        loop
        {
            mousegetpos, x, y
            tooltip, Warframe is not active to execute the macro, (x + 20), (y + 20), 1
            if (A_index==100)
            {   
                tooltip 
                break
            }
            sleep 20
        }
        return
    }
    ;send % buyContent
    clipboard := ""
    clipboard := buyContent
    ClipWait, 2
    send {Ctrl Down}
    sleep 30
    send {v}
    sleep 30
    send {Ctrl Up}
    ;KeyWait, Ctrl, U
    send {enter}
    sleep 100
    send t
    sentViaMacro := 1
    SetTimer, buySpamMessage, -120000
    return

NumpadDiv::
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        send {/}
        return
    }
    Send a4
    return

NumpadMult::
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        send {*}
        return
    }
    Send c6
    return

NumpadSub::
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        send {-}
        return
    }
    Send p2
    return

NumpadAdd::
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        send {+}
        return
    }
    Send c6
    return

^f1::reload

;----functions----
LogRewards()
{
    SetTimer, rewardLogging, -2000
    return
    rewardLogging:
    rewardText := "[" . A_DD . "/" . A_MMM . "/" . A_YYYY . " " . A_Hour . ":" . A_Min . "] " . clipboard . "`r`n`r`n"
    if !InStr(rewardText, "WfInfo")
        return
    rewardText := StrReplace(rewardText, " -- by WFInfo (smart OCR with pricecheck)", "")
    rewardText := StrReplace(rewardText, ":platinum:", "p")
    Fileappend, %rewardText%, Rewards Log.txt
    return
}
/*
getOrder(item_url,file_name)
{
    WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    WebRequest.Open("GET", "https://api.warframe.market/v1/items/" . item_url . "/orders?include=item", true)
	WebRequest.SetRequestHeader("Content-Type", "application/json")
	WebRequest.SetRequestHeader("Platform", "pc")
    try
    {
        loop 
        {
            WebRequest.Send()
            WebRequest.WaitForResponse(15)
            if (InStr(WebRequest.ResponseText, "error")) && (InStr(WebRequest.ResponseText, "[GET]"))   ;invalid URL
                return -3
            if !(InStr(WebRequest.ResponseText, "Service Temporarily Unavailable"))
                break
        }
        ordersArr := JSON.Load(WebRequest.ResponseText)				; Jxon_Load loads the string into ordersArr object
    }
    catch e
    {
        errorText := "[" . A_DD . "/" . A_MMM . "/" . A_YYYY . " " . A_Hour . ":" . A_Min . "] " . "Error at Line " . A_LineNumber . ": Failed to retreive item orders info from API in function getOrder(). Catch message: " e.message . "`r`n"
        Fileappend, %errorText% , Error log.dat
        return -1
    }
    file := FileOpen(file_name, "a")
    string := """" item_url """: ["
    commaFlag := 0
    loop % ordersArr.payload.orders.MaxIndex()
    {
        orderIndex := A_index
        if ((ordersArr.payload.orders[A_Index].user.status == "ingame") && (ordersArr.payload.orders[A_Index].order_type == "sell") && (ordersArr.payload.orders[A_Index].user.region == "en"))
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
*/
sendDiscordMessage(url, postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
{
    if (postdata=="")
    {
        msgbox % "triggered empty message`r`nSent message: " postdata "`r`nWebhookID: " webhookMessageId
        postdata := "{""content"": ""--"",""embeds"": """"}"
    }
    ;----if there was a previous message, then edit----
    if (regStatus==0)
    {
        loop
        {
            if (A_index!=1)
                sleep 500
            try 
            {
                WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
                WebRequest.Open("PATCH", url . "/messages/" . webhookMessageId, false)
                WebRequest.SetRequestHeader("Content-Type", "application/json")
                WebRequest.Send(postdata)
                WebRequest.WaitForResponse()
                if (WebRequest.Status == 500)       ;Internal Server Error"
                    continue
                if (WebRequest.Status == 502)       ;bad gateway
                    continue
                if (WebRequest.Status == 504)       ;gateway timeout
                    continue
                if (WebRequest.Status == 429)       ;rate limited
                {
                    rateLimit := Jxon_Load(WebRequest.ResponseText)
                    rateLimit := rateLimit.retry_after + 1
                    estimatedTick := A_TickCount + rateLimit
                    loop
                    {
                        if ((A_TickCount - estimatedTick) >= 0)
                            break
                    }
                    continue
                }
                if (WebRequest.Status != 200 && WebRequest.status != 204)
                {
                    try {
                        Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Request status: " WebRequest.status "`nResponse: " WebRequest.ResponseText "`n`n", Discord Responses.dat
                    }
                    catch e {
                        Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Request status: " WebRequest.status "`nResponse: Could not log response`n`n", Discord Responses.dat
                    }
                    continue
                }   
                /*
                responseObject := JSON.Load(WebRequest.ResponseText)
                if (responseObject.id == "")
                {
                    msgbox,,, % "Error occured while editing discord message at line " A_LineNumber, 5
                    msgbox,,, % "Server Response: " WebRequest.ResponseText "`r`nSent message: " postdata "`r`nWebhookID: " webhookMessageId, 5
                    continue
                }
                */
                break
            }
            catch e 
            {
                if InStr(e.message, "0x80072EE7")
                    continue
                if InStr(e.message, "0x8000000A")
                    continue
                if InStr(e.message, "0x80072F78")
                    continue
                msgbox,,, % e.message "`n`n", 5
                Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured editing discord message in script " A_ScriptName " at line " e.line "`nexception: " e.message "`nSent data: " postdata "`r`n", Error log.dat
                continue
            }
        }
    }
    ;----if there was not a preivous message, then send new and store id in registry----
    else if regStatus {
        loop
        {
            if (A_index!=1)
                sleep 500
            try
            {
                WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
                WebRequest.Open("post", url . "?wait=true", false)
                WebRequest.SetRequestHeader("Content-Type", "application/json")
                WebRequest.Send(postdata)
                WebRequest.WaitForResponse()
                responseObject := JSON.Load(WebRequest.ResponseText)
                if (WebRequest.Status == 500)       ;Internal Server Error"
                    continue
                if (WebRequest.Status == 502)       ;bad gateway
                    continue
                if (WebRequest.Status == 504)       ;gateway timeout
                    continue
                if InStr(WebRequest.ResponseText, "rate limited")
                {
                    rateLimit := Jxon_Load(WebRequest.ResponseText)
                    rateLimit := rateLimit.retry_after + 1
                    estimatedTick := A_TickCount + rateLimit
                    loop
                    {
                        if ((A_TickCount - estimatedTick) >= 0)
                            break
                    }
                    continue
                }
                if (WebRequest.Status != 200) 
                {
                    msgbox,,, "Error occured while sending discord message at line " A_LineNumber, 5
                    msgbox,,, WebRequest.ResponseText, 5
                    continue
                }
                break
            }
            catch e 
            {
                if InStr(e.message, "0x80072EE7")
                    continue
                if InStr(e.message, "0x8000000A")
                    continue
                if InStr(e.message, "0x80072F78")
                    continue
                msgbox,,, % e.message, 5
                try {
                    Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured sending discord message in script " A_ScriptName " at line " e.line "`nexception: " e.message "`nServer Response: " WebRequest.ResponseText "`nSent data: " postdata "`r`n", Error log.dat
                }
                catch e {
                    Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured sending discord message in script " A_ScriptName " at line " e.line "`nexception: " e.message "`nServer Response: " "Could not log response" "`nSent data: " postdata "`r`n", Error log.dat
                }
                continue
            }
        }
        discordResponse := WebRequest.ResponseText
        discordResponse := Jxon_Load(discordResponse)
        webhookMessageId := discordResponse.id
        RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%, % webhookMessageId		;writing new message id to the registry
    }
    if (mainLoopIndex == loopEndingIndex)
    {
        loop % 100
        {
            messageIDNextIndex := messageIdStartIndex + A_index
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIDNextIndex%
            if ErrorLevel
                break
            loop
            {
                if (A_index!=1)
                    sleep 500
                try
                {
                    WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
                    WebRequest.Open("PATCH", url . "/messages/" . webhookMessageId, false)
                    WebRequest.SetRequestHeader("Content-Type", "application/json")
                    WebRequest.Send("{""content"": ""--"",""embeds"": """"}")
                    WebRequest.WaitForResponse()
                    if (WebRequest.Status == 404)    ;message not found
                        break
                    if (WebRequest.Status == 500)       ;Internal Server Error"
                        continue
                    if (WebRequest.Status == 502)       ;bad gateway
                        continue
                    if (WebRequest.Status == 504)       ;gateway timeout
                        continue
                    if InStr(WebRequest.ResponseText, "rate limited")
                    {
                        rateLimit := Jxon_Load(WebRequest.ResponseText)
                        rateLimit := rateLimit.retry_after + 1
                        estimatedTick := A_TickCount + rateLimit
                        loop
                        {
                            if ((A_TickCount - estimatedTick) >= 0)
                                break
                        }
                        continue
                    }
                    if (WebRequest.Status != 200)
                    {
                        msgbox,,, % "Error occured while editing discord message at line " A_LineNumber, 5
                        msgbox,,, % WebRequest.ResponseText, 5
                        continue
                    }
                    break
                }
                catch e 
                {
                    if InStr(e.message, "0x80072EE7")
                        continue
                    if InStr(e.message, "0x8000000A")
                        continue
                    if InStr(e.message, "0x80072F78")
                        continue
                    msgbox,,, % e.message, 5
                    try {
                        Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured editing discord message in script " A_ScriptName " at line " e.line "`nexception: " e.message "`nServer Response: " WebRequest.ResponseText "`nSent data: " postdata "`r`n", Error log.dat
                    }
                    catch e {
                        Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured editing discord message in script " A_ScriptName " at line " e.line "`nexception: " e.message "`nServer Response: " "Could not log response" "`nSent data: " postdata "`r`n", Error log.dat
                    }
                    continue
                }
            }
            if (WebRequest.Status == 404)    ;message not found
                break
            estimatedTick := A_TickCount + 2000
            loop
            {
                if ((A_TickCount - estimatedTick) >= 0)
                    break
            }
        }
    }
}
fetchItemsList()
{
    ;----creating full prime and relic items list file-----
    try
    {
        loop 
        {
            if (A_index!=1)
                sleep 500
            requestItemList := ComObjCreate("WinHttp.WinHttpRequest.5.1")
            requestItemList.Open("GET", "https://api.warframe.market/v1/items", true)
            requestItemList.Send()
            requestItemList.WaitForResponse()
            if !(InStr(requestItemList.ResponseText, "Service Temporarily Unavailable"))
                break
        }
    }
    catch e
    {
        msgbox,,, % e.message, 5
        Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Crucial Error occured in script " A_ScriptName " at line " A_LineNumber " exception: " e.message "`r`n" , Error log.dat
        return
    }
    fileList := FileOpen("WFM_Items_List.json", "w")
    fileList.Write(requestItemList.ResponseText)
    fileList.close()
    requestItemList := Jxon_Load(requestItemList.ResponseText)
    fullItemsList := ""
    fullRelicsList := ""
    fullModsList := ""
    loop % requestItemList.payload.items.MaxIndex()
    {
        currentItem := requestItemList.payload.items[A_index].url_name
        if InStr(currentItem, "Prime") && !(InStr(currentItem, "Primed"))
            fullItemsList := fullItemsList . currentItem . "`r`n"
        else if InStr(currentItem, "relic") && !(InStr(currentItem, "scene"))
            fullRelicsList := fullRelicsList . currentItem . "`r`n"
        else if InStr(currentItem, "Primed")
            fullModsList := fullModsList . currentItem . "`r`n"
    }
    fullItemsList := SubStr(fullItemsList, 1, -2)
    fullRelicsList := SubStr(fullRelicsList, 1, -2)
    fullModsList := SubStr(fullModsList, 1, -2)
    fileList := FileOpen("FullItemsList.dat", "w")
    fileList.Write(FullItemsList)
    fileList.close()
    fileList := FileOpen("FullRelicsList.dat", "w")
    fileList.Write(fullRelicsList)
    fileList.close()
    fileList := FileOpen("fullModsList.dat", "w")
    fileList.Write(fullModsList)
    fileList.close()
    return
    ;----------
}
; For removing duplicates from an array
trimArray(arr) { ; Hash O(n) 

    hash := {}, newArr := []

    for e, v in arr
        if (!hash[v])
            hash[(v)] := 1, newArr.push(v)

    return newArr
}
;-----------------
;----test area----
/*
1::
    WebRequest2 := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    url2 := "https://api.warframe.market/v1/items/" . "loki_prime_systems" . "/orders?include=item"
    WebRequest2.Open("GET", url2, true)
    try 
    {
        loop 
        {
            WebRequest2.Send()
            WebRequest2.WaitForResponse(15)
            if !(InStr(WebRequest2.ResponseText, "Service Temporarily Unavailable"))
                break
        }
        ;partResponse2 := StrSplit(WebRequest2.ResponseText, "{")
        response := WebRequest2.ResponseText
        response := StrReplace(response, "{", "{`r`n")
        response := StrReplace(response, "},", "},`r`n")
        response := StrReplace(response, ",", ",`r`n")
    }
    catch e 
    {
        Fileappend, % "[" A_hour ":" A_Min ":" A_Sec "] " "Crucial Error in check price occured`r`n" , Error log.dat
        ;Fileappend, % WebRequest2.ResponseText, ServerResponse.dat
        return
    }
    Fileappend, %response%, serverResponse.txt
    partResponse := WebRequest2.ResponseText
    pos1 := InStr(partResponse, """item_name"": ""loki prime systems""")
    msgbox % pos1
        pos2 := InStr(partResponse, "]",, pos1)
        length := (pos2 - pos1) + 1
        partResponse := SubStr(partResponse, pos1, length)
        partResponse := StrSplit(partResponse, "{")
        loop % partResponse.MaxIndex()
        {
            if InStr(partResponse[A_index], """name"": ")
            {
                pos1 := InStr(partResponse[A_index], """name"": ")
                pos2 := InStr(partResponse[A_index], " Relic", pos1)
                length := pos2 - pos1
                relic := SubStr(partResponse[A_index], pos1, length)
                relic := StrReplace(relic, """name"": """, "")
                string := string . relic . "/"
            }
        }
        string := SubStr(string, 1, StrLen(string)-1)
        string := string . "`r`n"
    msgbox %string%
    return
*/