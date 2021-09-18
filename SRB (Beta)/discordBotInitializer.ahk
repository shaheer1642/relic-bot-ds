#SingleInstance ignore
#Persistent
#NoEnv

#Include %A_ScriptDir%
#include Jxon.ahk
#include JSON.ahk
#include objectSort.ahk
#include SRB functions.ahk
#include Discord.ahk-master\Discord.ahk

srbFunctions := new srbFunctions
global bot := new Discord("ODMyNjgyMzY5ODMxMTQxNDE3.YHnV4w.G7e4szgIo8LcErz0w_aTVqvs57E")
global uptime := A_TickCount

;SetTimer, verify_roles, -5000
SetTimer, verify_giveaway_roles, -70000     ; after presence update
SetTimer, presence_update, 60000

OnExit("ExitFunc")
return

MillisecToTime(msec) {
	secs := round(mod((msec / 1000),60),2)
	mins := floor(mod((msec / (1000 * 60)), 60) )
	hour := floor(mod((msec / (1000 * 60 * 60)) , 24))
    if (mins==00 && hour==00)
        return Format("{:02} seconds",secs)
    else if (hour==00)
    {
        if (mins==01)
            return Format("{:02} minute {:02} seconds",mins,secs)
        else 
            return Format("{:02} minutes {:02} seconds",mins,secs)
    }
    else
	    return Format("{:02} hours {:02} minutes {:02} seconds",hour,mins,secs)
}

relist_operation_label(ingame_name, JWT, offset, Data, messageId, opId)
{
    bot.relist_operation(ingame_name, JWT, offset, Data, messageId, opId)
    return
}

test(Data)
{
	fn := bot["OP" Data.op]
	%fn%(bot, Data)
}

ExitFunc()
{
    bot.ws.Disconnect()
    sleep 500
}

heartbeatMessage:
    bot.SendMessage("865549622985490482", "Current uptime: " MillisecToTime(A_TickCount-uptime))
    return

verify_roles:
    bot.verify_roles()
    return

verify_giveaway_roles:
    bot.verify_giveaway_roles()
    return

presence_update:
    bot.PresenceUpdate()
    return

Reconnect:
    bot := ""
    bot := new Discord("ODMyNjgyMzY5ODMxMTQxNDE3.YHnV4w.JRy0L2nCzOY4QIAU6ylkjG_UOm4")
    return