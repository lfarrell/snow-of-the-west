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
        });

        temps_rollup.forEach(function(d) {
            d.month = parse_month_date(d.month)
        });

        var render = _.debounce(function() {
            var screen_width = (window.innerWidth - margins.right - margins.left) / 2.5;

            var xScaleStateYearMonth = xScaleOrd(screen_width, el_month);
            var yScaleStateYearMonth = yScale(height, el_month);

            var xAxis = d3.axisTop()
                .scale(xScaleStateYearMonth)
                .tickFormat(d3.format(",d"));

            var yAxis = d3.axisLeft()
                .scale(yScaleStateYearMonth)
                .tickFormat(d3.timeFormat('%B'));

            var svg = d3.select("#year").append("svg");

            svg.attr("height", height + margins.top + margins.bottom)
                .attr("width", screen_width + margins.right + margins.left);

            svg.append("g")
                .attr("class", "x axis")
                .translate([margins.left, margins.top - 15]);

            d3.select("g.x").call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .translate([margins.left, margins.top]);

            d3.select("g.y").call(yAxis);


        });

        var rows = d3.selectAll('.row');
        rows.classed('opaque', false);
        rows.classed('hide', false);
        d3.selectAll('#load').classed('hide', true);

        function yScale(width, data) {
            var yScale =  d3.scaleTime()
                .range([0, width]);

            yScale.domain(d3.extent(data, d3.f('month')));

            return yScale;
        }

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

        render();

        window.addEventListener("resize", render);
});



