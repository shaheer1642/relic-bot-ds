class Discord
{
	static BaseURL := "https://discordapp.com/api"
	static prefix :=  "."
	static botID := "832682369831141417"
	
	__New(Token)
	{
		; Bind some functions for later use
		;Token := "ODMyNjgyMzY5ODMxMTQxNDE3.YHnV4w.JRy0L2nCzOY4QIAU6ylkjG_UOm4"
		this.SendHeartbeatBound := this.SendHeartbeat.Bind(this)
		
		; Save the token
		this.Token := Token
		
		; Get the gateway websocket URL
		URL := this.CallAPI("GET", "/gateway/bot").url

		; Connect to the server
		this.ws := {"base": this.WebSocket, "_Event": this._Event, "Parent": &this}
		this.ws.__New(URL "?v=9&encoding=json?compress=zlib-stream")
	}
	
	; Calls the REST API
	CallAPI(Method, Endpoint, Data="")
	{
		Http := ComObjCreate("WinHTTP.WinHTTPRequest.5.1")
		
		; Try the request multiple times if necessary
		Loop
		{
			if (A_index!=1)
				sleep 500
			; Send the request
			Http.Open(Method, this.BaseURL . Endpoint)
			Http.SetRequestHeader("Authorization", "Bot " this.Token)
			Http.SetRequestHeader("Content-Type", "application/json")
			try
			{
				(Data ? Http.Send(StrReplace(JSON.Dump(Data), "\\u", "\u")) : Http.Send())
				; Handle rate limiting
				if (Http.status == 429)
				{
					Response := this.Jxon_Load(Http.ResponseText())
					if (Response.retry_after == "")
						throw Exception("Failed to load rate limit retry_after")
					
					; Wait then retry the request
					Sleep, % Response.retry_after
					continue
				}
				if (SubStr(Http.Status, 1, 1) == 5)   ;internal server error
					continue
				responseCode := (this.Jxon_Load(Http.ResponseText())).code
				if (responseCode == 50007)
					return responseCode
				if (responseCode == 10007)
					return responseCode
				break
			}
			catch e 
			{
                if InStr(e.message, "0x8000000A")
                    continue
                if InStr(e.message, "0x80072EE7")
                    continue
			}
		}
		
		; Request was unsuccessful
		if (Http.status != 200 && Http.status != 204)
		{
			this.SendMessage(864199722676125757, "<@253525146923433984> Unhandled error. Check log file")
			Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured while calling API in script " A_ScriptName " at line " A_LineNumber "`nResponse status: " Http.status "`nServer Response: " Http.ResponseText "`nSent data:`n" JSON.Dump(Data) "`nEndpoint:`n" Endpoint "`r`n" , Error log.dat
			Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Reconnecting, API error`n`n", Reconnect Log.dat
			reload
			Exitapp
		}
		return this.Jxon_Load(Http.responseText)
	}
	
	; Sends data through the websocket
	Send(Data)
	{
		try 
		{
			this.ws.Send(this.Jxon_Dump(Data))
		}
		catch e 
		{
			Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Reconnecting, Websocket Data error`nException: " e.message "`n`n", Reconnect Log.dat
			reload	
			Exitapp
			;msgbox % e.message
		}
	}
	
	; Sends the Identify operation
	SendIdentify()
	{
		this.Send(
		( LTrim Join
		{
			"op": 2,
			"d": {
				"token": this.Token,
				"properties": {
					"$os": "windows",
					"$browser": "Discord.ahk",
					"$device": "Discord.ahk"
				},
				"compress": true,
				"large_threshold": 250,
				"presence": {
					"activities": [{
						"name": ".help",
						"type": 2
					}],
					"status": "online"
				},
				"intents": 14095
			}
		}
		))
	}

	SendResume()
	{
		; Send resume
		postdata := []
		postdata.op := 6
		postdata.d := {"token": this.Token, "session_id": this.session_id, "seq": this.Seq}
		this.Send(postdata)
	}
	
	; Sends a message to a channel
	SendMessage(channel_id, content)
	{
		return this.CallAPI("POST", "/channels/" channel_id "/messages", {"content": content})
	}
	
	/*
		Internal function triggered when the script receives a message on
		the WebSocket connected to the page.
	*/
	_Event(EventName, Event)
	{
		; If it was called from the WebSocket adjust the class context
		if this.Parent
			this := Object(this.Parent)
		
		this["On" EventName](Event)
	}
	
	; Called by the JS on WS open
	OnOpen(Event)
	{
		if (this.session_id != "")
		{
			this.SendResume()
			return
		}
		this.SendIdentify()
	}
	
	; Called by the JS on WS message
	OnMessage(Event)
	{
		Data := this.Jxon_Load(Event.data)
		
		; Save the most recent sequence number for heartbeats
		if Data.s
			this.Seq := data.s

		; Ignore all webhook events
		if (Data.d.webhook_id != "")
			return

		; Call the defined handler, if any
		;fn := this["OP" Data.op]
		;%fn%(this, Data)
		if (Data.d.channel_id == "884055410515017778")		; Test bot only channel
			return

		fn := Func("test").Bind(Data)
		try {
			SetTimer, %fn%, -1
		}
		catch e {
			reload
			Exitapp
		}
	}
	
	; OP 10 Hello
	OP10(Data)
	{
		this.HeartbeatACK := True
		Interval := Data.d.heartbeat_interval
		SendHeartbeat := this.SendHeartbeatBound
		SetTimer, %SendHeartbeat%, %Interval%, 1
	}

	; OP 1 Heartbeat
	OP1(Data)
	{
		this.Send({"op": 1, "d": this.Seq})
	}

	
	; OP 11 Heartbeat ACK
	OP11(Data)
	{
		this.HeartbeatACK := True
	}
	
	; OP 0 Dispatch
	OP0(Data)
	{
		; Call the defined handler, if any
		fn := this["OP0_" Data.t]
		%fn%(this, Data.d)
	}

	; OP 7 Reconnect
	OP7(Data)
	{
		this.ws.Close(4500)
	}
	
	; OP 9 Invalid Session
	OP9(Data)
	{
		Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Sending Identify, Invalid session. Received data:`n" JSON.Dump(Data) "`n`n", Reconnect Log.dat
		sleep 2000
		this.SendIdentify()
	}

	; OP 0 - READY
	OP0_READY(Data)
	{
		this.session_id := Data.session_id
		Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Session ready.`nSession_id: " this.session_id "`n`n", Reconnect Log.dat
	}

	; OP 0 - Resumed
	OP0_RESUMED(Data)
	{
		Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Connection resumed.`nSession_id: " this.session_id "`nSeq: " this.Seq "`n`n", Reconnect Log.dat
	}

	; OP 0 - MESSAGE_CREATE
	OP0_MESSAGE_CREATE(Data)
	{
		if (Data.author.id == this.botID)		;botception
			return

		if (Data.guild_id == "")		;reponses for dms
		{
			messageContent := Data.content
			opId := Data.id
			;StringLower, messageContent, messageContent
			if !(SubStr(messageContent, 1, 1)==this.prefix)
				return
			loop
			{
				if InStr(messageContent, "  ")
					messageContent := StrReplace(messageContent, "  ", " ")		;remove multiple spaces
				else
					break
			}
			messageContent := StrSplit(messageContent, " ")

			/*
			if (messageContent[1]==(this.prefix . "authorize"))
			{
				
				if (messageContent[2]=="")
				{
					this.SendMessage(Data.channel_id, "Usage example:`r`n.authorize wfm_email@xyz.com wfm_password123")
					this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
					return
				}
				if (messageContent[3]=="")
				{
					this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.authorize wfm_email@xyz.com wfm_password123")
					return
				}
				if !(messageContent[4]=="")
				{
					this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.authorize wfm_email@xyz.com wfm_password123")
					return
				}
				email := messageContent[2]
				password := messageContent[3]
				loop 
				{
					try 
					{
						postdata := {}
						postdata.auth_type := "header"
						postdata.email := email
						postdata.password := password
						WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
						WebRequest.Open("POST", "https://api.warframe.market/v1/auth/signin", true)
						WebRequest.SetRequestHeader("Content-Type", "application/json")
						WebRequest.SetRequestHeader("Authorization", "JWT")
						WebRequest.SetRequestHeader("language", "en")
						WebRequest.SetRequestHeader("platform", "pc")
						WebRequest.SetRequestHeader("auth_type", "header")
						WebRequest.Send(JSON.Dump(postdata))
						WebRequest.WaitForResponse()
						if InStr(WebRequest.ResponseText, "app.account.email_not_exist")
						{
							this.SendMessage(Data.channel_id, "Invalid Email.")
							return
						}
						if InStr(WebRequest.ResponseText, "app.account.password_invalid")
						{
							this.SendMessage(Data.channel_id, "Invalid password.")
							return
						}
						JWT := WebRequest.getresponseheader("Authorization")
						ingame_name := JSON.Load(WebRequest.ResponseText).payload.user.ingame_name
						FileRead, jwt_stack, % A_ScriptDir "\JWT_Stack\jwt_stack.json"
						jwt_stack := JSON.Load(jwt_stack)
						loop % jwt_stack.MaxIndex()
						{
							if (jwt_stack[A_index].discord_id == Data.author.id)
							{
								this.SendMessage(Data.channel_id, "Already authorized. If any issue, Contact MrSofty#7926")
								return
							}
						}
						jwt_stack.push({"discord_id": Data.author.id, "JWT": JWT, "ingame_name": ingame_name})
						;----update jwt stack----
						file_name := A_ScriptDir "\JWT_Stack\jwt_stack.json"
						file := FileOpen(file_name, "w")
						file.write(JSON.Dump(jwt_stack))
						file.close()
						;-----------------------------
						this.SendMessage(Data.channel_id, "Authorization successful.")
						return
					}
					catch e 
					{
						this.SendMessage(Data.channel_id, "Some error occured. Contact MrSofty#7926")
						break
					}
				}
			}
			*/
			return
		}

		messageContent := Data.content
		opId := Data.id
		StringLower, messageContent, messageContent
		if !(SubStr(messageContent, 1, 1)==this.prefix)
			return
		loop
		{
			if InStr(messageContent, "  ")
				messageContent := StrReplace(messageContent, "  ", " ")		;remove multiple spaces
			else
				break
		}
		messageContent := StrSplit(messageContent, " ")

		;----slots-bot commands----
		if (Data.channel_id=="870740023941689475")
		{
			if (messageContent[1]==(this.prefix . "createslot"))
			{
				if (messageContent[2]=="")
				{
					this.SendMessage(Data.channel_id, "Usage example:`r`n.createslot slot1")
					this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
					return
				}
				if (messageContent[3]!="")
				{
					this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.createslot slot1")
					return
				}
				fileName := messageContent[2]
				FileRead, status, % A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				if !ErrorLevel
				{
					this.SendMessage(Data.channel_id, "The slot """ fileName """ already exists.")
					return
				}
				/*
				RegRead highestSlotNumber, HKCU, Software\Slots Bot, highestSlotNumber
				if ErrorLevel {
					RegWrite REG_DWORD, HKCU, Software\Slots Bot, highestSlotNumber, 0		;default setting 
					RegRead highestSlotNumber, HKCU, Software\Slots Bot, highestSlotNumber
				}
				highestSlotNumber++
				*/
				;----create new slot file----
				Fileappend,,% A_ScriptDir "\Slots Bot Files\" fileName ".dat" ;"_" highestSlotNumber ".dat"
				;RegWrite REG_DWORD, HKCU, Software\Slots Bot, highestSlotNumber, %highestSlotNumber%
				;----response----
				this.SendMessage(Data.channel_id, "Slot """ fileName """ has been created.")
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			if (messageContent[1]==(this.prefix . "deleteslot"))
			{
				if (messageContent[2]=="")
				{
					this.SendMessage(Data.channel_id, "Usage example:`r`n.deleteslot slot1")
					this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
					return
				}
				if (messageContent[3]!="")
				{
					this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.deleteslot slot1")
					return
				}
				fileName := messageContent[2]
				FileRead, status, % A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				if ErrorLevel
				{
					this.SendMessage(Data.channel_id, "The slot """ fileName """ does not exist.")
					return
				}
				;----delete slot file----
				Filedelete,% A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				;----response----
				this.SendMessage(Data.channel_id, "Slot """ fileName """ has been deleted.")
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			if (messageContent[1]==(this.prefix . "additem"))
			{
				if (messageContent[2]=="")
				{
					this.SendMessage(Data.channel_id, "Usage example:`r`n.additem slot1 item1`r`n.additem slot1 item1,item2,item3")
					this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
					return
				}
				if (messageContent[3]=="")
				{
					this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.additem slot1 item1`r`n.additem slot1 item1,item2,item3")
					return
				}
				if (messageContent[4]!="")
				{
					this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.additem slot1 item1`r`n.additem slot1 item1,item2,item3")
					return
				}
				fileName := messageContent[2]
				itemName := messageContent[3]
				;----remove leading/trailing commas if there are-----
				loop
				{
					if (SubStr(itemName, 1, 1) == ",")
					{
						itemName := SubStr(itemName, 2, StrLen(itemName))
						continue
					}
					if (SubStr(itemName, StrLen(itemName), 1) == ",")
					{
						itemName := SubStr(itemName, 1, StrLen(itemName)-1)
						continue
					}
					break
				}
				;------
				itemName := StrReplace(itemName, ",", "`r`n")
				;------
				FileRead, status, % A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				if ErrorLevel
				{
					this.SendMessage(Data.channel_id, "The slot """ fileName """ does not exist. Please create it first")
					return
				}
				;----add item to the file----
				itemName := itemName . "`r`n"
				filePath := A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				file := FileOpen(filePath, "a")
				file.write(itemName)
				file.close()
				;Fileappend, % itemName "`r`n", % A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				;----retrieve updated list----
				FileRead, fileContents, % A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				fileContents := StrReplace(fileContents, "`r`n", ", ")
				/*
				Loop
				{
					FileReadLine, itemAtLine, % A_ScriptDir "\Slots Bot Files\" fileName ".dat", %A_Index%
					if ErrorLevel		;end of file reached
						Break
					fileContents := fileContents . itemAtLine . ", "
				}
				*/
				fileContents := SubStr(fileContents, 1, StrLen(fileContents)-2)		;remove trailing comma
				;----response----
				itemName := StrReplace(itemName, "`r`n", ",")
				this.SendMessage(Data.channel_id, "Item(s) """ itemName """ has/have been added to the slot """ fileName """.`n`nCurrent items: " fileContents)
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			if (messageContent[1]==(this.prefix . "removeitem"))
			{
				if (messageContent[2]=="")
				{
					this.SendMessage(Data.channel_id, "Usage example:`r`n.removeitem slot1 item1")
					this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
					return
				}
				if (messageContent[3]=="")
				{
					this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.removeitem slot1 item1")
					return
				}
				if (messageContent[4]!="")
				{
					this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.removeitem slot1 item1")
					return
				}
				fileName := messageContent[2]
				itemName := messageContent[3]
				;----remove leading/trailing commas if there are-----
				loop
				{
					if (SubStr(itemName, 1, 1) == ",")
					{
						itemName := SubStr(itemName, 2, StrLen(itemName))
						continue
					}
					if (SubStr(itemName, StrLen(itemName), 1) == ",")
					{
						itemName := SubStr(itemName, 1, StrLen(itemName)-1)
						continue
					}
					break
				}
				;----
				FileRead, status, % A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				if ErrorLevel
				{
					this.SendMessage(Data.channel_id, "The slot """ fileName """ does not exist. Please create it first")
					return
				}
				;----remove item from the file----
				fileContents := ""
				Loop
				{
					FileReadLine, itemAtLine, % A_ScriptDir "\Slots Bot Files\" fileName ".dat", %A_Index%
					if ErrorLevel		;end of file reached
						Break
					if (itemAtLine==itemName)
						continue
					fileContents := fileContents . itemAtLine . "`r`n"
				}
				;----update slot items-----
				filePath := A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				file := FileOpen(filePath, "w")
				file.write(fileContents)
				file.close()
				;Fileappend, % itemName "`r`n", % A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				;----retrieve updated list----
				FileRead, fileContents, % A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				fileContents := StrReplace(fileContents, "`r`n", ", ")
				/*
				Loop
				{
					FileReadLine, itemAtLine, % A_ScriptDir "\Slots Bot Files\" fileName ".dat", %A_Index%
					if ErrorLevel		;end of file reached
						Break
					fileContents := fileContents . itemAtLine . ", "
				}
				*/
				fileContents := SubStr(fileContents, 1, StrLen(fileContents)-2)		;remove trailing comma
				;----response----
				itemName := StrReplace(itemName, "`r`n", ",")
				this.SendMessage(Data.channel_id, "Item """ itemName """ has been removed from the slot """ fileName """.`n`nRemaining items: " fileContents)
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			if (messageContent[1]==(this.prefix . "listitems"))
			{
				if (messageContent[2]=="")
				{
					this.SendMessage(Data.channel_id, "Usage example:`r`n.listitems slot1")
					this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
					return
				}
				if (messageContent[3]!="")
				{
					this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.listitems slot1")
					return
				}
				fileName := messageContent[2]
				FileRead, status, % A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				if ErrorLevel
				{
					this.SendMessage(Data.channel_id, "The slot """ fileName """ does not exist. Please create it first")
					return
				}
				FileRead, fileContents, % A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				if (fileContents=="")
				{
					this.SendMessage(Data.channel_id, "Slot """ fileName """ is currently empty.")
					this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
					return
				}
				fileContents := StrReplace(fileContents, "`r`n", ", ")
				/*
				Loop
				{
					FileReadLine, itemAtLine, % A_ScriptDir "\Slots Bot Files\" fileName ".dat", %A_Index%
					if ErrorLevel		;end of file reached
						Break
					fileContents := fileContents . itemAtLine . ", "
				}
				*/
				fileContents := SubStr(fileContents, 1, StrLen(fileContents)-2)		;remove trailing comma
				;----response----
				itemName := StrReplace(itemName, "`r`n", ",")
				this.SendMessage(Data.channel_id, "Items in slot """ fileName """: " fileContents)
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			if (messageContent[1]==(this.prefix . "listslots"))
			{
				if (messageContent[2]!="")
				{
					this.SendMessage(Data.channel_id, "Usage example:`r`n.listslots")
					this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
					return
				}
				d_postdata := {}
				d_postdata.content := ""
				d_postdata.embeds := {}
				d_postdata.embeds.push({fields: {}})
				d_postdata.embeds[1].title := "Slots list"
				d_postdata.embeds[1].color := "5225082"
				fileContents := ""
				Loop, Files, Slots Bot Files\*.dat
				{
					FileRead, fileContents, % A_ScriptDir "\Slots Bot Files\" A_LoopFileName
					fileContents := StrReplace(fileContents, "`r`n", ", ")
					fileContents := SubStr(fileContents, 1, StrLen(fileContents)-2)		;remove trailing comma
					if (fileContents=="")
						fileContents := "Empty"
					else
						fileContents := "Items: " . fileContents
					d_postdata.embeds[1].fields.push({name: strreplace(A_LoopFileName, ".dat", ""), value: fileContents})
					fileContents := ""
				}
				if (d_postdata.embeds[1].fields[1]=="")
					d_postdata.embeds[1].title := "No slots available"
				this.CallAPI("POST", "/channels/" Data.channel_id "/messages", d_postdata)
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			if (messageContent[1]==(this.prefix . "randomize"))
			{
				if (messageContent[2]=="")
				{
					this.SendMessage(Data.channel_id, "Usage example:`r`n.randomize slot1")
					this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
					return
				}
				if (messageContent[3]!="")
				{
					this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.randomize slot1")
					return
				}
				fileName := messageContent[2]
				FileRead, status, % A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				if ErrorLevel
				{
					this.SendMessage(Data.channel_id, "The slot """ fileName """ does not exist. Please create it first")
					return
				}
				FileRead, fileContents, % A_ScriptDir "\Slots Bot Files\" fileName ".dat"
				if (fileContents=="")
				{
					this.SendMessage(Data.channel_id, "Slot """ fileName """ is currently empty.")
					this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
					return
				}
				fileContents := SubStr(fileContents, "1", StrLen(fileContents)-2)		;remove trailing enter
				Sort, fileContents, Random
				/*
				Loop
				{
					FileReadLine, itemAtLine, % A_ScriptDir "\Slots Bot Files\" fileName ".dat", %A_Index%
					if ErrorLevel		;end of file reached
						Break
					fileContents := fileContents . itemAtLine . ", "
				}
				*/
				;----response----
				itemName := StrReplace(itemName, "`r`n", ",")
				this.SendMessage(Data.channel_id, "Result:`r`n" fileContents)
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			if (messageContent[1]==(this.prefix . "help"))
			{
				;----discord message array----
				d_postdata := {}
				d_postdata.content := ""
				d_postdata.embeds := {}
				d_postdata.embeds.push({fields: {}})
				d_postdata.embeds[1].color := "3252165"
				;-----------------------------
				d_postdata.embeds[1].fields.push({name: ".createslot <slot_name>", value: "Creates a new slot`nUsage example:`r`n.createslot slot1"}, {name: ".deleteslot <slot_name>", value: "Deletes an existing slot`nUsage example:`r`n.deleteslot slot1"},{name: ".additem <slot_name> <item_name(s) seperated by commas without spaces>", value: "Adds new items to an existing slot`nUsage example:`r`n.additem slot1 item1`r`n.additem slot1 item1,item2,item3"},{name: ".removeitem <slot_name> <item_name>", value: "Removes item from an existing slot`nUsage example:`r`n.removeitem slot1 item1"},{name: ".listitems <slot_name>", value: "Lists items for an existing slot`nUsage example:`r`n.listitems slot1"},{name: ".listslots", value: "Lists all the slots along with their items list`nUsage example:`r`n.listslots"},{name: ".randomize <slot_name>", value: "Randomize items in a slot`nUsage example:`r`n.randomize slot1"})
				this.CallAPI("POST", "/channels/" Data.channel_id "/messages", d_postdata)
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			return
		}

		;----bought command for 100-ducat-sellers----
		if (Data.channel_id=="863744615768784916")
		{
			if (messageContent[1]==(this.prefix . "bought"))
			{
				if (messageContent[2]=="")
				{
					messageId := (this.SendMessage(Data.channel_id, "Usage example:`r`n.bought seller_name")).id
					estimatedTick := A_TickCount + 3000
					loop
					{
						if ((A_TickCount - estimatedTick) >= 0)
							break
					}
					this.CallAPI("DELETE", "/channels/" Data.channel_id "/messages/" messageId)
					this.CallAPI("DELETE", "/channels/" Data.channel_id "/messages/" opId)
					return
				}
				if (messageContent[3]!="")
				{
					messageId := (this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.bought seller_name")).id
					estimatedTick := A_TickCount + 3000
					loop
					{
						if ((A_TickCount - estimatedTick) >= 0)
							break
					}
					this.CallAPI("DELETE", "/channels/" Data.channel_id "/messages/" messageId)
					this.CallAPI("DELETE", "/channels/" Data.channel_id "/messages/" opId)
					return
				}
				messageId := (this.SendMessage(Data.channel_id, "Processing")).id
				trader_username := messageContent[2]
				;----------
				hasFound := 0
				loop % 100
				{
					messageIDNextIndex := 3080 + A_index
					RegRead webhookMessageId, HKCU, Software\Softy Relic Bot, webhookMessageId%messageIDNextIndex%
					if ErrorLevel
						break
					url := "https://discord.com/api/webhooks/863745862798540820/ygIlsGnta1_0YVQXlxIfQToopYM5i_hNSZKUWkClGP9B-6w2h9WxemF_JLMU-bIackoF"
					loop
					{
						try
						{
							WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
							WebRequest.Open("GET", url . "/messages/" . webhookMessageId, false)
							WebRequest.SetRequestHeader("Content-Type", "application/json")
							WebRequest.Send()
							WebRequest.WaitForResponse()
							if (WebRequest.Status == 404)    ;message not found
								break
							if (SubStr(WebRequest.Status, 1, 1) == 5)   ;internal server error
								continue
							if InStr(WebRequest.ResponseText, "rate limited")
							{
								Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] " WebRequest.Status, rate limit status.dat
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
								this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "<@253525146923433984> Unhandled error. Check log file"})
								Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured using .bought command in script " A_ScriptName " at line " A_LineNumber "`nServer Response: " WebRequest.ResponseText "`r`n", Error log.dat
								return
							}
							ducatsMessage := JSON.Load(WebRequest.ResponseText)
							ducatsMessage.content := StrReplace(ducatsMessage.content, "``````yaml`n/w " trader_username, "`n/w " trader_username)
							ducatsMessage.content := StrReplace(ducatsMessage.content, "``````fix`n/w " trader_username, "`n/w " trader_username)
							ducatsMessage.content := StrReplace(ducatsMessage.content, "```````n/w " trader_username, "`n/w " trader_username)
							pos1 := InStr(ducatsMessage.content, trader_username)
							if pos1
							{
								FileRead, ducats_sold_out_stack, % A_ScriptDir "\Cache\ducats_sold_out_stack.json"
								ducats_sold_out_stack := JSON.Load(ducats_sold_out_stack)
								hasFound := 1
								pos1 := pos1 - 3
								ducatsMessage.content
								pos2 := InStr(ducatsMessage.content, "```",, pos1)
								pos2 := pos2 + 3
								original_text := SubStr(ducatsMessage.content, pos1, pos2-pos1)
								original_text := StrReplace(original_text, "~~", "")
								whisperTemp := StrSplit(original_text, "`n")
								loop % ducats_sold_out_stack.MaxIndex()
								{
									if (ducats_sold_out_stack[A_index] = whisperTemp[1])
									{
										this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Seller's whisper is already marked sold out"})
										estimatedTick := A_TickCount + 3000
										loop
										{
											if ((A_TickCount - estimatedTick) >= 0)
												break
										}
										this.CallAPI("DELETE", "/channels/" Data.channel_id "/messages/" messageId)
										this.CallAPI("DELETE", "/channels/" Data.channel_id "/messages/" opId)
										return
									}
								}
								stroke_text := original_text
								stroke_text := StrReplace(stroke_text, "``````", "")
								stroke_text := StrReplace(stroke_text, "/w", "> ~~/w")
								stroke_text := StrReplace(stroke_text, "`n", "~~`n> ~~")
								stroke_text := stroke_text . "~~"
								;msgbox % stroke_text
								/*
								;strike through the string
								stroke_text := ""
								Loop, parse, original_text
									stroke_text .= A_LoopField Chr(0x336)
								;-----
								*/
								stroke_text := stroke_text . "`n> (Sold out!)`n"
								ducatsMessage.content := StrReplace(ducatsMessage.content, original_text, stroke_text)
								ducatsMessage.content := StrReplace(ducatsMessage.content, "`n`n>", "`n>")
								ducats_sold_out_stack.push(whisperTemp[1])
								;-------Stack pop ups--------
								loop
								{
									if (ducats_sold_out_stack.MaxIndex()<=10)
										break
									ducats_sold_out_stack.removeat(1)
								}
								;----update sold_out stack----
								file_name := A_ScriptDir "\Cache\ducats_sold_out_stack.json"
								file := FileOpen(file_name, "w")
								file.write(JSON.Dump(ducats_sold_out_stack))
								file.close()
								;---edit the message----
								postdata := []
								postdata.content := ducatsMessage.content
								postdata.emebeds := ""
								try
								{
									postdata := JSON.Dump(postdata) 
								}
								catch e 
								{
									this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "<@253525146923433984> Unhandled error. Check log file"})
									Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured using .bought command in script " A_ScriptName " at line " e.line "`nexception: " e.message "`r`n", Error log.dat
									return
								}
								loop
								{
									try 
									{
										WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
										WebRequest.Open("PATCH", url . "/messages/" . webhookMessageId, false)
										WebRequest.SetRequestHeader("Content-Type", "application/json")
										WebRequest.Send(postdata)
										WebRequest.WaitForResponse()
										if (SubStr(WebRequest.Status, 1, 1) == 5)   ;internal server error
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
											this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "<@253525146923433984> Unhandled error. Check log file"})
											Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured using .bought command in script " A_ScriptName " at line " A_LineNumber "`nServer Response: " WebRequest.ResponseText "`nSent data: " postdata "`r`n", Error log.dat
											return
										}
										break
									}
									catch e 
									{
										if InStr(e.message, "0x80072EE7")
											continue
										msgbox,,, % e.message "`n`n" WebRequest.ResponseText, 5
										Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured editing discord message in script " A_ScriptName " at line " e.line "`nexception: " e.message "`nServer Response: " WebRequest.ResponseText "`nSent data: " postdata "`r`n", Error log.dat
										continue
									}
								}
							}
							break
						}
						catch e 
						{
							if InStr(e.message, "0x80072EE7")
								continue
							msgbox,,, % e.message, 5
							Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured editing discord message in script " A_ScriptName " at line " e.line "`nexception: " e.message "`nServer Response: " WebRequest.ResponseText "`r`n", Error log.dat
							continue
						}
					}
					if hasFound
						break
					if (WebRequest.Status == 404)    ;message not found
						break
				}
				if !hasFound
				{
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Could not find that seller"})
					estimatedTick := A_TickCount + 3000
					loop
					{
						if ((A_TickCount - estimatedTick) >= 0)
							break
					}
					this.CallAPI("DELETE", "/channels/" Data.channel_id "/messages/" messageId)
					this.CallAPI("DELETE", "/channels/" Data.channel_id "/messages/" opId)
					return
				}
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "List edited. Thank you for letting us know"})
				estimatedTick := A_TickCount + 3000
				loop
				{
					if ((A_TickCount - estimatedTick) >= 0)
						break
				}
				this.CallAPI("DELETE", "/channels/" Data.channel_id "/messages/" messageId)
				this.CallAPI("DELETE", "/channels/" Data.channel_id "/messages/" opId)
				return
			}
		}

		/*
		if (messageContent[1]==(this.prefix . "close"))
		{
			this.ws.close(4500)
			return
		}
		*/
		
		/*
		if (messageContent[1]==(this.prefix . "test"))
		{
			postdata := []
			postdata.op := 8
			postdata.d := {"guild_id": "776804537095684108","query": "","limit": 0,"presences": "true"}
			this.Send(postdata)
			return
		}
		*/

		/*
		if (messageContent[1]==(this.prefix . "resume"))
		{
			; Send resume
			postdata := []
			postdata.op := 6
			postdata.d := {"token": This.Token, "session": this.session_id, "seq": this.Seq}
			this.ws.Send(JSON.Dump(postdata))
			return
		}
		*/

		/*
		if (messageContent[1]==(this.prefix . "help"))
		{
			;----discord message array----
			d_postdata := {}
			d_postdata.content := ""
			d_postdata.embeds := {}
			d_postdata.embeds.push({fields: {}})
			d_postdata.embeds[1].color := "5225082"
			;-----------------------------
			d_postdata.embeds[1].fields.push({name: ".uptime", value: "Reports current uptime`nUsage example:`r`n.uptime"}, {name: ".orders <item_name>", value: "Retrieve top 5 sell orders for an item from warframe.market`nUsage example:`n.orders frost prime`n.orders ember`n.orders kronen prime blade`n.orders axi L4 relic`n.orders primed pressure point"}, {name: ".relics <prime_item>", value: "Retrieve relics for a prime item`nUsage example:`n.relics frost prime`n.relics ember`n.relics kronen prime blade`n.relic axi s3"}, {name: ".auctions <kuva_weapon>", value: "Retrieve auctions for a kuva weapon lich from warframe.market, sorted by buyout price and weapon damage`nUsage example:`r`n.auctions kuva_kohm"}, {name: ".list <prime_item>", value: "List a prime item on warframe.market on your profile as the top selling order (requires authorization)`nUsage example:`n.list frost_prime_blueprint`n.list frost_prime_blueprint +10`n.list frost_prime_blueprint -20"}, {name: ".relist all", value: "Exactly like .list command except it relists all the sell orders on your profile for prime items. (requires authorization)`nIn order to prevent stress on the API, you can only use this command once per hour.`nUsage example:`r`n.relist all`n.relist all +10`n.relist all -20"})
			this.CallAPI("POST", "/channels/" Data.channel_id "/messages", d_postdata)
			this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
			return
		}
		*/
		
		if (messageContent[1]==(this.prefix . "mentionstemplate"))
		{
			if (Data.author.id != "253525146923433984")
				return
			d_postdata := {}
			d_postdata.content := "``````md`nNotes:`nThis data will be updated every 5 mins`nStill make sure of the edit time for a certain message before pming a seller. During bug fixing or when MrSofty is offline, the data will not be updated`n`nColors & filters:`nIf price per part is less than 4, whipser is filtered out (usually troll orders)`nIf quantity is 1, whisper is filtered out`n<If quantity is 2, it is highlighted yellow>`nIf quantity is 2 but price is greater than 20p, it is filtered out`n[If quantity is equal to 3 but price is lower than 25p, it is highlighted cyan][]`n[If quantity is equal to 4 but price is lower than 48p, it is highlighted cyan][]`n[If quantity is greater than 4, it is highlighted cyan][]`n``````React with the following emotes to obtain the given roles below. These roles are mentioned whenever a *new* trader appears with the given criteria. Removing reaction should remove the role(More roles will be added in the future. If any suggestions, dm MrSofty)`n`n:star:   (Ducats-1) :`: Quantity >= 6 AND TotalPrice <= 60p"
			this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" (this.CallAPI("POST", "/channels/" Data.d.channel_id "/messages", d_postdata)).id "/reactions/⭐/@me")
			return
		}

		if (messageContent[1]==(this.prefix . "editmentionstemplate"))
		{
			if (Data.author.id != "253525146923433984")
				return
			d_postdata := {}
			d_postdata.content := "``````md`nNotes:`nThis data will be updated every 5 mins`nStill make sure of the edit time for a certain message before pming a seller. During bug fixing or when MrSofty is offline, the data will not be updated`n`nColors & filters:`nIf price per part is less than 4, whipser is filtered out (usually troll orders)`nIf quantity is 1, it is filtered out`n<If quantity is 2, it is highlighted yellow>`nIf quantity is 2 but price is greater than 19p, it is filtered out`nIf quantity is 3 but price is greater than 30p, it is filtered out`n[If quantity is equal to 3 but price is lower than 25p, it is highlighted cyan][]`n[If quantity is equal to 4 but price is lower than 48p, it is highlighted cyan][]`n[If quantity is greater than 4, it is highlighted cyan][]`n```````nReact with the following emotes to obtain the given roles below. These roles are mentioned whenever a *new* trader appears with the given criteria. Removing reaction should remove the role. (If any suggestions, dm MrSofty)`n`n:star:   ````(Ducats-1) :`: Quantity >= 6 AND AvgPrice <= 10.00p`````n:gem:   ````(Ducats-2) :`: Quantity >= 4 AND AvgPrice <= 8.00p`````n`n:red_circle:   ````:`: Ping on 'Do not Disturb'`````n:purple_circle:   ````:`: Ping on 'Invisible'/offline`````n`nYou may use the following command in this channel to let your fellow buyers know if you have already bought ducats from a seller`n````.bought seller_name````"
			;this.CallAPI("PUT", "/channels/863744615768784916/messages/874104958755168256/reactions/🔴/@me")
			;this.CallAPI("DELETE", "/channels/863744615768784916/messages/874104958755168256/reactions/⚫/@me")
			;this.CallAPI("PUT", "/channels/863744615768784916/messages/874104958755168256/reactions/🟣/@me")
			;this.CallAPI("PATCH", "/channels/863744615768784916/messages/874104958755168256", d_postdata)
			return
		}

		if (messageContent[1]==(this.prefix . "uptime"))
		{
			if (messageContent[2]!="")
			{
				this.SendMessage(Data.channel_id, "Usage example:`r`n.uptime")
				return
			}
			this.SendMessage(Data.channel_id, "(Old bot) Current uptime: " MillisecToTime(A_TickCount-uptime))
			this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
			return
		}

	/*
		if (messageContent[1]==(this.prefix . "orders") || messageContent[1]==(this.prefix . "order"))
		{
			if (messageContent[2]=="")
			{
				this.SendMessage(Data.channel_id, "Retrieve top 5 sell orders for an item from warframe.market`nUsage example:`n.orders frost prime`n.orders ember`n.orders kronen prime blade`n.orders axi L4 relic`n.orders primed pressure point")
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			messageId := (this.SendMessage(Data.channel_id, "Processing")).id
			d_item_url := ""
			loop % messageContent.MaxIndex()
			{
				If (A_index == 1)
					continue
				d_item_url := d_item_url messageContent[A_Index] "_"
			}
			d_item_url := SubStr(d_item_url, 1, StrLen(d_item_url)-1)	;remove trailing underscore
			Fileread, wfm_items_list, WFM_Items_List.json
			try
			{
				wfm_items_list := JSON.Load(wfm_items_list)
			}
			catch e 
			{
				this.SendMessage(Data.channel_id, "Error occured at line " e.line ". Exception: " e.message "`nContact MrSofty#7926")
				return
			}
			temp_d_item_url := d_item_url
			d_item_url := {}
			primeFlag := 0
			loop % wfm_items_list.payload.items.MaxIndex()
			{
				if RegExMatch(wfm_items_list.payload.items[A_Index].url_name, "^" temp_d_item_url "\W*")
				{
					if instr(wfm_items_list.payload.items[A_Index].url_name, "prime")
						primeFlag := 1
					d_item_url.push(wfm_items_list.payload.items[A_Index].url_name)
				}
			}
			if (d_item_url[1] == "")
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Item " temp_d_item_url " not found"})
				return
			}
			if primeFlag
			{
				i := 1
				MaxIndex := d_item_url.MaxIndex()
				Loop
				{
					if (i > MaxIndex)
						break
					if !(InStr(d_item_url[i], "prime"))
						d_item_url.RemoveAt(i)
					else
						i++
					MaxIndex := d_item_url.MaxIndex()
				}
			}
			if (d_item_url.MaxIndex() > 10)
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "More than 10 search result detected for the item " temp_d_item_url ", cannot process this request. Please provide a valid item name" })
				return
			}
			d_postdata := {}
			d_postdata.content := "React with :up: to update"
			d_postdata.embeds := {}
			loop % d_item_url.MaxIndex()
			{
				orders_file_name := "cache\orderCache" A_Now ".json"
				d_status := srbFunctions.getOrder(d_item_url[A_index], orders_file_name)		;func from main code
				if (d_status==-1)
				{
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Error occured. Please try again"})
					;Discord.SendMessage(Data.d.channel_id, "Error occured. Please try again")
					return
				}
				if (d_status==-2)
					continue
				if (d_status==-3)
				{
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Item " d_item_url[A_index] " not found"})
					;Discord.SendMessage(Data.d.channel_id, "Item " d_item_url " not found")
					return
				}
				FileRead, d_orderDetail, % orders_file_name		
				if (ErrorLevel==1)
				{
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "File read error. Please contact MrSofty#7926"})
					return
				}
				try 
				{
					FileDelete, % orders_file_name
				}
				catch e 
				{
					if !(e.message=="1")
					{
						this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Unexpected file delete error. Contant MrSofty#7926"})
						return
					}
				}
				d_orderDetail := StrReplace(d_orderDetail, """" . d_item_url[A_index] . """: ", "")
				d_orderDetail := JSON.Load(d_orderDetail)
				d_orderDetail := objectSort(d_orderDetail, "price",,false)
				d_sellerNames := ""
				d_partQuantity := ""
				d_partPrice := ""
				loop, 5		;list already sorted
				{
					d_sellerNames := d_sellerNames . d_orderDetail[A_index].seller . "`n"
					d_partQuantity := d_partQuantity . d_orderDetail[A_index].quantity . "`n"
					d_partPrice := d_partPrice . d_orderDetail[A_index].price . "`n"
				}
				if InStr(d_sellerNames, "_")
					d_sellerNames := StrReplace(d_sellerNames, "_", "\_")
				;d_postdata.embeds.push()
				;d_postdata := d_postdata . "{""name"": ""Seller"",""value"": """ d_sellerNames """,""inline"": ""true""},"
				;d_postdata := d_postdata . "{""name"": ""Quantity"",""value"": """ d_partQuantity """,""inline"": ""true""},"
				;d_postdata := d_postdata . "{""name"": ""Price"",""value"": """ d_partPrice """,""inline"": ""true""}],"
				;----
				d_partName := StrReplace(d_item_url[A_index], "_", " ")
				;capitalizing first letters
				loop, 26
				{
					if (SubStr(d_partName, 1, 1) == chr(A_Index + 96))
						d_partName := StrReplace(d_partName, chr(A_Index + 96), chr(A_Index + 64),, 1)
					d_partName := StrReplace(d_partName, " "chr(A_Index + 96), " "chr(A_Index + 64),, 1)
				}
				;----
				;d_postdata := d_postdata . """title"": """ d_partName ""","
				FormatTime, d_currentTimeFormatted, %A_NowUTC%, yyyy-MM-ddTHH:mm:ss.000Z
				;d_postdata := d_postdata . """timestamp"": """ d_currentTimeFormatted ""","
				;d_postdata := d_postdata . """url"": ""https://warframe.market/items/" d_item_url[A_index] """}]}"
				d_postdata.embeds.push({title: d_partName, timestamp: d_currentTimeFormatted, url: "https://warframe.market/items/" d_item_url[A_index], fields: [{name: "Seller", value: d_sellerNames, inline: "true"}, {name: "Quantity", value: d_partQuantity, inline: "true"}, {name: "Price", value: d_partPrice, inline: "true"}]})
			}
			if (d_postdata.embeds[1].title == "")
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "No sellers found at the moment for " d_item_url[d_item_url.MaxIndex()]})
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				;Discord.SendMessage(Data.d.channel_id, "No sellers found at the moment for " d_item_url)
				return
			}
			try
			{
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" (this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, d_postdata)).id "/reactions/🆙/@me")
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			catch e
			{
				clipboard := JSON.Dump(d_postdata)
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Error occured. Please try again`nException: " e.message})
				return
			}
			return
		}
		*/

		/*
		if ((messageContent[1]==(this.prefix . "relics")) || (messageContent[1]==(this.prefix . "relic")))
		{
			if (messageContent[2]=="")
			{
				this.SendMessage(Data.channel_id, "Retrieve relics for a prime item`nUsage example:`n.relics frost prime`n.relics ember`n.relics kronen prime blade`n.relic axi s3")
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			messageId := (this.SendMessage(Data.channel_id, "Processing")).id
			d_item_url := ""
			loop % messageContent.MaxIndex()
			{
				If (A_index == 1)
					continue
				d_item_url := d_item_url messageContent[A_Index] "_"
			}
			d_item_url := SubStr(d_item_url, 1, StrLen(d_item_url)-1)	;remove trailing underscore
			Fileread, wfm_items_list, WFM_Items_List.json
			try
			{
				wfm_items_list := JSON.Load(wfm_items_list)
			}
			catch e 
			{
				this.SendMessage(Data.channel_id, "Error occured at line " e.line ". Exception: " e.message "`nContact MrSofty#7926")
				return
			}
			if InStr(d_item_url, "lith") || InStr(d_item_url, "meso") InStr(d_item_url, "neo") || InStr(d_item_url, "axi")
			{
				if !(InStr(d_item_url, "relic"))
					d_item_url .= "_relic"
				postdata := {}
				postdata.content := ""
				postdata.embeds := {}
				file_path := "Relics Info\" d_item_url ".json"
				FileRead, relic_drops, % file_path
				if ErrorLevel
				{
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Relic " d_item_url " not found"})
					return
				}
				relic_drops := JSON.Load(relic_drops)
				value1 := ""
				value2 := ""
				drops_value := 0
				FileRead, pricesDB, pricesDB.json
				pricesDB := JSON.Load(pricesDB)
				loop % relic_drops.Common.MaxIndex()
				{
					link := relic_drops.Common[A_index]
					str := StrReplace(relic_drops.Common[A_index], "_", " ")
					StringUpper, str, str, T
					;str := StrReplace(str, "blueprint", "BP")
					value1 .= ":brown_circle: " str  "`n"
					loop % pricesDB.MaxIndex()
					{
						if (pricesDB[A_index].item_url == link)
							value2 .= pricesDB[A_index].price "p`n", drops_value += pricesDB[A_index].price
					}
				}
				if (relic_drops.Common.MaxIndex() < 3)
					value1 .= ":brown_circle: Forma Blueprint`n", value2 .= "`n"
				loop % relic_drops.Uncommon.MaxIndex()
				{
					link := relic_drops.Uncommon[A_index]
					str := StrReplace(relic_drops.Uncommon[A_index], "_", " ")
					StringUpper, str, str, T
					;str := StrReplace(str, "blueprint", "BP")
					value1 .= ":white_circle: " str "`n"
					loop % pricesDB.MaxIndex()
					{
						if (pricesDB[A_index].item_url == link)
							value2 .= pricesDB[A_index].price "p`n", drops_value += pricesDB[A_index].price
					}
				}
				if (relic_drops.Uncommon.MaxIndex() < 2)
					value1 .= ":white_circle: Forma Blueprint`n", value2 .= "`n"
				loop % relic_drops.Rare.MaxIndex()
				{
					link := relic_drops.Rare[A_index]
					str := StrReplace(relic_drops.Rare[A_index], "_", " ")
					StringUpper, str, str, T
					;str := StrReplace(str, "blueprint", "BP")
					value1 .= ":yellow_circle: " str "`n"
					loop % pricesDB.MaxIndex()
					{
						if (pricesDB[A_index].item_url == link)
							value2 .= pricesDB[A_index].price "p`n", drops_value += pricesDB[A_index].price
					}
				}
				if (relic_drops.Rare.MaxIndex() < 1)
					value1 .= ":yellow_circle: Forma Blueprint`n", value2 .= "`n"
				value1 := SubStr(value1, 1, StrLen(value1)-1)		; Trailing newline
				value2 := SubStr(value2, 1, StrLen(value2)-1)		; Trailing newline
				relic_name := StrReplace(d_item_url, "_", " ")
				StringUpper, relic_name, relic_name, T
				title := StrReplace(d_item_url, "_", " ")
				StringUpper, title, title, T
				postdata.embeds.push({"footer": {"text": "Total drops value: " drops_value "p"}, "title": title,"url": "https://warframe.market/items/" d_item_url,"fields": [{"name": "``Drops``", "value": value1, "inline": "true"},{"name": "\u200b", "value": "\u200b", "inline": "true"},{"name": "\u200b", "value": value2, "inline": "true"}]})
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, postdata)
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			temp_d_item_url := d_item_url
			d_item_url := {}
			loop % wfm_items_list.payload.items.MaxIndex()
			{
				if RegExMatch(wfm_items_list.payload.items[A_Index].url_name, "^" temp_d_item_url "\W*")
				{
					if !(instr(wfm_items_list.payload.items[A_Index].url_name, "prime"))
						continue
					if (instr(wfm_items_list.payload.items[A_Index].url_name, "set"))
						continue
					d_item_url.push(wfm_items_list.payload.items[A_Index].url_name)
				}
			}
			if (d_item_url[1] == "")
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Item " temp_d_item_url " not found"})
				return
			}
			X := 1
			i := 1
			j := 1
			postdata := {}
			postdata[(X)] := {}
			postdata[(X)].content := ""
			postdata[(X)].embeds := {}
			loop % d_item_url.MaxIndex()
			{
				file_path := "Prime Parts Info\" d_item_url[i] ".json"
				FileRead, part_info, % file_path
				if ErrorLevel
				{
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Item " d_item_url[i] " not found."})
					return
				}
				temp := part_info
				part_info := JSON.Load(part_info)
				str := StrReplace(d_item_url[i], "_", " ")
				StringUpper, str, str, T
				postdata[(X)].embeds[j] := {}
				postdata[(X)].embeds[j].title := str
				postdata[(X)].embeds[j].url := "https://warframe.market/items/" d_item_url[i]
				postdata[(X)].embeds[j].fields := {}
				postdata[(X)].embeds[j].footer := {}
				postdata[(X)].embeds[j].footer.text := ""
				;---
				best_common := {}
				best_common.lith := {}
				best_common.meso := {}
				best_common.neo := {}
				best_common.axi := {}
				;---
				best_uncommon := {}
				best_uncommon.lith := {}
				best_uncommon.meso := {}
				best_uncommon.neo := {}
				best_uncommon.axi := {}
				;---
				best_rare := {}
				best_rare.lith := {}
				best_rare.meso := {}
				best_rare.neo := {}
				best_rare.axi := {}
				;---
				Loop % part_info.Relics.MaxIndex()
				{
					relic_index := A_index
					file_path := "Relics Info\" part_info.Relics[relic_index] ".json"
					FileRead, relic_drops, % file_path
					if ErrorLevel
					{
						this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Unexpected error. Contact MrSofty#7926"})
						return
					}
					relic_drops := JSON.Load(relic_drops)
					value := ""
					loop % relic_drops.Common.MaxIndex()
					{
						str := StrReplace(relic_drops.Common[A_index], "_", " ")
						StringUpper, str, str, T
						str := StrReplace(str, "blueprint", "BP")
						value .= ":brown_circle: " str  "`n"
						if (relic_drops.Common[A_index] == d_item_url[i])
						{
							relic_name := StrReplace(part_info.Relics[relic_index], "_", " ")
							StringUpper, relic_name, relic_name, T
							temp := StrSplit(relic_name, " ")
							relic_tier := temp[1]
							best_common[(relic_tier)].push(relic_name)
						}
					}
					if (relic_drops.Common.MaxIndex() < 3)
						value .= ":brown_circle: Forma Blueprint`n"
					loop % relic_drops.Uncommon.MaxIndex()
					{
						str := StrReplace(relic_drops.Uncommon[A_index], "_", " ")
						StringUpper, str, str, T
						str := StrReplace(str, "blueprint", "BP")
						value .= ":white_circle: " str "`n"
						if (relic_drops.Uncommon[A_index] == d_item_url[i])
						{
							relic_name := StrReplace(part_info.Relics[relic_index], "_", " ")
							StringUpper, relic_name, relic_name, T
							temp := StrSplit(relic_name, " ")
							relic_tier := temp[1]
							best_uncommon[(relic_tier)].push(relic_name)
						}
					}
					if (relic_drops.Uncommon.MaxIndex() < 2)
						value .= ":white_circle: Forma Blueprint`n"
					loop % relic_drops.Rare.MaxIndex()
					{
						str := StrReplace(relic_drops.Rare[A_index], "_", " ")
						StringUpper, str, str, T
						str := StrReplace(str, "blueprint", "BP")
						value .= ":yellow_circle: " str "`n"
						if (relic_drops.Rare[A_index] == d_item_url[i])
						{
							relic_name := StrReplace(part_info.Relics[relic_index], "_", " ")
							StringUpper, relic_name, relic_name, T
							temp := StrSplit(relic_name, " ")
							relic_tier := temp[1]
							best_rare[(relic_tier)].push(relic_name)
						}
					}
					if (relic_drops.Rare.MaxIndex() < 1)
						value .= ":yellow_circle: Forma Blueprint`n"
					value := SubStr(value, 1, StrLen(value)-1)		; Trailing newline
					relic_name := StrReplace(part_info.Relics[relic_index], "_", " ")
					StringUpper, relic_name, relic_name, T
					if (strlen(JSON.Dump(postdata[(X)])) + strlen({"name": "``" relic_name "``", "value": value, "inline": "true"}) > 6000)
					{
						; Create new array key for another message
						{
							X++
							j := 1
							postdata[(X)] := {}
							postdata[(X)].content := ""
							postdata[(X)].embeds := {}
						}
						;str := StrReplace(d_item_url[i], "_", " ")
						;StringUpper, str, str, T
						postdata[(X)].embeds[j] := {}
						;postdata[(X)].embeds[j].title := str
						;postdata[(X)].embeds[j].url := "https://warframe.market/items/" d_item_url[i]
						postdata[(X)].embeds[j].fields := {}
						postdata[(X)].embeds[j].footer := {}
						postdata[(X)].embeds[j].footer.text := ""
					}
					;postdata[(X)].embeds[j].title := str
					postdata[(X)].embeds[j].fields.push({"name": "``" relic_name "``", "value": value, "inline": "true"})
					;msgbox % strlen(JSON.Dump(postdata%X%))
				}
				tier_names := {}
				tier_names.push("lith", "meso", "neo", "axi")
				loop % tier_names.MaxIndex()
				{
					mainLoopIndex := A_Index
					if (JSON.Dump(best_common[(tier_names[mainLoopIndex])]) != "{}")
					{
						relics := ""
						loop % best_common[(tier_names[mainLoopIndex])].MaxIndex()
						{
							relics .= best_common[(tier_names[mainLoopIndex])][A_index] "|"
						}
						relics := SubStr(relics, 1, StrLen(relics)-1)
						postdata[(X)].embeds[j].footer.text := "Best Relic(s): " relics
						break
					}
				}
				if (postdata[(X)].embeds[j].footer.text == "")
				{
					loop % tier_names.MaxIndex()
					{
						mainLoopIndex := A_index
						if (JSON.Dump(best_uncommon[(tier_names[mainLoopIndex])]) != "{}")
						{
							relics := ""
							loop % best_uncommon[(tier_names[mainLoopIndex])].MaxIndex()
							{
								relics .= best_uncommon[(tier_names[mainLoopIndex])][A_index] "|"
							}
							relics := SubStr(relics, 1, StrLen(relics)-1)
							postdata[(X)].embeds[j].footer.text := "Best Relic(s): " relics
							break
						}
					}
				}
				if (postdata[(X)].embeds[j].footer.text == "")
				{
					loop % tier_names.MaxIndex()
					{
						mainLoopIndex := A_index
						if (JSON.Dump(best_rare[(tier_names[mainLoopIndex])]) != "{}")
						{
							relics := ""
							loop % best_rare[(tier_names[mainLoopIndex])].MaxIndex()
							{
								relics .= best_rare[(tier_names[mainLoopIndex])][A_index] "|"
							}
							relics := SubStr(relics, 1, StrLen(relics)-1)
							postdata[(X)].embeds[j].footer.text := "Best Relic(s): " relics
							break
						}
					}
				}
				i++
				j++
			}
			;clipboard := JSON.Dump(postdata)
			loop % X 
			{
				if (A_index==1)		; Only edit for first index
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, postdata[(A_index)])
				else 
					this.CallAPI("POST", "/channels/" Data.channel_id "/messages", postdata[(A_index)])
			}
			this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
			return
		}
		*/
		
		if (messageContent[1]==(this.prefix . "repeat"))
		{
			SetTimer, heartbeatMessage, 60000
			return
		}
		
		/*
		if ((messageContent[1]==(this.prefix . "auctions")) || (messageContent[1]==(this.prefix . "auction")))
		{
			if (messageContent[2]=="")
			{
				this.SendMessage(Data.channel_id, "Retrieve auctions for a kuva weapon lich from warframe.market, sorted by buyout price and weapon damage`nUsage example:`r`n.auctions kuva_kohm")
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			if !(messageContent[3]=="")
			{
				this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.auctions kuva_kohm")
				return
			}
			messageId := (this.SendMessage(Data.channel_id, "Processing")).id
			d_item_url := messageContent[2]
			;FileDelete, auctionCache.json
			auctions_file_name := "cache\auctionCache" A_Now ".json"
			d_status := srbFunctions.getAuction(d_item_url, auctions_file_name)		;func from main code
			if (d_status==-1)
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Error occured. Please try again"})
				;Discord.SendMessage(Data.d.channel_id, "Error occured. Please try again")
				return
			}
			if (d_status==-2)
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "No owners found at the moment for " d_item_url})
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				;Discord.SendMessage(Data.d.channel_id, "No sellers found at the moment for " d_item_url)
				return
			}
			if (d_status==-3)
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Item " d_item_url " not found"})
				;Discord.SendMessage(Data.d.channel_id, "Item " d_item_url " not found")
				return
			}
			FileRead, d_auctionDetail, % auctions_file_name
			if (ErrorLevel==1)
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "File read error. Please contact MrSofty#7926"})
				return
			}
			try 
			{
				FileDelete, % auctions_file_name
			}
			catch e 
			{
				if !(e.message=="1")
				{
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Unexpected file delete error. Contant MrSofty#7926"})
					return
				}
			}
			if (ErrorLevel==1)
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "File read error. Please contact MrSofty#7926"})
				return
			}
			d_auctionDetail := StrReplace(d_auctionDetail, "{""" d_item_url """:", "")
			d_auctionDetail := SubStr(d_auctionDetail, 1, StrLen(d_orderDetail)-1)
			d_auctionDetail := JSON.Load(d_auctionDetail)
			;----discord message array----
			d_postdata := {}
			d_postdata.content := ""
			d_postdata.embeds := {}
			;-----------------------------
			;----sorted by buyout_price----
			d_auctionDetail := objectSort(d_auctionDetail, "buyout_price",,false)
			d_ownerNames := ""
			d_weaponDetails := ""
			d_prices := ""
			i := 1
			loop	;list already sorted
			{
				if (i>5)
					break
				if (A_index > d_auctionDetail.MaxIndex())
					break
				if (d_auctionDetail[A_index].buyout_price=="")
					continue
				d_ownerNames := d_ownerNames "[" d_auctionDetail[A_index].owner "](https://warframe.market/auction/" d_auctionDetail[A_index].auction_id ")`n`n`n"
				d_weaponDetails := d_weaponDetails d_auctionDetail[A_index].damage "% " d_auctionDetail[A_index].element " "
				if (d_auctionDetail[A_index].ephemera)
					d_weaponDetails := d_weaponDetails "`nw/ Ephemera`n`n"
				else
					d_weaponDetails := d_weaponDetails "`nw/o Ephemera`n`n"
				d_prices := d_prices "``Price: " d_auctionDetail[A_index].buyout_price "```n``St. bid: " d_auctionDetail[A_index].starting_price "`` ``Top bid: " d_auctionDetail[A_index].top_bid "```n`n"
				i++
			}
			;----
			if InStr(d_ownerNames, "_")
				d_ownerNames := StrReplace(d_ownerNames, "_", "\_")
			d_partName := StrReplace(d_item_url, "_", " ")
			;capitalizing first letters
			loop, 26
			{
				if (SubStr(d_partName, 1, 1) == chr(A_Index + 96))
					d_partName := StrReplace(d_partName, chr(A_Index + 96), chr(A_Index + 64),, 1)
				d_partName := StrReplace(d_partName, " "chr(A_Index + 96), " "chr(A_Index + 64),, 1)
			}
			;----
			FormatTime, d_currentTimeFormatted, %A_NowUTC%, yyyy-MM-ddTHH:mm:ss.000Z
			d_postdata.embeds.push({title: d_partName, description: "``````fix`n(Sorted by buyout price)``````", timestamp: d_currentTimeFormatted, url: "https://warframe.market/auctions/search?type=lich&weapon_url_name=" d_item_Url "&sort_by=price_desc", fields: [{name: "Owner", value: d_ownerNames, inline: "true"}, {name: "Weapon Detail", value: d_weaponDetails, inline: "true"}, {name: "Price(s)", value: d_prices, inline: "true"}]})
			;----sorted by weapon damage incl. buyout price----
			d_auctionDetail := objectSort(d_auctionDetail, "damage",,true)
			d_ownerNames := ""
			d_weaponDetails := ""
			d_prices := ""
			i := 1
			loop	;list already sorted
			{
				if (i>5)
					break
				if (A_index > d_auctionDetail.MaxIndex())
					break
				if (d_auctionDetail[A_index].buyout_price=="")
					continue
				d_ownerNames := d_ownerNames "[" d_auctionDetail[A_index].owner "](https://warframe.market/auction/" d_auctionDetail[A_index].auction_id ")`n`n`n"
				d_weaponDetails := d_weaponDetails d_auctionDetail[A_index].damage "% " d_auctionDetail[A_index].element " "
				if (d_auctionDetail[A_index].ephemera)
					d_weaponDetails := d_weaponDetails "`nw/ Ephemera`n`n"
				else
					d_weaponDetails := d_weaponDetails "`nw/o Ephemera`n`n"
				d_prices := d_prices "``Price: " d_auctionDetail[A_index].buyout_price "```n``St. bid: " d_auctionDetail[A_index].starting_price "`` ``Top bid: " d_auctionDetail[A_index].top_bid "```n`n"
				i++
			}
			if InStr(d_ownerNames, "_")
				d_ownerNames := StrReplace(d_ownerNames, "_", "\_")
			;----
			d_partName := StrReplace(d_item_url, "_", " ")
			;capitalizing first letters
			loop, 26
			{
				if (SubStr(d_partName, 1, 1) == chr(A_Index + 96))
					d_partName := StrReplace(d_partName, chr(A_Index + 96), chr(A_Index + 64),, 1)
				d_partName := StrReplace(d_partName, " "chr(A_Index + 96), " "chr(A_Index + 64),, 1)
			}
			;----
			d_postdata.embeds.push({description: "``````fix`n(Sorted by weapon damage incl. buyout price)``````", timestamp: d_currentTimeFormatted, fields: [{name: "Owner", value: d_ownerNames, inline: "true"}, {name: "Weapon Detail", value: d_weaponDetails, inline: "true"}, {name: "Price(s)", value: d_prices, inline: "true"}]})
			;----sorted by weapon damage----
			d_auctionDetail := objectSort(d_auctionDetail, "damage",,true)
			d_ownerNames := ""
			d_weaponDetails := ""
			d_prices := ""
			i := 1
			loop	;list already sorted
			{
				if (i>5)
					break
				if (A_index > d_auctionDetail.MaxIndex())
					break
				d_ownerNames := d_ownerNames "[" d_auctionDetail[A_index].owner "](https://warframe.market/auction/" d_auctionDetail[A_index].auction_id ")`n`n`n"
				d_weaponDetails := d_weaponDetails d_auctionDetail[A_index].damage "% " d_auctionDetail[A_index].element " "
				if (d_auctionDetail[A_index].ephemera)
					d_weaponDetails := d_weaponDetails "`nw/ Ephemera`n`n"
				else
					d_weaponDetails := d_weaponDetails "`nw/o Ephemera`n`n"
				d_prices := d_prices "``Price: " d_auctionDetail[A_index].buyout_price "```n``St. bid: " d_auctionDetail[A_index].starting_price "`` ``Top bid: " d_auctionDetail[A_index].top_bid "```n`n"
				i++
			}
			if InStr(d_ownerNames, "_")
				d_ownerNames := StrReplace(d_ownerNames, "_", "\_")
			;----
			d_partName := StrReplace(d_item_url, "_", " ")
			;capitalizing first letters
			loop, 26
			{
				if (SubStr(d_partName, 1, 1) == chr(A_Index + 96))
					d_partName := StrReplace(d_partName, chr(A_Index + 96), chr(A_Index + 64),, 1)
				d_partName := StrReplace(d_partName, " "chr(A_Index + 96), " "chr(A_Index + 64),, 1)
			}
			;----
			d_postdata.embeds.push({description: "``````fix`n(Sorted by weapon damage)``````", timestamp: d_currentTimeFormatted, fields: [{name: "Owner", value: d_ownerNames, inline: "true"}, {name: "Weapon Detail", value: d_weaponDetails, inline: "true"}, {name: "Price(s)", value: d_prices, inline: "true"}]})
			;----
			try
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, d_postdata)
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			catch e
			{
				this.SendMessage(Data.channel_id, "Error occured. Please try again. Code 45")
				return
			}
		}
		*/

		/*
		if (messageContent[1]==(this.prefix . "list"))
		{
			if (messageContent[2]=="")
			{
				this.SendMessage(Data.channel_id, "List a prime item on warframe.market on your profile as the top selling order (requires authorization)`nUsage example:`n.list frost_prime_blueprint`n.list frost_prime_blueprint +10`n.list frost_prime_blueprint -20")
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			if (messageContent[3]!="")
			{
				if !(InStr(messageContent[3], "+") || InStr(messageContent[3], "-"))
				{
					this.SendMessage(Data.channel_id, "Invalid offset. Usage example:`n.list frost_prime_blueprint`n.list frost_prime_blueprint +10`n.list frost_prime_blueprint -20")
					return
				}
			}
			if (messageContent[4]!="")
			{
				this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.list frost_prime_blueprint")
				return
			}
			if (!InStr(messageContent[2], "prime") || InStr(messageContent[2], "primed"))
			{
				this.SendMessage(Data.channel_id, "This command is only limited to prime items for now")
				return
			}
			offset := messageContent[3]
			if (offset=="")
				offset := 0
			messageId := (this.SendMessage(Data.channel_id, "Processing")).id
			d_item_url := messageContent[2]
			FileRead, jwt_stack, % A_ScriptDir "\JWT_Stack\jwt_stack.json"
			jwt_stack := JSON.Load(jwt_stack)
			JWT := ""
			ingame_name := ""
			loop % jwt_stack.MaxIndex()
			{
				if (jwt_stack[A_index].discord_id == Data.author.id)
				{
					JWT := jwt_stack[A_index].JWT
					ingame_name := jwt_stack[A_index].ingame_name
					break
				}
			}
			if (JWT == "")
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Unauthorized. Please check your DMs"})
				d_postdata := {}
				d_postdata.recipient_id := Data.author.id
				try 
				{
					code := this.SendMessage((this.CallAPI("POST", "/users/@me/channels", d_postdata)).id, "Please authorize your account with the following command. Your email and password is not saved, only a token is stored for future orders`n.authorize wfm_email@xyz.com wfm_password123")
					if (code == 50007)
						this.SendMessage(Data.channel_id, "Error occured sending DM. Make sure you have DMs turned on for the bot")
				}
				catch e 
				{
					this.SendMessage(Data.channel_id, "Error occured sending DM. Make sure you have DMs turned on for the bot")
					return
				}
				return
			}
			loop 
			{
				try 
				{
					;----retrieve orders with similar names----
					WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
					WebRequest.Open("GET", "https://api.warframe.market/v1/profile/" ingame_name "/orders", true)
					WebRequest.SetRequestHeader("Content-Type", "application/json")
					WebRequest.SetRequestHeader("auth_type", "header")
					WebRequest.SetRequestHeader("Authorization", JWT)
					WebRequest.SetRequestHeader("language", "en")
					WebRequest.Send()
					WebRequest.WaitForResponse()
					profile_orders := JSON.Load(WebRequest.ResponseText)
					loop % profile_orders.payload.sell_orders.MaxIndex()
					{
						if (profile_orders.payload.sell_orders[A_index].item.url_name==d_item_url)
						{
							;----delete existing orders----
							WebRequest.Open("DELETE", "https://api.warframe.market/v1/profile/orders/" profile_orders.payload.sell_orders[A_index].id, true)
							WebRequest.SetRequestHeader("Content-Type", "application/json")
							WebRequest.SetRequestHeader("auth_type", "header")
							WebRequest.SetRequestHeader("Authorization", JWT)
							WebRequest.SetRequestHeader("language", "en")
							WebRequest.Send()
							WebRequest.WaitForResponse()
						}
					}
					;----retrieve item_id----
					WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
					WebRequest.Open("GET", "https://api.warframe.market/v1/items/" d_item_url, true)
					WebRequest.SetRequestHeader("Content-Type", "application/json")
					WebRequest.SetRequestHeader("auth_type", "header")
					WebRequest.SetRequestHeader("Authorization", JWT)
					WebRequest.SetRequestHeader("language", "en")
					WebRequest.Send()
					WebRequest.WaitForResponse()
					;----retrieve top listing----
					orders_file_name := "cache\orderCache" A_Now ".json"
					srbFunctions.getOrder(d_item_url, orders_file_name)
					FileRead, order_listing, % orders_file_name
					if (ErrorLevel==1)
					{
						this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "File read error. Please contact MrSofty#7926"})
						return
					}
					try 
					{
						Filedelete, % orders_file_name
					}
					catch e 
					{
						if !(e.message=="1")
						{
							this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "File delete error. Please contact MrSofty#7926"})
							return
						}
					}
					order_listing := StrReplace(order_listing, """" . d_item_url . """: ", "")
					order_listing := JSON.Load(order_listing)
					order_listing := objectSort(order_listing, "price",,false)
					postdata := {}
					postdata.item_id := JSON.Load(WebRequest.ResponseText).payload.item.id
					postdata.order_type := "sell"
					if (order_listing[1].price == "")
					{
						this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Listing unsuccessful. No order available at the moment for this item"})
						return
					}
					if ((order_listing[1].price + offset) > 0)
						postdata.platinum := order_listing[1].price + offset
					else
						postdata.platinum := order_listing[1].price
					postdata.quantity := "1"
					postdata.visible := "true"
					;----post new order----
					WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
					WebRequest.Open("POST", "https://api.warframe.market/v1/profile/orders", true)
					WebRequest.SetRequestHeader("Content-Type", "application/json")
					WebRequest.SetRequestHeader("auth_type", "header")
					WebRequest.SetRequestHeader("Authorization", JWT)
					WebRequest.SetRequestHeader("language", "en")
					WebRequest.Send(JSON.Dump(postdata))
					WebRequest.WaitForResponse()
					if InStr(WebRequest.responseText, "app.form.invalid")
					{
						this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Some error occured listing new order. Contact MrSofty#7926"})
						return
					}
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Item " d_item_url " successfully listed for profile " ingame_name})
					break
				}
				catch e 
				{
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Some error occured at line " e.line ". Exception thrown: " e.message "`nContact MrSofty#7926"})
					break
				}
			}
			return
		}
		*/

		/*
		if (messageContent[1]==(this.prefix . "relist"))
		{
			if (messageContent[2]=="")
			{
				this.SendMessage(Data.channel_id, "Exactly like .list command except it relists all the sell orders on your profile for prime items. (requires authorization)`nIn order to prevent stress on the API, you can only use this command once per hour.`nUsage example:`n.relist all`n.relist all +10`n.relist all -20")
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				return
			}
			if (messageContent[2]!="all")
			{
				this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.relist all`n.relist all +10`n.relist all -20")
				return
			}
			if (messageContent[3]!="")
			{
				if !(InStr(messageContent[3], "+") || InStr(messageContent[3], "-"))
				{
					this.SendMessage(Data.channel_id, "Invalid offset. Usage example:`r`n.relist all`n.relist all +10`n.relist all -20")
					return
				}
			}
			if !(messageContent[4]=="")
			{
				this.SendMessage(Data.channel_id, "Incorrect command. Usage example:`r`n.relist all`n.relist all +10`n.relist all -20")
				return
			}
			offset := messageContent[3]
			if (offset=="")
				offset := 0
			FileRead, cooldown_stack, % A_ScriptDir "\Cooldown_Stack\cooldown_stack.json"
			cooldown_stack := JSON.Load(cooldown_stack)
			inStack := 0
			loop % cooldown_stack.MaxIndex()
			{
				if (Data.author.id=="253525146923433984")		;because im admin?
				{
					inStack := 1
					break
				}
				if (cooldown_stack[A_index].discord_id == Data.author.id)
				{
					if ((Round(A_TickCount/1000) - cooldown_stack[A_index].timestamp) < 60 && (Round(A_TickCount/1000) - cooldown_stack[A_index].timestamp) > 0)
					{
						this.SendMessage(Data.channel_id, "This command is currently on cooldown for you. You can re use in " Round(1 - (Round(A_TickCount/1000) - cooldown_stack[A_index].timestamp)/60) " minutes")
						return
					}
					else
					{
						cooldown_stack[A_index].timestamp := Round(A_TickCount/1000)
						inStack := 1
					}
				}
			}
			if !inStack
			{
				cooldown_stack.push({"discord_id": Data.author.id, "timestamp": Round(A_TickCount/1000)})
			}
			;----update cooldown_stack----
			file_name := A_ScriptDir "\Cooldown_Stack\cooldown_stack.json"
			file := FileOpen(file_name, "w")
			file.write(JSON.Dump(cooldown_stack))
			file.close()
			;-----------------------------
			messageId := (this.SendMessage(Data.channel_id, "Processing, this might take a minute")).id
			FileRead, jwt_stack, % A_ScriptDir "\JWT_Stack\jwt_stack.json"
			jwt_stack := JSON.Load(jwt_stack)
			JWT := ""
			ingame_name := ""
			loop % jwt_stack.MaxIndex()
			{
				if (jwt_stack[A_index].discord_id == Data.author.id)
				{
					JWT := jwt_stack[A_index].JWT
					ingame_name := jwt_stack[A_index].ingame_name
					break
				}
			}
			if (JWT == "")
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Unauthorized. Please check your DMs"})
				d_postdata := {}
				d_postdata.recipient_id := Data.author.id
				try 
				{
					code := this.SendMessage((this.CallAPI("POST", "/users/@me/channels", d_postdata)).id, "Please authorize your account with the following command. Your email and password is not saved, only a token is stored for future orders`n.authorize wfm_email@xyz.com wfm_password123")
					if (code == 50007)
						this.SendMessage(Data.channel_id, "Error occured sending DM. Make sure you have DMs turned on for the bot")
				}
				catch e 
				{
					this.SendMessage(Data.channel_id, "Error occured sending DM. Make sure you have DMs turned on for the bot")
					return
				}
				return
			}
			fn := Func("relist_operation_label").Bind(ingame_name, JWT, offset, Data, messageId, opId)
			try
			{
				SetTimer, %fn%, -0
			}
			catch e 
			{
				msgbox % e.message
			}
			return
		}
		*/
	}
	
	OP0_GUILD_MEMBERS_CHUNK(Data)
	{
		file_name := "Presence Updates\presence_updates.json"
		file := FileOpen(file_name, "w")
		file.write(JSON.Dump(Data))
		file.close()
	}

	OP0_MESSAGE_REACTION_ADD(Data)
	{
		if (Data.member.user.id == this.botID)		;botception
			return

		/*
		if (Data.emoji.name == "🆙")
		{
			reactedMessageDetail := this.CallAPI("GET", "/channels/" Data.channel_id "/messages/" Data.message_id)		;retrieving details of the reaction message
			if (reactedMessageDetail.author.id != this.botID)
				return
			this.CallAPI("DELETE", "/channels/" Data.channel_id "/messages/" Data.message_id "/reactions/🆙/" Data.member.user.id)			;deleting reaction
			messageId := Data.message_id
			channelId := Data.channel_id
			d_item_url := {}
			loop % reactedMessageDetail.embeds.MaxIndex()
			{
				StringLower, temp, % StrReplace(reactedMessageDetail.embeds[A_index].title, " ", "_")
				d_item_url.push(temp)
			}
			this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {content: "Updating...", embeds: ""})
			if (d_item_url[1] == "")
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Could not retrieve details of the item. This order is no longer updatable"})
				return
			}
			d_postdata := {}
			d_postdata.content := "React with :up: to update"
			d_postdata.embeds := {}
			loop % d_item_url.MaxIndex()
			{
				orders_file_name := "cache\orderCache" A_Now ".json"
				d_status := srbFunctions.getOrder(d_item_url[A_index],orders_file_name)		;func from main code
				if (d_status==-1)
				{
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Error occured. Please try again"})
					return
				}
				if (d_status==-2)
					continue
				if (d_status==-3)
				{
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Item " d_item_url[A_index] " not found"})
					return
				}
				FileRead, d_orderDetail, % orders_file_name
				if (ErrorLevel==1)
				{
					this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "File read error. Please contact MrSofty#7926"})
					return
				}
				try 
				{
					FileDelete, % orders_file_name
				}
				catch e 
				{
					if !(e.message=="1")
					{
						this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Unexpected file delete error. Contant MrSofty#7926"})
						return
					}
				}
				d_orderDetail := StrReplace(d_orderDetail, """" . d_item_url[A_index] . """: ", "")
				d_orderDetail := JSON.Load(d_orderDetail)
				d_orderDetail := objectSort(d_orderDetail, "price",,false)
				d_sellerNames := ""
				d_partQuantity := ""
				d_partPrice := ""
				loop, 5		;list already sorted
				{
					d_sellerNames := d_sellerNames . d_orderDetail[A_index].seller . "`n"
					d_partQuantity := d_partQuantity . d_orderDetail[A_index].quantity . "`n"
					d_partPrice := d_partPrice . d_orderDetail[A_index].price . "`n"
				}
				if InStr(d_sellerNames, "_")
					d_sellerNames := StrReplace(d_sellerNames, "_", "\_")
				d_partName := StrReplace(d_item_url[A_index], "_", " ")
				;capitalizing first letters
				loop, 26
				{
					if (SubStr(d_partName, 1, 1) == chr(A_Index + 96))
						d_partName := StrReplace(d_partName, chr(A_Index + 96), chr(A_Index + 64),, 1)
					d_partName := StrReplace(d_partName, " "chr(A_Index + 96), " "chr(A_Index + 64),, 1)
				}
				;----
				FormatTime, d_currentTimeFormatted, %A_NowUTC%, yyyy-MM-ddTHH:mm:ss.000Z
				d_postdata.embeds.push({title: d_partName, timestamp: d_currentTimeFormatted, url: "https://warframe.market/items/" d_item_url[A_index], fields: [{name: "Seller", value: d_sellerNames, inline: "true"}, {name: "Quantity", value: d_partQuantity, inline: "true"}, {name: "Price", value: d_partPrice, inline: "true"}]})
			}
			if (d_postdata.embeds[1].title == "")
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "No sellers found at the moment for " d_item_url[d_item_url.MaxIndex()]})
				return
			}
			try
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, d_postdata)
				return
			}
			catch e
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Error occured. Please try again`nException: " e.message "`nLine: " e.line})
				return
			}
			return
		}
		*/
		
		/*
		if (Data.emoji.name == "⭐")
		{
			reactedMessageDetail := this.CallAPI("GET", "/channels/" Data.channel_id "/messages/" Data.message_id)		;retrieving details of the reaction message
			if (reactedMessageDetail.author.id != this.botID)
				return
			if (reactedMessageDetail.channel_id != "863744615768784916")
				return
			this.CallAPI("PUT", "/guilds/" Data.guild_id "/members/" Data.user_id "/roles/874077155083026473")
			d_postdata := {}
			d_postdata.recipient_id := Data.user_id
			this.SendMessage((this.CallAPI("POST", "/users/@me/channels", d_postdata)).id, "Role ""Ducats-1"" Added.")
		}
		if (Data.emoji.name == "💎")
		{
			reactedMessageDetail := this.CallAPI("GET", "/channels/" Data.channel_id "/messages/" Data.message_id)		;retrieving details of the reaction message
			if (reactedMessageDetail.author.id != this.botID)
				return
			if (reactedMessageDetail.channel_id != "863744615768784916")
				return
			this.CallAPI("PUT", "/guilds/" Data.guild_id "/members/" Data.user_id "/roles/876909210271617074")
			d_postdata := {}
			d_postdata.recipient_id := Data.user_id
			this.SendMessage((this.CallAPI("POST", "/users/@me/channels", d_postdata)).id, "Role ""Ducats-2"" Added.")
			return
		}
		*/
		/*
		if (Data.emoji.name == "🔴")
		{
			reactedMessageDetail := this.CallAPI("GET", "/channels/" Data.channel_id "/messages/" Data.message_id)		;retrieving details of the reaction message
			if (reactedMessageDetail.author.id != this.botID)
				return
			if (reactedMessageDetail.channel_id != "863744615768784916")
				return
            FileRead, dnd_filter, Presence Updates\dnd_filter.json
			dnd_filter := JSON.Load(dnd_filter)
			if (InStr(JSON.Dump(dnd_filter), Data.user_id))		; already in stack
				return
			dnd_filter.push(Data.user_id)
			file_name := "Presence Updates\dnd_filter.json"
			file := FileOpen(file_name, "w")
			file.write(JSON.Dump(dnd_filter))
			file.close()
			return
		}
		*/
		/*
		if (Data.emoji.name == "🟣")
		{
			reactedMessageDetail := this.CallAPI("GET", "/channels/" Data.channel_id "/messages/" Data.message_id)		;retrieving details of the reaction message
			if (reactedMessageDetail.author.id != this.botID)
				return
			if (reactedMessageDetail.channel_id != "863744615768784916")
				return
            FileRead, invis_filter, Presence Updates\invis_filter.json
			invis_filter := JSON.Load(invis_filter)
			if (InStr(JSON.Dump(invis_filter), Data.user_id))		; already in stack
				return
			invis_filter.push(Data.user_id)
			file_name := "Presence Updates\invis_filter.json"
			file := FileOpen(file_name, "w")
			file.write(JSON.Dump(invis_filter))
			file.close()
			return
		}
		*/
		if (Data.emoji.name == "🎉")		;removing roles for hiatus members
		{
			reactedMessageDetail := this.CallAPI("GET", "/channels/" Data.channel_id "/messages/" Data.message_id)		;retrieving details of the reaction message
			if (reactedMessageDetail.author.id != "294882584201003009")		;giveaway bot id
				return
			if (reactedMessageDetail.channel_id != "793207311891562556")	;only giveaway channel
				return
            FileRead, presence_updates, Presence Updates\presence_updates.json
			presence_updates := JSON.Load(presence_updates)
            loop % presence_updates.members.MaxIndex()
            {
                if InStr(JSON.Dump(presence_updates.members[A_index].roles), "838888922971897856")		;hiatus role
                {
					if (Data.user_id == presence_updates.members[A_index].user.id)
					{
						this.CallAPI("DELETE", "/channels/" Data.channel_id "/messages/" Data.message_id "/reactions/🎉/" Data.user_id)			;deleting reaction
							break
					}
				}
			}
			return
		}
	}

	OP0_MESSAGE_REACTION_REMOVE(Data)
	{
		if (Data.user_id == this.botID)		;botception
			return

		/*
		if (Data.emoji.name == "⭐")
		{
			reactedMessageDetail := this.CallAPI("GET", "/channels/" Data.channel_id "/messages/" Data.message_id)		;retrieving details of the reaction message
			if (reactedMessageDetail.author.id != this.botID)
				return
			if (reactedMessageDetail.channel_id != "863744615768784916")
				return
			this.CallAPI("DELETE", "/guilds/" Data.guild_id "/members/" Data.user_id "/roles/874077155083026473")
			d_postdata := {}
			d_postdata.recipient_id := Data.user_id
			this.SendMessage((this.CallAPI("POST", "/users/@me/channels", d_postdata)).id, "Role ""Ducats-1"" Removed.")
		}
		if (Data.emoji.name == "💎")
		{
			reactedMessageDetail := this.CallAPI("GET", "/channels/" Data.channel_id "/messages/" Data.message_id)		;retrieving details of the reaction message
			if (reactedMessageDetail.author.id != this.botID)
				return
			if (reactedMessageDetail.channel_id != "863744615768784916")
				return
			this.CallAPI("DELETE", "/guilds/" Data.guild_id "/members/" Data.user_id "/roles/876909210271617074")
			d_postdata := {}
			d_postdata.recipient_id := Data.user_id
			this.SendMessage((this.CallAPI("POST", "/users/@me/channels", d_postdata)).id, "Role ""Ducats-2"" Removed.")
		}
		*/
		/*
		if (Data.emoji.name == "🔴")
		{
			reactedMessageDetail := this.CallAPI("GET", "/channels/" Data.channel_id "/messages/" Data.message_id)		;retrieving details of the reaction message
			if (reactedMessageDetail.author.id != this.botID)
				return
			if (reactedMessageDetail.channel_id != "863744615768784916")
				return
            FileRead, dnd_filter, Presence Updates\dnd_filter.json
			dnd_filter := JSON.Load(dnd_filter)
			if !(InStr(JSON.Dump(dnd_filter), Data.user_id))		; not in stack
				return
			loop % dnd_filter.MaxIndex()
			{
				if (dnd_filter[A_index]==Data.user_id)
				{
					dnd_filter.removeat(A_index)
					break
				}
			}
			file_name := "Presence Updates\dnd_filter.json"
			file := FileOpen(file_name, "w")
			file.write(JSON.Dump(dnd_filter))
			file.close()
			return
		}
		*/
		/*
		if (Data.emoji.name == "🟣")
		{
			reactedMessageDetail := this.CallAPI("GET", "/channels/" Data.channel_id "/messages/" Data.message_id)		;retrieving details of the reaction message
			if (reactedMessageDetail.author.id != this.botID)
				return
			if (reactedMessageDetail.channel_id != "863744615768784916")
				return
            FileRead, invis_filter, Presence Updates\invis_filter.json
			invis_filter := JSON.Load(invis_filter)
			if !(InStr(JSON.Dump(invis_filter), Data.user_id))		; not in stack
				return
			loop % invis_filter.MaxIndex()
			{
				if (invis_filter[A_index]==Data.user_id)
				{
					invis_filter.removeat(A_index)
					break
				}
			}
			file_name := "Presence Updates\invis_filter.json"
			file := FileOpen(file_name, "w")
			file.write(JSON.Dump(invis_filter))
			file.close()
			return
		}
		*/
	}

	; Called by the JS on WS error
	OnError(Event)
	{
		;throw Exception("Unhandled Discord.ahk WebSocket Error")
    	;msgbox,,, reconnecting. websocket error, 1
		Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Closing WS, WS Error. `nReceived code: `n" Event.code "`n`n", Reconnect Log.dat
		this.ws.Reconnect()
		return
		Run, discordBotInitializer.ahk	
		Exitapp
		;this.__New("ODMyNjgyMzY5ODMxMTQxNDE3.YHnV4w.JRy0L2nCzOY4QIAU6ylkjG_UOm4")         ;reconnecting to the bot
		return
	}
	
	; Called by the JS on WS close
	OnClose(Event)
	{
		;throw Exception("Unhandled Discord.ahk WebSocket Close")
    	;msgbox,,, reconnecting. websocket close, 1
		; Reconnecting
		;msgbox % Event.code "`n" Event.reason
		;RegWrite REG_SZ, HKCU, Software\Softy Relic Bot, l_session_id, % this.session_id		
		;RegWrite REG_DWORD, HKCU, Software\Softy Relic Bot, l_seq, % this.Seq
		Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Closing WS, WS Close. `nReceived code: `n" Event.code "`n`n", Reconnect Log.dat
		SendHeartbeat := this.SendHeartbeatBound
		SetTimer, %SendHeartbeat%, off
		Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Heardbeat timer removed`n`n", Reconnect Log.dat
		this.ws.Reconnect()
		return
		Run, discordBotInitializer.ahk	
		Exitapp
		;this.__New("ODMyNjgyMzY5ODMxMTQxNDE3.YHnV4w.JRy0L2nCzOY4QIAU6ylkjG_UOm4")         ;reconnecting to the bot
		return
	}
	
	; Gets called periodically by a timer to send a heartbeat operation
	SendHeartbeat()
	{
		if !this.HeartbeatACK
		{
			;throw Exception("Heartbeat did not respond")
			/*
				If a client does not receive a heartbeat ack between its
				attempts at sending heartbeats, it should immediately terminate
				the connection with a non 1000 close code, reconnect, and
				attempt to resume.
			*/
    		;msgbox,,, Heartbeat did not respond. reconnecting to the bot, 1
			Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Closing WS, Heartbeat error.`n`n", Reconnect Log.dat
			this.ws.Reconnect()
			return
			Run, discordBotInitializer.ahk	
			Exitapp
			return
		}
		
		this.HeartbeatACK := False
		this.Send({"op": 1, "d": this.Seq})
	}

	PresenceUpdate()
	{
		postdata := []
		postdata.op := 8
		postdata.d := {"guild_id": "776804537095684108","query": "","limit": 0,"presences": "true"}
		this.Send(postdata)
		return
	}

	/*
	verify_roles()
	{
		;----Ducats-1----
		members_reacted := this.CallAPI("GET", "/channels/863744615768784916/messages/874104958755168256/reactions/⭐")
		loop % members_reacted.MaxIndex()
		{
			member_roles := this.CallAPI("GET", "/guilds/776804537095684108/members/" members_reacted[A_index].id)
			if (member_roles==10007)	; Unknown member. Must've left the guild. Clear cache
			{
				memberId := members_reacted[A_index].id
				this.CallAPI("DELETE", "/channels/863744615768784916/messages/874104958755168256/reactions/⭐/" memberId)			;deleting reaction
				this.CallAPI("DELETE", "/channels/863744615768784916/messages/874104958755168256/reactions/💎/" memberId)			;deleting reaction
				this.CallAPI("DELETE", "/channels/863744615768784916/messages/874104958755168256/reactions/🔴/" memberId)			;deleting reaction
				this.CallAPI("DELETE", "/channels/863744615768784916/messages/874104958755168256/reactions/🟣/" memberId)			;deleting reaction
				FileRead, dnd_filter, Presence Updates\dnd_filter.json
				dnd_filter := JSON.Load(dnd_filter)
				FileRead, invis_filter, Presence Updates\invis_filter.json
				invis_filter := JSON.Load(invis_filter)
				loop % dnd_filter.MaxIndex()
				{
					if (dnd_filter[A_index]==memberId)
						dnd_filter.removeat(A_index)
				}
				file_name := "Presence Updates\dnd_filter.json"
				file := FileOpen(file_name, "w")
				file.write(JSON.Dump(dnd_filter))
				file.close()
				loop % invis_filter.MaxIndex()
				{
					if (invis_filter[A_index]==memberId)
						invis_filter.removeat(A_index)
				}
				file_name := "Presence Updates\invis_filter.json"
				file := FileOpen(file_name, "w")
				file.write(JSON.Dump(invis_filter))
				file.close()
			}
			if !(Instr(Jxon_Dump(member_roles.roles), "874077155083026473"))		;user does not have a role but reacted to it
			{
				this.CallAPI("PUT", "/guilds/776804537095684108/members/" members_reacted[A_index].id "/roles/874077155083026473")
				d_postdata := {}
				d_postdata.recipient_id := members_reacted[A_index].id
				this.SendMessage((this.CallAPI("POST", "/users/@me/channels", d_postdata)).id, "Role ""Ducats-1"" Added.`n(This message might be late since you reacted when bot was offline. If this is a mistake, contact MrSofty#7926)")
			}
		}
		;----Ducats-2----
		members_reacted := this.CallAPI("GET", "/channels/863744615768784916/messages/874104958755168256/reactions/💎")
		loop % members_reacted.MaxIndex()
		{
			member_roles := this.CallAPI("GET", "/guilds/776804537095684108/members/" members_reacted[A_index].id)
			if !(Instr(Jxon_Dump(member_roles.roles), "876909210271617074"))		;user does not have a role but reacted to it
			{
				this.CallAPI("PUT", "/guilds/776804537095684108/members/" members_reacted[A_index].id "/roles/876909210271617074")
				d_postdata := {}
				d_postdata.recipient_id := members_reacted[A_index].id
				this.SendMessage((this.CallAPI("POST", "/users/@me/channels", d_postdata)).id, "Role ""Ducats-2"" Added.`n(This message might be late since you reacted when bot was offline. If this is a mistake, contact MrSofty#7926)")
			}
		}
		;-----Dnd Filter----
		FileRead, dnd_filter, Presence Updates\dnd_filter.json
		dnd_filter := JSON.Load(dnd_filter)
		FileRead, invis_filter, Presence Updates\invis_filter.json
		invis_filter := JSON.Load(invis_filter)
		members_reacted := this.CallAPI("GET", "/channels/863744615768784916/messages/874104958755168256/reactions/🔴")
		loop % members_reacted.MaxIndex()
		{
			user_id := members_reacted[A_index].id
			if (InStr(JSON.Dump(dnd_filter), user_id))		; already in stack
				continue
			dnd_filter.push(user_id)
		}
		file_name := "Presence Updates\dnd_filter.json"
		file := FileOpen(file_name, "w")
		file.write(JSON.Dump(dnd_filter))
		file.close()
		;-----Invis Filter----
		members_reacted := this.CallAPI("GET", "/channels/863744615768784916/messages/874104958755168256/reactions/🟣")
		loop % members_reacted.MaxIndex()
		{
			user_id := members_reacted[A_index].id
			if (InStr(JSON.Dump(invis_filter), user_id))		; already in stack
				continue
			invis_filter.push(user_id)
		}
		file_name := "Presence Updates\invis_filter.json"
		file := FileOpen(file_name, "w")
		file.write(JSON.Dump(invis_filter))
		file.close()
		;----
		return
	}
	*/

	verify_giveaway_roles()
	{
		; Get all channel messages
		channel_id := 793207311891562556		; giveaway channel
		all_messages := this.CallAPI("GET", "/channels/" channel_id "/messages")
		loop % all_messages.MaxIndex()
		{
			if (all_messages[A_index].author.id != "294882584201003009")		; giveaway bot id
				continue
			if (all_messages[A_index].embeds[1].footer.text == "")					; doesn't have a footer
				continue
			if InStr(all_messages[A_index].embeds[1].footer.text, "Ended at")		; already ended
				continue
			message_id := all_messages[A_index].id
			members_reacted := this.CallAPI("GET", "/channels/" channel_id "/messages/" message_id "/reactions/🎉")		;retrieving members who reacted to the message
			reactedMessageDetail := this.CallAPI("GET", "/channels/" channel_id "/messages/" message_id)					 ;retrieving details of the reaction message
			FileRead, presence_updates, Presence Updates\presence_updates.json
			presence_updates := JSON.Load(presence_updates)
			loop % members_reacted.MaxIndex()
			{
				member_id := members_reacted[A_index].id
				loop % presence_updates.members.MaxIndex()
				{
					if InStr(JSON.Dump(presence_updates.members[A_index].roles), "838888922971897856")		;hiatus role
					{
						if (member_id == presence_updates.members[A_index].user.id)
						{
							this.CallAPI("DELETE", "/channels/" channel_id "/messages/" message_id "/reactions/🎉/" member_id)			;deleting reaction
								break
						}
					}
				}
			}
		}
		return
	}

	/*
	relist_operation(ingame_name, JWT, offset, Data, messageId, opId)
	{
		loop 
		{
			try 
			{
				;----retrieve orders for the profile----
				loop
				{
					try
					{
						WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
						WebRequest.Open("GET", "https://api.warframe.market/v1/profile/" ingame_name "/orders", true)
						WebRequest.SetRequestHeader("Content-Type", "application/json")
						WebRequest.SetRequestHeader("auth_type", "header")
						WebRequest.SetRequestHeader("Authorization", JWT)
						WebRequest.SetRequestHeader("language", "en")
						WebRequest.Send()
						WebRequest.WaitForResponse()
						if (SubStr(WebRequest.Status, 1, 1) == 5)   ;internal server error
							continue
						if (WebRequest.Status != 200)
						{
							this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "<@253525146923433984> Unhandled error. Check log file"})
							Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured using .relist command in script " A_ScriptName " at line " e.line "`nexception: " e.message "`nServer Response: " WebRequest.ResponseText "`nSent data: " JSON.Dump(postdata) "`r`n", Error log.dat
							return
						}
					}
					catch e 
					{
						if InStr(e.message, "0x80072EE7")
							continue
						if InStr(e.message, "0x8000000A")
							continue
						this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "<@253525146923433984> Unhandled error. Check log file"})
						Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured using .relist command in script " A_ScriptName " at line " e.line "`nexception: " e.message "`nServer Response: " WebRequest.ResponseText "`nSent data: " JSON.Dump(postdata) "`r`n", Error log.dat
						return
					}
					break
				}
				profile_orders := JSON.Load(WebRequest.ResponseText)
				value1 := ""
				value2 := ""
				loop % profile_orders.payload.sell_orders.MaxIndex()
				{
					tags := JSON.Dump(profile_orders.payload.sell_orders[A_index].item.tags)
					if ((profile_orders.payload.sell_orders[A_index].order_type=="sell") && !Instr(tags, "mod") && Instr(tags, "prime"))
					{
						order_id := profile_orders.payload.sell_orders[A_index].id
						item_url := profile_orders.payload.sell_orders[A_index].item.url_name
						this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Processing, this might take a minute`n" item_url "..."})
						;----retrieve top listing----
						orders_file_name := "cache\orderCache" A_Now ".json"
						srbFunctions.getOrder(profile_orders.payload.sell_orders[A_index].item.url_name, orders_file_name)
						FileRead, order_listing, % orders_file_name
						if (ErrorLevel==1)
						{
							this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "File read error. Please contact MrSofty#7926"})
							return
						}
						try 
						{
							Filedelete, % orders_file_name
						}
						catch e 
						{
							if !(e.message=="1")
							{
								this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "File delete error. Please contact MrSofty#7926"})
								return
							}
						}
						order_listing := StrReplace(order_listing, """" . item_url . """: ", "")
						order_listing := JSON.Load(order_listing)
						order_listing := objectSort(order_listing, "price",,false)
						postdata := {}
						if (order_listing[1].price == "")	;skip this order
							continue
						price := 0
						i := 1
						; Average top 5 orders
						loop % order_listing.MaxIndex()
						{
							if (i==6)
								break
							price += order_listing[A_index].price
							i++
						}
						price /= --i
						;----
						if ((price + offset) > 0)
							postdata.platinum := price + offset
						else
							postdata.platinum := price
						postdata.platinum := price + offset
						if (offset != 0) && (Mod(postdata.platinum, 10)!=0)
							postdata.platinum := postdata.platinum + (10 - Mod(postdata.platinum, 10))
						;----edit order----
						loop
						{
							try
							{
								WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
								WebRequest.Open("PUT", "https://api.warframe.market/v1/profile/orders/" order_id, true)
								WebRequest.SetRequestHeader("Content-Type", "application/json")
								WebRequest.SetRequestHeader("auth_type", "header")
								WebRequest.SetRequestHeader("Authorization", JWT)
								WebRequest.SetRequestHeader("language", "en")
								WebRequest.Send(JSON.Dump(postdata))
								WebRequest.WaitForResponse()
								if (SubStr(WebRequest.Status, 1, 1) == 5)   ;internal server error
									continue
								if (WebRequest.Status != 200)
								{
									this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "<@253525146923433984> Unhandled error. Check log file"})
									Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured using .relist command in script " A_ScriptName " at line " e.line "`nexception: " e.message "`nServer Response: " WebRequest.ResponseText "`nSent data: " JSON.Dump(postdata) "`r`n", Error log.dat
									return
								}

							}
							catch e 
							{
								if InStr(e.message, "0x80072EE7")
									continue
								if InStr(e.message, "0x8000000A")
									continue
								this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "<@253525146923433984> Unhandled error. Check log file"})
								Fileappend, % "[" A_DD "/" A_MMM "/" A_YYYY " " A_Hour ":" A_Min "] Error occured using .relist command in script " A_ScriptName " at line " e.line "`nexception: " e.message "`nServer Response: " WebRequest.ResponseText "`nSent data: " JSON.Dump(postdata) "`r`n", Error log.dat
								return
							}
							break
						}
						part := StrReplace(item_url, "_", " ")
						StringUpper, part, part, T
						value1 .= part "`n"
						value2 .= postdata.platinum "`n"
					}
				}
				postdata := {}
				postdata.content := "Following prime item sell orders have successfully been relisted for profile " ingame_name ":"
				postdata.embeds := {}
				postdata.embeds.push({fields: [{name: "Items", value: value1, inline: "true"},{name: "\u200b", value: "\u200b", inline: "true"},{name: "Prices", value: value2, inline: "true"}]})
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, postdata)
				this.CallAPI("PUT", "/channels/" Data.channel_id "/messages/" opId "/reactions/✅/@me")
				break
			}
			catch e 
			{
				this.CallAPI("PATCH", "/channels/" Data.channel_id "/messages/" messageId, {"content": "Some error occured at line " e.line ". `nException thrown:`n " e.message "`nContact MrSofty#7926"})
				break
			}
		}
	}
	*/
	
	#Include %A_LineFile%\..\Lib\WebSocket.ahk\WebSocket.ahk
	#Include %A_LineFile%\..\Lib\AutoHotkey-JSON\Jxon.ahk
}

