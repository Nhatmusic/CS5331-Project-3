// Info to show visualization
var lineChartWidth = 600, lineChartHeight = 100,
    lineChartMargin = {top: 30, right: 20, bottom: 30, left: 50},
    lineChartContentWidth = lineChartWidth - lineChartMargin.left - lineChartMargin.right,
    lineChartContentHeight = lineChartHeight - lineChartMargin.top - lineChartMargin.bottom;

// var lineChartSvg = d3.select("#box-plot").append("svg").attr("id","svg1").attr("width", lineChartWidth).attr("height", lineChartHeight),
//     lineChartG = lineChartSvg.append("g").attr("id","g1").attr("transform", "translate(" + lineChartMargin.left + "," + lineChartMargin.top + ")");


// x, y, and color Scale
var lineChartX = d3.scaleTime().range([0, lineChartContentWidth]),
    lineChartY = d3.scaleLinear().range([0,lineChartContentHeight]).domain([10,0]),
    lineChartColor = d3.scaleOrdinal().range(d3.schemeCategory10);

// axises definition
var lineChartXAxis = d3.axisBottom(lineChartX),
    lineChartYAxis = d3.axisLeft(lineChartY).ticks(5);

let lineChartFeatures = [];
let locations = [];
d3.csv("Dataset/mc1-reports-data.csv",function (err, rows) {

    var tempFeatures = rows.columns;
    rows.forEach(row=>{
        row.time = observeTime(formatDayAndHour(parseTimeGeo(row.time)));
        tempFeatures.forEach(d=>{
            if(d !== "time")
                if(row[d] <= 0)
                    row[d] = null;
        })
    });

    lineChartFeatures = rows.columns.slice(2,8);

    //nest data by time and sort data
    var dataByTime = d3.nest().key(d=>d.time).entries(rows);
    dataByTime.sort((a,b)=>new Date(a.key) - new Date(b.key));

    // Find all location
    var databyLocation = d3.nest().key(d=>d.location).entries(rows);
    databyLocation.forEach(d=>{
        locations.push(d.key);
    });
    locations.sort((a,b)=>(+a) - (+b)); // sort data by convert String to number

    // console.log(dataByTime.length);

    var lineChart = [];
    dataByTime.forEach(time=>{

        locations.forEach(loc=>{
            // if(!(loc.key in lineChart))
            //     lineChart[loc.key] = {};
            // if(!(time.key in lineChart[loc.key]))
            //     lineChart[loc.key][time.key] = {};
            lineChartFeatures.forEach(fea=>{
                // lineChart[loc.key][time.key][fea] = {};
                var data = objByPropertyAndLocation(time.values,fea,loc);
                // lineChart[loc.key][time.key][fea] = data;

                lineChart.push({time: time.key, feature: fea, location: loc, [fea]:data});
            })
        })



    });
    // console.log(lineChart);

    var timeRange = d3.extent(rows,d=>d.time);
    // lineChartX.domain([new Date(timeRange[0]-5*60*60*1000),new Date(timeRange[1].getTime() + 5*60*60*1000)]);
    lineChartX.domain(timeRange);

    // Draw all location
    locations.forEach(loc=>{
        generateLocationSvg(lineChart,loc);
    });

    // initialize();

});


// Generate svg, g, and lines
function generateLocationSvg(lineChart,location) {
    var svg = d3.select("#box-plot").append("svg").attr("id","svg"+location).attr("width", lineChartWidth).attr("height", lineChartHeight),
        g = svg.append("g").attr("id","g"+location).attr("transform", "translate(" + lineChartMargin.left + "," + lineChartMargin.top + ")");

    // Draw axises
    g.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0, " + lineChartContentHeight + ")").call(lineChartXAxis);
    g.append("g")
        .attr("class", "grid").call(lineChartYAxis);

    // Define blur
    var innerFilter = svg.append("defs")
        .append("filter")
        .attr("id", "innerFilter"+location)
        .append("feGaussianBlur")
        .attr("stdDeviation", 1);

    var outerFilter = svg.append("defs")
        .append("filter")
        .attr("id", "outerFilter"+location)
        .append("feGaussianBlur")
        .attr("stdDeviation", 4);

    // Draw lines
    lineChartFeatures.forEach(feature=>{
        // console.log(feature);
        drawLine(lineChart,feature,location);
    });
    // console.log(lineChartFeatures);

    // Append title of graph
    g.append("text").attr("x",50).attr("y",-5)
        .text("Location " + neighborHood[+location-1].name)
        .style("font-size","8px");

    // Draw Legend for features
    var legend = svg.append("g").attr("id","legend")
        .attr("transform", "translate(" + lineChartMargin.left + ",10)");

    legend.selectAll(".legendRect").data(lineChartFeatures).enter().append("rect")
        .attr("class","legendRect").attr("id",d=>"legendRect"+d+location)
        .attr("x", (d,i)=>i*80)
        .attr("y", 0).attr("width", 5).attr("height",5)
        .attr("fill", d=>{
            return lineChartColor(d)});

    legend.selectAll(".legendText").data(lineChartFeatures).enter().append("text")
        .attr("class","legendText").attr("id",d=>"legendText"+d+location)
        .attr("x", (d,i)=>i*80+10)
        .attr("y", 5).text(d=>d)
        .style("font-size","8px")


    // hide the svg
    svg.style("display","none");

}

var outer_opacity = 0.3;
const normal_line_stroke_width = 1;
const hover_line_stroke_width = 2 ;

// Draw parallelLine graph
function drawLine(lineChart,property,location) {
    var thisColor = lineChartColor(property);
    var lineChartG = d3.select("#g"+location);

    var data = [];
    lineChart.forEach(d=>{
        if(d.location == location && (property in d)){
            // data.push({time: new Date(d.time), value: d[property].max});
            data.push(d);
        }
    });
    // console.log(data);


    var areaOuter = d3.area().defined(d=>d[property].mean)
        .x(d=>lineChartX(new Date(d.time)))
        .y0(d=>lineChartY(d[property].upperInnerFence))
        .y1(d=>lineChartY(d[property].lowerInnerFence))
        .curve(d3.curveCatmullRom.alpha(0.5));

    lineChartG.append("path").datum(data)
        .attr("class","lineChart"+location)
        .attr("id","outerArea"+property+location)
        .attr("fill",thisColor).style("opacity",outer_opacity)
        .attr("d", areaOuter)
        .attr("filter","url(#outerFilter"+location+")");
    //
    var areaInner = d3.area().defined(d=>d[property].mean)
        .x(d=>{
            // console.log(d.lowerInnerFence + ", " + d.quartile1+", "+d.quartile3 +", "+d.median + ", " + d.upperInnerFence);
            return lineChartX(new Date(d.time))})
        .y0(d=>lineChartY(d[property].quartile1))
        .y1(d=>lineChartY(d[property].quartile3))
        .curve(d3.curveCatmullRom.alpha(0.5));

    lineChartG.append("path").datum(data)
        .attr("class","lineChart"+location)
        .attr("id","innerArea"+property+location)
        .attr("fill",thisColor).style("opacity",outer_opacity)
        .attr("d", areaInner)
        .attr("filter","url(#innerFilter"+location+")");


    //
    var lineChartLine = d3.line().defined(d=>d[property].mean)
        .x(d=>lineChartX(new Date(d.time)))
        .y(d=>lineChartY(d[property].mean))
        .curve(d3.curveCatmullRom.alpha(0.5));

    lineChartG.append("path").datum(data)
        .attr("class","lineChart"+location)
        .attr("id","parallelLine"+property+location)
        .attr("stroke",thisColor)
        .attr("stroke-width",normal_line_stroke_width)
        .attr("fill","none")
        .attr("d",lineChartLine)
        .on("mouseover",d=>MouseOver(d))
        .on("mouseout",d=>MouseOut(d))

    // lineChartG.selectAll("lineChartRect").data(lineChart)
    //     .enter().append("rect")
    //     .attr("x",d=>{
    //         // console.log((d.quartile1) + ", " + (d.quartile3));
    //         return lineChartX(d.time)-5})
    //     .attr("y",d=>lineChartY(d.quartile3))
    //     // .attr("r",10)
    //     .attr("fill","blue")
    //     .attr("height",d=>((lineChartY(d.quartile1)-lineChartY(d.quartile3))))
    //     .attr("width",6.4)
    //     .style("opacity",0.6)
}

function MouseOver(data) {
    // console.log(data[0].location);
    lineChartFeatures.forEach(d=>{
        if(d==data[0].feature){
            d3.select("#parallelLine"+d+data[0].location).attr("stroke-width",hover_line_stroke_width);
            d3.select("#innerArea"+d+data[0].location).attr("filter",null);
            d3.select("#outerArea"+d+data[0].location).attr("filter",null);
            d3.select("#legendRect"+d+data[0].location).style("display",null);
            d3.select("#legendText"+d+data[0].location).style("display",null);
        }
        else {
            d3.select("#parallelLine"+d+data[0].location).attr("display","none");
            d3.select("#innerArea"+d+data[0].location).attr("display","none");
            d3.select("#outerArea"+d+data[0].location).attr("display","none");
            d3.select("#legendRect"+d+data[0].location).style("display","none");
            d3.select("#legendText"+d+data[0].location).style("display","none");
        }
    })

}

function MouseOut(data){

    var location = data[0].location;
    lineChartFeatures.forEach(d=> {
        if (d == data[0].feature) {
            d3.select("#parallelLine" + data[0].feature + data[0].location).attr("stroke-width", normal_line_stroke_width);
            d3.select("#innerArea" + data[0].feature + data[0].location).attr("filter", "url(#innerFilter"+location+")");
          d3.select("#outerArea" + data[0].feature + data[0].location).attr("filter", "url(#outerFilter"+location+")");
        } else {
            d3.select("#parallelLine"+d+data[0].location).attr("display",null);
            d3.select("#innerArea"+d+data[0].location).attr("display",null);
            d3.select("#outerArea"+d+data[0].location).attr("display",null);
            d3.select("#legendRect"+d+data[0].location).style("display",null);
            d3.select("#legendText"+d+data[0].location).style("display",null);
        }
    });

}

function getMetrics(data) {

    var metrics = {};
    // console.log((data));
    metrics.max = d3.max(data);
    metrics.min = d3.min(data);
    metrics.quartile1 = d3.quantile(data, 0.4);
    metrics.quartile3 = d3.quantile(data, 0.6);
    metrics.median = d3.median(data);
    metrics.mean = d3.mean(data);
    metrics.iqr = metrics.quartile3 - metrics.quartile1;
    metrics.lowerInnerFence = d3.quantile(data,0.2);
    metrics.upperInnerFence = d3.quantile(data,0.78);

    // console.log(metrics.quartile3);
    //The inner fences are the closest value to the IQR without going past it (assumes sorted lists)

    // var LIF = metrics.quartile1 - (1.5 * metrics.iqr);
    // var UIF = metrics.quartile3 + (1.5 * metrics.iqr);
    // for (var i = 0; i <= data.length; i++) {
    //     if (data[i] < LIF) {
    //         continue;
    //     }
    //     if (!metrics.lowerInnerFence && data[i] >= LIF) {
    //         metrics.lowerInnerFence = data[i];
    //         continue;
    //     }
    //     if (data[i] > UIF) {
    //         metrics.upperInnerFence = data[i - 1];
    //         break;
    //     }
    // }
    //
    // metrics.lowerOuterFence = metrics.quartile1 - (3 * metrics.iqr);
    // metrics.upperOuterFence = metrics.quartile3 + (3 * metrics.iqr);
    // if (!metrics.lowerInnerFence) {
    //     metrics.lowerInnerFence = metrics.min;
    // }
    // if (!metrics.upperInnerFence) {
    //     metrics.upperInnerFence = metrics.max;
    // }
    // console.log(metrics);
    return metrics;

}


function objByPropertyAndLocation(array, properties, location) {
    // console.log(array);
    var temp = [];
    array.forEach(d=>{
        // console.log(d[properties]);
        if(d.location == location) {
            temp.push(+d[properties]);
            // else {
            //     temp.push(null);
            // }
        }
        // console.log(d.time);
    });
    temp.sort((a,b)=>a-b);
    // if(temp.length <= 0)
    //     return getMetrics([0]);
    return getMetrics(temp);
}
