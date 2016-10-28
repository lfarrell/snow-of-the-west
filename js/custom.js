d3.queue()
    .defer(d3.csv,'group/updated/el_month.csv')
    .defer(d3.csv,'group/updated/state_el_month.csv')
    .defer(d3.csv,'group/updated/state_el_date.csv')
    .defer(d3.csv,'group/all_temps.csv')
    .defer(d3.csv,'group/temps_rollup.csv')
    .await(function(error, el_month, state_el_month, state_el_date, temps, temps_rollup)  {
        var margins = {top: 50, right: 130, bottom: 25, left: 105},
            parse_date = d3.timeParse("%m/%Y"),
            parse_month_date = d3.timeParse("%m"),
            num_format = d3.format(".1f"),
            map_height = 250 - margins.top - margins.bottom,
            height = 250 - margins.top - margins.bottom;

        var temp_colors = ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695'];
        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        el_month.forEach(function(d) {
            d.month = parse_month_date(d.month);
            d.snow_mean = +d.snow_mean;
        });

        var snow = el_month.filter(function(d) {
            return d.type === 'snow';
        });

        var water = el_month.filter(function(d) {
            return d.type === 'water';
        })

        state_el_month.forEach(function(d) {
            d.month = parse_month_date(d.month)
        });

        state_el_date.forEach(function(d) {
            d.date = parse_date(d.month + '/' + d.year);
        });

        temps.forEach(function(d) {
            d.date = parse_date(d.month + '/' + d.year);
            d.anomaly = +d.anomaly;
        });

        temps_rollup.forEach(function(d) {
            d.month = parse_month_date(d.month)
        });

        var all_temp = temps.filter(function(d) {
            return d.type === 'temp';
        });

        var temps_west = d3.nest()
            .key(function(d) { return d.month; })
            .rollup(function(values) {
                return {
                    hist_avg: num_format(d3.mean(values, function(d) { return d.value - d.anomaly; })),
                    actual: num_format(d3.mean(values, function(d) { return d.value; })),
                    value: num_format(d3.mean(values, function(d) {return d.anomaly; }))
                }
            })
            .entries(all_temp);

        temps_west.forEach(function(d) {
            d.date = parse_month_date(d.key);
        });

        var bisectDate = d3.bisector(function(d) { return d.date; }).right;

        var svg = d3.select("#year").append("svg");
        var temp_svg = d3.select("#temp").append("svg");

        var render = _.debounce(function() {
            var screen_width = (window.innerWidth - margins.right - margins.left) / 2.5;

            /****
             * Bubble Chart
             *
             */
            var monthColors = stripColors(temp_colors, el_month, 'snow_mean');
            var xScaleStateMonth = xScaleOrd(screen_width, el_month);
            var yScaleStateMonth = yScale(height, el_month);

            var xAxis = d3.axisTop()
                .scale(xScaleStateMonth)
                .tickFormat(d3.format(",d"));

            var yAxis = d3.axisLeft()
                .scale(yScaleStateMonth)
                .tickFormat(d3.timeFormat('%B'));

            svg.attr("height", height + margins.top + margins.bottom)
                .attr("width", screen_width + margins.right + margins.left);

            svg.append("g")
                .attr("class", "x axis")
                .translate([margins.left, margins.top - 15]);

            d3.select("#year g.x").call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .translate([margins.left, margins.top]);

            d3.select("#year g.y").call(yAxis);

            var circles = svg.selectAll('circle').data(el_month);

            circles.exit().remove();

            circles.enter().append('circle')
                .merge(circles)
                .style('fill', function(d) {
                    return monthColors(d.snow_mean)
                })
                .attr('cx', function(d) { return xScaleStateMonth(d.el_level + '000'); })
                .attr('cy', function(d) { return yScaleStateMonth(d.month); })
                .attr('r', 10)
                .translate([margins.left + 15, margins.top])
                .on('mouseover touchstart', function(d) {
                    var header_text = monthWord(d.month.getMonth());

                    div.transition()
                        .duration(100)
                        .style("opacity", .9);

                    div.html(
                            '<h4 class="text-center">' + header_text + '</h4>' +
                                '<h5  class="text-center">Snow/Water Equivalence</h5>' +
                                '<ul class="list-unstyled"' +
                                '<li>Elevation: ' + d.el_level + ',000+ feet</li>' +
                              //  '<li>Total Sites: ' + d.total + '</li>' +
                                '<li>Water Mean: ' + num_format(d.water_mean) + ' inches</li>' +
                                '<li>Water Median: ' + num_format(d.water_median) + ' inches</li>' +
                                '<li>Snow Mean: ' + num_format(d.snow_mean) + ' inches</li>' +
                                '<li>Snow Median: ' + num_format(d.snow_median) + ' inches</li>' +
                                '</ul>'
                        )
                        .style("top", (d3.event.pageY+10)+"px")
                        .style("left", (d3.event.pageX-55)+"px");

                  //  d3.select(this).attr('r', radius * 1.5);
                })
                .on('mouseout touchend', function(d) {
                    div.transition()
                        .duration(250)
                        .style("opacity", 0);
                 //   d3.select(this).attr('r', radius);
                });

            /***
             * Line Chart
             */
            var xTempScale = d3.scaleTime()
                .range([0, screen_width]);
            xTempScale.domain(d3.extent(temps_west, d3.f('date')));

            var yTempScale =  d3.scaleLinear()
                .range([0, height]);
            yTempScale.domain([d3.max(temps_west, function(d) { return d.value.value; }), 0]);

            var xTempAxis = d3.axisBottom()
                .scale(xTempScale)
                .tickFormat(d3.timeFormat('%B'));

            var yTempAxis = d3.axisLeft()
                .scale(yTempScale);

            temp_svg.attr("height", height + margins.top + margins.bottom)
                .attr("width", screen_width + margins.right + margins.left);

            temp_svg.append("g")
                .attr("class", "x temp axis")
                .translate([margins.left, height + margins.top]);

            d3.select("g.x.temp").call(xTempAxis);

            temp_svg.append("g")
                .attr("class", "y temp axis")
                .translate([margins.left, margins.top]);

            d3.select("g.y.temp").call(yTempAxis);

            var temp_line = lineGenerator(xTempScale, yTempScale, 'date', 'value');

            temp_svg = appendPath(temp_svg, "temp_line", "steelblue");
            drawPath("#temp_line", temp_line, temps_west);
            focusHover(temp_svg, temps_west, "#temp", "degrees");



            d3.select("#state-list").on("change", function(d) {
                var selected_state_name = this.options[this.selectedIndex].innerHTML;
                var state = d3.select(this);
                var state_val = state.prop("value");

                d3.select("#state-text").text(selected_state_name);
                state.prop("value", "");
            });

            /**
             * Add overlay circle & text
             * @param chart
             * @returns {CSSStyleDeclaration}
             */
            function focusHover(chart, data, selector, type) {
                var focus = chart.append("g")
                    .attr("class", "focus")
                    .style("display", "none");

                focus.append("line")
                    .attr("class", "y0")
                    .attrs({
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2:height

                    });

                chart.append("rect")
                    .attr("class", "overlay")
                    .attr("width", screen_width)
                    .attr("height", height)
                    .on("mouseover touchstart", function() { focus.style("display", null); })
                    .on("mouseout touchend", function() {
                        focus.style("display", "none");
                        div.transition()
                            .duration(250)
                            .style("opacity", 0);
                    })
                    .on("mousemove touchmove", mousemove)
                    .translate([margins.left, margins.top]);

                function mousemove() {
                    var x0 = xTempScale.invert(d3.mouse(this)[0]),
                        i = bisectDate(data, x0, 1),
                        d0 = data[i - 1],
                        d1 = data[i];

                    if(d1 === undefined) d1 = Infinity;
                    var d = x0 - d0.date > d1.date - x0 ? d1 : d0;

                    var transform_values = [(xTempScale(d.date) + margins.left), margins.top];
                    d3.select(selector + " line.y0").translate(transform_values);

                    div.transition()
                        .duration(100)
                        .style("opacity", .9);

                    div.html(
                            '<h4 class="text-center">' + monthWord(d.date.getMonth()) + '</h4>' +
                                '<ul class="list-unstyled"' +
                              //  '<li>Historical Avg: ' + monthAvg(avgs, weather_type, month) + ' ' + type + '</li>' +
                                '<li>Historic Avg: ' + d.value.hist_avg + ' ' + type + '</li>' +
                                '<li>Actual Avg: ' + d.value.actual + '</li>' +
                                '<li>Departure from Avg: ' + d.value.value  + ' ' + type + '</li>' +
                                '</ul>'

                        )
                        .style("top", (d3.event.pageY-108)+"px")
                        .style("left", (d3.event.pageX-28)+"px");
                }

                return chart;
            }
        });

        var rows = d3.selectAll('.row');
        rows.classed('opaque', false);
        rows.classed('hide', false);
        d3.selectAll('#load').classed('hide', true);



        function xScaleOrd(height, data) {
            var values = d3.set(data, d3.f('el_level')).values()
                  .sort(function(a,b) {
                    return a - b;
                }).map(function(d) {
                    return d + '000';
                });

            var xScale = d3.scaleBand()
                .rangeRound([0, height])
                .padding(0.5);

            xScale.domain(values);

            return xScale;
        }

        function yScale(width, data) {
            var yScale =  d3.scaleTime()
                .range([0, width]);

            yScale.domain(d3.extent(data, d3.f('month')));

            return yScale;
        }

        function stripColors(values, data, type) {
            var vals = _.pluck(data, type);

            return d3.scaleQuantile()
                .domain(vals)
                .range(values);
        }

        /**
         * Create line path function
         * @param xScale
         * @param yScale
         * @param y
         * @returns {*}
         */
        function lineGenerator(xScale, yScale, x, y) {
            return d3.line()
                .curve(d3.curveNatural)
                .x(function(d) { return xScale(d[x]); })
                .y(function(d) { return yScale(d['value'][y]); });
        }

        /**
         * Add svg path to a chart
         * @param svg
         * @param id
         * @param color
         * @returns {*}
         */
        function appendPath(svg, id, color) {
            svg.append("path#" + id)
                .attr("stroke", color)
                .translate([margins.left, margins.top]);

            return svg;
        }

        /**
         * Draw SVG path
         * @param selector
         * @param scale
         * @param data
         * @returns {*}
         */
        function drawPath(selector, scale, data) {
            return d3.select(selector).transition()
                .duration(1000)
                .ease(d3.easeSinInOut)
                .attr("d", scale(data));
        }

        function monthWord(m) {
            switch(m) {
                case 0:
                    return "January";
                    break;
                case 1:
                    return "February";
                    break;
                case 2:
                    return "March";
                    break;
                case 3:
                    return "April";
                    break;
                case 4:
                    return "May";
                    break;
                case 5:
                    return "June";
                    break;
                case 6:
                    return "July";
                    break;
                case 7:
                    return "August";
                    break;
                case 8:
                    return "September";
                    break;
                case 9:
                    return "October";
                    break;
                case 10:
                    return "November";
                    break;
                case 11:
                    return "December";
                    break;
                default:
                    return "unknown";
            }
        }

        render();

        window.addEventListener("resize", render);
});