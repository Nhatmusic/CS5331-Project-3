// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// parse the date / time
var parseTime = d3.timeParse("%m/%d/%Y %H:%M");

// set the ranges
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// define the line
var valueline = d3.line()
.defined(function(d) { return d.medical !== -1; })
.x(function(d) { return x(d.time); })
.y(function(d) { return y(d.medical); });

// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("body").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.csv("./Dataset/data-optimized.csv", function(error, data) {
  if (error) throw error;
  
  // format the data
  data.forEach(function(d) {
    d.time = parseTime(d.time);
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
  //
  // // Make a line for each category
  // categoryNest.forEach(function(d, i) {
  //   svg.append("path")
  //     .attr("class")
  // })
  
  // Add the valueline path.
  svg.append("path")
  .data([data])
  .attr("class", "line")
  .attr("d", valueline);
  
  // Add the X Axis
  svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x));
  
  // Add the Y Axis
  svg.append("g")
  .call(d3.axisLeft(y));
  
});