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

d3.csv("./Dataset/mc1-reports-data.csv",function (err, rows) {
        // console.log(rows);

        dataset = rows;
        dataset.columns = rows.columns;

        rows.forEach(row=>{
            // console.log(row.time);
            row.time_geo = (parseTimeGeo(row.time));
            // console.log(row.time);
        });

        // get features that used for mutlti-dimension coordinates
        features = dataset.columns.filter(function(element) {
            return (element !== "location" &&
                element !== "time");
        });

        // xScale.domain(features); // for parallel graph

        //nest data by time and sort data
        dataByTime = d3.nest().key(d=>d.time_geo).entries(rows);
        dataByTime.sort((a,b)=>new Date(a.key) - new Date(b.key));
        var report_number=[];
        dataByTime.forEach(d=>report_number.push(d.values.length));
        console.log(report_number)
        plot_line_v4(report_number,dataByTime)

        var dataByLocation = d3.nest().key(d=>d.location).entries(rows);
        // console.log(dataByLocation);

        // Draw Slider
        var timeRange = d3.extent(rows,d=>{return new Date(d.time_geo)});
         d3.json("./Dataset/StHimark.geojson", function(err, geojson) {
        // geojsonData = geojson;
             // drawMap(geojson.features, 0);
             for (var j=0; j<6; j++) {
                 analyzeDataByLocation(dataByLocation,j);
                 drawMap(geojson.features,j)
                 initialize(j);
             }
        });
        drawGeoSlider(timeRange);

        draw_heatmap(rows)



    });

function initialize(i) {

    checkedNeighborhood.forEach(id=>{
        d3.select("#geo"+i+id).style("fill-opacity",GEO_OPACITY_HOVER);
        d3.select("#svg"+id).transition().duration(1000).style("display",null);
    })

}

function getDataByTime(dateStart, dateEnd){
    var data = [];
    dataset.forEach(d=>{
        if (d.time >= dateStart && d.time <= dateEnd) {
            data.push(d);
        }
    })
    return data;
}


// Count the categories and return a descending frequency-ordered list of top categories
function CountCategories(data) {    // ***We could optimize this function further, but maybe later
    var categories = [];            // ***I think it has O(N^2) time complexity or more     ~Darien
    var count_category = [];
    var category_queue = [];
    //(data) get from d3.csv, push all category to categories array
    data.forEach(d => { // Build the list of category occurrences
        categories.push(d.time_geo);
    });

    var count;
    data.forEach((d) => {
        count = 0;
        if (!category_queue.includes(d.time_geo)) {    // If this category has not been counted
            for (i = 0; i < categories.length; i++) {   // Count the occurrences of this category
                if (categories[i] === d.time_geo) {
                    count++;
                }
            }
            category_queue.push(d.time);              // Mark this category as counted
            count_category.push({time: d.time_geo, number: count})    // Add the count of this category
        }
    });

    //sort count_category array
    count_category.sort(function (a, b) {
        return new Date(a.time_geo) - new Date(b.time_geo)
    });

    return count_category;
}

