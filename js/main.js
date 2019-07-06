var dataset = [];
//Time Format and Parsing
//format of data: 2020-04-09 12:30:00
const parseTimeMinute = d3.timeParse("%Y-%m-%d %H:%M:%S");
const formatDayAndHour = d3.timeFormat("%m/%d/%Y %H");
const observeTimebyhour = d3.timeParse("%m/%d/%Y %H");
//Time Format and Parsing
// const parseTime = d3.timeParse("%m/%d/%Y %H:%M");
// const formatTimeDay = d3.timeFormat("%d");

d3.csv("./Dataset/data-optimized.csv", function (err, rows) {

    dataset = rows;
    //format time in origin dataset
    rows.forEach(row => {
        row.time_minute = (parseTimeMinute(row.time));
        row.time_hour = observeTimebyhour(formatDayAndHour(parseTimeMinute(row.time)));
    });

    // get databylocation for geo_graph draw
    var dataByLocation = d3.nest().key(d => d.location).entries(rows);

    //get data ready for drawing line graph
    let time_step_origin = [];
    //nest data by 5 minute and sort data
    let dataByMinute = d3.nest().key(d => d.time_minute).entries(rows);
    dataByMinute.sort((a, b) => new Date(a.key) - new Date(b.key));
    let report_number = [];
    let timestep = [];
    dataByMinute.forEach(d => report_number.push(d.values.length));
    dataByMinute.forEach((d, i) => {
        timestep.push(d.key);
        time_step_origin.push(d.values[0].time);
    })

    //draw area graph of report number
    plot_report_linegraph(report_number, dataByMinute)


    //get data for heatmap graph
   let dataByTime_Heatmap = d3.nest().key(d => d.location).key(d => d.time_minute).entries(rows);
    dataByTime_Heatmap.sort((a, b) => (a.key) - (b.key))
    dataByTime_Heatmap.forEach(d => d.values.sort((a, b) => new Date(a.key) - new Date(b.key)));
    dataByTime_Heatmap.forEach(d => d.values.forEach(d => d.time_step = timestep.indexOf(d.key)));
    let array_data_in_minute = [];
    dataByTime_Heatmap.forEach(d => {
        let array_data2 = [];
        d.values.forEach(d1 => {
            let array_data1 = [];
            var array_time = [];
            d1.values.forEach(d2 => {
                array_data1.push([+d2.shake_intensity, +d2.medical, +d2.buildings, +d2.power, +d2.roads_and_bridges, +d2.sewer_and_water])
                array_time = d2.time_hour;
            })
            //array data 2 contain information of every report in each 5'
            array_data2.push({
                "value": array_data1,
                "step": d1.time_step,
                "noreport": d1.values.length,
                "location": d.key,
                "time_hour": array_time
            })
            // store_reportnum.push(d1.values.length)

        })
        //array_data_in_minute contains all the data in all 5' steps
        array_data_in_minute.push(array_data2)

    });

    //scale the number of report to [0,1];
    report_scale = d3.scaleLinear().domain([math.min(report_number), math.max(report_number)]).range([0, 1]);


    var collect_data_by_feature = [];

    // total data in every 5 minute
    array_data_total = [];

    array_data_in_minute.forEach(d => {

        //create temp array to store information of each time step
        let array_data_mean3 = [];

        d.forEach(d1 => {

            collect_data_by_feature = _.unzip(d1.value);

            //store mean value of each feature in each time step
            let array_data_mean = [];

            //push the number of report of each feature which does not contain null value
            let array_report = [];
            //temp array to store number of report in each time step
            var store_length = 0;


            //delete null data (value: -1)
            collect_data_by_feature.forEach(d2 => {
                let temp_store = Array.from(d2);
                temp_store.forEach((d3, i) => {
                    if (d3 == -1) {
                        temp_store.splice(i, 1);
                    }
                    // if (d2.length == 0) {
                    //     d2 = -1;
                    //     store_length = 0;
                    // }
                    // else {
                })
                array_report.push(temp_store.length)
                if (temp_store.length == 0) {
                    temp_store.push(-1);
                }
                array_data_mean.push(math.mean(temp_store))


            })

            //get all the information of each time step
            array_data_mean3.push({
                "data": array_data_mean,
                "step": d1.step,
                "noreport": array_report,
                "location": parseInt(d1.location),
                "time": parseTimeMinute(time_step_origin[d1.step]),
                "time_origin": time_step_origin[d1.step],
                "time_hour": d1.time_hour
            })

        })
        array_data_total.push(array_data_mean3)
    });

    //Prepare for heatmap svg element
    var cellSize = 3;
    var viewerWidth = 2000,
        viewerHeight = 3000;

    svg_heatmap = d3.select("#heatmap").append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
        .attr("transform", 'translate(0,80)');

    colors = ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"];

    //create color scale to display the feature
    colorScale = d3.scaleQuantize()
        .domain([0, 10])
        .range(colors);
    rowLabelData = ["shake_intensity", "medical", "buidings", "power", "roads_bridges", "sewer_water"]

    //Draw initial heatmap in every 5 minute
    Update_heatmap(array_data_total, cellSize)

    //process data for geo_graph
    var geo_data = analyzed_geo_data(array_data_total.flat())

    //get geojson data and draw map
    d3.json("./Dataset/StHimark.geojson", function (err, geojson) {

        for (var j = 0; j < 6; j++) {
            // analyzeDataByLocation(dataByLocation);
            drawMap(geojson.features, j, geo_data)
            initialize(j);
        }
    });

});

function updatebyminute() {
    svg_heatmap.selectAll("g").remove();
    Update_heatmap(array_data_total, 10)
}

function updatebyhour() {
    svg_heatmap.selectAll("g").remove();
    var cellSize = 10;
    var timestep = [];
    var array_data_by_hour = [];
    array_data_total.forEach( d => {
        array_data_by_hour.push(d3.nest().key(d => d.time_hour).entries(d));
    });
    array_data_by_hour[1].forEach(d => timestep.push(d.key))
    const reducer = (accumulator, currentValue) => accumulator + currentValue;
    var collect_report_data = [];
    var collect_value_data = [];
    array_data_by_hour.forEach(d => {
        d.forEach(d1 => {

            let temp_value = [];
            let temp_data = [];
            d1.step = timestep.indexOf(d1.key)
            d1.values.forEach(d2 => {
               temp_value.push(d2.noreport);
               temp_data.push(d2.data);
                d1.location = d2.location;
            })
                collect_value_data  = _.unzip(temp_data);
                collect_report_data = _.unzip(temp_value);
                // console.log(collect_report_data)
            var report=[];
                collect_report_data.forEach( d3 => {
                report.push(d3.reduce(reducer));
                })

                var get_mean = [];
            collect_value_data.forEach( (d,i) => {
                var sum = 0;
                for (var j = 0; j < collect_report_data[0].length; j++) {
                    sum += d[j]*collect_report_data[i][j]
                }
                get_mean.push(sum)

            })
            d1.data = get_mean.map(function(n, i) {
                if (report[i] != 0) {
                return n / report[i];
                }
                else{
                    return n = -1;
                }
            });
            d1.noreport = report;
            d1.time_origin = d1.key.split('G')[0]

        })

    });
    console.log(array_data_by_hour)

    Update_heatmap(array_data_by_hour, cellSize)

}

function Update_heatmap(data, cellSize) {

    // create tooltip
    tooltip = d3.select("#heatmap")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden");

    //find maximum time step
    // var max_timestep = Math.max.apply(Math, data.map(function (el) { return el.length }));
    var max_timestep = d3.max(data.flat(), d => d.step)
    // console.log(max_timestep)
    //find minimum time step
    var timestep = []
    timestep = d3.min(data.flat(), d => d.step)
    cellSize = 1840 / (max_timestep - timestep);
    if ((max_timestep - timestep) <= 121) {
        var cellSize_scale = cellSize / 2
    } else if ((max_timestep - timestep) < 60) {
        cellSize_scale = cellSize / 8
    } else if ((max_timestep - timestep) < 45) {
        cellSize_scale = cellSize / 32
    } else if ((max_timestep - timestep) < 30) {
        cellSize_scale = cellSize / 120
    } else if ((max_timestep - timestep) < 15) {
        cellSize_scale = cellSize / 240
    } else {
        cellSize_scale = cellSize;
    }
    maing = svg_heatmap.selectAll('g').data(data).enter()
        .append("g")
        .attr("transform", (song, i) => `translate(${150},${(50) + i * cellSize_scale * 10})`)
        .attr("class", 'locationheatmap')
        .attr("id", function (d, i) {
            return "location" + i
        })
    // maing.exit().remove();

    rowss = maing.selectAll(".row")
        .data(rows => rows)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", (row) => `translate(${(row.step - math.min(timestep)) * (cellSize)},0)`)
        .attr("class", function (d, i) {
            return "column" + d.step;
        });
    var Location_label = ['Palace Hills', 'Northwest', 'Old Town', 'Safe Town', 'Southwest', 'Downtown', 'Wilson Forest', 'Scenic Vista', 'BroadView', 'Chapparal', 'Terrapin Springs', 'Pepper Mill', 'Cheddar Ford', 'Easton', 'Weston', 'Southton', 'Oak Willow', 'East Parton', 'West Parton']
    var j, l;
    var heatmap = rowss.selectAll(".cell")
        .data(function (row) {
            j = row.noreport;
            l = row.location;
            k = row.step;
            h = row.time_origin;
            return row.data.map((d, i) => {
                return {data: d, report: j, location: l, type: i, timestep: k, time: h}
            });
        })
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", function (cell, i) {
            return i * ((cellSize + 2) / 2);
        })

        .attr("class", function (cell, i) {
            return "cell " + i + " loc " + cell.location;
        })
        .attr("width", cellSize / 2)
        .attr("height", cellSize / 2)
        .style("fill", function (d) {
            return colorScale((d.data))
        })
        .attr("stroke-width", function (d) {
            return report_scale(d.report[d.type]);
        })
        .attr("stroke", "black")

        .on('mouseover', function (cell) {
            tooltip.html('<div class="heatmap_tooltip">' + "Time: " + cell.time + "<br/>" + "Location: " + Location_label[cell.location - 1] + "<br/>" + "Report Quantity: " + cell.report[cell.type] + "<br/>" + "Average Damage Level: " + cell.data.toFixed(2) + "<br/>" + "Damage Type: " + rowLabelData[cell.type] + "<br/>" + '</div>');
            tooltip.style("visibility", "visible");
        })
        .on('mouseout', function (cell) {
            // d3.select(this).classed("hover", false);
            tooltip.style("visibility", "hidden");
        })
        .on("mousemove", function (cell) {
            tooltip.style("top", (d3.event.pageY - 800) + "px").style("left", (d3.event.pageX - 65) + "px");
        });
    var legend = svg_heatmap.append("g")
        .attr("class", "legend")
        .attr("transform",
            "translate(100,-100)")
        .selectAll(".legendElement")
        .data([-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        .enter().append("g")
        .attr("class", "legendElement");

    var legendElementWidth = 20;

    legend.append("svg:rect")
        .attr("x", function (d, i) {
            return legendElementWidth * i;
        })
        .attr("y", 115)
        .attr("class", "cellLegend bordered")
        .attr("width", legendElementWidth)
        .attr("height", legendElementWidth / 4)
        .style("fill", function (d, i) {
            return colors[i];

        });

    legend.append("text")
        .attr("class", "mono legendElement")
        .attr("font-size", "8px")
        .text(function (d) {
            return "≥" + Math.round(d * 100) / 100;
        })
        .attr("x", function (d, i) {
            return legendElementWidth * i;
        })
        .attr("y", 130);

    var y = d3.scaleLinear().range([cellSize_scale * 190, 0]).domain([19, 0]);


    // Add the y Axis
    svg_heatmap.append("g").attr("class", "y_axis")
        .attr("transform", (song, i) => `translate(${100},${(50) + i * cellSize_scale * 10})`)
        .call(d3.axisLeft(y).ticks(19).tickFormat(function (d) {
            return Location_label[d];
        }));
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
            return i * ((cellSize + 2) / 2);
        })
        .style("text-anchor", "middle")
        .style("font-size", "2px")
        .attr("transform", function (rowLabel) {
            return `translate(-20, ${4})`;
        })
        .attr("class", "rowLabel mono")
        .attr("id", function (rowLabel, i) {
            return "rowLabel_" + i;
        })
        .on('mouseover', function (d, i) {
            d3.select(this).style("font-size", "10px").classed("hover", true);
        })
        .on('mouseout', function (d, i) {
            d3.select(this).style("font-size", "2px").classed("hover", false);
        });
    cell_size_global = cellSize_scale;

    svg_heatmap.selectAll("rect").style("visibility", function (d) {
        if (d.data < 0) {
            return "hidden";
        } else {
            return "visible";
        }
    })
}

function initialize(i) {

    for ( var id=1; id < 20; id++) {
        d3.select("#geo" + i + id).style("fill-opacity", GEO_OPACITY_HOVER);
        // d3.select("#svg" + id).transition().duration(1000).style("display", null);

}
}

function showdatabyfeature() {
    maing.selectAll("text").remove();
    svg_heatmap.select(".y_axis").remove();
    var a = [0, 1, 2, 3, 4, 5]
    svg_heatmap.transition().duration(3000).selectAll(".cell")
        .attr("y",
            function (d) {
                if (a.includes(d.type)) {

                    return d.type * cell_size_global * 32 - ((d.location - 1) * cell_size_global * 9);
                }
            });
    var label = ["Shake_intensity", "Medical", "Buildings", "Power", "Roads&Bridges", "Sewer&Water"]
    var y = d3.scaleLinear().range([cell_size_global * 190, 0]).domain([6, 0]);
    // Add the y Axis
    svg_heatmap.append("g").attr("class", "label_axis")
        .attr("transform", (song, i) => `translate(${100},${(50) + i * cell_size_global * 10})`)
        .call(d3.axisLeft(y).ticks(6).tickFormat(function (d) {
            return label[d];
        }));

}

function showdatabylocation() {
    svg_heatmap.select(".y_axis").remove();
    svg_heatmap.select(".label_axis").remove();
    maing.selectAll("text").remove()
    var Location_label = ['Palace Hills', 'Northwest', 'Old Town', 'Safe Town', 'Southwest', 'Downtown', 'Wilson Forest', 'Scenic Vista', 'BroadView', 'Chapparal', 'Terrapin Springs', 'Pepper Mill', 'Cheddar Ford', 'Easton', 'Weston', 'Southton', 'Oak Willow', 'East Parton', 'West Parton']
    var y = d3.scaleLinear().range([cell_size_global * 190, 0]).domain([19, 0]);
    // Add the y Axis
    svg_heatmap.append("g").attr("class", "y_axis")
        .attr("transform", (song, i) => `translate(${100},${(50) + i * cell_size_global * 10})`)
        .call(d3.axisLeft(y).ticks(19).tickFormat(function (d) {
            return Location_label[d];
        }));
    // var cellSize = 10;
    rowss.transition().duration(3000).selectAll(".cell").attr("x", 0)
        .attr("y", function (cell, i) {
            return i * (cell_size_global + 4) / 2;
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
            return i * ((cell_size_global + 4) / 2);
        })
        .style("text-anchor", "middle")
        .style("font-size", "2px")
        .attr("transform", function (rowLabel) {
            return `translate(-20, ${4})`;
        })
        .attr("class", "rowLabel mono")
        .attr("id", function (rowLabel, i) {
            return "rowLabel_" + i;
        })
        .on('mouseover', function (d, i) {
            d3.select(this).style("font-size", "10px").classed("hover", true);
        })
        .on('mouseout', function (d, i) {
            d3.select(this).style("font-size", "2px").classed("hover", false);
        });
}

function plot_report_linegraph(report, data) {

    var svg = d3.select("#report_line")
            .append("svg")
            .attr("width", 1900)
            .attr("height", 200)
            .attr("class", "reportline")
            .attr("transform", 'translate(110,-20)'),
        margin = {top: 10, right: 20, bottom: 40, left: 40},
        margin2 = {top: 165, right: 20, bottom: 20, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        height2 = +svg.attr("height") - margin2.top - margin2.bottom;


    var clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

    //Build the xAsis
    var xAxisG = svg.append("g").attr("class", "focus").attr("transform", `translate(${margin.left}, ${margin.top + height})`);
    xScale = d3.scaleTime().domain(d3.extent(data, function (d) {
        return d.values[0].time_minute;
    })).range([0, width]);
    const x2Scale = d3.scaleTime().domain(d3.extent(data, function (d) {
        return d.values[0].time_minute;
    })).range([0, width]);
    const xAxis = d3.axisBottom(xScale);
    const xAxis2 = d3.axisBottom(x2Scale);
    xAxisG.call(xAxis)


    const yAxisG = svg.append('g').attr("transform", `translate(${margin.left}, ${margin.top})`);
    const yScale = d3.scaleLinear().domain([0, math.max(report)]).range([height, 0]);
    const y2Scale = d3.scaleLinear().domain([0, math.max(report)]).range([height2, 0]);
    const yAxis = d3.axisLeft(yScale);
    yAxisG.call(yAxis);
    var brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on("brush end", brushed);

    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    const area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) {
            return xScale(d.values[0].time_minute)
        })
        .y0(height)
        .y1(d => yScale(d.values.length));

    const area2 = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) {
            return x2Scale(d.values[0].time_minute)
        })
        .y0(height2)
        .y1(d => y2Scale(d.values.length));

    const graph = svg.append("g").attr("clip-path", "url(#clip)").attr("transform", `translate(${margin.left}, ${margin.top})`);
    graph.append("path").datum(data).attr("class", "area").attr("d", area);

    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", `translate(${margin2.left}, ${margin2.top})`)


    context.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area2);

    context.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    context.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, xScale.range());

    svg.append("rect")
        .attr("class", "zoom")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .call(zoom);

    function brushed() {
        console.log("to1")
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || x2Scale.range();
        xScale.domain(s.map(x2Scale.invert, x2Scale));
        graph.select(".area").attr("d", area);
        xAxisG.call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
        console.log("to2")
    }

    function zoomed() {
        console.log("to3")
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        xScale.domain(t.rescaleX(x2Scale).domain());
        graph.select(".area").attr("d", area);
        xAxisG.call(xAxis);
        context.select(".brush").call(brush.move, xScale.range().map(t.invertX, t));
        var s = xScale.range().map(t.invertX, t)
        timerangedata = s.map(x2Scale.invert)
        filterGeoTimeRange(timerangedata)
        console.log("to4")
        // console.log(timerangedata)
    }

}
