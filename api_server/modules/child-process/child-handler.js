const { fork } = require('child_process');

function createChildProcess(func,data,callback) {
    var child = fork(__dirname + '/child-functions.js');
    child.send({
        func: func,
        data: data
    },(err) => {
        if (err) {
            child.kill()
            console.error('Error creating child process',err)
            callback ? callback(undefined,'Error creating child process',err) : null
        }
    });
    child.on('message', ({res,err}) => {
        child.kill()
        callback ? callback(res,err) : null
    });
}

module.exports = {
    createChildProcess
}