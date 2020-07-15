var board = null
var game = new Chess('2bqkb2/1r4r1/n2pp2n/ppp2ppp/PPP2PPP/N2PP2N/1R4R1/2BQKB2 w - - 12 15')
//initialize the socket
var socket = io();
// piece color
var color = "white";
// number of players in the current room
var players;
// the room number between 0 and 99
var roomId;
// if the both players have joined then it will be false
var play = true;

// For some DOM manipulation later
var room = document.getElementById("room")
var roomNumber = document.getElementById("roomNumbers")
var button = document.getElementById("button")
var state = document.getElementById('state')


function onDragStart(source, piece) {
    // do not pick up pieces if the game is over
    // or if it's not that side's turn
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        play || // check if both players have joined
        (game.turn() === 'w' && color === 'black') ||
        (game.turn() === 'b' && color === 'white')) {
        return false;
    }
};

function onDrop(source, target) {
    removeGreySquares();

    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });
    if (game.game_over()) {
        state.innerHTML = 'GAME OVER';
        socket.emit('gameOver', roomId)
    }

    // illegal move
    if (move === null) return 'snapback';

    // if the move is allowed, emit the move event.
    else
        socket.emit('move', { move: move, board: game.fen(), room: roomId });

};

function onMouseoverSquare(square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    // highlight the square they moused over
    greySquare(square);

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

function onMouseoutSquare(square, piece) {
    removeGreySquares();
};

function onSnapEnd() {
    board.position(game.fen());
};

function updateStatus() {
    var status = ''

    var moveColor = 'White'
    if (game.turn() === 'b') {
        moveColor = 'Black'
    }

    // checkmate?
    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.'
    }

    // draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position'
    }

    // game still on
    else {
        status = moveColor + ' to move'

        // check?
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'
        }
    }

    $status.html(status)
}

socket.on('player', (msg) => {

    var plno = document.querySelector('.player')
    color = msg.color;
    players = msg.players;
    plno.innerHTML = 'Player ' + players + " : " + color;

    if (players == 2) {
        play = false;
        socket.emit('play', msg.roomId);
        state.innerHTML = "Game in Progress"
    }
    else
        state.innerHTML = "Waiting for Second player";

    var cfg = {
        orientation: color,
        draggable: true,
        position: "2bqkb2/1r4r1/n2pp2n/ppp2ppp/PPP2PPP/N2PP2N/1R4R1/2BQKB2 w - - 12 15",
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd
    };
    board = ChessBoard('chessboard', cfg);
});

// if the room is full (players > 2), redirect the user
// to the full.html page we made earlier
socket.on('full', function (msg) {
    if (roomId == msg)
        window.location.assign(window.location.href + 'full');
});

// change play to false when both players have
// joined the room, so that they can start playing
// (when play is false the players can play)
socket.on('play', function (msg) {
    if (msg == roomId) {
        play = false;
        state.innerHTML = "Game in progress"
    }
});

// when a move happens, check if it was meant for the clients room
// if yes, then make the move on the clients board
socket.on('move', function (msg) {
    if (msg.room == roomId) {
        game.move(msg.move);
        board.position(game.fen());
        console.log("moved")
    }
});


var connect = function () {

    // extract the value of the input field
    roomId = room.value;
    // if the room number is valid
    if (roomId !== "" && parseInt(roomId) <= 100) {
        room.remove();
        roomNumber.innerHTML = "Room Number " + roomId;
        button.remove();

        // emit the 'joined' event which we have set up a listener for on the server
        socket.emit('joined', roomId);
    }
}