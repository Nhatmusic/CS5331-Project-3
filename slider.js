function drawGeoSlider(timeRange) {
    const SLIDER_WIDTH = 1850;
    const SLIDER_HEIGHT = 80;

    console.log( (timeRange));

    // var dataFullTime = [];
    // let temp = timeRange[0];

    // console.log(typeof (new Date(temp)));
    // timeRange.map(d=>{dataFullTime.push((d))});

    // Create slider with properties
    var sliderRange = d3.sliderBottom()
        .min(timeRange[0])
        .max(timeRange[1])
        .step(1000*60*5)       // Step moving by min = (milisecs * secs)
        .width(SLIDER_WIDTH)
        // .tickFormat(d3.format('.2%'))
        .ticks(5)
        .default([timeRange[0],timeRange[1]])
        .fill('#2196f3')
        .on('onchange', val => {
            // console.log(val);
            var text = [];
            val.forEach(d=>{
                // console.log((d));
                // if(typeof (d) != "object"){
                //     text.push(getDateFormatforLabel(new Date(d)));
                // }
                // else
                    text.push(getDateFormatforLabel(new Date(d)));
            });
            d3.select("#date-value-1").text(text[0]);
            d3.select("#date-value-2").text(text[1]);

            d3.select("#time-value-1").property("value", getTimeFormatForInput(new Date(val[0])));
            d3.select("#time-value-2").property("value", getTimeFormatForInput(new Date(val[1])));

            // Event on change below
            //  var data = getDataByTime(new Date(val[0]),new Date(val[1]));
            filterGeoTimeRange(sliderRange.value());
             // Handle data
            //....


        });

    var gRange = d3
        .select('div#slider-simple')
        .append('svg')
        .attr('width', SLIDER_WIDTH+100)
        .attr('height', SLIDER_HEIGHT)
        .append('g')
        .attr('transform', 'translate(100,40)');

    gRange.call(sliderRange);

    // d3.select('#date-value-1').text(
    //     sliderRange.value().map(d=>{return getDateFormatforLabel(d)})
    //         .join(' - ')
    // );

    d3.select("#date-value-1").text(getDateFormatforLabel(sliderRange.value()[0]));
    d3.select("#date-value-2").text(getDateFormatforLabel(sliderRange.value()[1]));

    d3.select("#time-value-1").property("value", getTimeFormatForInput(sliderRange.value()[0]));
    d3.select("#time-value-2").property("value", getTimeFormatForInput(sliderRange.value()[1]));
    // getTimeFormatForInput(sliderRange.value());
}

function getTimeFormatForInput(sliderValue){
        var hour = ("0"+sliderValue.getHours()).slice(-2);
        var minute = ("0"+sliderValue.getMinutes()).slice(-2);

        return hour+":"+minute+":00"; // second is 00 as default
}
function getDateFormatforLabel(dateObject) {
    // used to change day and month numbers to "word"
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','August','Sep','Oct','Nov','Dec'];

    // Format "Mon Apr 06 00:00" --> add 0 in front of single number in date, hour, and minute
    var handledDate = (dateObject.getDate() < 10) ? "0"+dateObject.getDate() : dateObject.getDate();
    // var handledMinute = (dateObject.getMinutes() < 10) ? "0"+dateObject.getMinutes() : dateObject.getMinutes();
    // var handledHour = (dateObject.getHours() < 10) ? "0"+dateObject.getHours() : dateObject.getHours();

    return days[dateObject.getDay()] + " "
        + months[dateObject.getMonth()] + " " + handledDate + " ";
}

function changeTime(){
    // var temp = d3.select("#slider-simple").value();
    var hourAndMinute_1 = document.getElementById("time-value-1").value;
    var hourAndMinute_2 = document.getElementById("time-value-2").value;
    // console.log(hourAndMinute_1);
}