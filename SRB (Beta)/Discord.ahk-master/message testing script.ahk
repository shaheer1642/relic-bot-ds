uptime := A_TickCount

1::
    msgbox % "Current uptime: " MillisecToTime(A_TickCount-uptime)
    return

f1::reload

return

MillisecToTime(msec) {
	secs := floor(mod((msec / 1000),60))
	mins := floor(mod((msec / (1000 * 60)), 60) )
	hour := floor(mod((msec / (1000 * 60 * 60)) , 24))
    if (mins==hours==00)
        return Format("{:02} seconds",secs)
    else if (hours==00)
        return Format("{:02} minutes {:02} seconds",secs)
    else
	    return Format("{:02} hours {:02} minutes {:02} seconds",hour,mins,secs)
}