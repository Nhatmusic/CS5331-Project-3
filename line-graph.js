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

// parse the date / time
var parseTimeLineGraph = d3.timeParse("%m/%d/%Y %H:%M");

// set the ranges
var x = d3.scaleTime().range([0, lineGraphContentWidth]);
var y = d3.scaleLinear().range([lineGraphContentHeight, 0]);

// define the line
var linePath = d3.line()
.defined(function(d) { return d.medical !== -1; })
.x(function(d) { return x(d.time); })
.y(function(d) { return y(d.medical); });

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var lineGraphSvg = d3.select("#line-graph").append("svg")
.attr("width", lineGraphContentWidth + lineGraphMargin.left + lineGraphMargin.right)
.attr("height", lineGraphContentHeight + lineGraphMargin.top + lineGraphMargin.bottom)
.append("g")
.attr("transform",
    "translate(" + lineGraphMargin.left + "," + lineGraphMargin.top + ")");

// Get the data
d3.csv("./Dataset/data-optimized.csv", function(error, data) {
  if (error) throw error;
  
  // format the data
  data.forEach(function(d) {
    d.time = parseTimeLineGraph(d.time);
    d.medical = +d.medical;
    d.location = +d.location;
  });
  
  // Scale the range of the data
  x.domain(d3.extent(data.slice(0,100), function(d) { return d.time; }));
  y.domain([0, d3.max(data, function(d) { return d.medical; })]);
  
  // Nest the entries by category
  var categoryNest = d3.nest()
    .key(function(d) {return d.location;})
    .entries(data);

  // Make a line for each category
  categoryNest.forEach(function(d, i) {
    lineGraphSvg.append("path")
      .attr("class", "line")
      .style("stroke", function() {
        return colorByTop20Categories(d.key);
      })
    .attr("id", "line" + d.key)
    .attr("d", linePath(d.values));
  });
  
  // Add the X Axis
  lineGraphSvg.append("g")
  .attr("transform", "translate(0," + lineGraphContentHeight + ")")
  .call(d3.axisBottom(x));
  
  // Add the Y Axis
  lineGraphSvg.append("g")
  .call(d3.axisLeft(y));
  
});