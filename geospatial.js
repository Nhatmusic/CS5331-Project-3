


// drawGeoSlider();

var width = 900;
var height = 600;

var svg1 = d3.select(".geospatial").append("svg").attr("width",width).attr("height",height);
var group = svg1.append("g").attr("transform","translate(30,10)");
// var textLabel = g.append("text").attr("class","textLabel").attr("x",0).attr("y",0);

// color feature
var color = d3.scaleOrdinal().range(d3.schemeCategory20);
var GeoColor = d3.scaleLinear().range(['#1a9850','#d73027']).interpolate(d3.interpolateHcl);

var projection = d3.geoMercator().center([-119.78,0.15]).scale(120000);
// var projection = d3.geoAlbers().center([-119,0]);
var geopath = d3.geoPath().projection(projection);

//Time Format and Parsing
//format of data: 2020-04-09 12:30:00
const parseTime1 = d3.timeParse("%Y-%m-%d %H:%M:%S");
const formatDayAndHour = d3.timeFormat("%m/%d/%Y %H");
const observeTime = d3.timeParse("%m/%d/%Y %H");



var averageLocationDamageObj = {};
var averageLocationDamage = [];
var locationList = [];
var features1 = [];
d3.csv("./Dataset/mc1-reports-data.csv",function (err, rows) {
    // console.log(rows);

    rows.forEach(row=>{
        row.time = observeTime(formatDayAndHour(parseTime1(row.time)));
        // console.log(row.time);
    });
    features1 = rows.columns.slice(1,8);
    console.log(features1);
    var timeRange = d3.extent(rows,d=>{return d.time});
    var dataByLocation = d3.nest().key(d=>d.location).entries(rows);
    dataByLocation.forEach(location=>{
        var totalDamage = 0;
        location.values.forEach(d=>{
            features1.forEach(feature=>{
                totalDamage += +d[feature];
            })
        });


        averageLocationDamageObj[location.key] = Math.round(totalDamage/location.values.length);
        locationList.push(location.key);
        averageLocationDamage.push({location: location.key, averagedamage: Math.round(totalDamage/location.values.length),nReports: location.values.length});
    });

    averageLocationDamage.sort((a,b)=>{return a.averagedamage - b.averagedamage});
    GeoColor.domain([averageLocationDamage[0].averagedamage,averageLocationDamage[averageLocationDamage.length-1].averagedamage]);
    // GeoColor.domain([0,19]);
    console.log(averageLocationDamage);



    d3.json("./Dataset/StHimark.geojson", function(err, geojson) {

        // console.log(geojson);
        drawMapByDamage(geojson.features);

    });


});



function drawMapByDamage(data) {

    const GEO_OPACITY_DEFAULT = 0.7;
    const GEO_OPACITY_HOVER = 0.3;

    group.selectAll("path").data(data)
        .enter()
        .append("path").attr("d", geopath)
        .attr("id",d=>"geo"+d.properties.Id)
        // .data(geojson)
        .attr("fill",d=>{return GeoColor(averageLocationDamageObj[d.properties.Id.toString()])})
        .attr("fill-opacity",GEO_OPACITY_DEFAULT)
        .attr("stroke","#222")
        .on("mouseover",d=>{
            var indexInTotal = findIndexInArrayObject(averageLocationDamage,d.properties.Id);

            group.append("text").attr("class","textLabel").attr("x",0).attr("y",5).style("font-size","20px")
                .text("Id: " + d.properties.Id + " - "+d.properties.Nbrhood +
                    ", dmg: " + averageLocationDamageObj[d.properties.Id.toString()] +
                    ", reportNo. " + averageLocationDamage[indexInTotal].nReports);

            d3.select("#geo"+d.properties.Id).style("fill-opacity",GEO_OPACITY_HOVER);
        })
        .on("mouseout",d=>{
            d3.select(".textLabel").remove();
            d3.select("#geo"+d.properties.Id).style("fill-opacity",GEO_OPACITY_DEFAULT);
        })
}

function findIndexInArrayObject(array,value ) {
    var index = 0;
    array.forEach((loc,i)=>{
        if(loc.location===value.toString()){
            index = i;
        }});
    return index;
}
