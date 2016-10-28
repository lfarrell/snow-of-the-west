var fs = require('fs');
var d3 = require('d3');
var _ = require('lodash');
var R = require('ramda');
var stringify = require('csv-stringify');

var base = '../data';
var text_format = d3.format(".01f");

fs.readdir(base, function(err, files) {
    files.forEach(function(file) {
        if(/csv$/.test(file)) {
            fs.readFile(base + '/all.csv', 'utf8', function(e, rows) {
                var data = d3.csv.parse(rows);
            /*    var snow_depth_values = data.filter(function(d) {
                    return d.snow_depth !== '';
                });

                var snow_water_values = data.filter(function(d) {
                    return d.snow_water !== '';
                }); */

                var snow_el_month = d3.nest()
                    .key(function(d) { return d.el_level; })
                    .key(function(d) { return d.month; })
                    .rollup(function(values) {
                        return valueList(values);
                    })
                    .entries(data);

                var snow_flat = flattenTwo(snow_el_month);

                var state_snow_el_month = d3.nest()
                    .key(function(d) { return d.state; })
                    .key(function(d) { return d.el_level; })
                    .key(function(d) { return d.month; })
                    .rollup(function(values) {
                        return valueList(values);
                    })
                    .entries(data);

                var state_snow_flat = flattenThree(state_snow_el_month);

                var state_snow_el_year_month = d3.nest()
                    .key(function(d) { return d.state; })
                    .key(function(d) { return d.el_level; })
                    .key(function(d) { return d.year; })
                    .key(function(d) { return d.month; })
                    .rollup(function(values) {
                        return valueList(values);
                    })
                    .entries(data);

                var state_snow_date_flat = flattenFour(state_snow_el_year_month);

           /*     var water_el_month = d3.nest()
                    .key(function(d) { return d.el_level; })
                    .key(function(d) { return d.month; })
                    .rollup(function(values) {
                        return valueList(values, "snow_water");
                    })
                    .entries(snow_water_values);

                var water_flat = flattenTwo(water_el_month);

                var state_water_el_month = d3.nest()
                    .key(function(d) { return d.state; })
                    .key(function(d) { return d.el_level; })
                    .key(function(d) { return d.month; })
                    .rollup(function(values) {
                        return valueList(values, "snow_water");
                    })
                    .entries(snow_water_values);

                var state_water_flat = flattenThree(state_water_el_month);

                var state_water_el_year_month = d3.nest()
                    .key(function(d) { return d.state; })
                    .key(function(d) { return d.el_level; })
                    .key(function(d) { return d.year; })
                    .key(function(d) { return d.month; })
                    .rollup(function(values) {
                        return valueList(values, "snow_water");
                    })
                    .entries(snow_water_values);

                var state_water_date_flat = flattenFour(state_water_el_year_month); */

                var file_names = ['el_month', 'stat_el_month', 'state_el_year_month'];

                var options = {header: true,
                    columns: [ 'state', 'el_level', 'year', 'month', 'snow_mean', 'snow_median', 'water_mean', 'water_median']
                };

                [snow_flat, state_snow_flat, state_snow_date_flat].forEach(function(d, i) {
                    stringify(d, options, function(e, output){
                        fs.writeFile('updated/' + file_names[i] + '.csv', output, function(err) {
                            console.log(err)
                        });
                    });
                });

                function flattenTwo(nested_group) {
                    var flat = [];

                    nested_group.forEach(function(d) {
                        d.values.forEach(function(e) {
                            flat.push({
                                state: '',
                                el_level: d.key,
                                year: '',
                                month:e.key,
                                snow_mean: text_format(e.values.snow_mean),
                                snow_median: text_format(e.values.snow_median),
                                water_mean: text_format(e.values.water_mean),
                                water_median: text_format(e.values.water_median)
                            });
                        });
                    });

                    return _.sortByAll(flat, ['el_level', 'month']);
                }

                function flattenThree(nested_group) {
                    var flat = [];

                    nested_group.forEach(function(d) {
                        d.values.forEach(function(e) {
                            e.values.forEach(function(f) {
                                flat.push({
                                    state: d.key,
                                    el_level: e.key,
                                    year: '',
                                    month: f.key,
                                    snow_mean: text_format(f.values.snow_mean),
                                    snow_median: text_format(f.values.snow_median),
                                    water_mean: text_format(f.values.water_mean),
                                    water_median: text_format(f.values.water_median)
                                });
                            })
                        })
                    });

                    return _.sortByAll(flat, ['state', 'el_level', 'month']);
                }

                function flattenFour(nested_group) {
                    var flat = [];

                    nested_group.forEach(function(d) {
                        d.values.forEach(function(e) {
                            e.values.forEach(function(f) {
                                f.values.forEach(function(g) {
                                    flat.push({
                                        state: d.key,
                                        el_level: e.key,
                                        year: f.key,
                                        month: g.key,
                                        snow_mean: text_format(g.values.snow_mean),
                                        snow_median: text_format(g.values.snow_median),
                                        water_mean: text_format(g.values.water_mean),
                                        water_median: text_format(g.values.water_median)
                                    });
                                });
                            });
                        });
                    });

                    return _.sortByAll(flat, ['state', 'el_level', 'year', 'month']);
                }

                function valueList(values) {
                    return {
                        snow_mean : d3.mean(values, function(d) {
                            if(d.snow_depth !== '') return d.snow_depth; else return; 
                        }),
                        snow_median : d3.median(values, function(d) {
                            if(d.snow_depth !== '') return d.snow_depth; else return;
                        }),
                        water_mean: d3.mean(values, function(d) {
                            if(d.snow_water !== '') return d.snow_water; else return;
                        }),
                        water_median: d3.median(values, function(d) {
                            if(d.snow_water !== '') return d.snow_water; else return
                        })
                    };
                }
            });
        }
    });
});
/*
fs.readFile('all_temps.csv', 'utf8', function(e, values) {
    var data = d3.csv.parse(values);

   var type_rollup = d3.nest()
        .key(function(d) { return d.type; })
        .key(function(d) { return d.state; })
        .key(function(d) { return d.month; })
        .rollup(function(values) {
            return valueList(values);
        })
        .entries(data);

    var flatten = flattenThree(type_rollup);

    var options = {header: true,
        columns: [ 'type', 'state', 'month', 'value', 'anomaly', 'avg']
    };


    stringify(flatten, options, function(e, output){
        fs.writeFile('temps_rollup.csv', output, function(err) {
            console.log(err)
        });
    });

    function valueList(values) {
        return {
            value : text_format(d3.mean(values, function(d) {return d.value })),
            anomaly : text_format(d3.mean(values, function(d) {return d.anomaly; }))
        };
    }

    function flattenThree(nested_group) {
        var flat = [];

        nested_group.forEach(function(d) {
            d.values.forEach(function(e) {
                e.values.forEach(function(f) {
                    flat.push({
                        type: d.key,
                        state: e.key,
                        month: f.key,
                        value: f.values.value,
                        anomaly: f.values.anomaly,
                        avg: text_format(parseFloat(f.values.value) + parseFloat(f.values.anomaly))
                    });
                })
            })
        });

        return _.sortByAll(flat, ['type', 'state', 'month']);
    }
}); */