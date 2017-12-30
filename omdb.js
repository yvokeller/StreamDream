var http = require("http");
var https = require("https");
var async = require('async');

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const hostname = 'http://www.omdbapi.com/'
const apikey = '33973ba1'
const connection = hostname + '?apikey=' + apikey + '&'

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
    console.log('response: ' + JSON.stringify(response))
    console.log('Total Seasons: ' + response.totalSeasons)

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

            // Loop Through Episodes of this Season
            var rows_episode = response_season.Episodes

            async.each(rows_episode, function(row_episode, callback_inner) {
              console.log(row_episode)
              console.log('inner loop read episode')

              content += 'Episode ' + row_episode.Episode + ' ' + row_episode.Title

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

    promiseCreateSeasonArray().then(function(){
      // Season Array is created
      console.log('Season Array: ' + rows_season)

      return promiseReadSeasonEpisodes()
    }).then(function(content){

      callback(content)
    })


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
