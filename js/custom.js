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
            height = 400 - margins.top - margins.bottom;

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

        temps_rollupforEach(function(d) {
            d.month = parse_month_date(d.month)
        });

        var render = _.debounce(function() {
            var screen_width = window.innerWidth;




        });

        var rows = d3.selectAll('.row');
        rows.classed('opaque', false);
        rows.classed('hide', false);
        d3.selectAll('#load').classed('hide', true);

        render();

        window.addEventListener("resize", render);
});



