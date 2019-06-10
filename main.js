var dataset = [];
var topCategoriesAll = [];
var topCategories20 = [];

let features = [];
var selectedCategories = [];
var categories = [];
var categoriesByTimeSpan = {};

var geojsonData = [];

//Time Format and Parsing
//format of data: 2020-04-09 12:30:00
const parseTimeGeo = d3.timeParse("%Y-%m-%d %H:%M:%S");
const formatDayAndHour = d3.timeFormat("%m/%d/%Y %H");
const observeTime = d3.timeParse("%m/%d/%Y %H");
//Time Format and Parsing
// const parseTime = d3.timeParse("%m/%d/%Y %H:%M");
// const formatTimeDay = d3.timeFormat("%d");

d3.csv("./Dataset/data-optimized.csv", function (err, rows) {
    // console.log(rows);

    dataset = rows;
    dataset.columns = rows.columns;

    rows.forEach(row => {
        // console.log(row.time);
        row.time_geo = (parseTimeGeo(row.time));
        // console.log(row.time);
    });

    // get features that used for mutlti-dimension coordinates
    features = dataset.columns.filter(function (element) {
        return (element !== "location" &&
            element !== "time");
    });

    var time_step_origin = [];
    //nest data by time and sort data
    dataByTime = d3.nest().key(d => d.time_geo).entries(rows);
    dataByTime.sort((a, b) => new Date(a.key) - new Date(b.key));
    var report_number = [];
    var timestep = [];
    dataByTime.forEach(d => report_number.push(d.values.length));
    dataByTime.forEach((d, i) => {
        timestep.push(d.key);
        time_step_origin.push(d.values[0].time);
    })
  //draw area graph of report number
    plot_line_v4(report_number, dataByTime)

    var dataByLocation = d3.nest().key(d => d.location).entries(rows);
    // console.log(dataByLocation);

    // Draw Slider
    var timeRange = d3.extent(rows, d => {
        return new Date(d.time_geo)
    });


//set up heatmap

    //get data of each location by time and sort
    dataByTime_Heatmap = d3.nest().key(d => d.location).key(d => d.time_geo).entries(rows);
    dataByTime_Heatmap.sort((a,b)=>(a.key)-(b.key))
    dataByTime_Heatmap.forEach(d => d.values.sort((a, b) => new Date(a.key) - new Date(b.key)));
    dataByTime_Heatmap.forEach(d => d.values.forEach(d => d.time_step = timestep.indexOf(d.key)));
    var array_data3 = [];
    dataByTime_Heatmap.forEach(d => {
        var array_data2 = [];
        d.values.forEach(d1 => {
            var array_data1 = [];
            d1.values.forEach(d2 => {

                array_data1.push([+d2.shake_intensity, +d2.medical, +d2.buildings, +d2.power, +d2.roads_and_bridges, +d2.sewer_and_water])
            })
            array_data2.push({
                "value": array_data1,
                "step": d1.time_step,
                "noreport": d1.values.length,
                "location": d.key,
            })
            // store_reportnum.push(d1.values.length)
        })
        array_data3.push(array_data2)
    });


    //scale the number of report to [0,1];
    report_scale = d3.scaleLinear().domain([math.min(report_number), math.max(report_number)]).range([0, 1]);
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
            array_data_mean3.push({
                "data": array_data_mean2,
                "step": d1.step,
                "noreport": d1.noreport,
                "location": parseInt(d1.location),
                "time": parseTimeGeo(time_step_origin[d1.step]),
                "time_origin": time_step_origin[d1.step]
            })
        })

        array_data_mean4.push(array_data_mean3)


    });

    var cellSize = 3;
    var viewerWidth = 2200,
        viewerHeight = 3000;

    svg_heatmap = d3.select("#heatmap").append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
        .attr("transform", 'translate(0,0)');


    colors = ["#d3d3d3","#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"];
    //create color scale to display the feature
    colorScale = d3.scaleQuantize()
        .domain([-1, 10])
        .range(colors);
    rowLabelData = ["shake_intensity", "medical", "buidings", "power", "roads_bridges", "sewer_water"]

    Update_heatmap(array_data_mean4, cellSize)


    d3.json("./Dataset/StHimark.geojson", function (err, geojson) {
        // geojsonData = geojson;
        // drawMap(geojson.features, 0);
        for (var j = 0; j < 6; j++) {
            analyzeDataByLocation(dataByLocation, j);
            drawMap(geojson.features, j)
            initialize(j);
        }
        console.log(geojson)
    });
    // drawGeoSlider(timeRange);

    // draw_heatmap(rows,report_number,timestep,time_step_origin)


});

function updatebyminute() {
    svg_heatmap.selectAll("g").remove();
    Update_heatmap(array_data_mean4,10)

}

function updatebyhour() {
    svg_heatmap.selectAll("g").remove();
    var cellSize = 10;
    dataset.forEach(row => {
        row.time_heatmap = observeTime(formatDayAndHour(parseTimeGeo(row.time)));
    });
    var timestep = [];
    //get data of each location by time and sort
    var dataByTime_Heatmap = d3.nest().key(d => d.location).key(d => d.time_heatmap).entries(dataset);
    dataByTime_Heatmap.sort((a,b)=>(a.key)-(b.key));
    dataByTime_Heatmap.forEach(d => d.values.sort((a, b) => new Date(a.key) - new Date(b.key)));
    dataByTime_Heatmap[1].values.forEach(d => timestep.push(d.key))
    dataByTime_Heatmap.forEach(d => d.values.forEach(d => d.time_step = timestep.indexOf(d.key)));
    var array_data3 = [];
    dataByTime_Heatmap.forEach(d => {
        var array_data2 = [];
        d.values.forEach(d1 => {
            var array_data1 = [];
            d1.values.forEach(d2 => {
                array_data1.push([+d2.shake_intensity, +d2.medical, +d2.buildings, +d2.power, +d2.roads_and_bridges, +d2.sewer_and_water])
            })
            array_data2.push({
                "value": array_data1,
                "step": d1.time_step,
                "noreport": d1.values.length,
                "location": d.key,
            })
            // store_reportnum.push(d1.values.length)
        })
        array_data3.push(array_data2)
    });

    var array_data_mean = [];
    array_data_mean_hour = [];

    array_data3.forEach(d => {
        var array_data_mean3 = [];
        d.forEach(d1 => {

            array_data_mean = _.unzip(d1.value);
            var array_data_mean2 = [];
            array_data_mean.forEach(d2 =>
                array_data_mean2.push(math.mean(d2))
            )
            array_data_mean3.push({
                "data": array_data_mean2,
                "step": d1.step,
                "noreport": d1.noreport,
                "location": parseInt(d1.location),
                "time_origin": timestep[d1.step]
            })
        })
        array_data_mean_hour.push(array_data_mean3)

    });
    Update_heatmap(array_data_mean_hour, cellSize)

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
    console.log(max_timestep)
    //find minimum time step
    var timestep = []
    timestep = d3.min(data.flat(), d => d.step)
    cellSize = 1840/ (max_timestep - timestep);
    if ((max_timestep - timestep) <= 121) {
        var cellSize_scale = cellSize/2
    }
    else  if ((max_timestep - timestep) < 60) {
        cellSize_scale = cellSize/8
    }
    else  if ((max_timestep - timestep) < 45) {
        cellSize_scale = cellSize/32
    }

    else  if ((max_timestep - timestep) < 30) {
        cellSize_scale = cellSize/120
    }

    else  if ((max_timestep - timestep) < 15) {
        cellSize_scale = cellSize/240
    }
    else
        {
        cellSize_scale = cellSize;
    }
    maing = svg_heatmap.selectAll('g').data(data).enter()
        .append("g")
        .attr("transform", (song, i) => `translate(${150},${(50)+i*cellSize_scale * 10})`)
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
            return report_scale(d.report);
        })
        .attr("stroke", "black")

        .on('mouseover', function (cell) {
            tooltip.html('<div class="heatmap_tooltip">' + "Time: " + cell.time + "<br/>" + "Location: " + cell.location + "<br/>" + "Report Quantity: " + cell.report + "<br/>" + "Average Damage Level: " + cell.data.toFixed(2) + "<br/>" + '</div>');
            tooltip.style("visibility", "visible");
        })
        .on('mouseout', function (cell) {
            // d3.select(this).classed("hover", false);
            tooltip.style("visibility", "hidden");
        })
        .on("mousemove", function (cell) {
            tooltip.style("top", (d3.event.pageY - 750) + "px").style("left", (d3.event.pageX - 65) + "px");
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

    var Location_label = ['Palace Hills', 'Northwest', 'Old Town', 'Safe Town', 'Southwest', 'Downtown', 'Wilson Forest', 'Scenic Vista', 'BroadView', 'Chapparal', 'Terrapin Springs', 'Pepper Mill', 'Cheddar Ford', 'Easton', 'Weston', 'Southton', 'Oak Willow', 'East Parton', 'West Parton']
    var y = d3.scaleLinear().range([cellSize_scale*190, 0]).domain([19, 0]);


    // Add the y Axis
    svg_heatmap.append("g").attr("class", "y_axis")
        .attr("transform", (song, i) => `translate(${100},${(50)+i*cellSize_scale * 10})`)
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
    cell_size_global =cellSize_scale;
}

function initialize(i) {

    checkedNeighborhood.forEach(id => {
        d3.select("#geo" + i + id).style("fill-opacity", GEO_OPACITY_HOVER);
        d3.select("#svg" + id).transition().duration(1000).style("display", null);
    })

}

function showdatabyfeature() {
    maing.selectAll("text").remove();
    svg_heatmap.select(".y_axis").remove();
    var a = [0, 1, 2, 3, 4, 5]
    svg_heatmap.transition().duration(3000).selectAll(".cell")
        .attr("y",
            function (d) {
                if (a.includes(d.type)) {

                    return d.type * cell_size_global*32 - ((d.location - 1) * cell_size_global*9);
                }
            });
    var label = ["Shake_intensity", "Medical", "Buildings", "Power", "Roads&Bridges", "Sewer&Water"]
    var y = d3.scaleLinear().range([cell_size_global*190, 0]).domain([6, 0]);
    // Add the y Axis
    svg_heatmap.append("g").attr("class", "label_axis")
        .attr("transform", (song, i) => `translate(${100},${(50)+i*cell_size_global * 10})`)
        .call(d3.axisLeft(y).ticks(6).tickFormat(function (d) {
            return label[d];
        }));

}

function showdatabylocation() {
    svg_heatmap.select(".y_axis").remove();
    svg_heatmap.select(".label_axis").remove();
    maing.selectAll("text").remove()
    var Location_label = ['Palace Hills', 'Northwest', 'Old Town', 'Safe Town', 'Southwest', 'Downtown', 'Wilson Forest', 'Scenic Vista', 'BroadView', 'Chapparal', 'Terrapin Springs', 'Pepper Mill', 'Cheddar Ford', 'Easton', 'Weston', 'Southton', 'Oak Willow', 'East Parton', 'West Parton']
    var y = d3.scaleLinear().range([cell_size_global*190, 0]).domain([19, 0]);
    // Add the y Axis
    svg_heatmap.append("g").attr("class", "y_axis")
        .attr("transform", (song, i) => `translate(${100},${(50)+i*cell_size_global * 10})`)
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
            return i * ((cell_size_global+4) / 2);
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

// function showdatabyreport(data){
//
//
//     maing_report = svg_heatmap.selectAll('.reportheatmap').data(data).enter()
//         .append("g")
//         .attr("transform", (song, i) => `translate(${150},${((i+4)*cell_size_global * 10)})`)
//         .attr("class", 'reportheatmap')
//         .attr("id", function (d, i) {
//             return "report" + i
//         })
//
//     // var clip_heat = maing_report.append("defs").append("svg:clipPath")
//     //     .attr("id", "clip_heat")
//     //     .append("svg:rect")
//     //     .attr("width", +svg_heatmap.attr("width"))
//     //     .attr("height", 10*cell_size_global)
//     //     .attr("x", 0)
//     //     .attr("y", 0);
//
//     yScale_report = d3.scaleLinear().domain([0, 4485]).range([cell_size_global * 5, 0]);
//     // // //Build tooltip
//     // let div = d3.select("#report_line").append("div").attr("opacity", 0);
//
//     //Build the xAsis
//     var xAxisG = maing_report.append("g").attr("class", "focus").attr("transform", `translate(${0}, ${8*cell_size_global})`);
//     // const xScale = d3.scaleTime().domain(d3.extent(selectedHeatmap_data.flat(), function (d) {
//     //     return d.time;
//     // })).range([0, 1840]);
//
//     const xAxis = d3.axisBottom(xScale);
//
//     xAxisG.call(xAxis.ticks(0))
//
//
//     const area = d3.area()
//         .curve(d3.curveMonotoneX)
//         .x(function (d) {
//             return xScale(d.time)
//         })
//         .y0(5*cell_size_global)
//         .y1(d => yScale_report(d.noreport));
//
//     graph_heat = maing_report.append("g").attr("clip-path", "url(#clip)").attr("transform", `translate(${0}, ${3*cell_size_global})`);
//     graph_heat.append("path").datum(data=>data).attr("class", "area_heat").attr("d", area);
//
// }

function plot_line_v4(report, data) {

    var svg = d3.select("#report_line")
            .append("svg")
            .attr("width", 1900)
            .attr("height", 200)
            .attr("class","reportline")
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

    // // //Build tooltip
    // let div = d3.select("#report_line").append("div").attr("opacity", 0);

    //Build the xAsis
    var xAxisG = svg.append("g").attr("class", "focus").attr("transform", `translate(${margin.left }, ${margin.top + height})`);
    xScale = d3.scaleTime().domain(d3.extent(data, function (d) {
        return d.values[0].time_geo;
    })).range([0, width]);
    const x2Scale = d3.scaleTime().domain(d3.extent(data, function (d) {
        return d.values[0].time_geo;
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
    // .on("end", zoomend);


    const area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) {
            return xScale(d.values[0].time_geo)
        })
        .y0(height)
        .y1(d => yScale(d.values.length));
    // const lineGen = d3.line().x(function (d) {
    //     return xScale(d.values[0].time_geo)
    // })
    //     .y(d => yScale(d.values.length));

    const area2 = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) {
            return x2Scale(d.values[0].time_geo)
        })
        .y0(height2)
        .y1(d => y2Scale(d.values.length));
    // const lineGen2 = d3.line().x(function (d) {
    //     return x2Scale(d.values[0].time_geo)
    // })
    //     .y(d => y2Scale(d.values.length));

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
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || x2Scale.range();
        xScale.domain(s.map(x2Scale.invert, x2Scale));
        graph.select(".area").attr("d", area);
        xAxisG.call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));

    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        xScale.domain(t.rescaleX(x2Scale).domain());
        graph.select(".area").attr("d", area);
        xAxisG.call(xAxis);
        context.select(".brush").call(brush.move, xScale.range().map(t.invertX, t));
        var s = xScale.range().map(t.invertX, t)
        timerangedata = s.map(x2Scale.invert)
        filterGeoTimeRange(timerangedata)
        console.log(timerangedata)
    }

    // let circles = graph.selectAll("circle").data(data).enter().append("circle").call(createCircle);
    function createCircle(theCircle) {
        return theCircle.attr("cx", function (d, i) {
            return xScale(d.values[0].time_geo)
        })
            .attr("cy", d => yScale(d.values.length))
            .attr("r", 0.5)
            .style("fill", "black")
            .on("mouseover", function (d, i) {
                graph.style("display", null)
                div.style('left', d3.event.pageX + "px").style("top", (d3.event.pageY - 1000) + "px");
                div.style("opacity", 1);
                div.html("Report Quantity: " + d.values.length + "</br>" + "Time: " + d.values[0].time_geo + "</br>");
            })
            .on("mouseout", d => {
                graph.style("display", "none");
                div.transition().style("opacity", 0);
            });
    }

}
