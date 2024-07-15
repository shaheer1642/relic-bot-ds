
fetch('https://api.warframestat.us/items/').then(r => r.json()).then(items => {
    console.log(items.filter(item => item.name.toLowerCase().match('gauss prime')));
})