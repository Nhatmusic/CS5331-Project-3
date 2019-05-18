// console.log('1111111111');

// Info to show visualization
var parallelWidth = 850, parallelHeight = 400,
    parallelMargin = {top: 30, right: 20, bottom: 30, left: 50},
    parallelContentWidth = parallelWidth - parallelMargin.left - parallelMargin.right,
    parallelContentHeight = parallelHeight - parallelMargin.top - parallelMargin.bottom;

var parallelSvg = d3.select("#chart-area").append("svg").attr("width", parallelWidth + 200).attr("height", parallelHeight+100),
    g = parallelSvg.append("g").attr("transform", "translate(" + parallelMargin.left + "," + 100 + ")"),
    titleGroup = parallelSvg.append("g").attr("transform", "translate(" + (parallelContentHeight - 15) + "," + (parallelMargin.top + 50) + ")");

// x, y, and color Scale
var xScale = d3.scalePoint().range([0, parallelContentWidth]),
    yScale = {},
    // color = d3.scaleOrdinal().range(d3.schemeCategory20);
//hardcode the color of location to match with map's color.
    color = ['#0000', '#f4429e', '#ad42f4', '#f4f142', '#ce42f4', '#f4aa42', '#42e2f4', '#42f489', '#f4f442', '#ce42f4', '#42f1f4', '#f4c542', '#f47742', '#42c5f4', '#42f4f4', '#4274f4', '#42f47d', '#eef442', '#f4c542', '#f48042'];

// axises definition
var xAxis = d3.axisBottom(xScale),
    yAxis = d3.axisLeft(yScale).ticks(5);


// Axis Group
var xAxisGroup;

// Define parallelLine
var parallelLine = d3.line(d3.curveBasis),
    //Background and foreground parallelLine
    foreground;

//drag object
var dragging = {};

function colorByTop20Categories(category) {
    var temp = topCategories20.map(d => d.location).slice(0, 19);
    if (temp.includes(category))
        return color[category];
    return "#000000";
}

function drawParallelSlider() {
    var timeRange = d3.extent(dataset, d => {
        return d.time
    });
    var dataTime = d3.range(timeRange[0], timeRange[1] + 1).map(d => {
        // console.log(d);
        return d;
    });


    sliderTime = d3.sliderBottom()
        .min(timeRange[0])
        .max(timeRange[1])
        .step(1)
        .width(150)
        .tickFormat(d3.format(".0f"))
        .tickValues(dataTime)
        .default(dataTime[0])
        .on('onchange', val => {
            d3.select('p#value-time').text((val));

            legendisClicked = false; //set legend off-click
            
            graphByTimeSpan(dataset, sliderTime.value());
            filterGeoTimeSpan(sliderTime.value());
        });

    var gTime = d3
        .select('#slider-time')
        .append('svg')
        .attr("id", "slider")
        .attr('width', 200)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gTime.call(sliderTime);

    d3.select('p#value-time').text((sliderTime.value()));
}

function resetAll() {
    d3.select("svg#slider").remove();
    drawParallelSlider();
    graphByTimeSpan(dataset, sliderTime.value());
    filterGeoTimeSpan(sliderTime.value());
    addCheckBoxes(categories);
    document.getElementById("slider").style.display = "block";
    document.getElementById("categoryContainer").style.display = "none";
}

function chooseOption() {
    var timeSpanChart = document.getElementById("slider"),
        categoryChart = document.getElementById("categoryContainer"),
        timeSpanChoice = document.getElementById("timeSpan"),
        categoryChoice = document.getElementById("category")

    if (timeSpanChoice.checked) {
        timeSpanChart.style.display = "block";
        categoryChart.style.display = "none";
        graphByTimeSpan(dataset, sliderTime.value());
        filterGeoTimeSpan(sliderTime.value());
    }

    if (categoryChoice.checked) {
        // Add check boxes of categories
        addCheckBoxes(categories);
        graphByCategory();
        timeSpanChart.style.display = "none";
        categoryChart.style.display = "block";

    }
}

function graphByCategory() {
    var selectedSongs = [];
    categories.forEach(d => {
        var genChecked = document.getElementById(d);


        if (genChecked.checked && !selectedCategories.includes(d))
            selectedCategories.push(d);
        else if (!genChecked.checked && selectedCategories.includes(d))
            selectedCategories.splice(selectedCategories.indexOf(d), 1);
    });
    selectedCategories.forEach(gen => {
        dataset.forEach(song => {
            if (song.location === gen)
                selectedSongs.push(song);

        })
    });
    drawGraph(selectedSongs, 0, selectedCategories);
    // Draw_Scatterplot(selectedSongs);
    // console.log(selectedCategories);
}

function addCheckBoxes(array) {
    // console.log(array);
    var categoryContainer = document.getElementById("categoryContainer");
    array.forEach((d, i) => {
        //Add if checkbox not show
        if (document.getElementById(d) == null) {
            let checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.name = d;
            checkbox.value = d;
            checkbox.id = d;
            checkbox.onclick = graphByCategory;

            var label = document.createElement('label')
            label.htmlFor = d;
            label.appendChild(document.createTextNode(d));

            categoryContainer.appendChild(checkbox);
            categoryContainer.appendChild(label);
            categoryContainer.appendChild(document.createElement("br"));
        }

        // Set default check box
        let checkbox = document.getElementById(d);
        if (i === 0) checkbox.checked = true;
        else checkbox.checked = false;
    })
}

function updateParallelByTime(timeRange) {
    let selectedData;
    selectedData = dataset.filter(function(d) {
        return timeRange[0] <= d.time && d.time <= timeRange[1];
    });
    drawGraph(selectedData, null, locationList);
}

function graphByTimeSpan(data, timeSpan) {
    var selectedSongs = [];
    data.forEach(d => {
        if (d.time == timeSpan)
            selectedSongs.push(d);
    });
    drawGraph(selectedSongs, timeSpan, null);
    // Draw_Scatterplot(selectedSongs);
}

const maxForegroundOpacity = "1";
const minForegroundOpacity = "0.2";


// Draw graph from songs data, and timeSpan (0: draw all timeSpans, else: draw by timeSpan)
function drawGraph(songs, timeSpan, selectedCategories) {
    // console.log(timeSpan+ ": "+songs.length);
    d3.selectAll(".foreground").remove();
    d3.selectAll(".dimension").remove();
    // Make yScale for each dimension
    features.forEach((d) => {

        // Add Scale for each axis
        if (d == "location") {
            if (timeSpan == 0)
                yScale[d] = d3.scalePoint().range([parallelContentHeight, 0]).domain(selectedCategories);
            else if (selectedCategories)
                yScale[d] = d3.scalePoint().range([parallelContentHeight, 0]).domain(selectedCategories);
            else
                yScale[d] = d3.scalePoint().range([parallelContentHeight, 0]).domain(categoriesByTimeSpan[timeSpan]);
        } else
            yScale[d] = d3.scaleLinear().range([parallelContentHeight, 0]).domain([-1, 10]);
    });

    // Add blue foreground lines for focus.
    foreground = g.append("g")
        .attr("class", "foreground")
        .style("opacity", maxForegroundOpacity)
        .selectAll("path")
        .data(songs)
        .enter()
        .append("path")
        .attr("id", d => {
            return "path" + d.reportID;
        })
        .attr("d", path)
        .attr("stroke", d => {
            return colorByTop20Categories(d.location);
        })
        .attr("data-legend", function (d) {
            return d.location
        })
        .on("mouseover", d => {
            MouseOverLines(d);
            // MouseOverCircles(d);
            // MouseOvertooltip(d);
        })
        .on("mouseout", d => {
            MouseOutLines(d);
            // MouseOutCircles(d);
        });
    foreground.style("opacity", minForegroundOpacity);

    // Add a groupGeo element for each dimension.
    xAxisGroup = g.selectAll(".dimension")
        .data(features)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", d => {
            return "translate(" + xScale(d) + ")";
        })
        .call(d3.drag()
            .subject(function (d) {
                return {x: xScale(d)};
            })
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Add an axis and title.
    xAxisGroup.append("g")
        .attr("class", "axises")
        .each(function (d) {
            // Call y-axises
            if (d == "location")
                d3.select(this).call(d3.axisRight(yScale[d]));
            else
                d3.select(this).call(d3.axisLeft(yScale[d]).ticks(5));
        })
        .append("text")
        .style("text-anchor", "middle")
        .style("fill", "black")
        .attr("y", parallelContentHeight + 15)
        .text(function (d) {
            if (d == "duration")
                return d + "(s)";
            if (d == "tempo")
                return d + "(bpm)";
            return d;
        });

    // Add and store a brush for each axis.
    xAxisGroup.append("g")
        .attr("class", "brush")
        .each(function (d) {
            if (d != "location") {
                d3.select(this).call(yScale[d].brush = d3.brushY()
                    .extent([[-10, 0], [10, parallelContentHeight]])
                    .on("brush", brush)
                    .on("end", brush)
                );
            }
        });
}

function MouseOverLines(d) {
    d3.select("#path" + d.reportID)
        .style("stroke-width", "4px")
        .style("opacity", maxForegroundOpacity);

    // Show title - category (TimeSpan)
    titleGroup.append("text")
        .style("font-weight", "bold")
        .style("font", "12px sans-serif")
        .attr("y", -5)
        .attr("class", "title")
        .text("Location: " + d.location + "---" + "Time: " + " (" + d.time + ")");

    // Show rect before title
    titleGroup.append("rect")
        .attr("class", "title")
        .attr("x", -17)
        .attr("y", -15)
        .attr("width", 10).attr("height", 10)
        .style("fill", function () {
            return colorByTop20Categories(d.location)
        });

    //Show song info to the graph
    xAxisGroup.append("text").attr("class", "title")
        .style("text-anchor", "middle")
        .style("font", "12px sans-serif")
        .attr("y", -5)
        .text(feature => {
            if (feature != "location")
                return d[feature].toFixed(2);
        });
}

function MouseOutLines(d) {
    d3.select("#path" + d.reportID)
        .style("stroke-width", "1px")
        .style("opacity", minForegroundOpacity);
    d3.selectAll(".title").remove();
}

function path(d) {
    return parallelLine(features.map(function (p) {
        return [position(p), yScale[p](d[p])];
    }));
}

function position(d) {
    var v = dragging[d];
    return v == null ? xScale(d) : v;
}

function dragstarted(d) {
    dragging[d] = xScale(d);
    foreground.style("opacity", minForegroundOpacity / 2);
}

function dragged(d) {
    dragging[d] = Math.min(parallelWidth, Math.max(0, d3.event.x));
    foreground.attr("d", path);

    features.sort(function (a, b) {
        return position(a) - position(b);
    });
    xScale.domain(features);
    xAxisGroup.attr("transform", function (da) {
        // console.log((da));
        return "translate(" + position(da) + ")";
    })
}


function transition(g) {
    return g.transition().duration(500);
}

function dragended(d) {
    delete dragging[d];
    d3.select(this).attr("transform", "translate(" + xScale(d) + ")");
    transition(foreground).attr("d", path);

    foreground.style("opacity", minForegroundOpacity);

}

// Handles a brush event, toggling the display of foreground lines.
function brush() {

    var actives = [];
    parallelSvg.selectAll(".brush")
        .filter(function (d) {
            // console.log(d3.brushSelection(this));
            yScale[d].brushSelectionValue = d3.brushSelection(this);
            return d3.brushSelection(this);
        })
        .each(function (d) {
            // Get extents of brush along each active selection axis (the Y axes)
            actives.push({
                feature: d,
                extent: d3.brushSelection(this).map(yScale[d].invert)
            });
        });

    var selected = [];
    foreground.style("display", function (d) {
        if (actives.every(function (active) {
            let result = active.extent[1] <= d[active.feature] && d[active.feature] <= active.extent[0];
            return result;
        })) {
            selected.push(d);
            return null;
        } else return "none";
    });

    // Link to scatterPlot in brushing
    if (d3.brushSelection(this) == null) {     // If not brushing, update Scatter plot
        if (!selected.length) {
            var selectedSongs = [];
            var timeSpan = sliderTime.value();
            dataset.forEach(d => {
                if (d.time == timeSpan)
                    selected.push(d);
            });
        }
    }

}

