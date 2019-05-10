var dataset = [];
var topCategoriesAll = [];
var topCategories20 = [];

let features = [];
var selectedCategories = [];
var categories = [];
var categoriesByTimeSpan = {};


//Time Format and Parsing
const parseTime = d3.timeParse("%m/%d/%Y %H:%M");
const formatTimeDay = d3.timeFormat("%d");

// Takes a date object and rounds it down to the nearest day interval multiplied by the dayMultiplier
function RoundTimeDay(dateObject, dayMultiplier = 1) {
    let hourMultiplier =    24 *    // 1 day    - 24 hours
                            dayMultiplier;
    
    RoundTimeHour(dateObject, hourMultiplier);
}

// Takes a date object and rounds it down to the nearest hour interval multiplied by the hourMultiplier
function RoundTimeHour(dateObject, hourMultiplier = 1) {
    let timeMultiplier =    60 *    // 1 hour   - 60 minutes
                            hourMultiplier;
    
    RoundTimeMinutes(timeMultiplier);
}

// Takes a date object and rounds it down to the nearest minute interval multiplied by the minuteMultiplier
// This function assumes that the relevant locale is the Central Time Zone of the Americas
function RoundTimeMinutes(dateObject, minuteMultiplier = 1) {
    const LOCALE_OFFSET = -5;
    let timeStampUTC = +dateObject; // Convert the date object to a UTC timestamp in milliseconds
    
    // Account for the Central Time locale offset
    // Subtract the 5-hour difference to ensure rounding by Central Time and not UTC
    timeStampUTC += 1000    *       // 1 second - 1000 milliseconds
                    60      *       // 1 minute - 60 seconds
                    60      *       // 1 hour   - 60 minutes
                    LOCALE_OFFSET;  // 5 hours
    
    // Subtract the remainder down to the nearest minute interval multiplied by the minuteMultiplier
    timeStampUTC -= timeStampUTC % (minuteMultiplier *
                                    1000    *  // 1 second - 1000 milliseconds
                                    60);       // 1 minute - 60 seconds
    
    // Account for the Central Time locale offset
    // Add the 5-hour difference to ensure that the proper Central Time value is displayed
    timeStampUTC -= 1000    *       // 1 second - 1000 milliseconds
                    60      *       // 1 minute - 60 seconds
                    60      *       // 1 hour   - 60 minutes
                    LOCALE_OFFSET;  // 5 hours
    
    return new Date(timeStampUTC);
}

d3.csv("./Dataset/data-optimized1.csv")
    .row(function (d) {
        return d;
    })
    .get(function (error, rows) {

        dataset = rows;
        dataset.columns = rows.columns;
        console.log(dataset.columns);

        // get features that used for mutlti-dimension coordinates
        features = dataset.columns.filter(function(element) {
          return (element !== "reportID" &&
                  element !== "time");
        });
        xScale.domain(features);

        // Doing Time Slider
        dataset.forEach(d => {
            var timeSpan = d.time = +formatTimeDay(parseTimeGeo(d.time));
            features.forEach(feature => {
                if (feature !== "location")
                    d[feature] = +d[feature];
            });
            //Add categories by each timeSpan
            if (!categoriesByTimeSpan.hasOwnProperty(timeSpan)) {
                categoriesByTimeSpan[timeSpan] = [];
                categoriesByTimeSpan[timeSpan].push(d.location);
            } else {
                if (!categoriesByTimeSpan[timeSpan].includes(d.location))
                    categoriesByTimeSpan[timeSpan].push(d.location);
            }
        });


        topCategoriesAll = CountCategories(dataset);
        topCategories20 = topCategoriesAll;

        // add categories after sorting
        categories = topCategoriesAll.map(d => d.location);

        drawSlider();
        graphByTimeSpan(dataset, sliderTime.value());
        document.getElementById("categoryContainer").style.display = "none";

    });

// Count the categories and return a descending frequency-ordered list of top categories
function CountCategories(data) {    // ***We could optimize this function further, but maybe later
    var categories = [];            // ***I think it has O(N^2) time complexity or more     ~Darien
    var count_category = [];
    var category_queue = [];
    //(data) get from d3.csv, push all category to categories array
    data.forEach(d => { // Build the list of category occurrences
        categories.push(d.location);
    });

    var count;
    data.forEach((d) => {
        count = 0;
        if (!category_queue.includes(d.location)) {    // If this category has not been counted
            for (i = 0; i < categories.length; i++) {   // Count the occurrences of this category
                if (categories[i] === d.location) {
                    count++;
                }
            }
            category_queue.push(d.location);              // Mark this category as counted
            count_category.push({location: d.location, number: count})    // Add the count of this category
        }
    });

    //sort count_category array
    count_category.sort(function (a, b) {
        return b.number - a.number;
    });

    return count_category;
}

