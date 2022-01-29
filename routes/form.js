
db.transaction(function (tx) { 
tx.executeSql('SELECT * FROM users_list', [], function (tx, results) { 
    var len = results.rows.length, i; 
    msg = "<p>Found rows: " + len + "</p>"; 
    document.querySelector('#status').innerHTML +=  msg; 

    for (i = 0; i < len; i++) { 
        msg = "<p><b>" + results.rows.item(i).log + "</b></p>"; 
        document.querySelector('#status').innerHTML +=  msg; 
    } 
}, null); 
}); 