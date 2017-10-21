var express = require('express');
var app = express();

app.set('view engine', 'ejs')

//Initialize
var fs = require('fs');
var path = require('path');
var querystring = require('querystring');

//DB Connection

var db = require('./db');
var con = db.con;

/*var result = db.executeQuery('SELECT * FROM tbl_series;');
console.log('Name: ' + result.name)*/

//Manage Requested Static Files
app.use('/assets', express.static('assets'));
app.use('/data', express.static('data'));

//Manage Routes
app.get('/', function(req, res){
  res.render('index');
});

app.get('/remote', function(req, res){
  res.render('remote');
});

app.get('/stream', function(req, res){
  //console.log('Episode: ' + req.query.id);
  var sql_query = 'SELECT e.name, e.description, e.thumbnail, e.src, seaepi.number, sea.name name_season, sea.production_year, ser.name series, ser.description desc_series FROM tbl_episode e INNER JOIN tbl_season_episode seaepi ON e.id = seaepi.fk_episode INNER JOIN tbl_season sea ON seaepi.fk_season = sea.id INNER JOIN tbl_series ser ON sea.fk_series = ser.id WHERE e.id = 1';
  db.executeRead(sql_query, function(val){
    console.log('Got called back');
    //console.log('Info: ' + val[0].name);

    res.render('stream', {rq: val});
  });
});

app.get('/movie.mp4', function(req, res){
  //console.log('Video requested. ' + __dirname + "/data/movie.mp4");

  var file = path.resolve(__dirname + "/data/movie.mp4");
  fs.stat(file, function(err, stats) {
    //Error handling
    if (err) {
        if (err.code === 'ENOENT') {
          // 404 Error if file not found
          return res.sendStatus(404);
          console.log('its an error 404');
      }
      res.end(err);
    }

    var range = req.headers.range;
    if (!range) {
       // 416 Wrong range
       console.log('wrong range');
       return res.sendStatus(416);
    }

    var positions = range.replace(/bytes=/, "").split("-");
    var start = parseInt(positions[0], 10);
    var total = stats.size;
    var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
    var chunksize = (end - start) + 1;

    res.writeHead(206, {
      "Content-Range": "bytes " + start + "-" + end + "/" + total,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4"
    });

    var stream = fs.createReadStream(file, { start: start, end: end })
      .on("open", function() {
        //console.log('open pipe');
        stream.pipe(res);
      }).on("error", function(err) {
        res.end(err);
      });
  });
});

//The 404 Route
app.get('*', function(req, res){
  res.status(404);
  res.render('404');
});

//Stream
/*

*/


var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var users;
users = [];
var connections
connections = [];

server.listen(process.env.PORT || 8888);
console.log('Server started. Listening on Port 8888')

//Web Sockets
io.sockets.on('connection', function(socket){
    connections.push(socket);
    console.log('Connected: %s sockets.', connections.length);
    socket.emit('new message', {msg: 'Welcome to the chat room!'})

    //Disconnect
    socket.on('disconnect', function(data){
        connections.splice(connections.indexOf(socket),  1);
        console.log('Disconnected: %s sockets connected', connections.length);
    });

    //SendMessage
    socket.on('send message', function(data){
        if(data == ''){
          //Empty Message
        } else {
          io.sockets.emit('new message', {msg: data});
        }
    });

    //Stop Video Command
    socket.on('pause videos', function(data){
      //Stop All Browsers
      io.sockets.emit('pause', {time: data});
      console.log('videos paused!');
    });

    //Play Video Command
    socket.on('play videos', function(data){
      //Play All Browsers
      io.sockets.emit('play', {time: data});
      console.log('Videos played!');
    });

    //Get Play Time
    socket.on('send watchtime', function(data){
        if(data == ''){
          //Empty Message
          console.log('Empty');
        } else {
          console.log('Current Time: ', data);
        }
    });
});
