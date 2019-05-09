// Info to show visualization
var boxplotWidth = 900, parallelHeight = 400,
    boxplotMargin = {top: 30, right: 20, bottom: 30, left: 50},
    boxplotContentWidth = boxplotWidth - boxplotMargin.left - boxplotMargin.right,
    boxplotContentHeight = parallelHeight - boxplotMargin.top - boxplotMargin.bottom;

var boxplotSvg = d3.select("#box-plot").append("svg").attr("width", boxplotWidth + 200).attr("height", parallelHeight),
    boxplotG = boxplotSvg.append("g").attr("transform", "translate(" + boxplotMargin.left + "," + boxplotMargin.top + ")"),
    titleGroup = boxplotSvg.append("g").attr("transform", "translate(" + (boxplotContentHeight - 15) + "," + (boxplotMargin.top - 15) + ")");

// x, y, and color Scale
var boxplotX = d3.scaleTime().range([0, boxplotContentWidth]),
    boxplotY = d3.scaleLinear().range([0,boxplotContentHeight]).domain([10,0]);
// color = d3.scaleOrdinal().range(d3.schemeCategory20);

//color = ['#0000', '#f4429e', '#ad42f4', '#f4f142', '#ce42f4', '#f4aa42', '#42e2f4', '#42f489', '#f4f442', '#ce42f4', '#42f1f4', '#f4c542', '#f47742', '#42c5f4', '#42f4f4', '#4274f4', '#42f47d', '#eef442', '#f4c542', '#f48042'];

// axises definition
var boxplotXAxis = d3.axisBottom(boxplotX).ticks(5),
    boxplotYAxis = d3.axisLeft(boxplotY).ticks(5);

// Define area
// var outLinerLine = boxplotG.append("line").attr("class",);

//drag object
// var dragging = {};

const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
const formatDayAndHour = d3.timeFormat("%m/%d/%Y %H");
const observeTime = d3.timeParse("%m/%d/%Y %H");

var features = [];
d3.csv("data/mc1-reports-data.csv",function (err, rows) {

    rows.forEach(row=>{
        row.time = observeTime(formatDayAndHour(parseTime(row.time)));
    });


    var features = rows.columns.slice(1,8);

    //nest data by time and sort data
    var dataByTime = d3.nest().key(d=>d.time).entries(rows);
    dataByTime.sort((a,b)=>new Date(a.key) - new Date(b.key));

    // console.log(dataByTime.length);

    var boxplot = [];
    dataByTime.forEach(time=>{

        var databyLocation = d3.nest().key(d=>d.location).entries(time.values);
        databyLocation.forEach(loc=>{
            // if(!(loc.key in boxplot))
            //     boxplot[loc.key] = {};
            // if(!(time.key in boxplot[loc.key]))
            //     boxplot[loc.key][time.key] = {};
            features.forEach(fea=>{
                // boxplot[loc.key][time.key][fea] = {};
                var data = objByPropertyAndLocation(time.values,fea,loc.key);
                // boxplot[loc.key][time.key][fea] = data;

                boxplot.push({time: time.key, location: loc.key, [fea]:data});
            })
        })



    });
    // console.log(boxplot);

    // draw Axis

    var timeRange = d3.extent(rows,d=>{return d.time});
    // boxplotX.domain([new Date(timeRange[0]-5*60*60*1000),new Date(timeRange[1].getTime() + 5*60*60*1000)]);
    boxplotX.domain(timeRange);
    let xAxisGroup = boxplotG.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0, " + boxplotContentHeight + ")").call(boxplotXAxis);
    let yAxisGroup = boxplotG.append("g")
        .attr("class", "grid").call(boxplotYAxis);

    // draw axis
    drawLine(boxplot,"sewer_and_water",1);

});

var outer_opacity = 0.1;
function drawLine(boxplot,property,location) {
    var data = [];
    boxplot.forEach(d=>{
        if(d.location == location && (property in d)){
            data.push(d);
        }
    });
    console.log(data);


    // var areaInner = d3.area()
    //     .x(d=>boxplotX(d.time))
    //     .y0(d=>boxplotY(d[property].upperInnerFence))
    //     .y1(d=>boxplotY(d[property].lowerInnerFence))
    //     .curve(d3.curveCatmullRom.alpha(0.5));
    //
    // var drawAbove = boxplotG.append("path").datum(data)
    //     .attr("fill","#fcc29b").style("opacity",outer_opacity)
    //     .attr("d", areaInner);
    //
    // var areaQ3 = d3.area()
    //     .x(d=>{
    //         console.log(d.lowerInnerFence + ", " + d.quartile1+", "+d.quartile3 +", "+d.median + ", " + d.upperInnerFence);
    //         return boxplotX(d.time);})
    //     .y0(d=>boxplotY(d[property].quartile1))
    //     .y1(d=>boxplotY(d[property].quartile3))
    //     .curve(d3.curveCatmullRom.alpha(0.5));
    //
    // var drawAbove = boxplotG.append("path").datum(data)
    //     .attr("fill","#fcc29b").style("opacity",outer_opacity)
    //     .attr("d", areaQ3);

    // var areaQ1 = d3.area()
    //     .x(d=>{ return boxplotX(d.time);})
    //     .y0(d=>boxplotY(d.median))
    //     .y1(d=>boxplotY(d.quartile1))
    //     .curve(d3.curveCatmullRom.alpha(0.5));
    //
    // var drawAbove = boxplotG.append("path").datum(boxplot)
    //     .attr("fill","#fcc29b")
    //     .attr("d", areaQ1);
    //
    var boxplotLine = d3.line().x(d=>{
        console.log(new Date(d.time));
        boxplotX(new Date(d.time))}).y(d=>boxplotY(5)).curve(d3.curveCatmullRom.alpha(0.5));

    var boxplotPath = boxplotG.append("path").datum(data)
    // .attr("stroke","black")
        .attr("fill","none")
        .attr("d",boxplotLine)

    // boxplotG.selectAll("boxplotRect").data(boxplot)
    //     .enter().append("rect")
    //     .attr("x",d=>{
    //         // console.log((d.quartile1) + ", " + (d.quartile3));
    //         return boxplotX(d.time)-5})
    //     .attr("y",d=>boxplotY(d.quartile3))
    //     // .attr("r",10)
    //     .attr("fill","blue")
    //     .attr("height",d=>((boxplotY(d.quartile1)-boxplotY(d.quartile3))))
    //     .attr("width",6.4)
    //     .style("opacity",0.6)

    // boxplotG.selectAll("circletest").data(boxplot)
    //     .enter().append("circle")
    //     .attr("cx",d=>{
    //         console.log(d.quartile3);
    //         return boxplotX(d.time);
    //     })
    //     .attr("cy",d=>boxplotY(d.quartile3))
    //     .attr("r",3)
}

function getMetrics(data) {

    var metrics = { //These are the original non–scaled values
        // time: null,
        // max: null,
        // upperOuterFence: null,
        // upperInnerFence: null,
        // quartile3: null,
        // median: null,
        // mean: null,
        // iqr: null,
        // quartile1: null,
        // lowerInnerFence: null,
        // lowerOuterFence: null,
        // min: null
    };
    // console.log((data));
    metrics.max = d3.max(data);
    metrics.min = d3.min(data);
    metrics.quartile1 = d3.quantile(data, 0.4);
    metrics.quartile3 = d3.quantile(data, 0.6);
    metrics.median = d3.median(data);
    metrics.mean = d3.mean(data);
    metrics.iqr = metrics.quartile3 - metrics.quartile1;
    metrics.lowerInnerFence = d3.quantile(data,0.25);
    metrics.upperInnerFence = d3.quantile(data,0.75);

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
    // console.log(temp);
    return getMetrics(temp);
}