#include SRB functions.ahk
#include JSON.ahk
#include objectSort.ahk

1::
    item_url := "loki_prime_systems"
    loop 
    {
        try
        {
            loop 
            {
                postdata := {}
                postdata.auth_type := "header"
                postdata.email := "shaheer1642@gmail.com"
                postdata.password := "Hacker123"
                WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
                WebRequest.Open("POST", "https://api.warframe.market/v1/auth/signin", true)
                WebRequest.SetRequestHeader("Content-Type", "application/json")
                WebRequest.SetRequestHeader("Authorization", "JWT")
                WebRequest.SetRequestHeader("language", "en")
                WebRequest.SetRequestHeader("platform", "pc")
                WebRequest.SetRequestHeader("auth_type", "header")
                WebRequest.Send(JSON.Dump(postdata))
                WebRequest.WaitForResponse()
                JWT := WebRequest.getresponseheader("Authorization")
                ingame_name := JSON.Load(WebRequest.ResponseText).payload.user.ingame_name
                ;----retrieve orders with similar names----
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
                    if (profile_orders.payload.sell_orders[A_index].item.url_name==item_url)
                    {
                        ;delete order
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
                WebRequest.Open("GET", "https://api.warframe.market/v1/items/" item_url, true)
                WebRequest.SetRequestHeader("Content-Type", "application/json")
                WebRequest.SetRequestHeader("auth_type", "header")
                WebRequest.SetRequestHeader("Authorization", JWT)
                WebRequest.SetRequestHeader("language", "en")
                WebRequest.Send()
                WebRequest.WaitForResponse()
                ;----retrieve top listing----
                Filedelete, profile_order.json
                srbFunctions.getOrder(item_url, "profile_order.json")
                FileRead, order_listing, profile_order.json
				order_listing := StrReplace(order_listing, """" . item_url . """: ", "")
				order_listing := JSON.Load(order_listing)
				order_listing := objectSort(order_listing, "price",,false)
                postdata := {}
                postdata.item_id := JSON.Load(WebRequest.ResponseText).payload.item.id
                postdata.order_type := "sell"
                if (order_listing[1].price == "")
                {
                    msgbox No order available
                    return
                }
                postdata.platinum := order_listing[1].price
                postdata.quantity := "1"
                postdata.visible := "true"
                WebRequest.Open("POST", "https://api.warframe.market/v1/profile/orders", true)
                WebRequest.SetRequestHeader("Content-Type", "application/json")
                WebRequest.SetRequestHeader("auth_type", "header")
                WebRequest.SetRequestHeader("Authorization", JWT)
                WebRequest.SetRequestHeader("language", "en")
                WebRequest.Send(JSON.Dump(postdata))
                WebRequest.WaitForResponse()
                msgbox % WebRequest.ResponseText
                break
            }
            break
        }
        catch e
        {
            msgbox % e.message
        }
    }
    return
2::
    postdata := {}
    postdata.item := "59e203ce115f1d887cfd7ac6"
    postdata.order_type := "sell"
    postdata.platinum := "999"
    postdata.platinum := "1"
    postdata.visible := "true"
    postdata.rank := "3"
    postdata.subtype := "flawless"
    msgbox % JSON.Dump(postdata)
    loop 
    {
        try
        {
            loop 
            {
                WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
                WebRequest.Open("POST", "https://api.warframe.market/v1/profile/orders", true)
                WebRequest.SetRequestHeader("Content-Type", "application/json")
                WebRequest.SetRequestHeader("auth_type", "header")
                WebRequest.SetRequestHeader("Authorization", "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzaWQiOiJzWW94VzRlZWtXREZhUXlkNFd5V1dxRUt3MTFPcTdUMCIsImV4cCI6MTYzMzg4NDAzNSwiaWF0IjoxNjI4NzAwMDM1LCJpc3MiOiJqd3QiLCJhdWQiOiJqd3QiLCJhdXRoX3R5cGUiOiJoZWFkZXIiLCJzZWN1cmUiOnRydWUsImp3dF9pZGVudGl0eSI6IlFXdTZqcGMycW1IRHhZZGFMOERjT0dnYlk3MTFGVUx1IiwibG9naW5fdWEiOiJOb25lIiwibG9naW5faXAiOiJiJzE4Mi4xODUuNjguMjE5JyJ9.W-7Q87obsJC_EhoadbZGt5DfqL3dJSv9kIBCbTM21cM")
                WebRequest.SetRequestHeader("language", "en")
                WebRequest.Send(JSON.Dump(postdata))
                WebRequest.WaitForResponse()
                msgbox % WebRequest.ResponseText
                break
            }
            break
        }
        catch e
        {
            msgbox % e.message
        }
    }
    return

f1::reload