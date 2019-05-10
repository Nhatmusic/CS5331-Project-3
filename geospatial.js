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
    {name: "PALACE HILLS",position: [-119.975400, 0.165560]},
    {name: "NORTHWEST",position: [-119.930400, 0.183860]},
    {name: "OLD TOWN",position: [-119.873400, 0.193060]},
    {name: "SAFE TOWN",position: [-119.820400, 0.167060]},
    {name: "SOUTH WEST",position: [-119.930400, 0.110060]},
    {name: "DOWNTOWN",position: [-119.930400, 0.140060]},
    {name: "WILSON FOREST",position: [-119.730400, 0.088060]},
    {name: "SCENIC VISTA",position: [-119.780400, 0.032060]},
    {name: "BROADVIEW’s",position: [-119.843400, 0.052060]},
    {name: "CHAPPARAL’s",position: [-119.803400, 0.052060]},
    {name: "TERRAPIN SPRINGS",position: [-119.770400, 0.073060]},
    {name: "PEPPER MILL’s",position: [-119.765400, 0.103060]},
    {name: "CHEDDARFORD’s",position: [-119.811400, 0.106060]},
    {name: "EASTON",position: [-119.870800, 0.153120]},
    {name: "WESTON",position: [-119.898520, 0.151090]},
    {name: "SOUTHTON",position: [-119.900400, 0.119060]},
    {name: "OAK WILLOW",position: [-119.853400, 0.083060]},
    {name: "EAST PARTON",position: [-119.843400, 0.117060]},
    {name: "WEST PARTON",position: [-119.876400, 0.106060]}];

var checkedNeighborhood = ["1","3","5","7"];

const GEO_OPACITY_DEFAULT = 0.3;
const GEO_OPACITY_HOVER = 0.7;

const NORMAL_STROKE_WIDTH = 1;
const BIGER_STROKE_WIDTH = 3;

var geoWidth = 900;
var geoHeight = 600;

var svgGeo = d3.select(".geospatial").append("svg").attr("width",geoWidth).attr("height",geoHeight);
var group = svgGeo.append("g").attr("transform","translate(30,10)");
// var textLabel = g.append("text").attr("class","textLabel").attr("x",0).attr("y",0);

// color feature
// var color = d3.scaleOrdinal().range(d3.schemeCategory20);
var GeoColor = d3.scaleLinear().range(['#1a9850','#d73027']).interpolate(d3.interpolateHcl);

var projection = d3.geoMercator().center([-119.78,0.15]).scale(120000);
// var projection = d3.geoAlbers().center([-119,0]);
var geopath = d3.geoPath().projection(projection);

//Time Format and Parsing
//format of data: 2020-04-09 12:30:00
const parseTimeGeo = d3.timeParse("%Y-%m-%d %H:%M:%S");
const formatDayAndHour = d3.timeFormat("%m/%d/%Y %H");
const observeTime = d3.timeParse("%m/%d/%Y %H");

var initialData;

// Get the data from the CSV and format it to our needs
d3.csv("./Dataset/data-optimized.csv",function (err, rows) {
    // console.log(rows);

    rows.forEach(row=>{
        // console.log(row.time);
        row.time = observeTime(formatDayAndHour(parseTimeGeo(row.time)));
        // console.log(row.time);
    });

    // Save the initial data for later use
    initialData = rows;
    initialData.columns = rows.columns;

    // time range           // We don't appear to be using this
    var timeRange = d3.extent(rows,d=>{return d.time});
    // console.log(timeRange);

    //nest data by time and sort data
    var dataByTime = d3.nest().key(d=>d.time).entries(rows);
    dataByTime.sort((a,b)=>new Date(a.key) - new Date(b.key));

    // Draw Slider
    var time = [];
    dataByTime.map(d=>{time.push(d.key)});
    drawGeoSlider(time);

    // Take in the data and process it for the Geospatial Diagram
    analyzeDataByLocation(rows);

    // Process the GeoJSON map file for rendering the Geospatial Diagram
    d3.json("./Dataset/StHimark.geojson", function(err, geojson) {

        // console.log(geojson);
        drawMap(geojson.features);
        initialize();
    });


});

var averageLocationDamageObj;
var averageLocationDamage;
var locationList;
var featuresGeo;
// Format the data by location and analyze the damage for each location
function analyzeDataByLocation(data) {
    // Clear the data each time this is called
    averageLocationDamageObj = {};
    averageLocationDamage = [];
    locationList = [];
    featuresGeo = [];
    
    // Get columns of data
    //featuresGeo = data.columns.slice(1,8);
    featuresGeo = data.columns.filter(d => d !== "time" && d !== "reportID");
    
    // nest data by location
    //update boxplot
    var dataByLocation = d3.nest().key(d=>d.location).entries(data);

    // Calculate total/average damage for each location
    dataByLocation.forEach(location=>{
        let totalDamage = 0;
        let featureDamage = [];
        location.values.forEach(d=>{
            featuresGeo.forEach((feature)=>{
                if(feature !== "location")
                    if (!featureDamage.hasOwnProperty(feature)) {
                        featureDamage[feature] = 0;
                    }
                    totalDamage += +d[feature];
                    featureDamage[feature] += +d[feature];
            })
        });
        
        averageLocationDamageObj[location.key] = Math.round(totalDamage/location.values.length);
        locationList.push(location.key);
        averageLocationDamage.push({location: location.key,
            totalDamage: totalDamage,
            nReports: location.values.length,
            averagedamage: Math.round(totalDamage / location.values.length),
            sewer_and_water: (featureDamage["sewer_and_water"] / location.values.length).toFixed(1),
            power: (featureDamage["power"] / location.values.length).toFixed(1),
            roads_and_bridges: (featureDamage["roads_and_bridges"] / location.values.length).toFixed(1),
            medical: (featureDamage["medical"] / location.values.length).toFixed(1),
            buildings: (featureDamage["buildings"] / location.values.length).toFixed(1),
            shake_intensity: (featureDamage["shake_intensity"] / location.values.length).toFixed(1)
        });
    });

    averageLocationDamage.sort((a,b)=>{return a.averagedamage - b.averagedamage});
    GeoColor.domain(d3.extent(averageLocationDamage, function(d) { return d.averagedamage; }));
}

function getTimeFormatforSlider(time) {
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','August','Sep','Oct','Nov','Dec'];


    // Format "Mon Apr 06 00:00"
    var handledDate = (time.getDate() < 10) ? "0"+time.getDate() : time.getDate();

    return days[time.getDay()] + " "
        + months[time.getMonth()] + " " + handledDate + " "
        + time.getHours() + ":0" + time.getMinutes();
}

// Draw the time slider
function drawGeoSlider(data) {

    var dataFullTime = [];

    // console.log(typeof (new Date(temp)));
    data.map(d=>{dataFullTime.push(new Date(d))});

    // Create slider with properties
    var sliderRange = d3
        .sliderBottom()
        .min(dataFullTime[0])
        .max(dataFullTime[dataFullTime.length-1])
        .step(1000*60*60)       // Step moving by hour = (milisecs * secs * mins)
        .width(300)
        // .tickFormat(d3.format('.2%'))
        .ticks(5)
        .default([dataFullTime[0],dataFullTime[dataFullTime.length-1]])
        .fill('#2196f3')
        .on('onchange', val => {
            var text = [];
            val.forEach(d=>{
                if(typeof (d) != "object"){
                    text.push(getTimeFormatforSlider(new Date(d)));
                }
                else
                    text.push(getTimeFormatforSlider(d));
            });
            d3.select('p#value-simple').text(text.join(' - '));
            filterGeoTimeRange(val);
        });

    var gRange = d3
        .select('div#slider-simple')
        .append('svg')
        .attr('width', 400)
        .attr('height', 65)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gRange.call(sliderRange);

    d3.select('p#value-simple').text(
        sliderRange.value().map(d=>{return getTimeFormatforSlider(d)})
            .join(' - ')
    );
}



var selectedGeoData;
function filterGeoTimeRange(timeRange) {
    selectedGeoData = initialData.filter(function(d) {
        return timeRange[0] <= d.time && d.time <= timeRange[1];
    });
    selectedGeoData.columns = initialData.columns;
    
    analyzeDataByLocation(selectedGeoData);
    updateGeoFill();
    updateParallelByTime(timeRange);
}

function filterGeoTimeSpan(timeSpan) {
    selectedGeoData = initialData.filter(function(d) {
        return +formatTimeDay(RoundTimeDay(d.time)) === timeSpan;
    });
    selectedGeoData.columns = initialData.columns;
    
    analyzeDataByLocation(selectedGeoData);
    updateGeoFill();
}

function updateGeoFill() {
    locationList.forEach(function(location) {
        d3.select("#geo" + +location).attr("fill", function() { return GeoColor(averageLocationDamageObj[+location])})
    });
}


// Draw the geospatial diagram
function drawMap(data) {

    //Draw Map
    group.selectAll("path").data(data)
        .enter()
        .append("path").attr("d", geopath)
        .attr("id",d=>"geo"+d.properties.Id)
        // .data(geojson)
        .attr("fill",d=>{return GeoColor(averageLocationDamageObj[d.properties.Id.toString()])})
        .attr("fill-opacity",GEO_OPACITY_DEFAULT)
        .attr("stroke","#222")
        .on("mouseover",d=>{
            var id = d.properties.Id;
            var indexInTotal = findIndexInArrayObject(averageLocationDamage,id);

            group.append("text").attr("class","textLabel").attr("x",0).attr("y",5).style("font-size","20px")
                .text("Id: " + id + " - "+d.properties.Nbrhood +
                    ", dmg: " + averageLocationDamageObj[d.properties.Id.toString()] +
                    ", reportNo. " + averageLocationDamage[indexInTotal].nReports);
            group.append("text").attr("class","textLabel2").attr("x",0).attr("y",25).style("font-size","20px")
                .text("sewer: " + averageLocationDamage[indexInTotal].sewer_and_water +
                    " - power: " + averageLocationDamage[indexInTotal].power +
                    " - Road & bridge: " + averageLocationDamage[indexInTotal].roads_and_bridges +
                    " - medical: " + averageLocationDamage[indexInTotal].medical +
                    " - buildings: " + averageLocationDamage[indexInTotal].buildings +
                    " - shake_intensity: " + averageLocationDamage[indexInTotal].shake_intensity);

            d3.select("#geo"+id).attr("stroke-width",BIGER_STROKE_WIDTH);

        })
        .on("mouseout",d=>{
            var id = d.properties.Id;
            d3.select(".textLabel").remove();
            d3.select(".textLabel2").remove();

            d3.select("#geo"+id).attr("stroke-width",NORMAL_STROKE_WIDTH);

        })
        .on("click",d=>{
            var id = d.properties.Id.toString();
            if(!checkedNeighborhood.includes(id)){
                checkedNeighborhood.push(id);
                d3.select("#geo"+id).style("fill-opacity",GEO_OPACITY_HOVER);
                d3.select("#svg"+id).transition().duration(1000).style("display",null);
                // graphByCategory([id],ADD_CODE);
            }
            else {
                checkedNeighborhood.splice([checkedNeighborhood.indexOf(id)],1);
                d3.select("#geo"+id).style("fill-opacity",GEO_OPACITY_DEFAULT);
                d3.select("#svg"+id).transition().duration(1000).style("display","none");
                // graphByCategory([id],DELETE_CODE);
            }

        })

    // Draw hospital
    group.selectAll("geoHospitals").data(hospitals)
        .enter()
        .append("circle")
        .attr("class","geoHospitals")
        .attr("cx",d=>projection(d.position)[0])
        .attr("cy",d=>projection(d.position)[1]);

    // Draw the nuclear plant
    group.append("circle")
        .attr("class","geoNuclear")
        .attr("cx",d=>projection(nuclearPlant)[0])
        .attr("cy",d=>projection(nuclearPlant)[1]);

    // Draw neighborhood text
    group.selectAll("neighborText").data(neighborHood)
        .enter()
        .append("text").attr("font-size","10px")
        .attr("id",d=>"locationText"+d.name)
        .attr("x",d=>projection(d.position)[0])
        .attr("y",d=>projection(d.position)[1])
        .attr("transform", d=>{
            if(d.name == "WILSON FOREST")
                return "translate(230,990) rotate(-90)";
            else if(d.name == "CHAPPARAL’s")
                return "translate(30,908) rotate(-90)";
            else if(d.name == "SCENIC VISTA")
                return "translate(-150,255) rotate(-25)";
            return null;
        })
        .text(d=>d.name);

    // have circle and text
    var gGeoLabel = group.append("g").attr("transform","translate("+100+","+(geoHeight-125)+")");

    // hospital circle
    gGeoLabel.append("circle").attr("class","geoHospitals").attr("cx",0).attr("cy",0);
    gGeoLabel.append("text").attr("x",15).attr("y",4).text("Hospitals");

    // hospital circle
    gGeoLabel.append("circle").attr("class","geoNuclear").attr("cx",0).attr("cy",25);
    gGeoLabel.append("text").attr("x",15).attr("y",30).text("Nuclear plant");



}

function findIndexInArrayObject(array,value ) {
    var index = 0;
    array.forEach((loc,i)=>{
        if(loc.location===value.toString()){
            index = i;
        }});
    return index;
}
