#include SRB functions.ahk

srbFunctions := new srbFunctions
filedelete, auctionText.json
srbFunctions.getAuction("kuva_kohm","auctionText.json")
msgbox done
return