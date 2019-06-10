// drawGeoSlider();
// Hospital list
var hospitals = [
    {name: 1, position: [-119.959400, 0.180960]},
    {name: 2, position: [-119.915900, 0.153120]},
    {name: 3, position: [-119.909520, 0.151090]},
    {name: 4, position: [-119.904300, 0.121800]},
    {name: 5, position: [-119.883420, 0.134560]},
    {name: 6, position: [-119.855580, 0.182990]},
    {name: 7, position: [-119.828610, 0.041470]},
    {name: 8, position: [-119.744800, 0.065250]}];
var nuclearPlant = [-119.784825, 0.162679];

var neighborHood = [
    {name: "1 - PALACE HILLS", position: [-119.975400, 0.165560]},
    {name: "2 - NORTHWEST", position: [-119.930400, 0.183860]},
    {name: "3 - OLD TOWN", position: [-119.873400, 0.193060]},
    {name: "4 - SAFE TOWN", position: [-119.820400, 0.167060]},
    {name: "5 - SOUTH WEST", position: [-119.930400, 0.110060]},
    {name: "6 - DOWNTOWN", position: [-119.930400, 0.140060]},
    {name: "7 - WILSON FOREST", position: [-119.730400, 0.088060]},
    {name: "8 - SCENIC VISTA", position: [-119.780400, 0.032060]},
    {name: "9 - BROADVIEW’s", position: [-119.843400, 0.052060]},
    {name: "10 - CHAPPARAL’s", position: [-119.803400, 0.052060]},
    {name: "11 - TERRAPIN SPRINGS", position: [-119.770400, 0.073060]},
    {name: "12 - PEPPER MILL’s", position: [-119.765400, 0.103060]},
    {name: "13 - CHEDDARFORD’s", position: [-119.811400, 0.106060]},
    {name: "14 - EASTON", position: [-119.870800, 0.153120]},
    {name: "15 - WESTON", position: [-119.898520, 0.151090]},
    {name: "16 - SOUTHTON", position: [-119.900400, 0.119060]},
    {name: "17 - OAK WILLOW", position: [-119.853400, 0.083060]},
    {name: "18 - EAST PARTON", position: [-119.843400, 0.117060]},
    {name: "19 - WEST PARTON", position: [-119.876400, 0.106060]}];

var checkedNeighborhood = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"];

const GEO_OPACITY_DEFAULT = 0.3;
const GEO_OPACITY_HOVER = 0.7;

const NORMAL_STROKE_WIDTH = 1;
const BIGER_STROKE_WIDTH = 3;

var geoWidth = 400;
var geoHeight = 200;

// var GeoColor = colorbrewer["YlOrRd"][9];
// var colorScale = d3.scaleQuantize()
//     .domain([0, 10])
//     .range(GeoColor);

var projection = d3.geoMercator().center([-119.78, 0.15]).scale(120000);
// var projection = d3.geoAlbers().center([-119,0]);
var geopath = d3.geoPath().projection(projection);
var averageLocationDamageObj;
var averageLocationDamage;
var reportno = {};
var max_report=[];
var locationList;
var featuresGeo;
var type_feature = ['shake_intensity', 'sewer_and_water', 'power', 'roads_and_bridges', 'medical', 'buildings']
var geo_data = [];

// Format the data by location and analyze the damage for each location
function analyzeDataByLocation(data, feature_id) {



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
    data.forEach(location => {
        let featureDamage = [];
        location.values.forEach(d => {
            featuresGeo.forEach((feature) => {
                if (feature !== "location"&&feature !== "reportID")
                    if (!featureDamage.hasOwnProperty(feature)) {
                        featureDamage[feature] = 0;
                    }
                featureDamage[feature] += +d[feature];
            })
        });
        reportno[location.key] = location.values.length;
        max_report.push(location.values.length)
        locationList.push(location.key);
        averageLocationDamageObj[location.key] = featureDamage[type_feature[feature_id]] / location.values.length;


    });


    console.log("after")
    geo_data.push({averageLocationDamageObj: averageLocationDamageObj, reportnumber: reportno})
}


function filterGeoTimeRange(timeRange) {

    var selectedGeoData = dataset.filter(function (d) {
        return timeRange[0] <= d.time_geo && d.time_geo <= timeRange[1];
    });
    selectedGeoData = d3.nest().key(d => d.location).entries(selectedGeoData)
    console.log(selectedGeoData)

    selectedHeatmap_data = [];
    array_data_mean4.forEach(function (d) {
        return selectedHeatmap_data.push(d.filter(function (d1) {
            return timerangedata[0] <= d1.time && d1.time <= timerangedata[1];
        }))
    })
    svg_heatmap.selectAll("g").remove();
    var cellSize = 4;
    Update_heatmap(selectedHeatmap_data, cellSize)

    console.log(selectedGeoData)
    // selectedGeoData.columns = initialData.columns;
    geo_data = [];
    for (var i = 0; i < 6; i++) {
        analyzeDataByLocation(selectedGeoData, i);
        updateGeoFill(i);
    }

}



function updateGeoFill(i) {

    locationList.forEach(function (location) {
        d3.select("#geo" + i + location).attr("fill", function () {
            return colorScale(geo_data[i].averageLocationDamageObj[+location])
        })

    });

    // for (var i=0; i <6; i++) {
    //     for (var j=1; j < 20; j++) {
    //         groupGeo.selectAll("geo"+i+j).attr("stroke-width", function (d) {
    //             return report_scale(geo_data[i].reportnumber[j])
    //         })
    //     }
    // }

}


// Draw the geospatial diagram
function drawMap(geojsonFeatures, feature_id) {
    var svgGeo = d3.select(".geospatial" + feature_id).append("svg").attr("width", geoWidth).attr("height", geoHeight)
        .attr('viewBox', "0 0 700 600");
    groupGeo = svgGeo.append("g").attr("transform", "translate(30,10)");
    // create tooltip
    var tooltip_geo = d3.select("#row")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden");

    //scale the number of report to [0,1];
   report_scale_geo = d3.scaleLinear().domain([math.min(max_report), math.max(max_report)]).range([0.5, 6]);
    //Draw Map
    groupGeo.selectAll("path").data(geojsonFeatures)
        .enter()
        .append("path").attr("d", geopath)
        .attr("id", d => "geo" + feature_id + d.properties.Id)
        // .data(geojson)
        .attr("fill", d => {
            return colorScale(geo_data[feature_id].averageLocationDamageObj[d.properties.Id.toString()])
        })
        .attr("fill-opacity", GEO_OPACITY_DEFAULT)
        .attr("stroke", "#222")
        .attr("stroke-width",function(d) {
            return report_scale_geo(geo_data[feature_id].reportnumber[d.properties.Id.toString()])
        })
        .on('mouseover', function (d) {
            tooltip_geo.html('<div class="heatmap_tooltip">' + "Location: " + d.properties.Nbrhood + "<br/>" + "Damage Level: " + (geo_data[feature_id].averageLocationDamageObj[d.properties.Id.toString()]).toFixed(2) + "<br/>" +
                "Report Quantity: " + (geo_data[feature_id].reportnumber[d.properties.Id.toString()]) + "<br/>" +'</div>');
            tooltip_geo.style("visibility", "visible");
        })
        .on('mouseout', function (cell) {
            // d3.select(this).classed("hover", false);
            tooltip_geo.style("visibility", "hidden");
        })
        .on("mousemove", function (cell) {
            tooltip_geo.style("top", (d3.event.pageY - 200) + "px").style("left", (d3.event.pageX - 65) + "px");
        });
    groupGeo.selectAll("geoHospitals").data(hospitals)
        .enter()
    .append("svg:image")
        .attr("xlink:href", "https://img.icons8.com/small/32/000000/hospital-bed.png")
        .attr("x",d => projection(d.position)[0])
        .attr("y", d => projection(d.position)[1])
        .attr("width", "15")
        .attr("height", "15");


    // Draw the nuclear plant
    // groupGeo.append("circle")
    //     .attr("class", "geoNuclear")
    //     .attr("cx", d => projection(nuclearPlant)[0])
    //     .attr("cy", d => projection(nuclearPlant)[1]);
groupGeo.append("svg:image")
        .attr("xlink:href", "https://img.icons8.com/small/52/000000/nuclear-power-plant.png")
.attr("x", d => projection(nuclearPlant)[0])
        .attr("y", d => projection(nuclearPlant)[1])
        .attr("width", "40")
        .attr("height", "40");

    // Draw neighborhood text
    groupGeo.selectAll("neighborText").data(neighborHood)
        .enter()
        .append("text").attr("font-size", "10px")
        .attr("id", d => "locationText" + d.name)
        .attr("x", d => projection(d.position)[0])
        .attr("y", d => projection(d.position)[1])
        .attr("transform", d => {
            if (d.name == "7 - WILSON FOREST")
                return "translate(230,990) rotate(-90)";
            else if (d.name == "10 - CHAPPARAL’s")
                return "translate(30,908) rotate(-90)";
            else if (d.name == "8 - SCENIC VISTA")
                return "translate(-150,255) rotate(-25)";
            return null;
        })
        .text(d => d.name);

}

//




