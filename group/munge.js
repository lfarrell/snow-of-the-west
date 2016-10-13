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
                var snow_depth_values = data.filter(function(d) {
                    return d.snow_depth !== '';
                });

                var snow_water_values = data.filter(function(d) {
                    return d.snow_water !== '';
                });

                var snow_el_month = d3.nest()
                    .key(function(d) { return d.el_level; })
                    .key(function(d) { return d.month; })
                    .rollup(function(values) {
                        return valueList(values, "snow_depth");
                    })
                    .entries(snow_depth_values);

                var snow_flat = flattenTwo(snow_el_month);

                var state_snow_el_month = d3.nest()
                    .key(function(d) { return d.state; })
                    .key(function(d) { return d.el_level; })
                    .key(function(d) { return d.month; })
                    .rollup(function(values) {
                        return valueList(values, "snow_depth");
                    })
                    .entries(snow_depth_values);

                var state_snow_flat = flattenThree(state_snow_el_month);

                var water_el_month = d3.nest()
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

                var options = {header: true,
                    columns: [ 'state', 'el_level', 'month', 'mean', 'median', 'type']
                };

                [snow_flat, state_snow_flat, water_flat, state_water_flat].forEach(function(d, i) {
                    stringify(d, options, function(e, output){
                        fs.writeFile(i + '.csv', output, function(err) {
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
                                month:e.key,
                                mean: text_format(e.values.mean),
                                median: text_format(e.values.median),
                                type: e.values.type
                            });
                        });
                    });

                    return _.sortByAll(flat, ['state', 'el_level', 'month']);
                }

                function flattenThree(nested_group) {
                    var flat = [];

                    nested_group.forEach(function(d) {
                        console.log(d.key)
                        d.values.forEach(function(e) {
                            e.values.forEach(function(f) {
                                flat.push({
                                    state: d.key,
                                    el_level: e.key,
                                    month: f.key,
                                    mean: text_format(f.values.mean),
                                    median: text_format(f.values.median),
                                    type: f.values.type
                                });
                            })
                        })
                    });

                    return _.sortByAll(flat, ['state', 'el_level', 'month']);
                }

                function valueList(values, field) {
                    var type = /water/.test(field) ? "water" : "snow";
                    return {
                        mean : d3.mean(values, function(d) {return d[field] }),
                        median : d3.median(values, function(d) {return d[field]; }),
                        type : type
                    };
                }

              /*  var options = {header: true,
                    columns: [ 'state', 'fips', 'year', 'month', 'nothing', 'D0', 'D1', 'D2', 'D3', 'D4']
                };

                stringify(flat, options, function(e, output){
                    fs.writeFile('data/' + file_base + '.csv', output, function(err) {
                        console.log(err)
                    });
                }); */


            });
        }
    });
});