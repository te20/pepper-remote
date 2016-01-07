var log4js = require('log4js');
//var Parse = require('parse').Parse;
//var scoreDB = require('./scoreDB');

module.exports = function remoteControl(server) {
    var wsRobot, wsController;
    var logger = log4js.getLogger('pepper-remote');
    logger.setLevel('TRACE');

    // Setup cloud database
    //  Parse.initialize("vlBqlA9VTXJgTTweMYX5n7CC2IJ4GYxpqJBeQH7n", "SWQWwVpYzTpUMQPzZntTLLOUbZYgcWQOB7ybxw7V");
    //    var ShakeScore = Parse.Object.extend('ShakeScore');

    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({
        "server": server
    });

    wss.on('connection', function (ws) {
        //var shakeScore = new ShakeScore();
        var address = ws.upgradeReq.client.remoteAddress;
        var connection = {};

        function send(socket, action, data) {
            var msg = JSON.stringify({'action': action, 'data': data});
            var address = socket.upgradeReq.client.remoteAddress;

            logger.trace('Send message: ' + msg + ' to address: ' + address);
            socket.send(msg);
        }

        logger.info('Connection request from ' + address);
        logger.info('    Total %d connections', wss.clients.length);

        ws.on('message', function (data) {
            if (data.indexOf('[!dataURL!]||||') === 0) {
                logger.debug('Recieved image: ');
                return;
            }

            var message = JSON.parse(data);

            logger.trace('Recieved message: ' + data + ' from ' + address);

            /*
            if (message.action === 'robottoken') {
                ws.send(JSON.stringify({'action': 'success_connection', 'data':'none'}));
            }
            */

            switch (message.action) {
            case 'robottoken':
                send(ws, 'success_connection', 'none');
                wsRobot = ws;
                if (wsController) {
                    send(wsController, 'robot_connected', 'none');
                }
                break;
            case 'controllertoken':
                send(ws, 'success_connection', 'none');
                if (wsRobot) {
                    send(ws, 'robot_connected', 'none');
                }
                wsController = ws;
                break;
            case 'actioncomplete':
                logger.info('action completed');
                break;
            case 'robot_talk':
                send(wsRobot, message.action, message.data);
                break;
            case 'reset':
                logger.info('Reset from ' + address);
                reset();
                break;
            case 'iamalive':
                logger.info('Recieved alive message from ' + address);
                break;
            default:
                logger.warn('Unknow message type: ' + message);
            }
        });

        ws.on('close', function () {
            logger.info('Disconnected by ' + address);
        });

        ws.on('error', function (error) {
            logger.error('WebSocket Error: ' + error);
        });
    });

    function nextChar(c) {
        return String.fromCharCode(c.charCodeAt(0) + 1);
    }
};
