d3.csv("./Dataset/mc1-reports-data.csv",function (err, rows) {
    // console.log(rows);

    rows.forEach(row => {
        row.time = observeTime(formatDayAndHour(parseTimeGeo(row.time)));
    });


    //get data by time and sorted time for each location
    dataByTime = d3.nest().key(d => d.location).key(d => d.time).entries(rows);
    dataByTime.forEach(d => d.values.sort((a, b) => new Date(a.key) - new Date(b.key)));
    var timestep = [];
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
            array_data2.push({"value": array_data1, "step": d1.time_step})
        })
        array_data3.push(array_data2)
    });

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
            array_data_mean3.push({"data": array_data_mean2, "step": d1.step})
        })
        array_data_mean4.push(array_data_mean3)


    });
    // color_value_data=[];
    // array_data_mean4.forEach(d=>
    //     d.forEach(d1=>color_value_data.push(d1.data))
    // )


    var classesNumber = 9,
        cellSize = 10,
        viewerWidth = 1200,
        viewerHeight = 4000,
        viewerPosTop = 200,
        viewerPosLeft = 50,
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
    var Scale_heatmap = d3.scaleLinear().range([0, 10]).domain([0,1]);

    // create svg for group of songs
    var maing = svg.selectAll('g').data(array_data_mean4).enter()
        .append("g")
        .attr("transform", (song, i) => `translate(${viewerPosLeft},${viewerPosTop + i * viewerHeight / 60})`)
        .attr("id", function (d, i) {
            return "song" + i
        })
    var j;
    var rows = maing.selectAll(".row")
        .data((rows=>rows))
            .enter().append("g")
        .attr("class", "row")
        .attr("transform", (row) => `translate(${row.step*(cellSize+4)/2},0)`)
        .attr("class", function (d,i){
            return "column"+d.step;
        });

    var heatmap = rows.selectAll(".cell")
        .data(row=>row.data
        )
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
            return colorScale((d))
        });

});