
var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var DB = require('./../DB/DB-interface');
var contractData = require('./contractData');

var app = express();
var port = process.env.PORT || 3000;
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/style.css', function (req, res, next) {
    res.status(200).sendFile(__dirname + '/public/style.css');
});

app.get('/index.js', function (req, res, next) {
    res.status(200).sendFile(__dirname + '/public/index.js');
});

app.get('/', function (req, res, next) {
    // console.log(contractData);
    // contractData.forEach((contract) => {
    //   return DB.insertNew("jobs",contract)
    //   .then((result) => {
    //     console.log(result);
    //   });
    // });
    var jobList = DB.search("jobs");
    var contractorList = DB.search("contractors");
    Promise.all([ jobList, contractorList ])
    .then((lists) => {
      console.log(lists);
      res.status(200).render('homePage', {
          contracts: lists[0],
          // contractors: lists[1]
      });
    });
});

app.post('/submitJob', function(req, res) {
  DB.search("jobs", req.body).then((result) => {
    if (result.length == 0) {
      console.log("Inserting job...");
      DB.insertNew('jobs', req.body)
        .then((result) => {
        console.log("Job inserted!");
        return result.ops;
      }).then((result) => {
        var context = result[0];
        context.layout = false;
        console.log("Sending render...");
        res.status(200).render('partials/contractCard', context);
        console.log("Render sent!");
      }).catch((err) => { if (err) console.log("Error: ",err)});
    } else {
      console.log("Error: Duplicate insertion");
    }
  }).catch((err) => {
    if (err) console.log("Error: ",err);
  });
});

app.get('/contract/:jobID', function(req, res, next) {
  var jobID = req.params.jobID;
  console.log('jobID:'+jobID);
  if(jobID == "index.js") {
    res.status(200).sendFile(__dirname + '/public/index.js');
  } else if(jobID == "style.css") {
    res.status(200).sendFile(__dirname + '/public/style.css');
  } else {
    DB.search("jobs", {_id: jobID} )
      .then((jobs) => {
      console.log(jobs[0]);
      var context = { contracts: jobs[0]};
      res.status(200).render('singlecontract', context);
    });
  }
});

app.post('/removeJob/:jobID', function(req, res) {
  console.log("Removing job...");
  var jobID = req.params.jobID;
  DB.removeByID('jobs', jobID)
    .then((result) => {
    console.log("Job removed!");
  }).catch((err) => { if (err) console.log("Error: ",err)});
});

app.post('/submitComment', function(req, res) {
    console.log('Received Comment: ', req.body);
    console.log("Inserting...");
    DB.insertNew('comments', req.body)
        .then((result) => {
          console.log("Inserted: ",result.ops);
          return result.ops;
      }).then((result) => {
          var context = result[0];
          context.layout = false;
          res.status(200).render('partials/commentCard', context);
      }).catch((err) => {
          console.log("Error: ",err)
    });
  });

app.get('*', function (req, res) {
  res.status(404).render('404');
});

app.listen(port, function () {
    console.log("== Server listening on port", port);
})
