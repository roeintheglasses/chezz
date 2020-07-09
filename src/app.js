
//imports
const express = require("express");
const path = require("path");
const expressLayouts = require('express-ejs-layouts');

//Path and Env variables Setup
const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
const bulmaPath = path.join(__dirname, "../node_modules/bulma/css/");



//Express consts
const app = express();

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
    res.render('index')
});
app.use('/bulma', express.static(bulmaPath));


// app.get('*', (req, res) => {
//     res.render('404')
// })


//Server start
app.listen(port, console.log("Server running at port " + port));


// Stuff

const { Chess, Action, Piece } = require("bchess");
const chess = new Chess({ color: "white" });
chess.set({ square: "h4", piece: new Piece("Q", "white") });
chess.set({ square: "h1", piece: new Piece("", "white") });

console.log(chess.ascii());
chess.move({ from: "c2", to: "c3" });

console.log(chess.ascii());
