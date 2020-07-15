
//imports
const express = require("express");
const path = require("path");
const http = require('http');
const socket = require('socket.io');
const expressLayouts = require('express-ejs-layouts');

//Path and Env variables Setup
const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
const bulmaPath = path.join(__dirname, "../node_modules/bulma/css/");
const chessPath = path.join(__dirname, "../node_modules/chess.js/");


//Express consts
const app = express();
const server = http.createServer(app)


//socket.io Setup
const io = socket(server)

// keep track of how many players in a game (0, 1, 2)
var players;

// array to keep track of the 100 games
var games = Array(100);
for (let i = 0; i < 100; i++) {
    games[i] = { players: 0, pid: [0, 0] };
}

// Express & ejs Setup
app.use(express.static(publicDirectoryPath));
app.use(expressLayouts);
app.set("view engine", "ejs");

//Bodyparser
app.use(express.urlencoded({
    extended: false
}));

//Routes
app.get('/', (req, res) => {
    res.header("Set-Cookie", "HttpOnly;Secure;SameSite=Strict");
    res.render('index')
});
app.get('/full', (req, res) => {
    res.render('full')
});
app.use('/bulma', express.static(bulmaPath));
app.use('/chess', express.static(chessPath));


io.on('connection', function (socket) {

    // assigning a random number to every player that has connected
    var playerId = Math.floor((Math.random() * 100) + 1)
    console.log(playerId + ' connected');

    // if a user disconnects just print their playerID
    socket.on('disconnect', function () {
        console.log(playerId + ' disconnected');
    });



    var color; // black or white

    // 'joined' is emitted when the player enters a room number and clicks
    // the connect button the room ID that the player entered gets passed as a message

    socket.on('joined', function (roomId) {
        // if the room is not full then add the player to that room
        if (games[roomId].players < 2) {
            games[roomId].players++;
            games[roomId].pid[games[roomId].players - 1] = playerId;
        } // else emit the full event
        else {
            socket.emit('full', roomId)
            return;
        }
        console.log(games[roomId]);
        players = games[roomId].players
        // the first player to join the room gets white
        if (players % 2 == 0) color = 'black';
        else color = 'white';

        // this is an important event because, once this is emitted the game
        // will be set up in the client side, and it'll display the chess board
        socket.emit('player', { playerId, players, color, roomId })

    });

    // The client side emits a 'move' event when a valid move has been made.
    socket.on('move', function (msg) {
        // pass on the move event to the other clients
        socket.broadcast.emit('move', msg);
    });

    // 'play' is emitted when both players have joined and the game can start
    socket.on('play', function (msg) {
        socket.broadcast.emit('play', msg);
        console.log("ready " + msg);
    });

    // when the user disconnects from the server, remove him from the game room
    socket.on('disconnect', function () {
        for (let i = 0; i < 100; i++) {
            if (games[i].pid[0] == playerId || games[i].pid[1] == playerId)
                games[i].players--;
        }
        console.log(playerId + ' disconnected');

    });



});

// app.get('*', (req, res) => {
//     res.render('404')
// })


//Server start
server.listen(port, console.log("Server running at port " + port));
