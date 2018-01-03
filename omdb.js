var http = require("http");
var https = require("https");
var async = require('async');

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const hostname = 'http://www.omdbapi.com/'
const apikey = '33973ba1'
const connection = hostname + '?apikey=' + apikey + '&'

//ODBC DB
//var db = require('./db_odbc.js');
var db = require('./db.js');


exports.GET = function(route, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", connection + route, true);

  xhr.addEventListener("load", () => {
    callback(JSON.parse(xhr.responseText, xhr))
  })

  xhr.send()
};

exports.getSeries = function(title, callback) {
  // Search for Series
  var route = 't=' + title

  GET(route, function(response) {
    if (response.Response == 'False') {
      console.log('Series not found in OMDB. ' + JSON.stringify(response))
    } else {
      console.log('response: ' + JSON.stringify(response))
      console.log('Total Seasons: ' + response.totalSeasons)

      // Insert Series Into Database
      var poster = response.Poster.replace(/sx[0-9]*/i, "SX600"); // change resolution of poster
      var sql_query = 'CALL insert_series("' + response.Title + '", "' + response.Plot + '", "' + response.Genre + '", "' + poster + '")'
      db.executeQuery(sql_query, function(val) {
        console.log('series inserted with id ' + val[0].last_id)
      });

      var totalSeasons = parseInt(response.totalSeasons)
      var rows_season = []

      // Create Loop Array With Season Numbers
      let promiseCreateSeasonArray = function() {
        return new Promise(function(resolve, reject) {
          // Create Array with Season Numbers
          for (var i = 1; i < totalSeasons + 1; i++) {
            rows_season.push(i)
          }

          resolve()
        });
      }

      // Read each Episode in each Season
      let promiseReadSeasonEpisodes = function() {
        return new Promise(function(resolve, reject) {
          var content = ''

          async.each(rows_season, function(row_season, callback_outer) {
            // adding to content here --> async, why??

            var route_season = route + '&Season=' + row_season
            GET(route_season, function(response_season) {
              console.log('Getting Season:' + row_season + ' with route ' + route_season)
              content += 'Season ' + row_season + ':'


              // Insert Season Into DATABASE call insert_season('Game Of Thrones', 'Season 2', 2)
              var sql_query = 'CALL insert_season("' + title + '", "Season ' + row_season.toString() + '", ' + row_season + ')'
              db.executeQuery(sql_query, function(val) {
                console.log('season inserted with id ' + val[0].last_id)
              });

              // Loop Through Episodes of this Season
              var rows_episode = response_season.Episodes

              async.each(rows_episode, function(row_episode, callback_inner) {
                console.log(row_episode)
                console.log('inner loop read episode')

                content += 'Episode ' + row_episode.Episode + ' ' + row_episode.Title

                var route_episode = route_season + '&Episode=' + row_episode.Episode
                console.log('getting episode data with route ' + route_episode)
                GET(route_episode, function(response_episode_data) {
                  var row_episode_data = response_episode_data


                  // Insert Episode Into Database
                  var poster = row_episode_data.Poster.replace(/sx[0-9]*/i, "SX500"); // change resolution of poster
                  var sql_query2 = 'CALL insert_episode("' + row_episode_data.Title + '", "' + poster + '", "' + 'http://link.com/video' + '", "' + row_episode_data.Plot + '", "' + row_episode_data.Released + '", ' + row_episode_data.Year + ', "' + row_episode_data.Country + '","' + row_episode_data.Language + '")'
                  db.executeQuery(sql_query2, function(val) {
                    var episode_insert_id = val[0].last_id
                    var season_number = row_season
                    console.log('episode inserted with id ' + episode_insert_id)
                    console.log('known season: ' + row_season + ' / known series: ' + title + ' / episode number: ' + row_episode_data.Episode)

                    //Insert Episode-Season Into Database
                    var sql_query3 = 'CALL insert_season_episode(' + episode_insert_id + ', "' + title + '", ' + season_number + ', ' + row_episode_data.Episode + ')'
                    db.executeQuery(sql_query3, function(val_episode_season_insert) {
                      var episode_season_insert_id = val_episode_season_insert[0].last_id
                      console.log('episode inserted with id ' + episode_insert_id)
                    });
                  });


                });

                callback_inner();
              }, function(err) {
                console.log("InnerLoopFinished");
                callback_outer();
              });

              console.log('outer loop read season')

            });
          }, function(err) {
            console.log("OuterLoopFinished");
            console.log('Process Finished');

            resolve(content)
          });

        });
      }

      promiseCreateSeasonArray().then(function() {
        // Season Array is created
        console.log('Season Array: ' + rows_season)

        return promiseReadSeasonEpisodes()
      }).then(function(content) {

        callback(content)
      });
    }

    /*
    async.each(rows_episode, function(row_episode, callback) {
      async.each(val_episodes, function(row_episodes, callback1) {

        callback1();
      }, function(err) {
        console.log("InnerLoopFinished");
        callback();
      });
    }, function(err) {
      console.log("OuterLoopFinished");
      console.log('Process Finished');
    });

    route += '&Season=' + 1
    GET(route, function(response){

      callback(response)
    });
    */


  });
}

function GET(route, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", connection + route, true);

  xhr.addEventListener("load", () => {
    callback(JSON.parse(xhr.responseText, xhr))
  })

  xhr.send()
};
