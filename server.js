var express = require('express');
var app = express();

app.set('view engine', 'ejs')

//Cookie Parser
var cookieParser = require('cookie-parser')
app.use(cookieParser());

//Initialize
var fs = require('fs');
var path = require('path');
var querystring = require('querystring');
var session = require('express-session');
var bodyParser = require('body-parser');

var async = require('async');

var urlencodedParser = bodyParser.urlencoded({
  extended: false
});

/*app.use(session({
  cookie: {
    path    : '/',
    httpOnly: false,
    saveUninitialized: false,
    resave: false,
    maxAge  : 24*60*60*1000
  },
  secret: '1234567890QWERT'
}));*/

//Session Function
app.use(session({
  secret: 'keyboard cat',
  cookie: {
    maxAge: 2 * 60 * 60 * 1000 // expires after 2 hours
  }
}));

//Validation Functions
function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}

//Check if Object has contents
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

//Function to Check if User is logged in
function isLoggedIn(req, res, next) {
  if (req.session.authenticated === true) {
    next();
  } else {
    res.redirect('/login');
  }
}

//DB Connection
var db = require('./db');
var con = db.con;

//ODBC DB
//var db = require('./db_odbc.js');

//OMDB
var omdb = require('./omdb');

//Manage Requested Static Files
app.use('/assets', express.static('assets'));
app.use('/data', express.static('data'));

//Manage Routes
app.get('/', isLoggedIn, function(req, res) {
  var sess = req.session;
  res.render('index', {
    session: sess
  });
});

app.get('/remote', isLoggedIn, function(req, res) {
  var sess = req.session

  //Check if there Are Clients in Room
  if (io.sockets.adapter.rooms[sess.username] && io.sockets.adapter.rooms[sess.username].sockets) {
    var clients = io.sockets.adapter.rooms[sess.username].sockets

    //Loop Trough Room Members
    var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

    var content = '';
    content += '<ul class="collapsible popout" data-collapsible="accordion">'

    for (var clientId in clients) {
      var clientSocket = io.sockets.connected[clientId];

      content += '<li> <div class="collapsible-header"> <i class="material-icons">phonelink</i> ' + clientSocket.client_name + ' </div>'
      content += '</li>'
    }

    content += '</ul>'

    res.render('remote', {
      conn: content,
      session: sess
    });
  } else {
    res.render('remote', {
      conn: 'No Clients Connected.',
      session: sess
    });
  }
});

//### Encryption
var bcrypt = require('bcrypt');
//###

app.get('/register', function(req, res) {
  res.render('register', {
    errors: '',
    username: '',
    email: '',
    password: '',
    password_repeat: ''
  });
});

app.post('/register', urlencodedParser, function(req, res) {
  var msg = '';
  var state = true;
  var password, password_repeat, email, username;

  if (req.body.username && req.body.password && req.body.email) {
    //VARS
    username = querystring.escape(req.body.username);
    email = req.body.email;
    password = querystring.escape(req.body.password);
    password_repeat = querystring.escape(req.body.password_repeat);

    //Username Check
    if (username.length >= 3) {} else {
      msg += "username needs to be at least 3 characters long! "
      state = false;
    }

    //E-Mail Check
    if (validateEmail(email) == false) {
      msg += "e-mail address has an invalid format!"
      state = false;
    }

    //Password Check
    if (password.length >= 4) {
      if (password_repeat == password) {
        //Everthing OK
      } else {
        msg += "the passwords don't match! "
        state = false;
      }
    } else {
      msg += "the password has to be at least 4 characters long! "
      state = false;
    }
  } else {
    msg += "some fields are empty! "
    state = false;
  }

  //Encrypt Password
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(password, salt);

  //Wenn Status = True
  if (state == true) {
    //Try to Register User
    var sql_query = 'CALL insert_user("' + username + '", "' + hash + '", "' + email + '")'

    db.executeQuery(sql_query, function(val) {
      var data_row = val[0][0] // erste Zeile der data row
      var data_row = val[0] // odbc version..
      //var stored_procedure_row = val[1]

      var last_id = data_row.last_id
      var feedback = ''

      if (last_id == 0) {
        // no new row added in db
        console.log('user already registered')

        msg += 'User already registered. Try a different username/email.';
        feedback = '<div class="card-panel red lighten-4 center">' + msg + '</div>';
      } else {
        // user registered
        msg += 'Successfully registered! You can now log in.';
        feedback = '<div class="card-panel indigo lighten-4 center">' + msg + '</div>';
      }

      if (msg = '') {
        feedback = '';
      }

      res.render('register', {
        errors: feedback,
        username: '',
        email: '',
        password: '',
        password_repeat: ''
      });
    });
  } else {
    var feedback = '<div class="card-panel red lighten-4 center">' + msg + '</div>';

    if (msg = '') {
      feedback = '';
    }

    res.render('register', {
      errors: feedback,
      username: username,
      email: email,
      password: password,
      password_repeat: password_repeat
    });
  }
});

app.get('/login', function(req, res) {
  res.render('login', {
    errors: ''
  });
});

app.post('/login', urlencodedParser, function(req, res) {
  var sess = req.session
  sess.authenticated = false;

  if (req.body.username && req.body.password) {
    //VARS
    var username = querystring.escape(req.body.username);
    var password = querystring.escape(req.body.password);

    console.log('Logging In: ' + username);

    var sql_query = 'CALL select_user_by_name("' + username + '")';
    db.executeQuery(sql_query, function(val) {
      var data_row = val[0][0]
      //var stored_procedure_row = val[1]
      console.log('login db response: ' + JSON.stringify(val))

      if (data_row == undefined) {
        //No Result in DB
        console.log('Account doesnt exist.');
        res.render('login', {
          errors: '<div class="card-panel red lighten-4 center">This account doesnt exist!</div>'
        });
      } else {
        //Account found
        var hash = data_row.password;
        if (bcrypt.compareSync(password, hash)) {
          sess.authenticated = true;

          sess.username = data_row.username;
          sess.userid = data_row.id;

          //Create Cookie for later Access
          res.cookie('user', sess.username, {
            maxAge: 900000,
            httpOnly: true
          });

          console.log('User signed in.' + sess.authenticated);
          res.redirect('/');
        } else {
          res.render('login', {
            errors: '<div class="card-panel red lighten-4 center">Wrong password!</div>'
          });
        }
      }
    });
  } else {
    //Not all Parameters Given / False
    res.render('login', {
      errors: '<div class="card-panel red lighten-4 center">Invalid login credentials!</div>'
    });
  }
});

app.get('/logout', function(req, res) {
  var sess = req.session

  sess.authenticated = false;
  sess.username = null;
  sess.userid = null;

  console.log('After Logout: ' + req.session.authenticated);
  res.redirect('/login');
});

app.get('/library', isLoggedIn, function(req, res) {
  //MAIN PAGE
  var sess = req.session;
  var sql_query = 'SELECT name, description, genre, thumbnail FROM select_all_series';
  db.executeQuery(sql_query, function(val) {
    // get all aviable series
    if (val !== 'undefined' && val !== null) {
      var content = ''
      //
      content += '<div class="row">'
      for (var i = 0; i < val.length; i++) {
        content += '<div class="col s12 m6 l6 xl3 cards-container"> <div class="card"> <div class="card-image">'
        content += '<img src="' + val[i].thumbnail + '">'
        content += '<span class="card-title">' + val[i].name + '</span>'
        content += '<a class="btn-floating halfway-fab waves-effect waves-light red" href="/library/' + (val[i].name).toString() + '">'
        content += '<i class="material-icons">playlist_play</i></a> </div> <div class="card-content">'
        content += '<p><b>' + val[i].genre + '</b><br>' + val[i].description + '</p>'
        content += '</div> </div> </div>'
      }
      content += '</div>'

      var series = content;

      //Get RECENTLY WATCHED
      var sess = req.session;
      sql_query = 'CALL select_recently_watched_by_username("' + sess.username + '")'
      console.log('query: ' + sql_query)
      db.executeQuery(sql_query, function(val_watchlist) {
        var data_row = val_watchlist[0] // [0] is Data, [1] is stored procedure info

        if (data_row !== 'undefined' && data_row !== null) {
          content = '';

          content += '<div class="row">'
          for (var i = 0; i < data_row.length; i++) {
            content += '<div class="col s12 m6 l6 xl3"> <div class="card"> <div class="card-image">'
            content += '<img class="activator" src="' + data_row[i].thumbnail + '">'
            content += '<span class="card-title">' + data_row[i].name + '</span>'

            content += '<a class="btn-floating right halfway-fab waves-effect waves-light red" href="stream?id=' + (data_row[i].id).toString() + '">'
            content += '<i class="material-icons">play_arrow</i></a>'

            content += '<a class="btn-floating left halfway-fab waves-effect waves-light blue" onclick="airPlay(' + data_row[i].id + '); return false;">'
            content += '<i class="material-icons">airplay</i></a>'

            content += '</div> <div class="card-content">'
            content += '<p>' + data_row[i].name_series + ' S' + data_row[i].order_number + 'E' + data_row[i].number + '</p>'
            content += '<div class="card-reveal"> <span class="card-title grey-text text-darken-4">' + data_row[i].name + ' - ' + data_row[i].name_series + ' S' + data_row[i].order_number + 'E' + data_row[i].number
            content += '<i class="material-icons right">close</i></span><p>' + data_row[i].description + '</p></div>'
            content += '</div> </div> </div>'
          }
          content += '</div>'

          var recent = content;
        }

        //Render Page
        res.render('library', {
          series: series,
          recent: recent,
          username: sess.username
        });

      });
    } else {
      res.status(404);
      res.render('404');
    }
  });
});

app.get('/library/:series_name', isLoggedIn, function(req, res) {
  // define query strings
  var sess = req.session;
  var series = decodeURI(querystring.escape(req.params.series_name));
  console.log('selected series: ' + series)

  if (series !== 'undefined' && series !== null) {
    var content = ''
    var episode_content = ''

    var val_season

    let promiseReadSeason = function() {
      return new Promise(function(resolve, reject) {
        var sql_query = 'CALL select_seasons_by_series("' + series + '")'
        console.log('1')
        db.executeQuery(sql_query, function(val) {
          val = val[0] // set val according to stored procedure response

          if (val !== 'undefined' && val !== null & isEmptyObject(val) !== true) {
            // set value of val_season --> used later to read episodes
            val_season = val
            console.log(JSON.stringify(val_season))
            console.log('2')

            content += '<div class="row">'

            content += '<div class="col s12">'
            content += '<ul class="tabs">'
            // tabs
            for (var i = 0; i < val.length; i++) {
              content += '<li class="tab"><a href="#' + val[i].id + '">' + val[i].name + '</a></li>'
            }
            console.log('3')

            content += '</ul></div>'

            content += '<% episode_cards %>'

            content += '</div>'

            console.log('4')
            resolve('done')

          } else {
            res.status(404);
            res.render('404');
          }
        });
      });
    }

    let promiseReadEpisode = function() {
      return new Promise(function(resolve, reject) {

        if (isEmptyObject(val_season)) {
          // something went wrong adding to database
          console.log('something went wrong adding to database')

          res.send('404')
          reject('failed')
        } else {
          console.log('wont throw error')
          console.log(val_season)
          console.log(JSON.stringify(val_season))


          async.each(val_season, function(row_season, callback) {
            //process row_season
            sql_query = 'CALL select_episodes_by_season_and_series("' + series + '", ' + row_season.id + ')'
            console.log('query: ' + sql_query)
            db.executeQuery(sql_query, function(val_episodes) {
              val_episodes = val_episodes[0] // set val according to stored procedure response

              console.log('episodes: ' + val_episodes)
              if (val_episodes !== 'undefined' && val_episodes !== null) {

                episode_content += '<div id="' + row_season.id + '" class="col s12">'

                async.each(val_episodes, function(row_episodes, callback1) {
                  //change Plot
                  var plot = row_episodes.description.replace("'", "")
                  plot = plot.replace("'", "")

                  //process row_episodes
                  episode_content += '<div class="col s12 m6 l6 xl3"> <div class="card"> <div class="card-image">'
                  episode_content += '<img src="' + row_episodes.thumbnail + '">'
                  episode_content += '<span class="card-title">' + row_episodes.number + '. ' + row_episodes.name + '</span>'

                  episode_content += '<a class="btn-floating right halfway-fab waves-effect waves-light red" href="/stream?id=' + row_episodes.id + '">'
                  episode_content += '<i class="material-icons">play_arrow</i></a>'

                  episode_content += '<a class="btn-floating left halfway-fab waves-effect waves-light blue" '
                  episode_content += 'onclick="airPlay(' + row_episodes.id + '); return false;">'
                  episode_content += '<i class="material-icons">airplay</i></a>'

                  episode_content += '</div> <div class="card-content">'
                  episode_content += '<p>' + plot + '</p>'
                  episode_content += '</div> </div> </div>'

                  console.log('inner loop created card')

                  callback1();
                }, function(err) {
                  console.log("InnerLoopFinished");
                  callback();
                });

                console.log('outer loop closed season div')
                episode_content += '</div>'

              }
            });
          }, function(err) {
            console.log("OuterLoopFinished");
            console.log('Process Finished');

            resolve('done')
          });
        }
      });
    }

    promiseReadSeason().then(function() {
      console.log('promise 1 done')
      return promiseReadEpisode()
    }).then(function() {
      content = content.replace('<% episode_cards %>', episode_content)

      var data = {
        series_name: val_season[0].series_name,
        seasons: content,
        username: sess.username
      }

      res.render('library_seasons', {
        data: data
      });
    })
  }
});

app.get('/admin', isLoggedIn, function(req, res) {
  res.render('admin', {
    response: ''
  })
});

app.get('/admin/:id', isLoggedIn, function(req, res) {
  var imdb_id = querystring.escape(req.params.id);

  omdb.getSeries(imdb_id, function(response) {
    console.log('response : ' + JSON.stringify(response))

    res.render('admin', {
      response: response
    })
  });
});

app.get('/stream', isLoggedIn, function(req, res) {
  var sess = req.session;
  var episode = querystring.escape(req.query.id);
  if (episode !== 'undefined' && episode !== null) {
    var sql_query = 'CALL select_episode_by_id(' + episode + ')'
    db.executeQuery(sql_query, function(val) {
      val = val[0] // set val according to stored procedure response
      if (val !== 'undefined' && val !== null) {
        var poster_resize = val[0].thumbnail.replace('SX', 'SX10')

        var src_info = {
          src: 'play?id=' + val[0].id,
          poster: poster_resize,
          episode_name: val[0].name,
          episode_index: val[0].name_series + ' S' + val[0].order_number + 'E' + val[0].number,
          episode_desc: val[0].description
        };

        res.render('stream', {
          src_info: src_info,
          session: sess
        });

        /*
        if(req.cookies.user){
          var username = req.cookies.user;

          //Manage Room
          socket.join(username);

          //Access Room
          var clients = io.sockets.adapter.rooms[username].sockets
          var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

          socket.client_name = username + 's Client ' + numClients + 1;

          //Loop Trough Room Members
          for(var clientId in clients) {
               var clientSocket = io.sockets.connected[clientId];
          }
        }*/

      } else {
        res.status(404);
        res.render('404');
      }

    });
  } else {
    res.status(404);
    res.render('404');
  }
});

app.get('/play', isLoggedIn, function(req, res) {
  var episode = querystring.escape(req.query.id);
  var sql_query = 'CALL select_src_by_id(' + episode + ')';
  db.executeQuery(sql_query, function(val) {
    val = val[0] // set val according to stored procedure response
    if (val !== 'undefined' && val !== null) {
      //FOUND SOMETHING --> Stream
      var file = path.resolve(__dirname + "/data/movies/" + val[0].src);
      console.log('Requesting: ' + file);

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

        var stream = fs.createReadStream(file, {
            start: start,
            end: end
          })
          .on("open", function() {
            //console.log('open pipe');
            stream.pipe(res);
          }).on("error", function(err) {
            res.end(err);
          });
      });
    } else {
      res.status(404);
      res.render('404');
    }
  });
});

app.get('/omdb', function(req, res) {
  /*
  omdb.GET("i=tt3896198", (response) => {
    console.log('response : ' + JSON.stringify(response))
    console.log(response.Year)

    res.send(response)
  });
  */

  omdb.getSeries('The 100', function(response) {
    console.log('response : ' + JSON.stringify(response))
  });

  omdb.GET('t=Game Of Thrones&Season=4', function(response) {
    console.log('response : ' + JSON.stringify(response))

    res.send(response)
  });

});

app.get('/download', function(req, res) {
  var options = {
    host: '109.230.227.9',
    port: 8081,
    path: '/api/addPackage?name=%22test%22&links=%5B%22https%3A%2F%2Fgithub.com%2Fpyload%2Fpyload%2Freleases%2Fdownload%2Fv0.4.9%2Fpyload_0.4.9_win.zip%22%5D',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  var rest = require('./rest');

  /*rest.getJSON(options, function(statusCode, result) {
    // I could work with the result html/json here.  I could also just return it
    console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    res.statusCode = statusCode;
    res.send(result);
  });*/

  console.log('requesting')

  rest.POST2("/api/login", 'username:root&password:1234', (response) => {
    console.log('response:' + response)
  });


  /*
  rest.GET("/api/login?username=root&password=1234", (response) => {
    console.log('response : ' + response)
  });
  */

  res.render('404');

});

//The 404 Route
app.get('*', function(req, res) {
  res.status(404);
  res.render('404');
});

//WEBSOCKET
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
//var sio = require('socket.io')(server);
var users;
users = [];
var connections
connections = [];

//Test IO Access Session
/*
var sio = require("socket.io")(server);

var sessionMiddleware = session({
  secret: "keyboard cat"
});

sio.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});
app.use(sessionMiddleware);
*/

/*
//Session Middleware IO
var sessionMiddleware = session({
  secret: 'keyboard cat',
  cookie: { maxAge: 60000 }
});

sio.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next)
});

app.use(sessionMiddleware)

sio.sockets.on("connection", function(socket) {
  console.log('here it is: ' + socket.request.session) // Now it's available from Socket.IO sockets too! Win!
  console.log(JSON.stringify(socket.request.session, null, 4));
});
//########
*/


server.listen(process.env.PORT ||  8888);
console.log('Server started. Listening on Port 8888')

//Web Sockets
io.sockets.on('connection', function(socket) {
  //Add to Connections
  connections.push(socket);
  console.log('Connected: %s sockets.', connections.length);

  //Emit Welcome Message
  socket.emit('new message', {
    username: 'StreamDream',
    msg: 'Welcome to the chat room!'
  });

  //console.log(socket.request.session.username);
  /*
  //###############
  //JOIN ROOM
  if(req.cookies.user){
    var username = req.cookies.user;

    //Manage Room
    socket.join(username);

    //Access Room
    var clients = io.sockets.adapter.rooms[username].sockets
    var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

    socket.client_name = username + 's Client ' + numClients + 1;

    //Loop Trough Room Members
    for(var clientId in clients) {
         var clientSocket = io.sockets.connected[clientId];
    }
  }
  //###############
  */

  //Find series
  socket.on('find series', function(series_name) {
    series_name = querystring.escape(series_name)
    console.log('escaped input: ' + series_name)
    omdb.findSeries(series_name, function(response) {
      if (response.Response == 'False') {
        socket.emit('find series response', '<h5>Results</h5>Series not found in OMDB.')
      } else {
        console.log('response : ' + JSON.stringify(response))
        response = response.Search

        var collection = '<h5>Results</h5>'
        collection += '<ul class="collection">'

        for (var i = 0; i < response.length; i++) {
          collection += '<li class="collection-item avatar">'

          collection += '<img src="' + response[i].Poster + '" alt="" class="circle">'
          collection += '<span class="title">' + response[i].Title + '</span>'
          collection += '<p><b>Type:</b> ' + response[i].Type + ' <b>Year:</b> ' + response[i].Year + '</p>'
          collection += '<a href="/admin/' + response[i].imdbID + '" class="secondary-content"><i class="material-icons">arrow_downward</i></a>'

          collection += '</li>'
        }
        collection += '</ul>'

        console.log('collection string: ' + collection)

        socket.emit('find series response', collection)
      }
    });
  });

  //Load series
  socket.on('load series', function(series_name) {
    omdb.getSeries(series_name, function(response) {
      console.log('response : ' + JSON.stringify(response))

      socket.emit('load series response', JSON.stringify(response))
    });
  });

  //Join Room
  socket.on('join room', function(data) {
    var username = data.username;
    var vendor = data.vendor;
    var episode_name = data.episode_name;

    socket.join(username);
    console.log(username + ' Joined the Room ' + username);

    var clients = io.sockets.adapter.rooms[username].sockets
    var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

    socket.client_name = username + 's client ' + numClients + ' watching "' + episode_name + '" (on ' + vendor + ' browser)';

    socket.emit('joined room', {
      members: numClients
    });
  });

  //Disconnect
  socket.on('disconnect', function(data) {
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnected: %s sockets connected', connections.length);
  });

  //SendMessage
  socket.on('send message', function(data) {
    if (data == '') {
      //Empty Message
    } else {
      io.sockets.emit('new message', {
        username: data.username,
        msg: data.msg
      });
    }
  });

  socket.on('send air play', function(data) {
    //Check If User Wants to airplay
    var id = querystring.escape(data.id);
    var room_name = data.room_name;
    var response;

    console.log('send air play called with id ' + id)

    if(id !== 'undefined'){
      // Check If io is defined
      if (typeof io.sockets.adapter.rooms[room_name] !== 'undefined') {
        //Loop trough Clients connected with room
        console.log(typeof io.sockets.adapter.rooms[room_name])
        var clients = io.sockets.adapter.rooms[room_name].sockets;
        for (var clientId in clients) {
          var clientSocket = io.sockets.connected[clientId];

          // send redirect
          io.to(room_name).emit('air play', {
            redirect: '/stream?id=' + id
          });

        }
        response = 'Successfully redirected currently streaming clients.'
        console.log('Air Play redirect executed!');

        socket.emit('toast response', {
          msg: response
        })
      } else {
        response = 'Streaming redirect failed. There is no device streaming at the moment.'
        console.log('there is no room opened in your account!')

        socket.emit('toast response', {
          msg: response
        })
      }
    }
  })

  //Stop Video Command
  socket.on('pause videos', function(data) {
    var room_name = data.room_name;

    // Check If io is defined
    if (typeof io.sockets.adapter.rooms[room_name] !== 'undefined') {
      //Loop trough Clients connected with room
      console.log(typeof io.sockets.adapter.rooms[room_name])
      var clients = io.sockets.adapter.rooms[room_name].sockets;
      for (var clientId in clients) {
        var clientSocket = io.sockets.connected[clientId];

        io.to(room_name).emit('pause', {
          time: data
        });
      }
      console.log('Videos paused!');
    } else {
      console.log('there is no room opened in your account!')
    }
  });

  //Play Video Command
  socket.on('play videos', function(data) {
    //Play All Browsers
    io.sockets.emit('play', {
      time: data
    });
    console.log('Videos played!');
  });

  //Forward 10
  socket.on('forward 10', function(data) {
    //Play All Browsers
    io.sockets.emit('skip forward 10', {
      time: data
    });
    console.log('Sent 10 Forward!');
  });

  //Backward 10
  socket.on('backward 10', function(data) {
    //Play All Browsers
    io.sockets.emit('skip backward 10', {
      time: data
    });
    console.log('Sent 10 Backward!');
  });

  //Mute
  socket.on('mute', function(data) {
    //Mute All Browsers
    io.sockets.emit('activate mute', {
      time: data
    });
    console.log('activated mute');
  });

  //Unmute
  socket.on('unmute', function(data) {
    //Unmute All Browsers
    io.sockets.emit('activate unmute', {
      time: data
    });
    console.log('activated unmute');
  });

  //Sync
  socket.on('get watchtime', function(data) {
    console.log('Wants watchtime. Recieved ' + data)

    //Read Watchtime from DB
    var sql_query = 'CALL select_watchtime_by_user_and_episode(' + data.episode + ', "' + data.username + '")'
    db.executeQuery(sql_query, function(val) {
      val = val[0] //set value according to stored procedure response
      if (val.length === 0) {
        //No Entry in DB --> WatchTime 0
        socket.emit('set watchtime', {
          watch_time: 0
        });
      } else {
        //Send watchtime back to Stream Client
        console.log('Sent watchtime: ' + val[0].watch_time);
        socket.emit('set watchtime', {
          watch_time: val[0].watch_time
        });
      }
    });
  });

  //Get Play Time
  socket.on('send watchtime', function(data) {
    if (data == '') {
      //Empty Message
      console.log('Empty');
    } else {
      //Insert DB
      var sql_query = 'CALL insert_update_watchtime(' + data.episode + ', "' + data.username + '", "1", "' + data.curr_time + '")'
      db.executeQuery(sql_query, function(val) {
        //value changed
      });
    }
  });

  //Search For Series
  socket.on('search series', function(data) {
    console.log('recieved search request');
    var search_input = querystring.escape(data.search)

    var sql_query = 'SELECT name, description, genre, thumbnail FROM tbl_series WHERE name LIKE "%' + search_input + '%"';
    console.log('query: ' + sql_query)
    db.executeQuery(sql_query, function(val) {
      // get all aviable series
      if (val !== 'undefined' && val !== null) {
        var content = ''
        //
        content += '<div class="row">'
        for (var i = 0; i < val.length; i++) {
          content += '<div class="col s12 m6 l6 xl3 cards-container"> <div class="card"> <div class="card-image">'
          content += '<img src="' + val[i].thumbnail + '">'
          content += '<span class="card-title">' + val[i].name + '</span>'
          content += '<a class="btn-floating halfway-fab waves-effect waves-light red" href="/library/' + (val[i].name).toString() + '">'
          content += '<i class="material-icons">play_arrow</i></a> </div> <div class="card-content">'
          content += '<p><b>' + val[i].genre + '</b><br>' + val[i].description + '</p>'
          content += '</div> </div> </div>'
        }
        content += '</div>'

        var series = content

        socket.emit('search result', {
          series: series
        })
      }
    })
  });
});
