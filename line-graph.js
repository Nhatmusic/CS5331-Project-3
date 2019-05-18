// set the dimensions and margins of the graph
var lineGraphMargin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50
    },
    lineGraphWidth = 960,
    lineGraphHeight = 300,
    lineGraphContentWidth = lineGraphWidth - lineGraphMargin.left - lineGraphMargin.right,
    lineGraphContentHeight = lineGraphHeight - lineGraphMargin.top - lineGraphMargin.bottom,
    lineGraphPositionX = 0,
    lineGraphPositionY = 450;

// append the svg object to the body of the page
// appends a 'groupGeo' element to 'svg'
// moves the 'groupGeo' element to the top left margin
var lineGraphSvg = d3.select("#parallelLine-graph").append("svg")
.attr("width", lineGraphContentWidth + lineGraphMargin.left + lineGraphMargin.right)
.attr("height", lineGraphContentHeight + lineGraphMargin.top + lineGraphMargin.bottom)
.attr("transform", "translate(" + lineGraphPositionX + "," + lineGraphPositionY + ")")
.append("g")
.attr("transform",
    "translate(" + lineGraphMargin.left + "," + lineGraphMargin.top + ")");

// parse the date / time
var parseTimeLineGraph = d3.timeParse("%m/%d/%Y %H:%M");
var parseDateStringToObject = d3.timeParse("%a %b %d %Y %H:%M:%S GMT%Z (Central Daylight Time)");

// set the ranges
var x = d3.scaleTime().range([0, lineGraphContentWidth]);
var y = d3.scaleLinear().range([lineGraphContentHeight, 0]);

// Add the X Axis
lineGraphSvg.append("g")
.attr("transform", "translate(0," + lineGraphContentHeight + ")")
.call(d3.axisBottom(x));

// Add the Y Axis
lineGraphSvg.append("g")
.call(d3.axisLeft(y));


// Takes a date object and rounds it down to the nearest hour
function RoundTimeHour(dateObject) {
  let timeStampUTC = +dateObject; // Convert the date object to a UTC timestamp in milliseconds
  timeStampUTC -= timeStampUTC %  // Subtract the remainder down to the nearest hour
                    (1000 *  // 1 second - 1000 milliseconds
                     60   *  // 1 minute - 60 seconds
                     60);    // 1 hour   - 60 minutes
  return new Date(timeStampUTC);
}

// Takes a date in string format and returns a rounded date object
function CleanTime(dateString) {                  // This function should be deleted if it is
  return parseDateStringToObject(dateString);     // not further modified by the end of this
}                                                 // project because it is currently redundant

var IGNORE_NULL_LINE_GRAPH = true;  // This is a switch that determines whether or not the null data will be ignored

// define the parallelLine
var linePath = d3.line()
.defined(function(d) {
  if (IGNORE_NULL_LINE_GRAPH) { // Conditionally ignore the null data on the parallelLine graph
    return d.value >= 0;
  } else {
    return d.value;
  }
})
.x(function(d) {
  return x(CleanTime(d.key));
})
.y(function(d) { return y(d.value); });

// Get the data
d3.csv("./Dataset/data-optimized.csv", function(error, data) {
  if (error) throw error;
  
  // Format the data to the proper datatypes
  data.forEach(function(d) {
    d.time = parseTimeGeo(d.time);
    d.medical = +d.medical;
    d.location = +d.location;
  });
  
  // Scale the range of the data
  let TEST_RENDER_SIZE_LINE_GRAPH = 20000;  // Temporary limit for chart testing
  x.domain(d3.extent(data.slice(0,TEST_RENDER_SIZE_LINE_GRAPH), function(d) { return d.time; }));
  y.domain([-1, d3.max(data, function(d) { return d.medical; })]);
  
  // Nest the entries by category
  var categoryNest = d3.nest()
    .key(function(d) { return d.location; })  // Sort by location
    .key(function(d) {                        // Then sort by time
      return RoundTimeHour(d.time);
    })
    .rollup(function(v) {   // Perform aggregate operations on the grouped data
      if (IGNORE_NULL_LINE_GRAPH) {   // Conditionally filter the null entries
        v = v.filter(function(element) {  // Filter out the entries that have null data
          return element.medical !== -1;
        });
      } else {
        // Don't do anything for now
      }
      return d3.mean(v, function(d) { // Calculate the mean of all the entries in this groupGeo
        return d.medical;
      });
    })
    .entries(data);

  // Make a parallelLine for each category
  categoryNest.forEach(function(d, i) {
    lineGraphSvg.append("path")
      .attr("class", "parallelLine")
      .style("stroke", function() {
        return colorByTop20Categories(d.key);
      })
    .attr("id", "parallelLine" + d.key)
    .attr("d", linePath(d.values)); // Draw the parallelLine
  });
});