'use strict';

function prepareOptions(client) {
    var connections = [ { connectionOption: client.connectionOption, auth_pass: [client.options.auth_pass] } ];

    client._failover = {
        connections: connections,
        cycle: 0,
        retry_backoff: client.options.failover.retry_backoff || 1.7,
        connectionIndex: 0,
        passwordIndex: 0
    };

    client.options.failover.connections.forEach(function (cnct) {
        var cnxOption = optionsWithoutAuth(cnct);
        var keys = Object.keys(cnxOption);
        if (keys.length === 0 && cnct.auth_pass) {
            addAuth(cnct.auth_pass, connections[0]);
            return;
        }

        var sameConnection, _cnxOption;
        connections.some(function (_cnct) {
            _cnxOption = optionsWithoutAuth(_cnct.connectionOption);
            if (equal(cnxOption, _cnxOption)) {
                sameConnection = _cnct;
                return true;
            }
        });

        if (sameConnection && cnct.auth_pass) {
            addAuth(cnct.auth_pass, sameConnection);
        } else {
            connections.push({ connectionOption: cnxOption, auth_pass: [cnct.auth_pass]});
        }
    });

    function optionsWithoutAuth(opts) {
        var options = {};
        for (var opt in opts) {
            if (opt !== 'auth_pass') {
                options[opt] = opts[opt];
            }
        }
        return options;
    }

    function addAuth(auth_pass, toConnection) {
        if (toConnection.auth_pass.indexOf(auth_pass) === -1) {
            toConnection.auth_pass.push(auth_pass);
        } else {
            console.error('Same password used more than once');
        }
    }

    function equal(a, b) {
        var keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) return false;
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i]; 
            if (a[key] !== b[key]) return false;
        }
        return true;
    }
}


function nextConnection(client) {
    var fo = client._failover;
    fo.connectionIndex++;
    if (fo.connectionIndex === fo.connections.length) {
        fo.connectionIndex = 0;
        fo.cycle++;
        client.retry_delay = Math.round(client.retry_delay * fo.retry_backoff);
    }
    var connection = fo.connections[fo.connectionIndex];
    client.connectionOption = connection.connectionOption;

    fo.passwordIndex = 0;
    client.auth_pass = connection.auth_pass[fo.passwordIndex];
}


function allButCurrent(passwords, currentIndex) {
    var afterCurrent = passwords.slice(currentIndex + 1);
    var beforeCurrent = passwords.slice(0, currentIndex);
    return afterCurrent.concat(beforeCurrent);
}


function alternativePasswords(client) {
    var fo = client._failover;
    var connection = fo.connections[fo.connectionIndex];
    var passwords = connection.auth_pass;
    if (passwords.length === 1) return;
    return allButCurrent(passwords, fo.passwordIndex);
}


function setValidPassword(client, password) {
    var fo = client._failover;
    var connection = fo.connections[fo.connectionIndex];
    var index = connection.auth_pass.indexOf(password);
    var valid = index >= 0;
    if (valid) fo.passwordIndex = index;
    else console.error('password doesn\'t match any password defined for the current connection');
    return valid;
}


exports.prepareOptions = prepareOptions;
exports.nextConnection = nextConnection;
exports.alternativePasswords = alternativePasswords;
exports.setValidPassword = setValidPassword;