// drawGeoSlider();
// Hospital list
var hospitals = [
    {name: 1,position: [-119.959400, 0.180960]},
    {name: 2,position: [-119.915900, 0.153120]},
    {name: 3,position: [-119.909520, 0.151090]},
    {name: 4,position: [-119.904300, 0.121800]},
    {name: 5,position: [-119.883420, 0.134560]},
    {name: 6,position: [-119.855580, 0.182990]},
    {name: 7,position: [-119.828610, 0.041470]},
    {name: 8,position: [-119.744800, 0.065250]}];
var nuclearPlant = [-119.784825,0.162679];

var neighborHood = [
    {name: "1 - PALACE HILLS",position: [-119.975400, 0.165560]},
    {name: "2 - NORTHWEST",position: [-119.930400, 0.183860]},
    {name: "3 - OLD TOWN",position: [-119.873400, 0.193060]},
    {name: "4 - SAFE TOWN",position: [-119.820400, 0.167060]},
    {name: "5 - SOUTH WEST",position: [-119.930400, 0.110060]},
    {name: "6 - DOWNTOWN",position: [-119.930400, 0.140060]},
    {name: "7 - WILSON FOREST",position: [-119.730400, 0.088060]},
    {name: "8 - SCENIC VISTA",position: [-119.780400, 0.032060]},
    {name: "9 - BROADVIEW’s",position: [-119.843400, 0.052060]},
    {name: "10 - CHAPPARAL’s",position: [-119.803400, 0.052060]},
    {name: "11 - TERRAPIN SPRINGS",position: [-119.770400, 0.073060]},
    {name: "12 - PEPPER MILL’s",position: [-119.765400, 0.103060]},
    {name: "13 - CHEDDARFORD’s",position: [-119.811400, 0.106060]},
    {name: "14 - EASTON",position: [-119.870800, 0.153120]},
    {name: "15 - WESTON",position: [-119.898520, 0.151090]},
    {name: "16 - SOUTHTON",position: [-119.900400, 0.119060]},
    {name: "17 - OAK WILLOW",position: [-119.853400, 0.083060]},
    {name: "18 - EAST PARTON",position: [-119.843400, 0.117060]},
    {name: "19 - WEST PARTON",position: [-119.876400, 0.106060]}];

var checkedNeighborhood = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19"];

const GEO_OPACITY_DEFAULT = 0.3;
const GEO_OPACITY_HOVER = 0.7;

const NORMAL_STROKE_WIDTH = 1;
const BIGER_STROKE_WIDTH = 3;

var geoWidth = 400;
var geoHeight = 200;

// var svgGeo = d3.select(".geospatial").append("svg").attr("width",geoWidth).attr("height",geoHeight);
// var groupGeo = svgGeo.append("g").attr("transform","translate(30,10)");
// var textLabel = g.append("text").attr("class","textLabel").attr("x",0).attr("y",0);

// color feature
// var color = d3.scaleOrdinal().range(d3.schemeCategory20);
var GeoColor = colorbrewer["YlOrRd"][9];
var colorScale = d3.scaleQuantize()
    .domain([0, 10])
    .range(GeoColor);
// var GeoColor = d3.scaleSequential(d3.interpolateYlOrRd).domain([0,10])

var projection = d3.geoMercator().center([-119.78,0.15]).scale(120000);
// var projection = d3.geoAlbers().center([-119,0]);
var geopath = d3.geoPath().projection(projection);
var averageLocationDamageObj;
var averageLocationDamage;
var locationList;
var featuresGeo;
var type_feature=['shake_intensity','sewer_and_water','power','roads_and_bridges','medical','buildings']
var geo_data=[];

// Format the data by location and analyze the damage for each location
function analyzeDataByLocation(data,feature_id) {

    // Clear the data each time this is called
    averageLocationDamageObj = {};
    averageLocationDamage = [];
    locationList = [];
    featuresGeo = [];

    // Get columns of data
    // featuresGeo = data.columns.slice(1,8);
    featuresGeo = dataset.columns.filter(d => d !== "time");

    // nest data by location
    // update boxplot


    console.log("before")

    // Calculate total/average damage for each location
    data.forEach(location=>{
        let featureDamage = [];
        location.values.forEach(d=>{
            featuresGeo.forEach((feature)=>{
                if(feature !== "location")
                    if (!featureDamage.hasOwnProperty(feature)) {
                        featureDamage[feature] = 0;
                    }
                    featureDamage[feature] += +d[feature];
            })
        });
// console.log(featureDamage)

        // console.log(dataByLocation)

        locationList.push(location.key);
        // averageLocationDamage.push({location: location.key,
        //     totalDamage: totalDamage,
        //     // nReports: location.values.length,
        //     // averagedamage: Math.round(totalDamage / location.values.length),
        //     // sewer_and_water: (featureDamage["sewer_and_water"] / location.values.length).toFixed(1),
        //     // power: (featureDamage["power"] / location.values.length).toFixed(1),
        //     // roads_and_bridges: (featureDamage["roads_and_bridges"] / location.values.length).toFixed(1),
        //     // medical: (featureDamage["medical"] / location.values.length).toFixed(1),
        //     // buildings: (featureDamage["buildings"] / location.values.length).toFixed(1),
        //     averagedamage: (featureDamage[type_feature[feature_id]] / location.values.length).toFixed(1)
        // });

        averageLocationDamageObj[location.key] = featureDamage[type_feature[feature_id]] / location.values.length;



    });
    console.log("after")
    // console.log(averageLocationDamageObj)
    // averageLocationDamage.sort((a,b)=>{return a.averagedamage - b.averagedamage});

    geo_data.push({averageLocationDamageObj: averageLocationDamageObj})
    // console.log(geo_data)
    // GeoColor.domain(d3.extent(averageLocationDamage, function(d) { return d.averagedamage; }));
}



function filterGeoTimeRange(timeRange) {

    var selectedGeoData = dataset.filter(function(d) {
        return timeRange[0] <= d.time_geo && d.time_geo <= timeRange[1];
    });

    selectedHeatmap_data=[];
    array_data_mean4.forEach(function(d) {
    return selectedHeatmap_data.push(d.filter(function(d1){ return timerangedata[0] <= d1.time && d1.time <= timerangedata[1];}))
})
    console.log("heatmapdata" + selectedHeatmap_data)
    svg_heatmap.selectAll("g").remove();
    Update_heatmap(selectedHeatmap_data,report_scale,colorScale,tooltip,legendElementWidth,colors)
    console.log(selectedGeoData)
    selectedGeoData=d3.nest().key(d=>d.location).entries(selectedGeoData)
    // selectedGeoData.columns = initialData.columns;
    geo_data=[];
    for (var i=0;i<6;i++) {
        analyzeDataByLocation(selectedGeoData,i);
        updateGeoFill(i);
    }
    // $("#heatmap").empty();
    // draw_heatmap(selected_heatmap_Data)
    // drawMap(geojsonData.features);
    // updateParallelByTime(timeRange);
}

// function filterGeoTimeSpan(timeSpan) {
//     selectedGeoData = initialData.filter(function(d) {
//         return +formatTimeDay(RoundTimeDay(d.time)) === timeSpan;
//     });
//     selectedGeoData.columns = initialData.columns;
//     geo_data=[];
//     for (var i=0;i<6;i++) {
//         analyzeDataByLocation(selectedGeoData, i);
//         updateGeoFill(i);
//     }
//
// }

function updateGeoFill(i){

        locationList.forEach(function (location) {
            d3.select("#geo" + i + location).attr("fill", function () {
                return colorScale(geo_data[i].averageLocationDamageObj[+location])
            })
        });

}


// Draw the geospatial diagram
function drawMap(geojsonFeatures,feature_id) {
    var svgGeo = d3.select(".geospatial"+feature_id).append("svg").attr("width",geoWidth).attr("height",geoHeight)
        .attr('viewBox',"0 0 700 600");
    var groupGeo = svgGeo.append("g").attr("transform","translate(30,10)");

    //Draw Map
    groupGeo.selectAll("path").data(geojsonFeatures)
        .enter()
        .append("path").attr("d", geopath)
        .attr("id",d=>"geo"+ feature_id + d.properties.Id)
        // .data(geojson)
        .attr("fill",d=>{return colorScale(geo_data[feature_id].averageLocationDamageObj[d.properties.Id.toString()])})
        .attr("fill-opacity",GEO_OPACITY_DEFAULT)
        .attr("stroke","#222")

    // Draw hospital
    groupGeo.selectAll("geoHospitals").data(hospitals)
        .enter()
        .append("circle")
        .attr("class","geoHospitals")
        .attr("cx",d=>projection(d.position)[0])
        .attr("cy",d=>projection(d.position)[1]);

    // Draw the nuclear plant
    groupGeo.append("circle")
        .attr("class","geoNuclear")
        .attr("cx",d=>projection(nuclearPlant)[0])
        .attr("cy",d=>projection(nuclearPlant)[1]);

    // Draw neighborhood text
    groupGeo.selectAll("neighborText").data(neighborHood)
        .enter()
        .append("text").attr("font-size","10px")
        .attr("id",d=>"locationText"+d.name)
        .attr("x",d=>projection(d.position)[0])
        .attr("y",d=>projection(d.position)[1])
        .attr("transform", d=>{
            if(d.name == "7 - WILSON FOREST")
                return "translate(230,990) rotate(-90)";
            else if(d.name == "10 - CHAPPARAL’s")
                return "translate(30,908) rotate(-90)";
            else if(d.name == "8 - SCENIC VISTA")
                return "translate(-150,255) rotate(-25)";
            return null;
        })
        .text(d=>d.name);

}

function plot_line_v4(report,data) {
        var svg = d3.select("#report_line")
                .append("svg")
                .attr("width", 1900)
                .attr("height", 200)
                .attr("transform", 'translate(50,-20)'),
            margin = {top: 10, right: 20, bottom: 35, left: 40},
            margin2 = {top: 165, right: 20, bottom: 15, left: 40},
            width = +svg.attr("width") - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom,
            height2 = +svg.attr("height") - margin2.top - margin2.bottom;
            // contentWidth = width - margin.left - margin.right,
            // contentHeight = height - margin.top - margin.bottom;

        var clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);
        // //Build tooltip
        let div = d3.select("#report_line").append("div").attr("opacity", 0);

        //Build the xAsis
        var xAxisG = svg.append("g").attr("class", "focus").attr("transform", `translate(${margin.left}, ${margin.top + height})`);
        const xScale = d3.scaleTime().domain(d3.extent(data, function(d) { return d.values[0].time_geo; })).range([0, width]);
        const x2Scale = d3.scaleTime().domain(d3.extent(data, function(d) { return d.values[0].time_geo; })).range([0, width]);
        const xAxis = d3.axisBottom(xScale);
        const xAxis2= d3.axisBottom(x2Scale);
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
        const lineGen = d3.line().x(function (d) {
            return xScale(d.values[0].time_geo)
        })
            .y(d => yScale(d.values.length));

    const area2 = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) {
        return x2Scale(d.values[0].time_geo)
    })
        .y0(height2)
        .y1(d => y2Scale(d.values.length));
    const lineGen2 = d3.line().x(function (d) {
        return x2Scale(d.values[0].time_geo)
    })
        .y(d => y2Scale(d.values.length));

    const graph = svg.append("g").attr("clip-path", "url(#clip)").attr("transform", `translate(${margin.left}, ${margin.top})`);
    graph.append("path").datum(data).attr("class", "area").attr("d",area);

    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");


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
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
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
        var s=xScale.range().map(t.invertX, t)
         timerangedata=s.map(x2Scale.invert)
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
                .on("mouseover", function (d,i){
                    graph.style("display",null)
                    div.style('left', d3.event.pageX + "px").style("top", (d3.event.pageY-1000) + "px");
                    div.style("opacity", 1);
                    div.html("Report Quantity: " + d.values.length + "</br>" +"Time: " + d.values[0].time_geo + "</br>");
                })
                .on("mouseout", d=>{
                    graph.style("display", "none");
                    div.transition().style("opacity", 0);
                });
        }

}

