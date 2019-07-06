// Harcoded position of hospital and nuclear plant
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

const GEO_OPACITY_DEFAULT = 0.3;
const GEO_OPACITY_HOVER = 0.7;

//define svg size of each geo graph
var geoWidth = 300;
var geoHeight = 200;
//Draw Geomap using geodata
var projection = d3.geoMercator().center([-119.78, 0.15]).scale(120000);
var geopath = d3.geoPath().projection(projection);




function analyzed_geo_data(data) {
    var temp_data_array = [];
    temp_data_array = d3.nest().key(d => d.location).entries(data);
    const reducer_geo = (accumulator, currentValue) => accumulator + currentValue;
    temp_data_array.forEach(d => {
        let temp_value = [];
        let temp_data = [];
        d.values.forEach(d1 => {
            // d1.values.forEach(d2 => {
            temp_value.push(d1.noreport);
            temp_data.push(d1.data);
            // })
        })
            var collect_value_data  = _.unzip(temp_data);
            var collect_report_data = _.unzip(temp_value);
            // console.log(collect_report_data)
            var report=[];
            collect_report_data.forEach( d3 => {
                report.push(d3.reduce(reducer_geo));
            })

            var get_mean = [];
            collect_value_data.forEach( (d,i) => {
                var sum = 0;
                for (var j = 0; j < collect_report_data[0].length; j++) {
                    sum += d[j]*collect_report_data[i][j]
                }
                get_mean.push(sum)

            })
            d.value = get_mean.map(function(n, i) {
                if (report[i] != 0) {
                    return n / report[i];
                }
                else{
                    return n = -1;
                }
            });
            d.noreport = report;

    });

    return temp_data_array;

}


function filterGeoTimeRange(timeRange) {
    console.log("to5")
    var selectedGeoData = array_data_total.flat().filter(function (d) {
        return timeRange[0] <= d.time && d.time <= timeRange[1];
    });
    var geo_data = analyzed_geo_data(selectedGeoData)
    // console.log(selectedGeoData)
    for (var i=0; i<6; i++)
    {
        updateGeoFill(i,geo_data)
    }

    var selectedHeatmap_data = [];
    array_data_total.forEach(function (d) {
        return selectedHeatmap_data.push(d.filter(function (d1) {
            return timerangedata[0] <= d1.time && d1.time <= timerangedata[1];
        }))
    })
    svg_heatmap.selectAll("g").remove();
    var cellSize = 4;
    Update_heatmap(selectedHeatmap_data, cellSize)

    console.log("to6")
}

function updateGeoFill(i,geo_data) {
    for (var location =1; location < 20; location ++) {

        d3.select("#geo" + i + location).attr("fill", function () {
            if ((geo_data[location-1].value)[i] < 0){
                return "white"
            }
            else {
                return colorScale((geo_data[location - 1].value)[i])
            }
        })
            .attr("stroke-width", function () {
                return report_scale((geo_data[location-1].noreport)[i])
            })
            .on('mouseover', function (d) {
                tooltip_geo.html('<div class="heatmap_tooltip">' + "Location: " + d.properties.Nbrhood + "<br/>" + "Damage Level: " + (geo_data[d.properties.Id-1].value)[i].toFixed(2) + "<br/>" +
                    "Report Quantity: " + ((geo_data[d.properties.Id -1]).noreport[i]) + "<br/>" +'</div>');
                tooltip_geo.style("visibility", "visible");
            })
            // .on('mouseout', function (cell) {
            //     // d3.select(this).classed("hover", false);
            //     tooltip_geo.style("visibility", "hidden");
            // })
            // .on("mousemove", function (cell) {
            //     tooltip_geo.style("top", (d3.event.pageY - 100) + "px").style("left", (d3.event.pageX - 65) + "px");
            // });


    }






}


// Draw the geospatial diagram
function drawMap(geojsonFeatures, feature_id,geo_data) {
    var svgGeo = d3.select(".geospatial" + feature_id).append("svg").attr("width", geoWidth).attr("height", geoHeight)
        .attr('viewBox', "0 0 700 600");
    groupGeo = svgGeo.append("g").attr("transform", "translate(30,10)");
    // create tooltip
    tooltip_geo = d3.select("#row")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden");
    var store_report = [];
    geo_data.forEach(d=> store_report.push(d.noreport))
    //scale the number of report to [0,5,6]; for stroke-width of geo graph
    report_scale_geo = d3.scaleLinear().domain([math.min(store_report), math.max(store_report)]).range([0.5, 6]);
    //Draw Map
    groupGeo.selectAll("path").data(geojsonFeatures)
        .enter()
        .append("path").attr("d", geopath)
        .attr("id", d => "geo" + feature_id + d.properties.Id)
        // .data(geojson)
        .attr("fill", d => {
            if ((geo_data[d.properties.Id-1].value)[feature_id]<0){
                return "white"
            }
            else {
                return colorScale((geo_data[d.properties.Id - 1].value)[feature_id])
            }
        })
        .attr("fill-opacity", GEO_OPACITY_DEFAULT)
        .attr("stroke", "#222")
        .attr("stroke-width",function(d) {
            return report_scale_geo((geo_data[d.properties.Id-1].noreport)[feature_id])
        })
        .on('mouseover', function (d) {
            tooltip_geo.html('<div class="heatmap_tooltip">' + "Location: " + d.properties.Nbrhood + "<br/>" + "Damage Level: " + (geo_data[d.properties.Id-1].value)[feature_id].toFixed(2) + "<br/>" +
                "Report Quantity: " + ((geo_data[d.properties.Id -1]).noreport[feature_id]) + "<br/>" +'</div>');
            tooltip_geo.style("visibility", "visible");
        })
        .on('mouseout', function (cell) {
            // d3.select(this).classed("hover", false);
            tooltip_geo.style("visibility", "hidden");
        })
        .on("mousemove", function (cell) {
            tooltip_geo.style("top", (d3.event.pageY - 100) + "px").style("left", (d3.event.pageX - 65) + "px");
        });
    groupGeo.selectAll("geoHospitals").data(hospitals)
        .enter()
    .append("svg:image")
        .attr("xlink:href", "https://img.icons8.com/small/32/000000/hospital-bed.png")
        .attr("x",d => projection(d.position)[0])
        .attr("y", d => projection(d.position)[1])
        .attr("width", "15")
        .attr("height", "15");

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









