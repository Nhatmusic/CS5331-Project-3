



// drawGeoSlider();

var geoWidth = 900;
var geoHeight = 600;

var svgGeo = d3.select(".geospatial").append("svg").attr("width",geoWidth).attr("height",geoHeight);
var group = svgGeo.append("g").attr("transform","translate(30,10)");
// var textLabel = g.append("text").attr("class","textLabel").attr("x",0).attr("y",0);

// color feature
var color = d3.scaleOrdinal().range(d3.schemeCategory20);
var GeoColor = d3.scaleLinear().range(['#1a9850','#d73027']).interpolate(d3.interpolateHcl);

var projection = d3.geoMercator().center([-119.78,0.15]).scale(120000);
// var projection = d3.geoAlbers().center([-119,0]);
var geopath = d3.geoPath().projection(projection);

//Time Format and Parsing
//format of data: 2020-04-09 12:30:00
const parseTimeGeo = d3.timeParse("%Y-%m-%d %H:%M:%S");
const formatDayAndHour = d3.timeFormat("%m/%d/%Y %H");
const observeTime = d3.timeParse("%m/%d/%Y %H");



var averageLocationDamageObj = {};
var averageLocationDamage = [];
var locationList = [];
var featuresGeo = [];
d3.csv("./Dataset/mc1-reports-data.csv",function (err, rows) {
    // console.log(rows);

    rows.forEach(row=>{
        row.time = observeTime(formatDayAndHour(parseTimeGeo(row.time)));
        // console.log(row.time);
    });
    featuresGeo = rows.columns.slice(1,8);
    console.log(featuresGeo);
    var timeRange = d3.extent(rows,d=>{return d.time});
    var dataByLocation = d3.nest().key(d=>d.location).entries(rows);
    dataByLocation.forEach(location=>{
        var totalDamage = 0;
        var featureDamage = [0,0,0,0,0,0];
        location.values.forEach(d=>{
            // console.log(d);
            featuresGeo.forEach((feature,i)=>{
                totalDamage += +d[feature];
                if(feature!=="location")
                    featureDamage[i] += +d[feature];
            })
        });


        // var temp = 0;
        // featureDamage.map(d=>{temp += d/location.values.length});
        //
        // console.log(temp/6);
        averageLocationDamageObj[location.key] = Math.round(totalDamage/location.values.length);
        locationList.push(location.key);
        averageLocationDamage.push({location: location.key,
            totalDamage: totalDamage,
            nReports: location.values.length,
            averagedamage: Math.round(totalDamage/location.values.length),
            sewer_and_water:(featureDamage[0]/location.values.length).toFixed(1),
            power:(featureDamage[1]/location.values.length).toFixed(1),
            roads_and_bridges:(featureDamage[2]/location.values.length).toFixed(1),
            medical:(featureDamage[3]/location.values.length).toFixed(1),
            buildings:(featureDamage[4]/location.values.length).toFixed(1),
            shake_intensity:(featureDamage[5]/location.values.length).toFixed(1)
        });
    });

    averageLocationDamage.sort((a,b)=>{return a.averagedamage - b.averagedamage});
    GeoColor.domain([averageLocationDamage[0].averagedamage,averageLocationDamage[averageLocationDamage.length-1].averagedamage]);
    // GeoColor.domain([0,10]);
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
            group.append("text").attr("class","textLabel2").attr("x",0).attr("y",25).style("font-size","20px")
                .text("sewer: " + averageLocationDamage[indexInTotal].sewer_and_water +
                    " - power: " + averageLocationDamage[indexInTotal].power +
                    " - Road & bridge: " + averageLocationDamage[indexInTotal].roads_and_bridges +
                    " - medical: " + averageLocationDamage[indexInTotal].medical +
                    " - buildings: " + averageLocationDamage[indexInTotal].buildings +
                    " - shake_intensity: " + averageLocationDamage[indexInTotal].shake_intensity);

            d3.select("#geo"+d.properties.Id).style("fill-opacity",GEO_OPACITY_HOVER);
        })
        .on("mouseout",d=>{
            d3.select(".textLabel").remove();
            d3.select(".textLabel2").remove();
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
