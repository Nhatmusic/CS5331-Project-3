var dataset = [];
var topGenresAll = [];           // Must not be greater than the size of our precomputed
var topGenres20 = [];            // t-SNE result if we are using it

let features = [];
var selectedGenres = [];
var genres = [];
var genresByYear = {};

d3.csv("./Dataset/data-optimized.csv")
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
        // Time
        dataset.forEach(d => {
            var year = d.time = +formatYear(parseTime(d.time));
            features.forEach(feature => {
                if (feature !== "location")
                    d[feature] = +d[feature];
            });
            //Add genres by each year
            if (!genresByYear.hasOwnProperty(year)) {
                genresByYear[year] = [];
                genresByYear[year].push(d.location);
            } else {
                if (!genresByYear[year].includes(d.location))
                    genresByYear[year].push(d.location);
            }
        });


        topGenresAll = CountGenres(dataset);
        topGenres20 = topGenresAll;

        // add genres after sorting
        genres = topGenresAll.map(d => d.location);

        // UpdateDataTSNE(bigdata.slice(0, testSize));
        drawSlider();
        graphByYear(dataset, sliderTime.value());
        document.getElementById("genreContainer").style.display = "none";

    });

// Count the genres and return a descending frequency-ordered list of top genres
function CountGenres(data) {    // ***We could optimize this function further, but maybe later
    var genres = [];            // ***I think it has O(N^2) time complexity or more     ~Darien
    var count_genre = [];
    var genre_queue = [];
    //(data) get from d3.csv, push all genre to genres array
    data.forEach(d => { // Build the list of genre occurrences
        genres.push(d.location);
    });

    var count;
    data.forEach((d) => {
        count = 0;
        if (!genre_queue.includes(d.location)) {        // If this genre has not been counted
            for (i = 0; i < genres.length; i++) {   // Count the occurrences of this genre
                if (genres[i] === d.location) {
                    count++;
                }
            }
            genre_queue.push(d.location);              // Mark this genre as counted
            count_genre.push({location: d.location, number: count})    // Add the count of this genre
        }
    });

    //sort count_genre array
    count_genre.sort(function (a, b) {
        return b.number - a.number;
    });

    return count_genre;
}

