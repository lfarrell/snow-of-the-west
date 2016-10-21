d3.queue()
    .defer(d3.csv,'group/el_month.csv')
    .defer(d3.csv,'group/state_el_month.csv')
    .defer(d3.csv,'group/state_el_date.csv')
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
            d.month = parse_month_date(d.month)
        });

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

        var svg = d3.select("#year").append("svg");
        var temp_svg = d3.select("#temp").append("svg");

        var render = _.debounce(function() {
            var screen_width = (window.innerWidth - margins.right - margins.left) / 2.5;

            /****
             * Bubble Chart
             *
             */
            var monthColors = stripColors(temp_colors, el_month, 'mean');
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
                    return monthColors(d.mean)
                })
                .attr('cx', function(d) { return xScaleStateMonth(d.el_level + '000'); })
                .attr('cy', function(d) { return yScaleStateMonth(d.month); })
                .attr('r', 10)
                .translate([margins.left + 15, margins.top]);

            /***
             * Line Chart
             */
            var xTempScale = d3.scaleTime()
                .range([0, screen_width]);
            xTempScale.domain(d3.extent(temps, d3.f('date')));

            var yTempScale =  d3.scaleLinear()
                .range([0, height]);
            yTempScale.domain([d3.max(temps, d3.f('anomaly')), 0]);

            var xTempAxis = d3.axisBottom()
                .scale(xTempScale);

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



            d3.select("#state-list").on("change", function(d) {
                var selected_state_name = this.options[this.selectedIndex].innerHTML;
                var state = d3.select(this);
                var state_val = state.prop("value");

                d3.selectAll(".selected_state").text(selected_state_name);
                state.prop("value", "");
            });


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
            return d3.scaleQuantile()
                .domain(_.pluck(data, type))
                .range(values);
        }

        render();

        window.addEventListener("resize", render);
});



