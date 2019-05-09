d3.csv("./Dataset/mc1-reports-data.csv",function (err, rows) {
    // console.log(rows);

    rows.forEach(row => {
        row.time = observeTime(formatDayAndHour(parseTimeGeo(row.time)));
    });
    //get data of each location by time and sort
     dataByTime = d3.nest().key(d => d.location).key(d => d.time).entries(rows);
    dataByTime.forEach(d => d.values.sort((a, b) => new Date(a.key) - new Date(b.key)));
    var timestep = [];
    var store_reportnum=[];
    dataByTime[1].values.forEach(d => timestep.push(d.key))
    dataByTime.forEach(d => d.values.forEach(d => d.time_step = timestep.indexOf(d.key)));
    var array_data3 = [];
    dataByTime.forEach(d => {
        var array_data2 = [];
        d.values.forEach(d1 => {
            var array_data1 = [];
            d1.values.forEach(d2 => {

                array_data1.push([+d2.shake_intensity, +d2.medical, +d2.buildings,+d2.power, +d2.roads_and_bridges, +d2.sewer_and_water])
            })
            array_data2.push({"value": array_data1, "step": d1.time_step, "noreport":d1.values.length})
            store_reportnum.push(d1.values.length)

        })
        array_data3.push(array_data2)
    });

    //scale the number of report to [0,1];
    var report_scale = d3.scaleLinear().domain([math.min(store_reportnum),math.max(store_reportnum)]).range([0,1]);

    var array_data_mean = [];
     array_data_mean4 = [];

    array_data3.forEach(d => {
        var array_data_mean3 = [];
        d.forEach(d1 => {

            array_data_mean = _.unzip(d1.value);
            var array_data_mean2 = [];
            array_data_mean.forEach(d2 =>
                array_data_mean2.push(math.mean(d2))
            )
            array_data_mean3.push({"data": array_data_mean2, "step": d1.step ,"noreport": d1.noreport})
        })
        array_data_mean4.push(array_data_mean3)


    });

    // create tooltip
    var tooltip = d3.select("#heatmap")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden");

    var classesNumber = 9,
        cellSize = 10,
        viewerWidth = 1200,
        viewerHeight = 4000,
        viewerPosTop = 100,
        viewerPosLeft = 100,
        viewerPosBot = 300,
        rowLabelMargin = 10,
        legendElementWidth = cellSize * 2;

    svg = d3.select("#heatmap").append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
    var colors = colorbrewer["YlOrRd"][classesNumber];
    //create color scale to display the feature
    var colorScale = d3.scaleQuantize()
        .domain([0, 10])
        .range(colors);
    var rowLabelData =  ["shake_intensity","medical","buidings","power","roads_bridges","sewer_water"]


    // Add scales to axis
    var N=121;
    var array_label=[];
    array_label=Array.apply(null, {length: N}).map(Number.call, Number)
    //create time line axis
    // Create scale
    var scale = d3.scaleLinear()
        .domain([d3.min(array_label), d3.max(array_label)])
        .range([0, 840]);

    // create svg for group of LOCATION
    var maing = svg.selectAll('g').data(array_data_mean4).enter()
        .append("g")
        .attr("transform", (song, i) => `translate(${viewerPosLeft},${viewerPosTop + i * viewerHeight / 80})`)
        .attr("id", function (d, i) {
            return "location" + i
        })
    var time_axis=svg.append("g").attr("class","x_axis")
        .attr("transform", "translate(102," + 80 + ")")
        .call(d3.axisBottom(scale).ticks(60));

    svg.append("text")
        .attr("transform",
            "translate(520,70)")
        .style("text-anchor", "middle")
        .text("Time(hours)");
//create row label
    var rowLabels = maing.append("g")
        .attr("class", "rowLabels")
        .selectAll(".rowLabel")
        .data(rowLabelData)
        .enter().append("text")
        .text(function (rowLabel) {
            return rowLabel
        })
        .attr("x", 0)
        .attr("y", function (rowLabel, i) {
            return (i*cellSize/1.4 );
        })
        .style("text-anchor", "middle")
        .style("font-size", "5px")
        .attr("transform", function (rowLabel) {
            return `translate(-20, ${4})`;
        })
        .attr("class", "rowLabel mono")
        .attr("id", function (rowLabel, i) {
            return "rowLabel_" + i;
        })
        .on('mouseover', function (d, i) {
            d3.select(this).classed("hover", true);
        })
        .on('mouseout', function (d, i) {
            d3.select(this).classed("hover", false);
        });;

    var rows = maing.selectAll(".row")
        .data(rows=>rows)
            .enter().append("g")
        .attr("class", "row")
        .attr("transform", (row) => `translate(${row.step*(cellSize+4)/2},0)`)
        .attr("class", function (d,i){
            return "column"+d.step;
        });
    var j;
    var heatmap = rows.selectAll(".cell")
        .data(function(row) {
            j = row.noreport;
            console.log(j)
            return row.data.map(d => {
                return {data: d, report: j}
            });
        })
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", function (cell,i) {
            return i * (cellSize+4) / 2;
        })
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("class", function (cell, i) {
            return "cell bordered cr" + i;
        })
        .attr("width", cellSize / 2)
        .attr("height", cellSize / 2)
        .style("fill", function (d){
            return colorScale((d.data))
        })
        .attr("stroke-width", function(d){
            return report_scale(d.report);
        })
        .attr("stroke","black")

        .on('mouseover', function (cell) {
            console.log(cell.report)
                tooltip.html('<div class="heatmap_tooltip">' + "Report_No: " + cell.report +  "<br/>" + "Mean_value: " + cell.data.toFixed(2) +  "<br/>" + '</div>');
                tooltip.style("visibility", "visible");
        })
        .on('mouseout', function (cell) {
            d3.select(this).classed("hover", false);
            tooltip.style("visibility", "hidden");
        })
        .on("mousemove", function (cell) {
            tooltip.style("top", (d3.event.pageY - 880) + "px").style("left", (d3.event.pageX - 60) + "px");
        });

});