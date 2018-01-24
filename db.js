var mysql = require('mysql');

var con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: ''
});

con.connect(function(err) {
  if (err) throw err;
  console.log('Connected!');
});

function executeQuery(sql, callback){
  var result = con.query(sql, function (err, res) {
      if (err){
        if (err.code === 'ER_DUP_ENTRY') {
          console.log('Entry already exists! UNIQUE_KEY');
        /*} else if(err.code === 'ER_NO_REFERENCED_ROW_2') {
          console.log('Insert Error occured')*/
        } else {
          throw err;
        }
      }

      callback(res); //Call Given function with result
  });
}

con.query('USE stream_dream5;', function (err, result) {
    if (err) throw err;
    console.log('Using database');
});

module.exports = {
  con: con,
  executeQuery: executeQuery,
  escape: mysql.escape
};
