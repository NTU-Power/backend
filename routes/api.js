var express = require('express');
var router  = express.Router();

router.use(function(req, res, next) {
    next();
});

router.get('/', function(req, res){
    res.json({ message: 'Welcome to backend api' }); 
});

router.route('/usage_chart/meter/:id')
    .get(function(req, res) {
        res.json({"MeterID":req.params.id});
        console.log("Start date : "+req.query.start_date);
        console.log("End date   : "+req.query.end_date);
        console.log("Summary Interval : "+req.query.summary_interval);
    });

module.exports = router;
