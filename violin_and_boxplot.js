// Info to show visualization
var boxplotWidth = 1300, parallelHeight = 400,
    boxplotMargin = {top: 30, right: 20, bottom: 30, left: 50},
    boxplotContentWidth = boxplotWidth - boxplotMargin.left - boxplotMargin.right,
    boxplotContentHeight = parallelHeight - boxplotMargin.top - boxplotMargin.bottom;

var boxplotSvg = d3.select("#box-plot").append("svg").attr("width", boxplotWidth + 200).attr("height", parallelHeight),
    boxplotG = boxplotSvg.append("g").attr("transform", "translate(" + boxplotMargin.left + "," + boxplotMargin.top + ")"),
    titleGroup = boxplotSvg.append("g").attr("transform", "translate(" + (boxplotContentHeight - 15) + "," + (boxplotMargin.top - 15) + ")");

// x, y, and color Scale
var boxplotX = d3.scaleTime().range([0, boxplotContentWidth]),
    boxplotY = d3.scaleLinear().range([0,boxplotContentHeight]).domain([10,0]);
    // color = d3.scaleOrdinal().range(d3.schemeCategory10);

//color = ['#0000', '#f4429e', '#ad42f4', '#f4f142', '#ce42f4', '#f4aa42', '#42e2f4', '#42f489', '#f4f442', '#ce42f4', '#42f1f4', '#f4c542', '#f47742', '#42c5f4', '#42f4f4', '#4274f4', '#42f47d', '#eef442', '#f4c542', '#f48042'];

// axises definition
var boxplotXAxis = d3.axisBottom(boxplotX),
    boxplotYAxis = d3.axisLeft(boxplotY).ticks(5);

// Define blur
var filter1 = boxplotSvg.append("defs")
    .append("filter")
    .attr("id", "innerFilter")
    .append("feGaussianBlur")
    .attr("stdDeviation", 1);

var filter2 = boxplotSvg.append("defs")
    .append("filter")
    .attr("id", "outerFilter")
    .append("feGaussianBlur")
    .attr("stdDeviation", 4);

//drag object
// var dragging = {};

// const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
// const formatDayAndHour = d3.timeFormat("%m/%d/%Y %H");
// const observeTime = d3.timeParse("%m/%d/%Y %H");

let locations = [];
d3.csv("Dataset/mc1-reports-data.csv",function (err, rows) {

    rows.forEach(row=>{
        row.time = observeTime(formatDayAndHour(parseTime(row.time)));
    });


    features = rows.columns.slice(1,7);

    //nest data by time and sort data
    var dataByTime = d3.nest().key(d=>d.time).entries(rows);
    dataByTime.sort((a,b)=>new Date(a.key) - new Date(b.key));

    // Find all location
    var databyLocation = d3.nest().key(d=>d.location).entries(rows);
    databyLocation.forEach(d=>{
        locations.push(d.key);
    });

    // console.log(dataByTime.length);

    var boxplot = [];
    dataByTime.forEach(time=>{

        locations.forEach(loc=>{
            // if(!(loc.key in boxplot))
            //     boxplot[loc.key] = {};
            // if(!(time.key in boxplot[loc.key]))
            //     boxplot[loc.key][time.key] = {};
            features.forEach(fea=>{
                // boxplot[loc.key][time.key][fea] = {};
                var data = objByPropertyAndLocation(time.values,fea,loc);
                // boxplot[loc.key][time.key][fea] = data;

                boxplot.push({time: time.key, feature: fea, location: loc, [fea]:data});
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
    drawLine(boxplot,"power","1");
    drawLine(boxplot,"sewer_and_water","1");
    drawLine(boxplot,"roads_and_bridges","1");
    drawLine(boxplot,"medical","1");
    drawLine(boxplot,"buildings","1");
    drawLine(boxplot,"shake_intensity","1");

});

var outer_opacity = 0.3;
const normal_stroke_width = 2;
const hover_strok_width = 4 ;

function drawLine(boxplot,property,location) {
    var thisColor = color(property);
    var data = [];
    boxplot.forEach(d=>{
        if(d.location === location && (property in d)){
            // data.push({time: new Date(d.time), value: d[property].max});
            data.push(d);
        }
    });
    // console.log(data);


    var areaOuter = d3.area()
        .x(d=>boxplotX(new Date(d.time)))
        .y0(d=>boxplotY(d[property].upperInnerFence))
        .y1(d=>boxplotY(d[property].lowerInnerFence))
        .curve(d3.curveCatmullRom.alpha(0.5));

    var drawOuter = boxplotG.append("path").datum(data)
        .attr("class","boxplot"+location)
        .attr("id",d=>"outerArea"+property+location)
        .attr("fill",thisColor).style("opacity",outer_opacity)
        .attr("d", areaOuter)
        .attr("filter","url(#outerFilter)");
    //
    var areaInner = d3.area()
        .x(d=>{
            // console.log(d.lowerInnerFence + ", " + d.quartile1+", "+d.quartile3 +", "+d.median + ", " + d.upperInnerFence);
            return boxplotX(new Date(d.time))})
        .y0(d=>boxplotY(d[property].quartile1))
        .y1(d=>boxplotY(d[property].quartile3))
        .curve(d3.curveCatmullRom.alpha(0.5));

    var drawInner = boxplotG.append("path").datum(data)
        .attr("class","boxplot"+location)
        .attr("id",d=>"innerArea"+property+location)
        .attr("fill",thisColor).style("opacity",outer_opacity)
        .attr("d", areaInner)
        .attr("filter","url(#innerFilter)");


    //
    var boxplotLine = d3.line().x(d=>boxplotX(new Date(d.time)))
        .y(d=>boxplotY(d[property].median))
        .curve(d3.curveCatmullRom.alpha(0.5));

    var boxplotPath = boxplotG.append("path").datum(data)
        .attr("class","boxplot"+location)
        .attr("id",d=>"line"+property+location)
        .attr("stroke",thisColor)
        .attr("stroke-width",normal_stroke_width)
        .attr("fill","none")
        .attr("d",boxplotLine)
        .on("mouseover",d=>MouseOver(d))
        .on("mouseout",d=>MouseOut(d))

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
}

function MouseOver(data) {
    // console.log(data);
    features.forEach(d=>{
        if(d==data[0].feature){
            d3.select("#line"+data[0].feature+data[0].location).attr("stroke-width",hover_strok_width);
            d3.select("#innerArea"+data[0].feature+data[0].location).attr("filter",null);
            d3.select("#outerArea"+data[0].feature+data[0].location).attr("filter",null);
        }
        else {
            d3.select("#line"+d+data[0].location).attr("display","none");
            d3.select("#innerArea"+d+data[0].location).attr("display","none");
            d3.select("#outerArea"+d+data[0].location).attr("display","none");
        }
    })

}

function MouseOut(data){
    features.forEach(d=> {
        if (d == data[0].feature) {
            d3.select("#line" + data[0].feature + data[0].location).attr("stroke-width", normal_stroke_width);
            d3.select("#innerArea" + data[0].feature + data[0].location).attr("filter", "url(#innerFilter)");
            d3.select("#outerArea" + data[0].feature + data[0].location).attr("filter", "url(#outerFilter)");
        } else {
            d3.select("#line"+d+data[0].location).attr("display",null);
            d3.select("#innerArea"+d+data[0].location).attr("display",null);
            d3.select("#outerArea"+d+data[0].location).attr("display",null);
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
    if(temp.length <= 0)
        return getMetrics([0]);
    return getMetrics(temp);
}