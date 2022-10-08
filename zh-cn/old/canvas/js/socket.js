function connect() {
    var host = (window.location.protocol == "https:"
        ? "wss://" : "ws://") + window.location.host
        + "/examples/websocket/drawboard";
    socket = new WebSocket(host);

    /* Use a pausable event forwarder.
     * This is needed when we load an Image object with data
     * from a previous message, because we must wait until the
     * Image's load event it raised before we can use it (and
     * in the meantime the socket.message event could be
     * raised).
     * Therefore we need this pausable event handler to handle
     * e.g. socket.onmessage and socket.onclose.
     */
    var eventForwarder = new PausableEventForwarder();

    socket.onopen = function () {
        // Socket has opened. Now wait for the server to
        // send us the initial packet.
        Console.log("WebSocket connection opened.");

        // Set up a timer for pong messages.
        pingTimerId = window.setInterval(function () {
            socket.send("0");
        }, 30000);
    };

    socket.onclose = function () {
        eventForwarder.callFunction(function () {
            Console.log("WebSocket connection closed.");
            disableControls();

            // Disable pong timer.
            window.clearInterval(pingTimerId);
        });
    };

    // Handles an incoming Websocket message.
    var handleOnMessage = function (message) {

        // Split joined message and process them
        // individually.
        var messages = message.data.split(";");
        for (var msgArrIdx = 0; msgArrIdx < messages.length;
            msgArrIdx++) {
            var msg = messages[msgArrIdx];
            var type = msg.substring(0, 1);

            if (type == "0") {
                // Error message.
                var error = msg.substring(1);
                // Log it to the console and show an alert.
                Console.log("Error: " + error);
                alert(error);

            } else {
                if (!isStarted) {
                    if (type == "2") {
                        // Initial message. It contains the
                        // number of players.
                        // After this message we will receive
                        // a binary message containing the current
                        // room image as PNG.
                        playerCount = parseInt(msg.substring(1));

                        refreshPlayerCount();

                        // The next message will be a binary
                        // message containing the room images
                        // as PNG. Therefore we temporarily swap
                        // the message handler.
                        var originalHandler = handleOnMessage;
                        handleOnMessage = function (message) {
                            // First, we restore the original handler.
                            handleOnMessage = originalHandler;

                            // Read the image.
                            var blob = message.data;
                            // Create new blob with correct MIME type.
                            blob = new Blob([blob], { type: "image/png" });

                            var url = URL.createObjectURL(blob);

                            var img = new Image();

                            // We must wait until the onload event is
                            // raised until we can draw the image onto
                            // the canvas.
                            // Therefore we need to pause the event
                            // forwarder until the image is loaded.
                            eventForwarder.pauseProcessing();

                            img.onload = function () {

                                // Release the object URL.
                                URL.revokeObjectURL(url);

                                // Set the canvases to the correct size.
                                for (var i = 0; i < canvasArray.length; i++) {
                                    canvasArray[i].width = img.width;
                                    canvasArray[i].height = img.height;
                                }

                                // Now draw the image on the last canvas.
                                canvasServerImageCtx.clearRect(0, 0,
                                    canvasServerImage.width,
                                    canvasServerImage.height);
                                canvasServerImageCtx.drawImage(img, 0, 0);

                                // Draw it on the background canvas.
                                canvasBackgroundCtx.drawImage(canvasServerImage,
                                    0, 0);

                                isStarted = true;
                                startControls();

                                // Refresh the display canvas.
                                refreshDisplayCanvas();


                                // Finally, resume the event forwarder.
                                eventForwarder.resumeProcessing();
                            };

                            img.src = url;
                        };
                    }
                } else {
                    if (type == "3") {
                        // The number of players in this room changed.
                        var playerAdded = msg.substring(1) == "+";
                        playerCount += playerAdded ? 1 : -1;
                        refreshPlayerCount();

                        Console.log("Player " + (playerAdded
                            ? "joined." : "left."));

                    } else if (type == "1") {
                        // We received a new DrawMessage.
                        var maxLastHandledId = -1;
                        var drawMessages = msg.substring(1).split("|");
                        for (var i = 0; i < drawMessages.length; i++) {
                            var elements = drawMessages[i].split(",");
                            var lastHandledId = parseInt(elements[0]);
                            maxLastHandledId = Math.max(maxLastHandledId,
                                lastHandledId);

                            var path = new Path(
                                parseInt(elements[1]),
                                [parseInt(elements[2]),
                                parseInt(elements[3]),
                                parseInt(elements[4]),
                                parseInt(elements[5]) / 255.0],
                                parseFloat(elements[6]),
                                parseFloat(elements[7]),
                                parseFloat(elements[8]),
                                parseFloat(elements[9]),
                                parseFloat(elements[10]),
                                elements[11] != "0");

                            // Draw the path onto the last canvas.
                            path.draw(canvasServerImageCtx);
                        }

                        // Draw the last canvas onto the background one.
                        canvasBackgroundCtx.drawImage(canvasServerImage,
                            0, 0);

                        // Now go through the pathsNotHandled array and
                        // remove the paths that were already handled by
                        // the server.
                        while (pathsNotHandled.length > 0
                            && pathsNotHandled[0].id <= maxLastHandledId)
                            pathsNotHandled.shift();

                        // Now me must draw the remaining paths onto
                        // the background canvas.
                        for (var i = 0; i < pathsNotHandled.length; i++) {
                            pathsNotHandled[i].path.draw(canvasBackgroundCtx);
                        }

                        refreshDisplayCanvas();
                    }
                }
            }
        }
    };

    socket.onmessage = function (message) {
        eventForwarder.callFunction(function () {
            handleOnMessage(message);
        });
    };

}