# CS5331-Project-3

App's Link: https://nhatmusic.github.io/CS5331-Project-3/
Task Plan: (https://docs.google.com/document/d/1QsNrgIGv8CESoXGcuVemh7mpvuvKN3iwLNKmA_gX_p4/edit)
## Questions
- Emergency responders will base their initial response on the earthquake shake map. Use visual analytics to determine how their response should change based on damage reports from citizens on the ground. How would you prioritize neighborhoods for response? Which parts of the city are hardest hit? Limit your response to 1000 words and 10 images.
Provide your answer and corresponding images here.
- Use visual analytics to show uncertainty in the data. Compare the reliability of neighborhood reports. Which neighborhoods are providing reliable reports? Provide a rationale for your response. Limit your response to 1000 words and 10 images.
Provide your answer and corresponding images here.
- How do conditions change over time? How does uncertainty in change over time? Describe the key changes you see. Limit your response to 500 words and 8 images.

## Tasks:
- Plot events from dataset on a map with different types of damage (Geospatial) (Darien, Hao)
- Plot events over time as a stacked graph (Darien, Nhat)
- Plot events over animated time with a parallel coordinate graph (Nhat, Hao)
## Functionality:
- Categorize by areas and types of damage
- We can show calculated total damage when categorizing by area
- Plot approximation lines
- Plot areas of deviation
- Show all types of damage individually
- We can show approximation and deviation within a certain timestep
- We can use a drop-down or a log-scale slider
- Filter the data by time range
- We can use a brush or double slider
## Data:
- Time filtering
- Average values by entries in a given time-step within the range
- Process null value 
- mc1-reports-data.csv fields:
    - time: timestamp of incoming report/record, in the format YYYY-MM-DD hh:mm:ss
    - location: id of neighborhood where person reporting is feeling the shaking and/or seeing the damage
    - {shake_intensity, sewer_and_water, power, roads_and_bridges, medical, buildings}: reported categorical value of how violent the shaking was/how bad the damage was (0 - lowest, 10 - highest; missing data allowed)
- Also included are two shakemap (PNG) files which indicate where the corresponding earthquakes' epicenters originate as well as how much shaking can be felt across the city.
 ![Alt text](https://github.com/Nhatmusic/CS5331-Project-3/blob/master/Dataset/countreport.JPG)
