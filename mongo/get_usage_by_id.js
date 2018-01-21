var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/Power-database';

function get_usage_by_mid(mid, s_date_str, e_date_str, i_str, callback) {
    MongoClient.connect(DB_CONN_STR, function(err, database) {
        if (err)
            callback(err);

        const power_db = database.db('Power-database');
        var PowerList = power_db.collection('PowerList');

        PowerList.find(
            {
                "PowerID": mid,
            }
        ).toArray( function(err, _power_list)
        {
            if (_power_list.length == 0) {
                callback({'IDNotExists': mid});
                return;
            }
            _month_list = _power_list[0].PowerMonthList;
            _usage_summary(_month_list, s_date_str, e_date_str, i_str, callback);
        }); // PowerList.find.toArray
    }); // MongoClient.connect
}; // get_usage_by_mid

function get_usage_by_bid(bid, s_date_str, e_date_str, i_str, callback) {
    MongoClient.connect(DB_CONN_STR, function(err, database) {
        if (err) {
            callback(err);
            return;
        }

        const power_db = database.db('Power-database');
        var PowerList   = power_db.collection('PowerList');
        var Mapping     = power_db.collection('Mapping');

        Mapping.find(
            {
                "BuildingID": bid
            }
        ).toArray( function(err, _building_list) 
        {
            if (_building_list.length == 0) {
                callback({'IDNotExists': bid});
                return;
            }
            var _the_building = _building_list[0];
            var _usage_list = [];
            var _signs_list = [];

            var _not_exist_flag = false;
            var _not_exist_ids  = [];
            _the_building.PowerMeters.forEach(function(_one_meter, index, _all_meters)
            {
                console.log('METER_ID: '+_one_meter.PowerID);
                PowerList.find(
                    {
                        "PowerID": _one_meter.PowerID,
                    }
                ).toArray( function(err, _power_list)
                {
                    if (_power_list.length == 0) {
                        _not_exist_flag = true;
                        _not_exist_ids.push(_one_meter.PowerID);
                    } else if (!_not_exist_flag) {
                        _month_list = _power_list[0].PowerMonthList;
                        _usage_summary(_month_list, s_date_str, e_date_str, i_str, function(err, _one_meter_obj){
                            _usage_list.push(_one_meter_obj);
                            _signs_list.push(_one_meter.sign);
                            if (index == _all_meters.length - 1) {
                                res_obj = _usage_combine(_usage_list, _signs_list);
                                callback(0, res_obj);
                            }
                        }); // _usage_summary
                    } 
                    if (_not_exist_flag && index === _all_meters.length - 1) {
                        callback({'IDNotExists': _not_exist_ids});
                    }
                }); // PowerList.find.toArray
            }); // _the_building.PowerMeters.forEach
        });// Mapping.find.toArray
    }); // MongoClient.connect
}; // get_usage_by_bid

function get_usage_by_cname(cname, s_date_str, e_date_str, i_str, callback) {
    MongoClient.connect(DB_CONN_STR, function(err, database) {
        if (err) {
            callback(err);
            return;
        }

        const power_db = database.db('Power-database');
        var CollegeList = power_db.collection('CollegeList');
        var PowerList   = power_db.collection('PowerList');
        var Mapping     = power_db.collection('Mapping');

        var _not_exist_flag = false;
        var _not_exist_ids  = [];
        CollegeList.find(
            {
                "CollegeName": cname
            }
        ).toArray( function(err, _college_list) {
            if (_college_list.length == 0) {
                callback({'IDNotExists': cname});
                return;
            }
            var _the_college = _college_list[0];
            var _usage_list = [];
            var _signs_list = [];
            _the_college.CollegeBuildingList.forEach(function(_one_building, b_index, _all_buildings) {
                Mapping.find(
                    {
                        "BuildingID": _one_building.BuildingID
                    }
                ).toArray( function(err, _building_list) 
                {
                    if (_building_list.length == 0) {
                        _not_exist_flag = true;
                        _not_exist_ids.push(_one_building.BuildingID);
                    } else if (!_not_exist_flag){
                        var _the_building = _building_list[0];
                        _the_building.PowerMeters.forEach(function(_one_meter, index, _all_meters)
                        {
                            console.log('METER_ID: '+_one_meter.PowerID);
                            PowerList.find(
                                {
                                    "PowerID": _one_meter.PowerID,
                                }
                            ).toArray( function(err, _power_list)
                            {
                                if (_power_list.length == 0) {
                                    _not_exist_flag = true;
                                    _not_exist_ids.push(_one_meter.PowerID);
                                } else if (!_not_exist_flag) {
                                    _month_list = _power_list[0].PowerMonthList;
                                    _usage_summary(_month_list, s_date_str, e_date_str, i_str, function(err, _one_meter_obj){
                                        _usage_list.push(_one_meter_obj);
                                        _signs_list.push(_one_meter.sign);
                                        if (     index === _all_meters.length - 1
                                            && b_index === _all_buildings.length - 1) {
                                            res_obj = _usage_combine(_usage_list, _signs_list);
                                            callback(0, res_obj);
                                        }
                                    }); // _usage_summary
                                } 
                                if (_not_exist_flag 
                                 &&   index === _all_meters.length - 1
                                 && b_index === _all_buildings.length - 1) {
                                    callback({'IDNotExists': _not_exist_ids});
                                }
                            }); // PowerList.find.toArray
                        }); // _the_building.PowerMeters.forEach
                    }
                    if (_not_exist_flag
                     && b_index === _all_buildings.length - 1) {
                        callback({'IDNotExists': _not_exist_ids});
                    }
                }); // Mapping.find.toArray
            }); // _the_college.CollegeBuildingList.forEach
        }); // CollegeList.find.toArray
    }); // MongoClient.connect
}; // get_usage_by_cname

function _parse_date_string(date_str) {
    y = parseInt(date_str.substring(0, 4));
    m = parseInt(date_str.substring(4, 6)) - 1;
    if (date_str.length > 6){
        d = parseInt(date_str.substring(6));
    } else {
        d = 1;
    }
    month = new Date(y, m, 1);
    console.log(month, d);
    return [month, d];
}

function _date_to_string(date, type) {
    var m = (date.getMonth() + 1);
    var d = date.getDate();
    if (type == 'm') {
        return [
            date.getFullYear(), 
            (m > 9? '':'0') + m
        ].join('-');
    } else if (type == 'd') {
        return [
            date.getFullYear(), 
            (m > 9 ? '':'0') + m,
            (d > 9 ? '':'0') + d
        ].join('-');
    }
}

function _parse_interval_string(i_str) {
    i_num  = parseInt(i_str);
    i_type = i_str.substring(i_str.length-1).toLowerCase();
    return [i_num, i_type];
}

function _usage_summary(_month_list, s_date_str, e_date_str, i_str, callback) {
    var [s_month, s_d] = _parse_date_string(s_date_str); 
    var [e_month, e_d] = _parse_date_string(e_date_str); 
    var [i_num, i_type] = _parse_interval_string(i_str);

    var summary_obj = {"usage_chart":[]};
    var summary_count = 0;
    var summary_usage = 0.0;

    if (i_type == 'm') {
        _month_list.forEach(function(_one_month, index, _all_month){
            if (   _one_month.PowerMonth.getTime() >= s_month.getTime() 
                && _one_month.PowerMonth.getTime() <= e_month.getTime()  ){
                summary_count += 1;
                summary_usage += _one_month.PowerMonthAve.PowerMonthUsage;
                if (summary_count % i_num == 0) {
                    summary_obj.usage_chart.push({
                        "date":     _date_to_string(_one_month.PowerMonth, i_type),
                        "usage":    summary_usage
                    });
                    summary_count = 0;
                    summary_usage = 0.0;
                }
            }
        });
        callback(0, summary_obj);
        console.log(summary_obj);
    } else if (i_type == 'd') {
        _month_list.forEach(function(_one_month, index, _all_month){
            console.log(_one_month.PowerMonth, s_month);
            if (
                _one_month.PowerMonth.getTime() == s_month.getTime() 
            ){
                var _date_list = _one_month.PowerDateList;
                _date_list.forEach(function(_one_date, _d, _all_dates) {
                    if (_d+1 >= s_d && _d+1 <= e_d) {
                        summary_count += 1;
                        summary_usage += _one_date.PowerDateData.PowerDateUsage;
                        if (summary_count % i_num == 0) {
                            _the_date = new Date(_one_month.PowerMonth);
                            _the_date.setDate(_d+1);
                            summary_obj.usage_chart.push({
                                "date":     _date_to_string(_the_date, i_type),
                                "usage":    summary_usage
                            });
                            summary_count = 0;
                            summary_usage = 0.0;
                        }
                    }
                });
            } else if (   
                   _one_month.PowerMonth.getTime() > s_month.getTime() 
                && _one_month.PowerMonth.getTime() < e_month.getTime()  
            ) {
                var _date_list = _one_month.PowerDateList;
                _date_list.forEach(function(_one_date, _d, _all_dates) {
                    summary_count += 1;
                    summary_usage += _one_date.PowerDateData.PowerDateUsage;
                    if (summary_count % i_num == 0) {
                        _the_date = new Date(_one_month.PowerMonth);
                        _the_date.setDate(_d+1);
                        summary_obj.usage_chart.push({
                            "date":     _date_to_string(_the_date, i_type),
                            "usage":    summary_usage
                        });
                        summary_count = 0;
                        summary_usage = 0.0;
                    }
                });
            } else if (  
                _one_month.PowerMonth.getTime() == e_month.getTime()
            ) {
                var _date_list = _one_month.PowerDateList;
                _date_list.forEach(function(_one_date, _d, _all_dates) {
                    if (_d+1 <= e_d) {
                        summary_count += 1;
                        summary_usage += _one_date.PowerDateData.PowerDateUsage;
                        if (summary_count % i_num == 0) {
                            _the_date = new Date(_one_month.PowerMonth);
                            _the_date.setDate(_d+1);
                            summary_obj.usage_chart.push({
                                "date":     _date_to_string(_the_date, i_type),
                                "usage":    summary_usage
                            });
                            summary_count = 0;
                            summary_usage = 0.0;
                        }
                    }
                });
            }
        });
        callback(0, summary_obj);
        console.log(summary_obj);
    } else {
        callback({'TypeError':i_type});
    }
}

function _usage_combine(_usage_list, _signs_list) {
    var combined_usage = _usage_list[0];
    var _one_sign = _signs_list[0] == '+' ? 1.0 : -1.0;
    combined_usage.usage_chart.forEach( function(_one_date, d_index, _all_dates) {
        combined_usage.usage_chart[d_index].usage *= _one_sign;
    });
    _usage_list.forEach( function(_one_meter, index, _all_meters) 
    {
        if (index == 0) return ;
        _one_sign = _signs_list[index] == '+' ? 1.0 : -1.0;
        combined_usage.usage_chart.forEach( function(_one_date, d_index, _all_dates) {
            combined_usage.usage_chart[d_index].usage += _one_sign * _one_meter.usage_chart[d_index].usage;
        });
    });
    return combined_usage;
}

module.exports = {
    get_usage_by_mid,
    get_usage_by_bid,
    get_usage_by_cname
}
