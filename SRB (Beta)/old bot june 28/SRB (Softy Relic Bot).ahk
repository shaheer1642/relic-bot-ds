#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
SetWorkingDir, C:\Users\Horcrux\Google Drive\SRB (Beta)  ; Ensures a consistent starting directory.
;----icons----
#NoTrayIcon  ;Hide initial icon.
Menu Tray, Icon, %A_WorkingDir%\icon\icon.png  ; Set icon.
Menu Tray, Icon  ; Show icon.
;-------------
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetBatchLines, -1
FileEncoding, UTF-8
FileAppend,, SrbDB.dat      ;creating new file if not existing
FileAppend,, SrbExc.dat      ;creating new file if not existing
FileAppend,, SrbCustom.dat      ;creating new file if not existing
OnClipboardChange("LogRewards")
#Include %A_ScriptDir%
#include Jxon.ahk
;----variables/timers----
enableEditing := 0
buySpamMode := 0
sentViaMacro := 0
lithCheck := 1
mesoCheck := 1
neoCheck := 1
axiCheck := 1
apiUpdating := 0
currentHour := A_Hour
SetTimer, checkForPriceUpdate, 120000       ;checking for prices update every hour
SetTimer, checkForLowPrice, 58000
SetTimer, ducatPartsUpdate, 300000
RegRead 4Cycles, HKCU, Software\Softy Relic Bot, 4Cycles
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, 4Cycles, 0		;default setting
    RegRead 4Cycles, HKCU, Software\Softy Relic Bot, 4Cycles
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
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, partsPriceThreshold, 50		;default setting 
    RegRead partsPriceThreshold, HKCU, Software\Softy Relic Bot, partsPriceThreshold
}
RegRead setsPriceThreshold, HKCU, Software\Softy Relic Bot, setsPriceThreshold
if ErrorLevel {
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, setsPriceThreshold, 50		;default setting 
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
;----creating 2d array for the database-----
FileRead, relicsArr, SrbDB.dat
Sort, relicsArr
relicsArr := StrSplit(relicsArr, "`r`n")
loop % relicsArr.MaxIndex()-1
{
    relicsArr[A_Index] := StrSplit(relicsArr[A_Index], A_tab)
}
;-------------------------------------------
;----Interface options----
Gui, main_interface:New,, Relics Interface
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
;----others----
Gui, main_interface:Add, CheckBox, x10 y370 genableEditing venableEditing, Enable editing
Gui, main_interface:Add, Text, x150 y370 w100 vtotalRelics, Total Relics: 
gosub totalRelics
Gui, main_interface:Add, Button, x10 y340 goffcycleRelics, Show Offcycle Relcs
;--------------
relicsX := 10
relicsY := 400
Loop % relicsArr.MaxIndex()-1
{
    newCategory := SubStr(relicsArr[A_index][1], 1, 1)
    if (newCategory != lastCategory) && (A_index!=1)    ;begin a new column     ;skip for first index
    {
        relicsX := relicsX + 250
        relicsY := 400
    }
    if (relicsArr[A_index][2] > hostThreshold-1)
        Gui, main_interface:Font, c8aff1c
    if (relicsArr[A_index][2] < 1)
        Gui, main_interface:Font, c1ba5f5
    Gui, main_interface:Add, Text, % "vrelicName"A_index " " "x"relicsX " " "y"relicsY " " "w100", % relicsArr[A_index][1] "        " relicsArr[A_index][2]
    Gui, main_interface:Font, cWhite
    Gui, main_interface:Add, Button , % "gButtonAddOneRelic" " " "vaddOneButton"A_index " " "x"relicsX+100 " " "y"relicsY-5, +1
    Gui, main_interface:Add, Button , % "gButtonRemoveOneRelic" " " "vremoveOneButton"A_index " " "x"relicsX+125 " " "y"relicsY-5, -1
    Gui, main_interface:Add, Button , % "gButtonAddFiveRelics" " " "vaddFiveButton"A_index " " "x"relicsX+150 " " "y"relicsY-5, +5
    Gui, main_interface:Add, Button , % "gButtonRemoveFiveRelics" " " "vremoveFiveButton"A_index " " "x"relicsX+175 " " "y"relicsY-5, -5
    relicsY := relicsY + 25
    /*
    if (Mod(A_index,10) == 0)  ;starting a new column every 10 relics
    {
        relicsX := relicsX + 250
        relicsY := 200
    }
    */
    lastCategory := SubStr(relicsArr[A_index][1], 1, 1)
}
Gui, main_interface:Show, X%guiX% Y%guiY%
return

ButtonAddNewRelic:
    GuiControlGet, New_relic
    if (New_relic=="")
    {
        msgbox, Please enter a value
        return
    }
    loop, 26
    {
        New_relic := StrReplace(New_relic, chr(A_Index + 96), chr(A_Index + 64))    ;capitalize tier letter
    }
    New_relic := StrReplace(New_relic, "lith", "Lith")
    New_relic := StrReplace(New_relic, "meso", "Meso")
    New_relic := StrReplace(New_relic, "neo", "Neo")
    New_relic := StrReplace(New_relic, "axi", "Axi")
    ;Emptying fields
    GuiControl, main_interface:, New_relic
    GuiControl, main_interface:focus, New_relic
    ;checking if already in the list
    FileRead, relicsInfo, SrbDB.dat
    if InStr(relicsInfo, New_relic)
    {
        msgbox, Relic already exists.
        return
    }
    ;adding to the database
    ;FileAppend, %New_relic%%A_tab%0`r`n, SrbDB.dat
    file := FileOpen("SrbDB.dat", "a")
    file.write(New_relic . A_tab . "0`r`n")
    file.close()
    ;updating the gui text
    ;Gui, main_interface:Destroy
    reload
    return

ButtonShowRelics:
    FileRead, relicsInfo, SrbDB.dat
    i := 1000
    Loop % i+1
    {
        relicsInfo := StrReplace(relicsInfo, A_tab . i, "")
        i--
    }
    Sort, relicsInfo
    Gui, ShowAll:New,,Relics
    Gui, ShowAll:Add, Edit, w100 h300 +readonly +vscroll, %relicsInfo%
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
    ;Emptying fields
    GuiControl, main_interface:, New_relic
    GuiControl, main_interface:focus, New_relic
    ;removing from the database
    fileContents := ""
    Loop
    {
        FileReadLine, relicInfo, SrbDB.dat, %A_Index%
        if ErrorLevel		;end of file reached
            Break
        if InStr(relicInfo, New_relic)
            continue
        fileContents := fileContents . relicInfo . "`r`n"
    }
    ;---- The end of the file has been reached or there was a problem.
    ;FileDelete, SrbDB.dat
    ;FileAppend, %fileContents%, SrbDB.dat
    file := FileOpen("SrbDB.dat", "w")
    file.write(fileContents)
    file.close()
    ;updating the gui text
    ;Gui, main_interface:Destroy
    reload
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
    relicsArr[addVar][2] += 1   ;incrementing by 1
    ;updating database
    fileContents := ""
    Loop % relicsArr.MaxIndex()-1
    {
        fileContents := fileContents . relicsArr[A_index][1] . A_tab . relicsArr[A_index][2] . "`r`n"
    }
    ;FileDelete, SrbDB.dat
    ;FileAppend, %fileContents%, SrbDB.dat
    file := FileOpen("SrbDB.dat", "w")
    file.write(fileContents)
    file.close()
    Gui, main_interface:Font, cWhite
    if (relicsArr[addVar][2] > fetchThreshold-1) 
    {
        Gui, main_interface:Font, c8aff1c
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    else if (relicsArr[addVar][2] < 1)
    {
        Gui, main_interface:Font, c1ba5f5
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    Else
    {
    
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    GuiControl, main_interface:Text, % "relicName"addVar , % relicsArr[addVar][1] "        " relicsArr[addVar][2]
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
    relicsArr[addVar][2] -= 1   ;decrementing by 1
    ;updating database
    fileContents := ""
    Loop % relicsArr.MaxIndex()-1
    {
        fileContents := fileContents . relicsArr[A_index][1] . A_tab . relicsArr[A_index][2] . "`r`n"
    }
    ;FileDelete, SrbDB.dat
    ;FileAppend, %fileContents%, SrbDB.dat
    file := FileOpen("SrbDB.dat", "w")
    file.write(fileContents)
    file.close()
    Gui, main_interface:Font, cWhite
    if (relicsArr[addVar][2] > fetchThreshold-1)
    {
        Gui, main_interface:Font, c8aff1c
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    else if (relicsArr[addVar][2] < 1)
    {
        Gui, main_interface:Font, c1ba5f5
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    Else
    {
    
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    GuiControl, main_interface:Text, % "relicName"addVar , % relicsArr[addVar][1] "        " relicsArr[addVar][2]

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
    relicsArr[addVar][2] += 5   ;incrementing by 5
    ;updating database
    fileContents := ""
    Loop % relicsArr.MaxIndex()-1
    {
        fileContents := fileContents . relicsArr[A_index][1] . A_tab . relicsArr[A_index][2] . "`r`n"
    }   
    ;FileDelete, SrbDB.dat
    ;FileAppend, %fileContents%, SrbDB.dat
    file := FileOpen("SrbDB.dat", "w")
    file.write(fileContents)
    file.close()
    Gui, main_interface:Font, cWhite
    if (relicsArr[addVar][2] > fetchThreshold-1)
    {
        Gui, main_interface:Font, c8aff1c
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    else if (relicsArr[addVar][2] < 1)
    {
        Gui, main_interface:Font, c1ba5f5
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    Else
    {
    
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    GuiControl, main_interface:Text, % "relicName"addVar , % relicsArr[addVar][1] "        " relicsArr[addVar][2]
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
    relicsArr[addVar][2] -= 5   ;incrementing by 5
    ;updating database
    fileContents := ""
    Loop % relicsArr.MaxIndex()-1
    {
        fileContents := fileContents . relicsArr[A_index][1] . A_tab . relicsArr[A_index][2] . "`r`n"
    }
    ;FileDelete, SrbDB.dat
    ;FileAppend, %fileContents%, SrbDB.dat
    file := FileOpen("SrbDB.dat", "w")
    file.write(fileContents)
    file.close()
    Gui, main_interface:Font, cWhite
    if (relicsArr[addVar][2] > fetchThreshold-1)
    {
        Gui, main_interface:Font, c8aff1c
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    else if (relicsArr[addVar][2] < 1)
    {
        Gui, main_interface:Font, c1ba5f5
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    Else
    {
    
        GuiControl, main_interface:Font, % "relicName"addVar
    }
    GuiControl, main_interface:Text, % "relicName"addVar , % relicsArr[addVar][1] "        " relicsArr[addVar][2]
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
    Loop % relicsArr.MaxIndex()-1
    {   
        if (relicsArr[A_index][2] > fetchThreshold-1)
            fetchContent := fetchContent . ",+" . relicsArr[A_index][1]
    }
    fetchContent := StrReplace(fetchContent, "," , "",, 1)
    GuiControl,, fetchText , %fetchContent%
    return

updateHost:
    GuiControlGet, hostThreshold
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, hostThreshold, %hostThreshold%
    hostContent := ""
    Loop % relicsArr.MaxIndex()-1
    {
        if ((InStr(relicsArr[A_index][1], "lith")) && (lithCheck==0))
            continue
        else if ((InStr(relicsArr[A_index][1], "meso")) && (mesoCheck==0))
            continue
        else if ((InStr(relicsArr[A_index][1], "neo")) && (neoCheck==0))
            continue
        else if ((InStr(relicsArr[A_index][1], "axi")) && (axiCheck==0))
            continue
        if (relicsArr[A_index][2] > hostThreshold-1)
        {
            relicIndex := A_Index
            FileRead, excArr, SrbExc.dat
            FileRead, customArr, SrbCustom.dat
            excArr := StrSplit(excArr, "`r`n")
            customArr := StrSplit(customArr, "`r`n")
            isFoundCustom := 0
            loop % customArr.MaxIndex()-1
            {
                if  InStr(customArr[A_Index], relicsArr[relicIndex][1])
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
                if (relicsArr[relicIndex][1] == excArr[A_Index])
                {
                    hostContent := hostContent . "++host " . relicsArr[relicIndex][1] . " rad 2b2"
                    if 4Cycles
                        hostContent := hostContent . " (4+ cycles)`r`n"
                    else
                        hostContent := hostContent . "`r`n"
                    isFoundExc := 1
                }
            }
            if isFoundExc
                continue
            hostContent := hostContent . "++host " . relicsArr[A_index][1] . " rad 4b4"
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
    Loop % relicsArr.MaxIndex()-1
    {
        if !(InStr(relicsArr[A_index][1], "lith"))
            continue
        tier := StrReplace(relicsArr[A_index][1], "lith ", "", i)
        if (relicsArr[A_index][2] < buyThreshold || InStr(alwaysBuyingRelicsInfo, relicsArr[A_index][1]))
        {
            if (putLith==0)
            {
                buyContent := buyContent . "Lith "
                putLith++
            }
            if (putSlash!=0)
                buyContent := buyContent . "/"
            buyContent := buyContent . tier
            if (relicsArr[A_index][2] > 0)
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
    Loop % relicsArr.MaxIndex()-1
    {
        if !(InStr(relicsArr[A_index][1], "meso"))
            continue
        tier := StrReplace(relicsArr[A_index][1], "meso ", "", i)
        if (relicsArr[A_index][2] < buyThreshold || InStr(alwaysBuyingRelicsInfo, relicsArr[A_index][1]))
        {
            if (putMeso==0)
            {
                buyContent := buyContent . "Meso "
                putMeso++
            }
            if (putSlash!=0)
                buyContent := buyContent . "/"
            buyContent := buyContent . tier
            if (relicsArr[A_index][2] > 0)
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
    Loop % relicsArr.MaxIndex()-1
    {
        if !(InStr(relicsArr[A_index][1], "neo"))
            continue
        tier := StrReplace(relicsArr[A_index][1], "neo ", "", i)
        if (relicsArr[A_index][2] < buyThreshold || InStr(alwaysBuyingRelicsInfo, relicsArr[A_index][1]))
        {
            if (putNeo==0)
            {
                buyContent := buyContent . "Neo "
                putNeo++
            }
            if (putSlash!=0)
                buyContent := buyContent . "/"
            buyContent := buyContent . tier
            if (relicsArr[A_index][2] > 0)
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
    Loop % relicsArr.MaxIndex()-1
    {
        if !(InStr(relicsArr[A_index][1], "axi"))
            continue
        tier := StrReplace(relicsArr[A_index][1], "axi ", "", i)
        if (relicsArr[A_index][2] < buyThreshold || InStr(alwaysBuyingRelicsInfo, relicsArr[A_index][1]))
        {
            if (putAxi==0)
            {
                buyContent := buyContent . "Axi "
                putAxi++
            }
            if (putSlash!=0)
                buyContent := buyContent . "/"
            buyContent := buyContent . tier
            if (relicsArr[A_index][2] > 0)
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
    x := 655
    y := 291
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
        y := y + 25
    }
    ;-----------------------
    ;ending text
    buyContent := buyContent . "5p each. Pmo for L1/L4 or links"
    GuiControl, main_interface:, buyText , %buyContent%
    GuiControl, main_interface:, linkerText , %linkerContent%
    return

updatePrice:
    GuiControlGet, partsPriceThreshold
    GuiControlGet, setsPriceThreshold
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, partsPriceThreshold, %partsPriceThreshold%
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, setsPriceThreshold, %setsPriceThreshold%
    FileRead, priceList, pricesDB.json
    FileRead, relicList, relicsDB.dat
    priceList := Jxon_Load(priceList)
    relicList := StrSplit(relicList, "`r`n")
    loop % relicList.MaxIndex()-1
    {
        relicList[A_Index] := StrSplit(relicList[A_Index], ": ")
    }
    primeParts := ""
    primeSets := ""
    ducatPartsList := ""
    fullRelicList := ""
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
            if InStr(partName, "Set")
            {
                primeSets := primeSets . partName . "$" . A_tab . priceList[lineIndex].price . "p" . A_tab . "Ducats: " . priceList[lineIndex].ducat . "`r`n"
                continue
            }
            primeParts := primeParts . partName . "$" . A_tab . priceList[lineIndex].price . "p" .  A_tab . "Ducats: " . priceList[lineIndex].ducat . A_tab . "Relics: " . relicNames . "`r`n"
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
    loop % relicList.MaxIndex()-1
    {
        lineIndex := A_index
        relicList[lineIndex][1] := StrReplace(relicList[lineIndex][1], "_", " ")
        ;capitalizing first letters
        loop, 26
	    {
		    if (SubStr(relicList[lineIndex][1], 1, 1) == chr(A_Index + 96))
			    relicList[lineIndex][1] := StrReplace(relicList[lineIndex][1], chr(A_Index + 96), chr(A_Index + 64),, 1)
            relicList[lineIndex][1] := StrReplace(relicList[lineIndex][1], " "chr(A_Index + 96), " "chr(A_Index + 64),, 1)
	    }
        ;-----
        fullRelicList := fullRelicList . relicList[lineIndex][1] . ":" . A_tab . relicList[lineIndex][2] . "p`r`n"
    }
    fullRelicList := StrReplace(fullRelicList, "N/Ap", "N/A")
    ;sorting parts list
    primeParts := StrSplit(primeParts, "`r`n")
    loop % primeParts.MaxIndex()-1
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
    loop % primeParts.MaxIndex()-1
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
    loop % primeParts.MaxIndex()-1
    {
        partsContentSorted := partsContentSorted . primeParts[A_index] . "`r`n"
    }
    Sort, partsContentSorted, N P41 R
    partsContentSorted := StrReplace(partsContentSorted, "$", "")
    partsContentSorted := "Prime parts >= " . partsPriceThreshold . "p:`r`n" . partsContentSorted
    ;-------
    ;sorting sets list
    primeSets := StrSplit(primeSets, "`r`n")
    loop % primeSets.MaxIndex()-1
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
    loop % primeSets.MaxIndex()-1
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
    loop % primeSets.MaxIndex()-1
    {
        setsContentSorted := setsContentSorted . primeSets[A_index] . "`r`n"
    }
    Sort, setsContentSorted, N P45 R
    setsContentSorted := StrReplace(setsContentSorted, "$", "")
    setsContentSorted := "Prime sets >= " . setsPriceThreshold . "p:`r`n" . setsContentSorted
    priceContentSorted := partsContentSorted . "`r`n" . setsContentSorted
    ;----------
    ;sorting ducats list
    ducatPartsList := StrSplit(ducatPartsList, "`r`n")
    loop % ducatPartsList.MaxIndex()-1
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
    loop % ducatPartsList.MaxIndex()-1
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
    loop % ducatPartsList.MaxIndex()-1
    {
        ducatsContentSorted := ducatsContentSorted . ducatPartsList[A_index] . "`r`n"
    }
    Sort, ducatsContentSorted, N P91 R
    ducatsContentSorted := StrReplace(ducatsContentSorted, "$", "")
    ;ducatsContentSorted := "Prime parts <= 15p and worth 100 ducats:`r`n" . ducatsContentSorted
    ;----------
    ;sorting relics list
    fullRelicList := StrSplit(fullRelicList, "`r`n")
    loop % fullRelicList.MaxIndex()-1
    {
        pos := InStr(fullRelicList[A_index], A_tab)
        lineIndex := A_index
        if pos<40
        {
            loop
            {
                if InStr(fullRelicList[lineIndex], A_tab) == 31
                    break
                fullRelicList[lineIndex] := StrReplace(fullRelicList[lineIndex], ":" , ": ",,1)
            }
        }
    }
    fullRelicListSorted := ""
    loop % fullRelicList.MaxIndex()-1
    {
        fullRelicListSorted := fullRelicListSorted . fullRelicList[A_index] . "`r`n"
    }
    Sort, fullRelicListSorted, N P31 R
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
        if InStr(partName, "Set")
            {
                primeSets := primeSets . partName . "$" . A_tab . priceList[lineIndex].price . "p" . A_tab . "Ducats: " . priceList[lineIndex].ducat . "`r`n"
                continue
            }
        primeParts := primeParts . partName . "$" . A_tab . priceList[lineIndex].price . "p" .  A_tab . "Ducats: " . priceList[lineIndex].ducat . A_tab . "Relics: " . relicNames . "`r`n"
    }
    ;---------
    GuiControl, main_interface:, priceText, %priceContentSorted%
    RegRead priceUpdateDateTime, HKCU, Software\Softy Relic Bot, priceUpdateDateTime
    RegRead priceUpdateTotalTime, HKCU, Software\Softy Relic Bot, priceUpdateTotalTime
    GuiControl, main_interface:, priceUpdateDateTime, Last check: %priceUpdateDateTime%
    GuiControl, main_interface:, priceUpdateTotalTime, Update duration: %priceUpdateTotalTime%s
    return

updatePriceDB:
    if (currentHour == A_Hour)
    {
        msgbox,4,, This process might take upto 5 minutes but will run in the background. Would you like to continue?
        IfMsgBox, No
            return
    }
    currentHour := A_Hour
    apiUpdating := 1
    GuiControl, main_interface:, priceText , updating...
    time_taken := A_TickCount
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
    FormatTime, priceUpdateDateTime, %A_NowUTC%, ddd dd-MM-yyyy 'at' hh:mm tt 'UTC'
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, priceUpdateTotalTime, %priceUpdateTotalTime%		;updating registry
	RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, priceUpdateDateTime, %priceUpdateDateTime%		;updating registry
    ;combining primes DB
    FileRead, pricesDB1, pricesDBMT1.json
    FileRead, pricesDB2, pricesDBMT2.json
    FileRead, pricesDB3, pricesDBMT3.json
    pricesDB1 := SubStr(pricesDB1, 1, -1)      ;removing ending brace
    pricesDB2 := SubStr(pricesDB2, 2, -1)      ;removing starting and ending brace
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
    FileRead, relicsDB1, relicsDB1.dat
    FileRead, relicsDB2, relicsDB2.dat
    FileRead, relicsDB3, relicsDB3.dat
    string := relicsDB1 . relicsDB2 . relicsDB3
    file := FileOpen("relicsDB.dat", "w")
    if !IsObject(file)
    {
        MsgBox Can't open file for writing.
        return
    }
    file.write(string)
    file.close()
    ;----
    gosub updatePrice
    gosub discordPost
    apiUpdating := 0
    return

discordPost:
    threeApos := "``"
    priceListArr := []
    loop
    {
        startPos := 1
        endPos := 1700
        endPos := InStr(priceContentSorted, "`r`n",, endPos)-1
        if (priceContentSorted=="`n")
            break
        priceListArr[A_Index] := SubStr(priceContentSorted, startPos, endPos)
        priceContentSorted := StrReplace(priceContentSorted, priceListArr[A_Index], "")
        if (InStr(priceContentSorted, "`r`n") < 10 )
            priceContentSorted := StrReplace(priceContentSorted, "`r`n", "",, 1)
    }
    loop
    {
        fullRelicListSorted := StrReplace(fullRelicListSorted, "  ", "", OutputVarCount1)
        fullRelicListSorted := StrReplace(fullRelicListSorted, A_space . A_tab, A_tab, OutputVarCount2)
        if (OutputVarCount1==0 && OutputVarCount2==0)
            break
    }
    relicListArr := []
    loop
    {
        startPos := 1
        endPos := 1100
        endPos := InStr(fullRelicListSorted, "`r`n",, endPos)-1
        if (fullRelicListSorted=="`n")
            break
        relicListArr[A_Index] := SubStr(fullRelicListSorted, startPos, endPos)
        fullRelicListSorted := StrReplace(fullRelicListSorted, relicListArr[A_Index], "")
        if (InStr(fullRelicListSorted, "`r`n") < 10 )
            fullRelicListSorted := StrReplace(fullRelicListSorted, "`r`n", "",, 1)
    }
    loop % relicListArr.MaxIndex()
    {
        relicListArr[A_index] := StrSplit(relicListArr[A_index], "`r`n")
    }
    loop % relicListArr.MaxIndex()
    {
        relicListArrIndex := A_index
        loop % relicListArr[relicListArrIndex].MaxIndex()
        {
            relicListArr[relicListArrIndex][A_Index] := StrSplit(relicListArr[relicListArrIndex][A_Index], A_tab)
        }
    }
    ducatListArr := []
    loop
    {
        startPos := 1
        endPos := 1000
        endPos := InStr(ducatsContentSorted, "`r`n",, endPos)-1
        if (ducatsContentSorted=="`n")
            break
        ducatListArr[A_Index] := SubStr(ducatsContentSorted, startPos, endPos)
        ducatsContentSorted := StrReplace(ducatsContentSorted, ducatListArr[A_Index], "")
        if (InStr(ducatsContentSorted, "`r`n") < 10 )
            ducatsContentSorted := StrReplace(ducatsContentSorted, "`r`n", "",, 1)
    }
    loop % ducatListArr.MaxIndex()
    {
        ducatListArr[A_index] := StrSplit(ducatListArr[A_index], "`r`n")
    }
    loop % ducatListArr.MaxIndex()
    {
        ducatListArrIndex := A_index
        loop % ducatListArr[ducatListArrIndex].MaxIndex()
        {
            ducatListArr[ducatListArrIndex][A_Index] := StrSplit(ducatListArr[ducatListArrIndex][A_Index], A_tab)
        }
    }
	WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    ;----posting good prices to relic stocks server----
	postdata=
	(
		{
  			"content": "%threeApos%----------\nBelow is a list of all prime items equal to or above the given threshold. Their values are calcuated from WFM based on the average of lowest 5 (or less if not available) online in-game sell orders. The list will be edited on hourly basis. For any concerns, contact MrSofty#7926\n----------\nLast check: %priceUpdateDateTime%\n----------\n%threeApos%"
		}
	)
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId1
    ;----if there was a previous message, then edit----
    if (ErrorLevel==0)
    {
	    WebRequest.Open("PATCH", "https://discord.com/api/webhooks/851461876016611348/qgbNjuUKUJhi0I96xhLqv9-ySh_iVyMfehU3XGMP0Wlp0rfoKb6YqzPNRGal0p5IpdEF/messages/" . webhookMessageId, false)
	    WebRequest.SetRequestHeader("Content-Type", "application/json")
	    WebRequest.Send(postdata)
    }
    ;----if there was not a preivous message, then send new and store id in registry----
    if ErrorLevel {
	    WebRequest.Open("post", "https://discord.com/api/webhooks/851461876016611348/qgbNjuUKUJhi0I96xhLqv9-ySh_iVyMfehU3XGMP0Wlp0rfoKb6YqzPNRGal0p5IpdEF?wait=true", false)
	    WebRequest.SetRequestHeader("Content-Type", "application/json")
        loop
        {
	        WebRequest.Send(postdata)
            WebRequest.WaitForResponse()
            if InStr(WebRequest.ResponseText, "Rate limited")
                continue
            break
        }
        messsageBody := WebRequest.ResponseText
        pos1 := InStr(messsageBody, """id"":")
        pos2 := InStr(messsageBody, ",",,pos1)
        length := pos2 - pos1
        webhookMessageId := SubStr(messsageBody, pos1 , length)
        webhookMessageId := StrReplace(webhookMessageId, """id"": ", "")
        webhookMessageId := StrReplace(webhookMessageId, """", "")
        post := StrReplace(post, ",", "")
	    RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId1, % webhookMessageId		;writing new message id to the registry
    }
    loop, 2 ;% priceListArr.MaxIndex()
    {
        lineIndex := A_index
        string := priceListArr[A_index]
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
        messageIdStartIndex := lineIndex + 1
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        if (A_index==3)
        {
            FileAppend, "Missing webhook id at line" . A_LineNumber . "`r`n", MissingWebhookIDs.dat
            break
        }
        ;----if there was a previous message, then edit----
        if (ErrorLevel==0)
        {
	        WebRequest.Open("PATCH", "https://discord.com/api/webhooks/851461876016611348/qgbNjuUKUJhi0I96xhLqv9-ySh_iVyMfehU3XGMP0Wlp0rfoKb6YqzPNRGal0p5IpdEF/messages/" . webhookMessageId, false)
	        WebRequest.SetRequestHeader("Content-Type", "application/json")
            if !(priceListArr[lineIndex]=="")
	            WebRequest.Send(postdata)
            else
                WebRequest.Send("{""content"": ""--"" }")       ;clearing past messages if length is shorter
        }
        ;----if there was not a preivous message, then send new and store id in registry----
        if ErrorLevel {
	        WebRequest.Open("post", "https://discord.com/api/webhooks/851461876016611348/qgbNjuUKUJhi0I96xhLqv9-ySh_iVyMfehU3XGMP0Wlp0rfoKb6YqzPNRGal0p5IpdEF?wait=true", false)
	        WebRequest.SetRequestHeader("Content-Type", "application/json")
            loop
            {
	            WebRequest.Send(postdata)
                WebRequest.WaitForResponse()
                if InStr(WebRequest.ResponseText, "Rate limited")
                    continue
                break
            }
            messsageBody := WebRequest.ResponseText
            pos1 := InStr(messsageBody, """id"":")
            pos2 := InStr(messsageBody, ",",,pos1)
            length := pos2 - pos1
            webhookMessageId := SubStr(messsageBody, pos1 , length)
            webhookMessageId := StrReplace(webhookMessageId, """id"": ", "")
            webhookMessageId := StrReplace(webhookMessageId, """", "")
            post := StrReplace(post, ",", "")
            if (A_index==1)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId2, % webhookMessageId		;writing new message id to the registry
            if (A_index==2)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId3, % webhookMessageId		;writing new message id to the registry
        }
    }
    ;sorting parts full list
    primeParts := StrSplit(primeParts, "`r`n")
    loop % primeParts.MaxIndex()-1
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
    loop % primeParts.MaxIndex()-1
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
    partsFullContentSorted := ""
    loop % primeParts.MaxIndex()-1
    {
        partsFullContentSorted := partsFullContentSorted . primeParts[A_index] . "`r`n"
    }
    Sort, partsFullContentSorted, N P41 R
    partsFullContentSorted := StrReplace(partsFullContentSorted, "$", "")
    partsFullContentSorted := "Prime parts:`r`n" . partsFullContentSorted
    ;sorting sets full list
    primeSets := StrSplit(primeSets, "`r`n")
    loop % primeSets.MaxIndex()-1
    {
        pos := InStr(primeSets[A_index], A_tab)
        lineIndex := A_index
        if pos<50
        {
            loop
            {
                if InStr(primeSets[lineIndex], A_tab) == 41
                    break
                primeSets[lineIndex] := StrReplace(primeSets[lineIndex], "$" , "$ ",,1)
            }
        }
    }
    setsFullContentSorted := ""
    loop % primeSets.MaxIndex()-1
    {
        setsFullContentSorted := setsFullContentSorted . primeSets[A_index] . "`r`n"
    }
    Sort, setsFullContentSorted, N P41 R
    setsFullContentSorted := StrReplace(setsFullContentSorted, "$", "")
    setsFullContentSorted := "Prime sets:`r`n" . setsFullContentSorted
    priceFullContentSorted := partsFullContentSorted . "`r`n" . setsFullContentSorted
    fullListArr := []
    loop
    {
        startPos := 1
        endPos := 1700
        endPos := InStr(priceFullContentSorted, "`r`n",, endPos)-1
        if (priceFullContentSorted=="`n")
            break
        fullListArr[A_Index] := SubStr(priceFullContentSorted, startPos, endPos)
        priceFullContentSorted := StrReplace(priceFullContentSorted, fullListArr[A_Index], "")
        if (InStr(priceFullContentSorted, "`r`n") < 10 )
            priceFullContentSorted := StrReplace(priceFullContentSorted, "`r`n", "",, 1)
    }
    ;----------
    ;----posting full list to relic stocks server----
	postdata=
	(
		{
  			"content": "%threeApos%----------\nBelow is the full price list of all prime items in the game. Their values are calcuated from WFM based on the average of lowest 5 (or less if not available) online in-game sell orders. The list will be edited on hourly basis. For any concerns, contact MrSofty#7926\n----------\nLast check: %priceUpdateDateTime%\n----------\n%threeApos%"
		}
	)
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId4
    ;----if there was a previous message, then edit----
    if (ErrorLevel==0)
    {
	    WebRequest.Open("PATCH", "https://discord.com/api/webhooks/851453670133727242/s5TADpV3dldbS5chP0bD1NGnW7T4YK_IODVeErpSkuEO6uIgFJZIDs67iPFbKE0k2ngk/messages/" . webhookMessageId, false)
	    WebRequest.SetRequestHeader("Content-Type", "application/json")
	    WebRequest.Send(postdata)
    }
    ;----if there was not a preivous message, then send new and store id in registry----
    if ErrorLevel {
	    WebRequest.Open("post", "https://discord.com/api/webhooks/851453670133727242/s5TADpV3dldbS5chP0bD1NGnW7T4YK_IODVeErpSkuEO6uIgFJZIDs67iPFbKE0k2ngk?wait=true", false)
	    WebRequest.SetRequestHeader("Content-Type", "application/json")
        loop
        {
	        WebRequest.Send(postdata)
            WebRequest.WaitForResponse()
            if InStr(WebRequest.ResponseText, "Rate limited")
                continue
            break
        }
        messsageBody := WebRequest.ResponseText
        pos1 := InStr(messsageBody, """id"":")
        pos2 := InStr(messsageBody, ",",,pos1)
        length := pos2 - pos1
        webhookMessageId := SubStr(messsageBody, pos1 , length)
        webhookMessageId := StrReplace(webhookMessageId, """id"": ", "")
        webhookMessageId := StrReplace(webhookMessageId, """", "")
        post := StrReplace(post, ",", "")
	    RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId4, % webhookMessageId		;writing new message id to the registry
    }
    loop, 28 ;% fullListArr.MaxIndex()
    {
        lineIndex := A_index
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
        if (A_index==1)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId5
        if (A_index==2)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId6
        if (A_index==3)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId7
        if (A_index==4)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId8
        if (A_index==5)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId9
        if (A_index==6)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId10
        if (A_index==7)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId11
        if (A_index==8)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId12
        if (A_index==9)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId13
        if (A_index==10)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId14
        if (A_index==11)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId15
        if (A_index==12)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId16
        if (A_index==13)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId17
        if (A_index==14)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId18
        if (A_index==15)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId19
        if (A_index==16)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId20
        if (A_index==17)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId21
        if (A_index==18)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId22
        if (A_index==19)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId23
        if (A_index==20)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId24
        if (A_index==21)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId25
        if (A_index==22)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId26
        if (A_index==23)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId27
        if (A_index==24)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId28
        if (A_index==25)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId29
        if (A_index==26)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId30
        if (A_index==27)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId31
        if (A_index==28)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId32
        if (A_index==29)
        {
            FileAppend, Missing webhook id at line %A_LineNumber% `r`n, MissingWebhookIDs.dat
            break
        }
        ;----if there was a previous message, then edit----
        if (ErrorLevel==0)
        {
	        WebRequest.Open("PATCH", "https://discord.com/api/webhooks/851453670133727242/s5TADpV3dldbS5chP0bD1NGnW7T4YK_IODVeErpSkuEO6uIgFJZIDs67iPFbKE0k2ngk/messages/" . webhookMessageId, false)
	        WebRequest.SetRequestHeader("Content-Type", "application/json")
            if !(fullListArr[lineIndex]=="")
	            WebRequest.Send(postdata)
            else
                WebRequest.Send("{""content"": ""--"" }")       ;clearing past messages if length is shorter
        }
        ;----if there was not a preivous message, then send new and store id in registry----
        if ErrorLevel {
	        WebRequest.Open("post", "https://discord.com/api/webhooks/851453670133727242/s5TADpV3dldbS5chP0bD1NGnW7T4YK_IODVeErpSkuEO6uIgFJZIDs67iPFbKE0k2ngk?wait=true", false)
	        WebRequest.SetRequestHeader("Content-Type", "application/json")
            loop
            {
	            WebRequest.Send(postdata)
                WebRequest.WaitForResponse()
                if InStr(WebRequest.ResponseText, "Rate limited")
                    continue
                break
            }
            messsageBody := WebRequest.ResponseText
            pos1 := InStr(messsageBody, """id"":")
            pos2 := InStr(messsageBody, ",",,pos1)
            length := pos2 - pos1
            webhookMessageId := SubStr(messsageBody, pos1 , length)
            webhookMessageId := StrReplace(webhookMessageId, """id"": ", "")
            webhookMessageId := StrReplace(webhookMessageId, """", "")
            post := StrReplace(post, ",", "")
            if (A_index==1)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId5, % webhookMessageId		;writing new message id to the registry
            if (A_index==2)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId6, % webhookMessageId		;writing new message id to the registry
            if (A_index==3)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId7, % webhookMessageId		;writing new message id to the registry
            if (A_index==4)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId8, % webhookMessageId		;writing new message id to the registry
            if (A_index==5)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId9, % webhookMessageId		;writing new message id to the registry
            if (A_index==6)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId10, % webhookMessageId		;writing new message id to the registry
            if (A_index==7)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId11, % webhookMessageId		;writing new message id to the registry
            if (A_index==8)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId12, % webhookMessageId		;writing new message id to the registry
            if (A_index==9)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId13, % webhookMessageId		;writing new message id to the registry
            if (A_index==10)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId14, % webhookMessageId		;writing new message id to the registry
            if (A_index==11)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId15, % webhookMessageId		;writing new message id to the registry
            if (A_index==12)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId16, % webhookMessageId		;writing new message id to the registry
            if (A_index==13)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId17, % webhookMessageId		;writing new message id to the registry
            if (A_index==14)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId18, % webhookMessageId		;writing new message id to the registry
            if (A_index==15)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId19, % webhookMessageId		;writing new message id to the registry
            if (A_index==16)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId20, % webhookMessageId		;writing new message id to the registry
            if (A_index==17)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId21, % webhookMessageId		;writing new message id to the registry
            if (A_index==18)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId22, % webhookMessageId		;writing new message id to the registry
            if (A_index==19)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId23, % webhookMessageId		;writing new message id to the registry
            if (A_index==20)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId24, % webhookMessageId		;writing new message id to the registry
            if (A_index==21)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId25, % webhookMessageId		;writing new message id to the registry
            if (A_index==22)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId26, % webhookMessageId		;writing new message id to the registry
            if (A_index==23)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId27, % webhookMessageId		;writing new message id to the registry
            if (A_index==24)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId28, % webhookMessageId		;writing new message id to the registry
            if (A_index==25)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId29, % webhookMessageId		;writing new message id to the registry
            if (A_index==26)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId30, % webhookMessageId		;writing new message id to the registry
            if (A_index==27)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId31, % webhookMessageId		;writing new message id to the registry
            if (A_index==28)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId32, % webhookMessageId		;writing new message id to the registry
        }
    }
    ;----posting full list to blossoms of the void server
	postdata=
	(
		{
  			"content": "%threeApos%----------\nBelow is the full price list of all prime items in the game. Their values are calcuated from WFM based on the average of lowest 5 (or less if not available) online in-game sell orders. The list will be edited on hourly basis. For any concerns, contact MrSofty#7926\n----------\nLast check: %priceUpdateDateTime%\n----------\n%threeApos%"
		}
	)
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId33
    ;----if there was a previous message, then edit----
    if (ErrorLevel==0)
    {
	    WebRequest.Open("PATCH", "https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV/messages/" . webhookMessageId, false)
	    WebRequest.SetRequestHeader("Content-Type", "application/json")
	    WebRequest.Send(postdata)
    }
    ;----if there was not a preivous message, then send new and store id in registry----
    if ErrorLevel {
	    WebRequest.Open("post", "https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV?wait=true", false)
	    WebRequest.SetRequestHeader("Content-Type", "application/json")
        loop
        {
	        WebRequest.Send(postdata)
            WebRequest.WaitForResponse()
            if InStr(WebRequest.ResponseText, "Rate limited")
                continue
            break
        }
        messsageBody := WebRequest.ResponseText
        pos1 := InStr(messsageBody, """id"":")
        pos2 := InStr(messsageBody, ",",,pos1)
        length := pos2 - pos1
        webhookMessageId := SubStr(messsageBody, pos1 , length)
        webhookMessageId := StrReplace(webhookMessageId, """id"": ", "")
        webhookMessageId := StrReplace(webhookMessageId, """", "")
        post := StrReplace(post, ",", "")
	    RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId33, % webhookMessageId		;writing new message id to the registry
    }
    loop, 28 ;% fullListArr.MaxIndex()
    {
        lineIndex := A_index
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
        if (A_index==1)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId34
        if (A_index==2)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId35
        if (A_index==3)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId36
        if (A_index==4)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId37
        if (A_index==5)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId38
        if (A_index==6)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId39
        if (A_index==7)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId40
        if (A_index==8)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId41
        if (A_index==9)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId42
        if (A_index==10)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId43
        if (A_index==11)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId44
        if (A_index==12)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId45
        if (A_index==13)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId46
        if (A_index==14)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId47
        if (A_index==15)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId48
        if (A_index==16)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId49
        if (A_index==17)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId50
        if (A_index==18)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId51
        if (A_index==19)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId52
        if (A_index==20)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId53
        if (A_index==21)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId54
        if (A_index==22)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId55
        if (A_index==23)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId56
        if (A_index==24)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId57
        if (A_index==25)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId58
        if (A_index==26)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId59
        if (A_index==27)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId60
        if (A_index==28)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId61
        if (A_index==29)
        {
            FileAppend, Missing webhook id at line %A_LineNumber% `r`n, MissingWebhookIDs.dat
            break
        }
        ;----if there was a previous message, then edit----
        if (ErrorLevel==0)
        {
	        WebRequest.Open("PATCH", "https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV/messages/" . webhookMessageId, false)
	        WebRequest.SetRequestHeader("Content-Type", "application/json")
            if !(fullListArr[lineIndex]=="")
	            WebRequest.Send(postdata)
            else
                WebRequest.Send("{""content"": ""--"" }")       ;clearing past messages if length is shorter
        }
        ;----if there was not a preivous message, then send new and store id in registry----
        if ErrorLevel {
	        WebRequest.Open("post", "https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV?wait=true", false)
	        WebRequest.SetRequestHeader("Content-Type", "application/json")
            loop
            {
	            WebRequest.Send(postdata)
                WebRequest.WaitForResponse()
                if InStr(WebRequest.ResponseText, "Rate limited")
                    continue
                break
            }
            messsageBody := WebRequest.ResponseText
            pos1 := InStr(messsageBody, """id"":")
            pos2 := InStr(messsageBody, ",",,pos1)
            length := pos2 - pos1
            webhookMessageId := SubStr(messsageBody, pos1 , length)
            webhookMessageId := StrReplace(webhookMessageId, """id"": ", "")
            webhookMessageId := StrReplace(webhookMessageId, """", "")
            post := StrReplace(post, ",", "")
            if (A_index==1)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId34, % webhookMessageId		;writing new message id to the registry
            if (A_index==2)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId35, % webhookMessageId		;writing new message id to the registry
            if (A_index==3)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId36, % webhookMessageId		;writing new message id to the registry
            if (A_index==4)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId37, % webhookMessageId		;writing new message id to the registry
            if (A_index==5)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId38, % webhookMessageId		;writing new message id to the registry
            if (A_index==6)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId39, % webhookMessageId		;writing new message id to the registry
            if (A_index==7)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId40, % webhookMessageId		;writing new message id to the registry
            if (A_index==8)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId41, % webhookMessageId		;writing new message id to the registry
            if (A_index==9)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId42, % webhookMessageId		;writing new message id to the registry
            if (A_index==10)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId43, % webhookMessageId		;writing new message id to the registry
            if (A_index==11)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId44, % webhookMessageId		;writing new message id to the registry
            if (A_index==12)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId45, % webhookMessageId		;writing new message id to the registry
            if (A_index==13)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId46, % webhookMessageId		;writing new message id to the registry
            if (A_index==14)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId47, % webhookMessageId		;writing new message id to the registry
            if (A_index==15)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId48, % webhookMessageId		;writing new message id to the registry
            if (A_index==16)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId49, % webhookMessageId		;writing new message id to the registry
            if (A_index==17)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId50, % webhookMessageId		;writing new message id to the registry
            if (A_index==18)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId51, % webhookMessageId		;writing new message id to the registry
            if (A_index==19)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId52, % webhookMessageId		;writing new message id to the registry
            if (A_index==20)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId53, % webhookMessageId		;writing new message id to the registry
            if (A_index==21)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId54, % webhookMessageId		;writing new message id to the registry
            if (A_index==22)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId55, % webhookMessageId		;writing new message id to the registry
            if (A_index==23)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId56, % webhookMessageId		;writing new message id to the registry
            if (A_index==24)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId57, % webhookMessageId		;writing new message id to the registry
            if (A_index==25)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId58, % webhookMessageId		;writing new message id to the registry
            if (A_index==26)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId59, % webhookMessageId		;writing new message id to the registry
            if (A_index==27)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId60, % webhookMessageId		;writing new message id to the registry
            if (A_index==28)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId61, % webhookMessageId		;writing new message id to the registry
        }
    }
    ;------------
    ;sending ducat parts
    arrayIndex := 1
    loop, 2 ;% ducatListArr.MaxIndex()
    {
        if (ducatListArr[arrayIndex][A_index][1] == "")
            break
        ducatListPartNames1 := ""
        ducatListPartPrices1 := ""
        ducatListPartDucats1 := ""
        loop % ducatListArr[arrayIndex].MaxIndex()
        {
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "$", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "ducats:", "")
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "`r`n", "")
            ducatListArr[arrayIndex][A_index][2] := StrReplace(ducatListArr[arrayIndex][A_index][2], "`r`n", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "`r`n", "")
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "`r", "")
            ducatListArr[arrayIndex][A_index][2] := StrReplace(ducatListArr[arrayIndex][A_index][2], "`r", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "`r", "")
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "`n", "")
            ducatListArr[arrayIndex][A_index][2] := StrReplace(ducatListArr[arrayIndex][A_index][2], "`n", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "`n", "")
            ducatListPartNames1 := ducatListPartNames1 . ducatListArr[arrayIndex][A_index][1] . "\n"
            ducatListPartPrices1 := ducatListPartPrices1 . ducatListArr[arrayIndex][A_index][2] . "\n"
            ducatListPartDucats1 := ducatListPartDucats1 . ducatListArr[arrayIndex][A_index][3] . "\n"
        }
        arrayIndex++
        ducatListPartNames2 := ""
        ducatListPartPrices2 := ""
        ducatListPartDucats2 := ""
        loop % ducatListArr[arrayIndex].MaxIndex()
        {
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "$", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "ducats:", "")
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "`r`n", "")
            ducatListArr[arrayIndex][A_index][2] := StrReplace(ducatListArr[arrayIndex][A_index][2], "`r`n", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "`r`n", "")
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "`r", "")
            ducatListArr[arrayIndex][A_index][2] := StrReplace(ducatListArr[arrayIndex][A_index][2], "`r", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "`r", "")
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "`n", "")
            ducatListArr[arrayIndex][A_index][2] := StrReplace(ducatListArr[arrayIndex][A_index][2], "`n", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "`n", "")
            ducatListPartNames2 := ducatListPartNames2 . ducatListArr[arrayIndex][A_index][1] . "\n"
            ducatListPartPrices2 := ducatListPartPrices2 . ducatListArr[arrayIndex][A_index][2] . "\n"
            ducatListPartDucats2 := ducatListPartDucats2 . ducatListArr[arrayIndex][A_index][3] . "\n"
        }
        arrayIndex++
        ducatListPartNames3 := ""
        ducatListPartPrices3 := ""
        ducatListPartDucats3 := ""
        loop % ducatListArr[arrayIndex].MaxIndex()
        {
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "$", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "ducats:", "")
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "`r`n", "")
            ducatListArr[arrayIndex][A_index][2] := StrReplace(ducatListArr[arrayIndex][A_index][2], "`r`n", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "`r`n", "")
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "`r", "")
            ducatListArr[arrayIndex][A_index][2] := StrReplace(ducatListArr[arrayIndex][A_index][2], "`r", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "`r", "")
            ducatListArr[arrayIndex][A_index][1] := StrReplace(ducatListArr[arrayIndex][A_index][1], "`n", "")
            ducatListArr[arrayIndex][A_index][2] := StrReplace(ducatListArr[arrayIndex][A_index][2], "`n", "")
            ducatListArr[arrayIndex][A_index][3] := StrReplace(ducatListArr[arrayIndex][A_index][3], "`n", "")
            ducatListPartNames3 := ducatListPartNames3 . ducatListArr[arrayIndex][A_index][1] . "\n"
            ducatListPartPrices3 := ducatListPartPrices3 . ducatListArr[arrayIndex][A_index][2] . "\n"
            ducatListPartDucats3 := ducatListPartDucats3 . ducatListArr[arrayIndex][A_index][3] . "\n"
        }
        arrayIndex++
        if (ducatListPartNames1=="")
        {
            ducatListPartNames1 := "\u200b"
            ducatListPartPrices1 := "\u200b"
            ducatListPartDucats1 := "\u200b"
        }
        if (ducatListPartNames2=="")
        {
            ducatListPartNames2 := "\u200b"
            ducatListPartPrices2 := "\u200b"
            ducatListPartDucats2 := "\u200b"
        }
        if (ducatListPartNames3=="")
        {
            ducatListPartNames3 := "\u200b"
            ducatListPartPrices3 := "\u200b"
            ducatListPartDucats3 := "\u200b"
        }
	    postdata=
	    (
            {
                "content": "",
	            "embeds": [{
			        "fields": [
                    {
                        "name": "Prime Part",
                        "value": "%ducatListPartNames1%",
                        "inline": "true"
                    },
                    {
                        "name": "Price",
                        "value": "%ducatListPartPrices1%",
                        "inline": "true"
                    },
                    {
                        "name": "Ducats",
                        "value": "%ducatListPartDucats1%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "%ducatListPartNames2%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "%ducatListPartPrices2%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "%ducatListPartDucats2%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "%ducatListPartNames3%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "%ducatListPartPrices3%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "%ducatListPartDucats3%",
                        "inline": "true"
                    }
                    ]
		        }]
            }
	    )
        if (A_index==1)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId2000
        if (A_index==2)
        {
            FileAppend, % "Missing webhook id at line" . A_LineNumber . "`r`n", MissingWebhookIDs.dat
            break
        }
        ;----if there was a previous message, then edit----
        if (ErrorLevel==0)
        {
	        WebRequest.Open("PATCH", "https://discord.com/api/webhooks/851462538553983006/gMm_nWRtA-mCDZiwRvke8ay8mupnF6qhv_v3omyssq4cbfrtKpyoUXiAbSfIHxieoPyA/messages/" . webhookMessageId, false)
	        WebRequest.SetRequestHeader("Content-Type", "application/json")
            if !(ducatListPartNames1=="")
	            WebRequest.Send(postdata)
            else
                WebRequest.Send("{""content"": ""--"" }")       ;clearing past messages if length is shorter
        }
        ;----if there was not a preivous message, then send new and store id in registry----
        if ErrorLevel {
	        WebRequest.Open("post", "https://discord.com/api/webhooks/851462538553983006/gMm_nWRtA-mCDZiwRvke8ay8mupnF6qhv_v3omyssq4cbfrtKpyoUXiAbSfIHxieoPyA?wait=true", false)
	        WebRequest.SetRequestHeader("Content-Type", "application/json")
            loop
            {
	            WebRequest.Send(postdata)
                WebRequest.WaitForResponse()
                if InStr(WebRequest.ResponseText, "Rate limited")
                    continue
                break
            }
            messsageBody := WebRequest.ResponseText
            pos1 := InStr(messsageBody, """id"":")
            pos2 := InStr(messsageBody, ",",,pos1)
            length := pos2 - pos1
            webhookMessageId := SubStr(messsageBody, pos1 , length)
            webhookMessageId := StrReplace(webhookMessageId, """id"": ", "")
            webhookMessageId := StrReplace(webhookMessageId, """", "")
            post := StrReplace(post, ",", "")
            if (A_index==1)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId2000, % webhookMessageId		;writing new message id to the registry
            if (A_index==2)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId2001, % webhookMessageId		;writing new message id to the registry
            if (A_index==3)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId2002, % webhookMessageId		;writing new message id to the registry
        }
    }
    ;---posting relic list to relic stocks server----
	postdata=
	(
		{
  			"content": "%threeApos%%threeApos%%threeApos%----------\nRelic prices are listed below. These prices might not be accurate due to low relic sales and fluctuate from time to time. But you get an idea for a specific relic. If no in-game order, it will be marked N/A.\nAdditionally, the relics have symbols next to them for more info. These are described below:\n(V) Vaulted Relic\n(B) Baro ki'teer Exclusive Relic\n(P) Prime unvault Relic\n(E) Next vault expected Relic\n----------\n%threeApos%%threeApos%%threeApos%"
		}
	)
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId63
    ;----if there was a previous message, then edit----
    if (ErrorLevel==0)
    {
	    WebRequest.Open("PATCH", "https://discord.com/api/webhooks/851387436101795851/UQ58dKyjJH5dBc2g3BeJdcn6Qk3eEzopdCBP96Tp0UkBq9VIdGGpX2K8FaWlTFhmMo4E/messages/" . webhookMessageId, false)
	    WebRequest.SetRequestHeader("Content-Type", "application/json")
	    WebRequest.Send(postdata)
    }
    ;----if there was not a preivous message, then send new and store id in registry----
    if ErrorLevel {
	    WebRequest.Open("post", "https://discord.com/api/webhooks/851387436101795851/UQ58dKyjJH5dBc2g3BeJdcn6Qk3eEzopdCBP96Tp0UkBq9VIdGGpX2K8FaWlTFhmMo4E?wait=true", false)
	    WebRequest.SetRequestHeader("Content-Type", "application/json")
        loop
        {
	        WebRequest.Send(postdata)
            WebRequest.WaitForResponse()
            if InStr(WebRequest.ResponseText, "Rate limited")
                continue
            break
        }
        messsageBody := WebRequest.ResponseText
        pos1 := InStr(messsageBody, """id"":")
        pos2 := InStr(messsageBody, ",",,pos1)
        length := pos2 - pos1
        webhookMessageId := SubStr(messsageBody, pos1 , length)
        webhookMessageId := StrReplace(webhookMessageId, """id"": ", "")
        webhookMessageId := StrReplace(webhookMessageId, """", "")
        post := StrReplace(post, ",", "")
	    RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId63, % webhookMessageId		;writing new message id to the registry
    }
    arrayIndex := 1
    loop, 8 ;% relicListArr.MaxIndex()
    {
        if (relicListArr[arrayIndex][A_index][1] == "")
            break
        relicListPartNames1 := ""
        relicListPartPrices1 := ""
        loop % relicListArr[arrayIndex].MaxIndex()
        {
            if (relicListArr[arrayIndex][A_index][1]=="")
                break
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], ":", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r`n", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`n", "")
            relicListPartNames1 := relicListPartNames1 . relicListArr[arrayIndex][A_index][1] . "\n"
            relicListPartPrices1 := relicListPartPrices1 . relicListArr[arrayIndex][A_index][2] . "\n"
        }
        arrayIndex++
        relicListPartNames2 := ""
        relicListPartPrices2 := ""
        loop % relicListArr[arrayIndex].MaxIndex()
        {
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], ":", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r`n", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`n", "")
            relicListPartNames2 := relicListPartNames2 . relicListArr[arrayIndex][A_index][1] . "\n"
            relicListPartPrices2 := relicListPartPrices2 . relicListArr[arrayIndex][A_index][2] . "\n"
        }
        arrayIndex++
        relicListPartNames3 := ""
        relicListPartPrices3 := ""
        loop % relicListArr[arrayIndex].MaxIndex()
        {
            if (relicListArr[arrayIndex][A_index][1]=="")
                break
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], ":", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r`n", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`n", "")
            relicListPartNames3 := relicListPartNames3 . relicListArr[arrayIndex][A_index][1] . "\n"
            relicListPartPrices3 := relicListPartPrices3 . relicListArr[arrayIndex][A_index][2] . "\n"
        }
        arrayIndex++
        relicListPartNames4 := ""
        relicListPartPrices4 := ""
        loop % relicListArr[arrayIndex].MaxIndex()
        {
            if (relicListArr[arrayIndex][A_index][1]=="")
                break
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], ":", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r`n", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`n", "")
            relicListPartNames4 := relicListPartNames4 . relicListArr[arrayIndex][A_index][1] . "\n"
            relicListPartPrices4 := relicListPartPrices4 . relicListArr[arrayIndex][A_index][2] . "\n"
        }
        arrayIndex++
        relicListPartNames5 := ""
        relicListPartPrices5 := ""
        loop % relicListArr[arrayIndex].MaxIndex()
        {
            if (relicListArr[arrayIndex][A_index][1]=="")
                break
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], ":", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r`n", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`n", "")
            relicListPartNames5 := relicListPartNames5 . relicListArr[arrayIndex][A_index][1] . "\n"
            relicListPartPrices5 := relicListPartPrices5 . relicListArr[arrayIndex][A_index][2] . "\n"
        }
        arrayIndex++
        fieldName1_1 := "Relic"
        fieldName1_2 := "Price"
        fieldName2_1 := "Relic"
        fieldName2_2 := "Price"
        fieldName3_1 := "Relic"
        fieldName3_2 := "Price"
        fieldName4_1 := "Relic"
        fieldName4_2 := "Price"
        fieldName5_1 := "Relic"
        fieldName5_2 := "Price"
        if (relicListPartNames1=="")
        {
            fieldName1_1 := "\u200b"
            fieldName1_2 := "\u200b"
            relicListPartNames1 := "\u200b"
            relicListPartPrices1 := "\u200b"
        }
        if (relicListPartNames2=="")
        {
            fieldName2_1 := "\u200b"
            fieldName2_2 := "\u200b"
            relicListPartNames2 := "\u200b"
            relicListPartPrices2 := "\u200b"
        }
        if (relicListPartNames3=="")
        {
            fieldName3_1 := "\u200b"
            fieldName3_2 := "\u200b"
            relicListPartNames3 := "\u200b"
            relicListPartPrices3 := "\u200b"
        }
        if (relicListPartNames4=="")
        {
            fieldName4_1 := "\u200b"
            fieldName4_2 := "\u200b"
            relicListPartNames4 := "\u200b"
            relicListPartPrices4 := "\u200b"
        }
        if (relicListPartNames5=="")
        {
            fieldName5_1 := "\u200b"
            fieldName5_2 := "\u200b"
            relicListPartNames5 := "\u200b"
            relicListPartPrices5 := "\u200b"
        }
	    postdata=
	    (
            {
                "content": "",
	            "embeds": [{
			        "fields": [
                    {
                        "name": "%fieldName1_1%",
                        "value": "%relicListPartNames1%",
                        "inline": "true"
                    },
                    {
                        "name": "%fieldName1_2%",
                        "value": "%relicListPartPrices1%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "\u200b"
                    },
                    {
                        "name": "%fieldName2_1%",
                        "value": "%relicListPartNames2%",
                        "inline": "true"
                    },
                    {
                        "name": "%fieldName2_2%",
                        "value": "%relicListPartPrices2%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "\u200b"
                    },
                    {
                        "name": "%fieldName3_1%",
                        "value": "%relicListPartNames3%",
                        "inline": "true"
                    },
                    {
                        "name": "%fieldName3_2%",
                        "value": "%relicListPartPrices3%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "\u200b"
                    },
                    {
                        "name": "%fieldName4_1%",
                        "value": "%relicListPartNames4%",
                        "inline": "true"
                    },
                    {
                        "name": "%fieldName4_2%",
                        "value": "%relicListPartPrices4%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "\u200b"
                    },
                    {
                        "name": "%fieldName5_1%",
                        "value": "%relicListPartNames5%",
                        "inline": "true"
                    },
                    {
                        "name": "%fieldName5_2%",
                        "value": "%relicListPartPrices5%",
                        "inline": "true"
                    }
                    ]
		        }]
            }
	    )
        if (A_index==1)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId64
        if (A_index==2)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId65
        if (A_index==3)
        {
            FileAppend, Missing webhook id at line %A_LineNumber% `r`n, MissingWebhookIDs.dat
            break
        }
        ;----if there was a previous message, then edit----
        if (ErrorLevel==0)
        {
	        WebRequest.Open("PATCH", "https://discord.com/api/webhooks/851387436101795851/UQ58dKyjJH5dBc2g3BeJdcn6Qk3eEzopdCBP96Tp0UkBq9VIdGGpX2K8FaWlTFhmMo4E/messages/" . webhookMessageId, false)
	        WebRequest.SetRequestHeader("Content-Type", "application/json")
            if !(relicListPartNames1=="")
	            WebRequest.Send("{""content"": ""--"",""embeds"": """" }")
            else
	            WebRequest.Send("{""content"": ""--"",""embeds"": """" }")      ;clearing past messages if length is shorter
        }
        ;----if there was not a preivous message, then send new and store id in registry----
        if ErrorLevel {
	        WebRequest.Open("post", "https://discord.com/api/webhooks/851387436101795851/UQ58dKyjJH5dBc2g3BeJdcn6Qk3eEzopdCBP96Tp0UkBq9VIdGGpX2K8FaWlTFhmMo4E?wait=true", false)
	        WebRequest.SetRequestHeader("Content-Type", "application/json")
            loop
            {
	            WebRequest.Send(postdata)
                WebRequest.WaitForResponse()
                if InStr(WebRequest.ResponseText, "Rate limited")
                    continue
                break
            }
            messsageBody := WebRequest.ResponseText
            pos1 := InStr(messsageBody, """id"":")
            pos2 := InStr(messsageBody, ",",,pos1)
            length := pos2 - pos1
            webhookMessageId := SubStr(messsageBody, pos1 , length)
            webhookMessageId := StrReplace(webhookMessageId, """id"": ", "")
            webhookMessageId := StrReplace(webhookMessageId, """", "")
            post := StrReplace(post, ",", "")
            if (A_index==1)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId64, % webhookMessageId		;writing new message id to the registry
            if (A_index==2)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId65, % webhookMessageId		;writing new message id to the registry
        }
    }
    */
    ;---posting relic list to blossoms of the void server----
	postdata=
	(
		{
  			"content": "%threeApos%%threeApos%%threeApos%----------\nRelic prices are listed below. These prices might not be accurate due to low relic sales and fluctuate from time to time. But you get an idea for a specific relic. If no in-game order, it will be marked N/A.\nAdditionally, the relics have symbols next to them for more info. These are described below:\n(V) Vaulted Relic\n(B) Baro ki'teer Exclusive Relic\n(P) Prime unvault Relic\n(E) Next vault expected Relic\n----------\n%threeApos%%threeApos%%threeApos%"
		}
	)
    RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId72
    ;----if there was a previous message, then edit----
    if (ErrorLevel==0)
    {
	    WebRequest.Open("PATCH", "https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV/messages/" . webhookMessageId, false)
	    WebRequest.SetRequestHeader("Content-Type", "application/json")
	    WebRequest.Send(postdata)
    }
    ;----if there was not a preivous message, then send new and store id in registry----
    if ErrorLevel {
	    WebRequest.Open("post", "https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV?wait=true", false)
	    WebRequest.SetRequestHeader("Content-Type", "application/json")
        loop
        {
	        WebRequest.Send(postdata)
            WebRequest.WaitForResponse()
            if InStr(WebRequest.ResponseText, "Rate limited")
                continue
            break
        }
        messsageBody := WebRequest.ResponseText
        pos1 := InStr(messsageBody, """id"":")
        pos2 := InStr(messsageBody, ",",,pos1)
        length := pos2 - pos1
        webhookMessageId := SubStr(messsageBody, pos1 , length)
        webhookMessageId := StrReplace(webhookMessageId, """id"": ", "")
        webhookMessageId := StrReplace(webhookMessageId, """", "")
        post := StrReplace(post, ",", "")
	    RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId72, % webhookMessageId		;writing new message id to the registry
    }
    arrayIndex := 1
    loop, 8 ;% relicListArr.MaxIndex()
    {
        if (relicListArr[arrayIndex][A_index][1] == "")
            break
        relicListPartNames1 := ""
        relicListPartPrices1 := ""
        loop % relicListArr[arrayIndex].MaxIndex()
        {
            if (relicListArr[arrayIndex][A_index][1]=="")
                break
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], ":", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r`n", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`n", "")
            relicListPartNames1 := relicListPartNames1 . relicListArr[arrayIndex][A_index][1] . "\n"
            relicListPartPrices1 := relicListPartPrices1 . relicListArr[arrayIndex][A_index][2] . "\n"
        }
        arrayIndex++
        relicListPartNames2 := ""
        relicListPartPrices2 := ""
        loop % relicListArr[arrayIndex].MaxIndex()
        {
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], ":", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r`n", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`n", "")
            relicListPartNames2 := relicListPartNames2 . relicListArr[arrayIndex][A_index][1] . "\n"
            relicListPartPrices2 := relicListPartPrices2 . relicListArr[arrayIndex][A_index][2] . "\n"
        }
        arrayIndex++
        relicListPartNames3 := ""
        relicListPartPrices3 := ""
        loop % relicListArr[arrayIndex].MaxIndex()
        {
            if (relicListArr[arrayIndex][A_index][1]=="")
                break
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], ":", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r`n", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`n", "")
            relicListPartNames3 := relicListPartNames3 . relicListArr[arrayIndex][A_index][1] . "\n"
            relicListPartPrices3 := relicListPartPrices3 . relicListArr[arrayIndex][A_index][2] . "\n"
        }
        arrayIndex++
        relicListPartNames4 := ""
        relicListPartPrices4 := ""
        loop % relicListArr[arrayIndex].MaxIndex()
        {
            if (relicListArr[arrayIndex][A_index][1]=="")
                break
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], ":", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r`n", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`n", "")
            relicListPartNames4 := relicListPartNames4 . relicListArr[arrayIndex][A_index][1] . "\n"
            relicListPartPrices4 := relicListPartPrices4 . relicListArr[arrayIndex][A_index][2] . "\n"
        }
        arrayIndex++
        relicListPartNames5 := ""
        relicListPartPrices5 := ""
        loop % relicListArr[arrayIndex].MaxIndex()
        {
            if (relicListArr[arrayIndex][A_index][1]=="")
                break
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], ":", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r`n", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`r", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`r", "")
            relicListArr[arrayIndex][A_index][1] := StrReplace(relicListArr[arrayIndex][A_index][1], "`n", "")
            relicListArr[arrayIndex][A_index][2] := StrReplace(relicListArr[arrayIndex][A_index][2], "`n", "")
            relicListPartNames5 := relicListPartNames5 . relicListArr[arrayIndex][A_index][1] . "\n"
            relicListPartPrices5 := relicListPartPrices5 . relicListArr[arrayIndex][A_index][2] . "\n"
        }
        arrayIndex++
        fieldName1_1 := "Relic"
        fieldName1_2 := "Price"
        fieldName2_1 := "Relic"
        fieldName2_2 := "Price"
        fieldName3_1 := "Relic"
        fieldName3_2 := "Price"
        fieldName4_1 := "Relic"
        fieldName4_2 := "Price"
        fieldName5_1 := "Relic"
        fieldName5_2 := "Price"
        if (relicListPartNames1=="")
        {
            fieldName1_1 := "\u200b"
            fieldName1_2 := "\u200b"
            relicListPartNames1 := "\u200b"
            relicListPartPrices1 := "\u200b"
        }
        if (relicListPartNames2=="")
        {
            fieldName2_1 := "\u200b"
            fieldName2_2 := "\u200b"
            relicListPartNames2 := "\u200b"
            relicListPartPrices2 := "\u200b"
        }
        if (relicListPartNames3=="")
        {
            fieldName3_1 := "\u200b"
            fieldName3_2 := "\u200b"
            relicListPartNames3 := "\u200b"
            relicListPartPrices3 := "\u200b"
        }
        if (relicListPartNames4=="")
        {
            fieldName4_1 := "\u200b"
            fieldName4_2 := "\u200b"
            relicListPartNames4 := "\u200b"
            relicListPartPrices4 := "\u200b"
        }
        if (relicListPartNames5=="")
        {
            fieldName5_1 := "\u200b"
            fieldName5_2 := "\u200b"
            relicListPartNames5 := "\u200b"
            relicListPartPrices5 := "\u200b"
        }
	    postdata=
	    (
            {
                "content": "",
	            "embeds": [{
			        "fields": [
                    {
                        "name": "%fieldName1_1%",
                        "value": "%relicListPartNames1%",
                        "inline": "true"
                    },
                    {
                        "name": "%fieldName1_2%",
                        "value": "%relicListPartPrices1%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "\u200b"
                    },
                    {
                        "name": "%fieldName2_1%",
                        "value": "%relicListPartNames2%",
                        "inline": "true"
                    },
                    {
                        "name": "%fieldName2_2%",
                        "value": "%relicListPartPrices2%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "\u200b"
                    },
                    {
                        "name": "%fieldName3_1%",
                        "value": "%relicListPartNames3%",
                        "inline": "true"
                    },
                    {
                        "name": "%fieldName3_2%",
                        "value": "%relicListPartPrices3%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "\u200b"
                    },
                    {
                        "name": "%fieldName4_1%",
                        "value": "%relicListPartNames4%",
                        "inline": "true"
                    },
                    {
                        "name": "%fieldName4_2%",
                        "value": "%relicListPartPrices4%",
                        "inline": "true"
                    },
                    {
                        "name": "\u200b",
                        "value": "\u200b"
                    },
                    {
                        "name": "%fieldName5_1%",
                        "value": "%relicListPartNames5%",
                        "inline": "true"
                    },
                    {
                        "name": "%fieldName5_2%",
                        "value": "%relicListPartPrices5%",
                        "inline": "true"
                    }
                    ]
		        }]
            }
	    )
        if (A_index==1)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId73
        if (A_index==2)
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId74
        if (A_index==3)
        {
            FileAppend, Missing webhook id at line %A_LineNumber% `r`n, MissingWebhookIDs.dat
            break
        }
        ;----if there was a previous message, then edit----
        if (ErrorLevel==0)
        {
	        WebRequest.Open("PATCH", "https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV/messages/" . webhookMessageId, false)
	        WebRequest.SetRequestHeader("Content-Type", "application/json")
            if !(relicListPartNames1=="")
	            WebRequest.Send("{""content"": ""--"",""embeds"": """" }")
            else
	            WebRequest.Send("{""content"": ""--"",""embeds"": """" }")      ;clearing past messages if length is shorter
        }
        ;----if there was not a preivous message, then send new and store id in registry----
        if ErrorLevel {
	        WebRequest.Open("post", "https://discord.com/api/webhooks/847545977953845249/8-UsARSPccT3ZpHf_0WbBYxqcDYiLBP3LJk7mPu4mmXmKTPWIyfM-hwrixzTSw27dhcV?wait=true", false)
	        WebRequest.SetRequestHeader("Content-Type", "application/json")
            loop
            {
	            WebRequest.Send(postdata)
                WebRequest.WaitForResponse()
                if InStr(WebRequest.ResponseText, "Rate limited")
                    continue
                break
            }
            messsageBody := WebRequest.ResponseText
            pos1 := InStr(messsageBody, """id"":")
            pos2 := InStr(messsageBody, ",",,pos1)
            length := pos2 - pos1
            webhookMessageId := SubStr(messsageBody, pos1 , length)
            webhookMessageId := StrReplace(webhookMessageId, """id"": ", "")
            webhookMessageId := StrReplace(webhookMessageId, """", "")
            post := StrReplace(post, ",", "")
            if (A_index==1)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId73, % webhookMessageId		;writing new message id to the registry
            if (A_index==2)
	            RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, webhookMessageId74, % webhookMessageId		;writing new message id to the registry
        }
    }
    return

totalRelics:
    count := 0
    loop % relicsArr.MaxIndex()-1
    {
        count += relicsArr[A_Index][2]
    }
    GuiControl, main_interface:, totalRelics , Total Relics:  %count%
    return

offcycleRelics:
    Gui, offcycle_relic_interface:New,, Offcycle Relics
    FileRead, offcycleRelics, relicsDB.dat
    offcycleRelics := StrSplit(offcycleRelics, "`r`n")
    loop % offcycleRelics.MaxIndex()-1
    {
        offcycleRelics[A_Index] := StrSplit(offcycleRelics[A_Index], ": ")
    }
    offcycleRelicList := ""
    loop % offcycleRelics.MaxIndex()-1
    {
        relicIndex := A_index
        if InStr(offcycleRelics[relicIndex][1], "(V)") || InStr(offcycleRelics[relicIndex][1], "(B)") || InStr(offcycleRelics[relicIndex][1], "(P)") || InStr(offcycleRelics[relicIndex][1], "(E)")
            continue
        relicName := offcycleRelics[relicIndex][1]
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
    if (currentHour != A_Hour)
    {
        gosub updatePriceDB
    }
    return

checkForLowPrice:
    if apiUpdating
        return
    checkPrice("loki_prime_systems", 320, 200)
    checkPrice("loki_prime_set", 400, 200)
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
        msgbox,,, Trade message ready, 0.5
    }
    return

ducatPartsUpdate:       ;will be executed every 5 minutes
    if apiUpdating
        return
    FileRead, ducatPartsNames, ducatPrimeParts.dat
    ducatPartsNames := StrSplit(ducatPartsNames, "`r`n")
    file_name := "100ducatSellersInfo.json"
    FileDelete, %file_name%
    ;----indicating start of file----
    file := FileOpen(file_name, "a")
    file.write("{")
    file.close
    ;--------------------------------
    loop % ducatPartsNames.MaxIndex()-1
    {
        status := getOrder(ducatPartsNames[A_index],file_name)
        if (status != 0)
            msgbox % "Error occured at line " A_LineNumber
        ;----adding comma before next order----
        if (A_index != ducatPartsNames.MaxIndex()-1)
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
    ducatSellersInfo := Jxon_Load(ducatSellersInfo)
    FileRead, ducatPartsNames, ducatPrimeParts.dat
    ducatPartsNames := StrSplit(ducatPartsNames, "`r`n")
    loop % ducatPartsNames.MaxIndex()-1 ;% relicListArr.MaxIndex()
    {
        mainLoopIndex := A_index
        item_Url := ducatPartsNames[A_index]
        sellerNames := ""
        partQuantity := ""
        partPrice := ""
        postdata := "{""content"":"""",""embeds"": [{ ""fields"": ["
        loop % ducatSellersInfo[item_Url].MaxIndex()
        {
            if ((ducatSellersInfo[item_Url][A_index].quantity >= 2 && ducatSellersInfo[item_Url][A_index].price <= 15) || (ducatSellersInfo[item_Url][A_index].quantity >= 1 && ducatSellersInfo[item_Url][A_index].price <= 12))
            {
                sellerNames := sellerNames . ducatSellersInfo[item_Url][A_index].seller . "\n"
                partQuantity := partQuantity . ducatSellersInfo[item_Url][A_index].quantity . "\n"
                partPrice := partPrice . ducatSellersInfo[item_Url][A_index].price . "\n"
            }
        }
        if InStr(sellerNames, "_")
            sellerNames := StrReplace(sellerNames, "_", "\\_")
        if (sellerNames != "")      ;adding a new field in discord embed
        {
            postdata := postdata . "{""name"": ""Seller"",""value"": """ sellerNames """,""inline"": ""true""},"
            postdata := postdata . "{""name"": ""Quantity"",""value"": """ partQuantity """,""inline"": ""true""},"
            postdata := postdata . "{""name"": ""Price"",""value"": """ partPrice """,""inline"": ""true""}],"
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
            postdata := postdata . """title"": """ partName ""","
            FormatTime, currentTimeFormatted, %A_NowUTC%, yyyy-MM-ddTHH:mm:ss.000Z
            ;postdata := postdata . """timestamp"": """ A_YYYY "-" A_MM "-" A_DD "T" (A_Hour-5) ":" A_Min ":" A_Sec ".000Z" ""","
            postdata := postdata . """timestamp"": """ currentTimeFormatted ""","
            postdata := postdata . """url"": ""https://warframe.market/items/" item_Url """}]}"
        }
        else
            postdata := "{""content"": ""--"",""embeds"": """"}"
        ;FileDelete, discordMessage.json
        ;file := FileOpen("discordMessage.json", "w")
        ;file.Write(postdata)
        ;file.close()
        ;clearing previous embeds
        messageIdStartIndex := mainLoopIndex + 2000
        RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
        regStatus := ErrorLevel
        loopEndingIndex := ducatPartsNames.MaxIndex()-1
        sendDiscordMessage("https://discord.com/api/webhooks/851462538553983006/gMm_nWRtA-mCDZiwRvke8ay8mupnF6qhv_v3omyssq4cbfrtKpyoUXiAbSfIHxieoPyA", postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
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
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, guiX, %guiX%
	RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, guiY, %guiY%
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
    Send i1
    return

NumpadMult::
    if !WinActive("ahk_exe Warframe.x64.exe")
    {
        send {*}
        return
    }
    Send p4
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
    Send t7
    return

f1::reload

;----functions----
checkPrice(item_Url, priceNumHigh, priceNumLow)
{
    if (item_Url=="")
    {
        msgbox, Please input an item url
        return
    }
    WebRequest2 := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    url2 := "https://api.warframe.market/v1/items/" . item_url . "/orders"
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
        partResponse2 := StrSplit(WebRequest2.ResponseText, "{")
    }
    catch e 
    {
        Fileappend, % "[" A_hour ":" A_Min ":" A_Sec "] " "Crucial Error in check price occured`r`n" , Error log.dat
        return
    }
    values2 := ""
    loop % partResponse2.MaxIndex()
    {
        if InStr(partResponse2[A_Index], """order_type"": ""sell""") && InStr(partResponse2[A_Index+1], """status"": ""ingame""")
        {
            if InStr(partResponse2[A_Index], "platinum")
                lineIndex2 := A_Index
            else if InStr(partResponse2[A_Index+1], "platinum")
                lineIndex2 := A_Index+1
            else
            {
                msgbox % partResponse2[A_Index] partResponse2[A_Index+1]
                return
            }
            pos12 := InStr(partResponse2[lineIndex2], """platinum")
            pos22 := InStr(partResponse2[lineIndex2], ",",,pos12)
            length2 := pos22-pos12
            post2 := SubStr(partResponse2[lineIndex2], pos12 , length2)
            post2 := StrReplace(post2, """platinum"": ", "")
            post2 := Ceil(post2)   ;converting to int
            values2 := values2 . post2 . "`r`n"
        }
    }
    Sort, values2, N
    values2 := StrSplit(values2, "`r`n")
    price := values2[1]
    if (price <= priceNumHigh) AND (price != 0) AND (price >= priceNumLow)
    {
        discordLowPriceNotify=
	    (
		    {
  			    "content": "%item_Url% is currently available for %price%p."
		    }
	    )
	    WebRequest2.Open("Post", "https://discord.com/api/webhooks/838179813155799041/AflKA0ohL5jwPtkhl_08hrmtL_YbnJgU-36D6o_LwuyCfOiqcKRNlih-A7Ed1spgqcdz", false)
	    WebRequest2.SetRequestHeader("Content-Type", "application/json")
	    WebRequest2.Send(discordLowPriceNotify)
    }
    return 
}
LogRewards()
{
    SetTimer, rewardLogging, -5000
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
    string := string . "]"
    file.write(string)
    file.close()
    string := ""
    return 0
}
sendDiscordMessage(url, postdata, regStatus, webhookMessageId, messageIdStartIndex, mainLoopIndex, loopEndingIndex)
{
    WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    ;----if there was a previous message, then edit----
    if (regStatus==0)
    {
        WebRequest.Open("PATCH", url . "/messages/" . webhookMessageId, false)
        WebRequest.SetRequestHeader("Content-Type", "application/json")
        loop
        {
            WebRequest.Send(postdata)
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
                msgbox % "Error occured while editing discord message at line " A_LineNumber
                msgbox % WebRequest.ResponseText
                continue
            }
            break
        }
    }
    ;----if there was not a preivous message, then send new and store id in registry----
    else if regStatus {
        WebRequest.Open("post", url . "?wait=true", false)
        WebRequest.SetRequestHeader("Content-Type", "application/json")
        loop
        {
            WebRequest.Send(postdata)
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
                msgbox % "Error occured while sending discord message at line " A_LineNumber
                msgbox % WebRequest.ResponseText
                continue
            }
            break
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
            messageIdStartIndex := mainLoopIndex + 2000 + A_index
            RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIdStartIndex%
            WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
            WebRequest.Open("PATCH", "https://discord.com/api/webhooks/851462538553983006/gMm_nWRtA-mCDZiwRvke8ay8mupnF6qhv_v3omyssq4cbfrtKpyoUXiAbSfIHxieoPyA/messages/" . webhookMessageId, false)
            WebRequest.SetRequestHeader("Content-Type", "application/json")
            loop
            {
                WebRequest.Send("{""content"": ""--"",""embeds"": """"}")
                WebRequest.WaitForResponse()
                if InStr(WebRequest.ResponseText, "404: not found")
                    break
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
                    msgbox % "Error occured while editing discord message at line " A_LineNumber
                    msgbox % WebRequest.ResponseText
                    continue
                }
                break
            }
            if InStr(WebRequest.ResponseText, "404: not found")
                break
        }
    }
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

/*
1::
    file_name := "itemsOrderInfo.json"
    FileDelete, %file_name%
    ;----indicating start of file----
    file := FileOpen(file_name, "a")
    file.write("{")
    file.close
    ;--------------------------------
    status := getOrder("mirage_prime_systems",file_name)
    ;----adding comma before second order----
    file := FileOpen(file_name, "a")
    file.write(",")
    file.close
    ;-----------------------------------------
    status := getOrder("mirage_prime_neuroptics",file_name)
    ;----indicating end of file------
    file := FileOpen(file_name, "a")
    file.write("`r`n}")
    file.close
    ;--------------------------------
    if (status==0)
        msgbox done
    if (status==-1)
        msgbox error
    FileRead, fileContents, %file_name%
    ordersArr := Jxon_Load(fileContents)				; Jxon_Load loads the string into ordersArr object
    msgbox % ordersArr.mirage_prime_systems[1].seller
    msgbox % ordersArr.mirage_prime_neuroptics[1].seller
    FileRead, orders, itemsOrderInfo.json
    item := "mirage_prime_systems"
    orderArr := Jxon_Load(orders)
    msgbox % orderArr[item][1].seller
    Return
*/