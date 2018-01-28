// define query strings
var series = querystring.escape(req.params.id);

if (series !== 'undefined' && series !== null) {
  var content = ''
  var episode_content = ''

  var val_season

  let promiseReadSeason = function() {
    return new new Promise(function(resolve, reject) {

      var sql_query = 'SELECT se.name series_name, sea.id, sea.fk_series, sea.name, sea.thumbnail, sea.description, sea.production_year FROM tbl_season sea INNER JOIN tbl_series se ON se.id = sea.fk_series WHERE sea.fk_series = ' + series + ' ORDER BY sea.order_number;'
      db.executeRead(sql_query, function(val) {
        if (val !== 'undefined' && val !== null) {
          // set value of val_season --> used later to read episodes
          val_season = val

          content += '<div class="row">'

          content += '<div class="col s12">'
          content += '<ul class="tabs">'
          // tabs
          for (var i = 0; i < val.length; i++) {
            content += '<li class="tab"><a href="#' + val[i].id + '">' + val[i].name + '</a></li>'
          }
          content += '</ul></div>'

          content += '<% episode_cards %>'

          content += '</div>'

          resolve('done')
        } else {
          res.status(404);
          res.render('404');
        }
      });

    });
  }

  let promiseReadEpisode = function() {
    import each from 'async/each';
    return new new Promise(function(resolve, reject) {

      async.each(val_season, function(row_season, callback) {
        //process row_season
        episode_content += '<div id="' + row_season.id + '" class="col s12">'

        sql_query = 'SELECT e.id, e.name, e.description, e.thumbnail, e.src, seaepi.number FROM tbl_episode e INNER JOIN tbl_season_episode seaepi ON e.id = seaepi.fk_episode INNER JOIN tbl_season sea ON seaepi.fk_season = sea.id INNER JOIN tbl_series ser ON sea.fk_series = ser.id WHERE ser.id = ' + series + ' AND sea.id = ' + val[i].id + ' ORDER BY seaepi.number';
        db.executeRead(sql_query, function(val_episodes) {
          if (val_episodes !== 'undefined' && val_episodes !== null) {

            async.each(val_episodes, function(row_episodes, callback1) {
              //process row_episodes
              episode_content += '<div class="col s12"> <div class="card"> <div class="card-image">'
              episode_content += '<img src="/data/thumbnails/' + row_episodes.thumbnail + '">'
              episode_content += '<span class="card-title">' + row_episodes.number + '. ' + row_episodes.name + '</span>'
              episode_content += '<a class="btn-floating halfway-fab waves-effect waves-light red" href="/stream?id' + row_episodes.id + '">'
              episode_content += '<i class="material-icons">play_arrow</i></a> </div> <div class="card-content">'
              episode_content += '<p>' + row_episodes.description + '</p>'
              episode_content += '</div> </div> </div> </div>'

              callback1();
            }, function(err) {
              console.log("InnerLoopFinished");
              callback();
            });

          }
        });

        episode_content += '</div>'

      }, function(err) {
        console.log("OuterLoopFinished");
        console.log('Process Finished');
      });

      /*
      // episode content
      for (var i = 0; i < val_season.length; i++) {
        episode_content += '<div id="' + val_season[i].id + '" class="col s12">'

        // get episodes for season
        sql_query = 'SELECT e.id, e.name, e.description, e.thumbnail, e.src, seaepi.number FROM tbl_episode e INNER JOIN tbl_season_episode seaepi ON e.id = seaepi.fk_episode INNER JOIN tbl_season sea ON seaepi.fk_season = sea.id INNER JOIN tbl_series ser ON sea.fk_series = ser.id WHERE ser.id = ' + series + ' AND sea.id = ' + val_season[i].id + ' ORDER BY seaepi.number';
        db.executeRead(sql_query, function(val_episodes) {

          if (val_episodes !== 'undefined' && val_episodes !== null) {

            for (var y = 0; y < val_episodes.length; y++) {
              episode_content += '<div class="col s12"> <div class="card"> <div class="card-image">'
              episode_content += '<img src="/data/thumbnails/' + val_episodes[y].thumbnail + '">'
              episode_content += '<span class="card-title">' + val_episodes[y].number + '. ' + val_episodes[y].name + '</span>'
              episode_content += '<a class="btn-floating halfway-fab waves-effect waves-light red" href="/stream?id' + val_episodes[y].id + '">'
              episode_content += '<i class="material-icons">play_arrow</i></a> </div> <div class="card-content">'
              episode_content += '<p>' + val_episodes[y].description + '</p>'
              episode_content += '</div> </div> </div> </div>'
            }

          }

        });

        episode_content += '</div>'
      }
      */

      resolve('done')
    });
  }

  promiseReadSeason().then(function() {
    return promiseReadEpisode()
  }).then(function() {
    content = content.replace('<% episode_cards %>', episode_content)

    console.log('finished. ' + content)

    var data = {
      series_name: val_season[0].series_name,
      seasons: content
    }

    res.render('library_seasons', {
      data: data
    });
  })
}
