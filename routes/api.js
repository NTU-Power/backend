var express = require('express');
var router  = express.Router();

var {get_usage_by_mid,
     get_usage_by_bid,
     get_usage_by_cname} = require('../mongo/get_usage_by_id');



router.use(function(req, res, next) {
    next();
});

router.get('/', function(req, res){
    res.json({ message: 'Welcome to backend api' }); 
});

router.route('/usage_chart/meter/:id')
    .get(function(req, res) {
        console.log("MeterID : "+req.params.id);
        console.log("Start date : "+req.query.start_date);
        console.log("End date   : "+req.query.end_date);
        console.log("Summary Interval : "+req.query.summary_interval);
        console.log("");
        get_usage_by_mid(
            req.params.id, 
            req.query.start_date, 
            req.query.end_date,
            req.query.summary_interval, 
            function(err, obj) {
                if (err)
                    res.send(err);
                res.json(obj);
            }
        );
    });

router.route('/usage_chart/building/:id')
    .get(function(req, res) {
        console.log("BuildingID : "+req.params.id);
        console.log("Start date : "+req.query.start_date);
        console.log("End date   : "+req.query.end_date);
        console.log("Summary Interval : "+req.query.summary_interval);
        console.log("");
        get_usage_by_bid(
            req.params.id, 
            req.query.start_date, 
            req.query.end_date,
            req.query.summary_interval, 
            function(err, obj) {
                if (err)
                    res.send(err);
                else 
                    res.json(obj);
            }
        );
    });

router.route('/usage_chart/college/:name')
    .get(function(req, res) {
        console.log("CollegeName: "+req.params.name);
        console.log("Start date : "+req.query.start_date);
        console.log("End date   : "+req.query.end_date);
        console.log("Summary Interval : "+req.query.summary_interval);
        console.log("");
        get_usage_by_cname(
            req.params.name, 
            req.query.start_date, 
            req.query.end_date,
            req.query.summary_interval, 
            function(err, obj) {
                if (err)
                    res.send(err);
                res.json(obj);
            }
        );
    });

module.exports = router;
