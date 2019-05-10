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
    dataByTime[1].values.forEach((d,i) => timestep.push(d.key))
    dataByTime.forEach(d => d.values.forEach(d => d.time_step = timestep.indexOf(d.key)));
    var array_data3 = [];
    dataByTime.forEach(d => {
        var array_data2 = [];
        d.values.forEach(d1 => {
            var array_data1 = [];
            d1.values.forEach(d2 => {

                array_data1.push([+d2.shake_intensity, +d2.medical, +d2.buildings,+d2.power, +d2.roads_and_bridges, +d2.sewer_and_water])
            })
            array_data2.push({"value": array_data1, "step": d1.time_step, "noreport":d1.values.length, "location":d.key })
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
            array_data_mean3.push({"data": array_data_mean2, "step": d1.step ,"noreport": d1.noreport, "location":parseInt(d1.location)})
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
        viewerWidth = 1000,
        viewerHeight = 2000,
        viewerPosTop = 100,
        viewerPosLeft = 150,
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
    rowLabelData =  ["shake_intensity","medical","buidings","power","roads_bridges","sewer_water"]


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
     maing = svg.selectAll('g').data(array_data_mean4).enter()
        .append("g")
        .attr("transform", (song, i) => `translate(${viewerPosLeft},${viewerPosTop + i * 50})`)
        .attr("id", function (d, i) {
            return "location" + i
        })
    var time_axis=svg.append("g").attr("class","x_axis")
        .attr("transform", "translate(152," + 80 + ")")
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
            d3.select(this).style("font-size","10px").classed("hover", true);
        })
        .on('mouseout', function (d, i) {
            d3.select(this).style("font-size","5px").classed("hover", false);
        });;

    rowss = maing.selectAll(".row")
        .data(rows=>rows)
            .enter().append("g")
        .attr("class", "row")
        .attr("transform", (row) => `translate(${row.step*(cellSize+4)/2},0)`)
        .attr("class", function (d,i){
            return "column"+d.step;
        });
    var j,l;
     var heatmap = rowss.selectAll(".cell")
        .data(function(row) {
            j = row.noreport;
            l = row.location;
            return row.data.map((d,i) => {
                return {data: d, report: j, location: l, type:i}
            });
        })
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", function (cell,i) {
            return i * (cellSize+4) / 2;
        })
        // .attr("rx", 2)
        // .attr("ry", 2)
        .attr("class", function (cell, i) {
            return "cell " + i + " loc " +cell.location;
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
                tooltip.html('<div class="heatmap_tooltip">' + "Location: " + cell.location +  "<br/>"+ "Report Quantity: " + cell.report +  "<br/>" + "Average Damage Level: " + cell.data.toFixed(2) +  "<br/>" + '</div>');
                tooltip.style("visibility", "visible");
        })
        .on('mouseout', function (cell) {
            d3.select(this).classed("hover", false);
            tooltip.style("visibility", "hidden");
        })
        .on("mousemove", function (cell) {
            tooltip.style("top", (d3.event.pageY - 910) + "px").style("left", (d3.event.pageX - 65) + "px");
        });

    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform",
            "translate(100,-80)")
        .selectAll(".legendElement")
        .data([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        .enter().append("g")
        .attr("class", "legendElement");

    legend.append("svg:rect")
        .attr("x", function (d, i) {
            return legendElementWidth * i;
        })
        .attr("y", 115)
        .attr("class", "cellLegend bordered")
        .attr("width", legendElementWidth)
        .attr("height", cellSize / 2)
        .style("fill", function (d, i) {
            return colors[i];

        });

    legend.append("text")
        .attr("class", "mono legendElement")
        .attr("font-size","10px")
        .text(function (d) {
            return "≥" + Math.round(d * 100) / 100;
        })
        .attr("x", function (d, i) {
            return legendElementWidth * i;
        })
        .attr("y", 130);

    var Location_label=['Palace Hills', 'Northwest', 'Old Town', 'Safe Town', 'Southwest', 'Downtown', 'Wilson Forest', 'Scenic Vista', 'BroadView', 'Chapparal', 'Terrapin Springs','Pepper Mill', 'Cheddar Ford', 'Easton', 'Weston','Southton','Oak Willow', 'East Parton', 'West Parton']
    var y = d3.scaleLinear().range([945, 0]).domain([19,0]);
    // Add the y Axis
    svg.append("g").attr("class","y_axis")
        .attr("transform", "translate(100," + 100 + ")")
        .call(d3.axisLeft(y).ticks(19).tickFormat(function(d) { return Location_label[d]; }));

});

function showdatabyfeature() {
var a=[0,1,2,3,4,5]
svg.transition().duration(3000).selectAll(".cell")
    .attr("y",
        function (d) {
            if(a.includes(d.type)) {

                return d.type*160-(d.location - 1) * 43;
            }
        });
    var locationlabel=[]
    var label=["Shake_intensity","Medical","Buildings","Power","Roads&Bridges","Sewer&Water"]
    var y = d3.scaleLinear().range([945, 0]).domain([6,0]);
    // Add the y Axis
    svg.append("g").attr("class","label_axis")
        .attr("transform", "translate(80," + 100 + ")")
        .call(d3.axisLeft(y).ticks(6).tickFormat(function(d) { return label[d]; }));
maing.selectAll("text").remove();
svg.select(".y_axis").remove();
}

function showdatabylocation() {
    svg.select(".label_axis").remove();
    maing.selectAll("text").remove()
    var y = d3.scaleLinear().range([945, 0]).domain([19.5,0.5]);
    // Add the y Axis
    svg.append("g").attr("class","y_axis")
        .attr("transform", "translate(50," + 100 + ")")
        .call(d3.axisLeft(y).ticks(19));
    var cellSize=10;
    rowss.transition().duration(3000).selectAll(".cell").attr("x", 0)
        .attr("y", function (cell,i) {
            return i * (cellSize+4) / 2;
        })
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
            d3.select(this).style("font-size","10px").classed("hover", true);
        })
        .on('mouseout', function (d, i) {
            d3.select(this).style("font-size","5px").classed("hover", false);
        });
}
