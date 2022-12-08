// DSN NAME is dependent on file /usr/local/Cellar/unixodbc/2.3.4/etc/odbc.ini
// GETS DATA FROM ODBC MANAGER File (idk where that is)

var db = require('odbc')();
var con = 'DSN=stream_dream';

//Open Connection
db.open(con, function(err) {
  if (err) return console.log(err);

  console.log('Connected to database via odbc!');
});

//Execute Sync SQL Query
function executeQuery(sql, callback) {
  db.query(sql, function(err, rows, moreResultSets) {
    if (err) {
      return console.log(err);
    }

    callback(rows)
  });
}

module.exports = {
  con: con,
  executeQuery: executeQuery
};
