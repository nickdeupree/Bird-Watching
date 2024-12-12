# Project: Bird Watching App

The goal of the project is to build a bird-watching app/site, loosely modeled on ebird.org.  The project has been chosen in a way that will let us play with many interesting features in web development, including developing responsive one-page apps, maps integration, user communication, and more. 

The project is organized around the following main pages: 

- Index page.  Welcomes users and shows a map of bird densities. 
- Checklist page.  Enables users to enter a checklist. 
- Stats page.  Enables users to see stats and compilations about their own data. 
- Location page.  Enables users to ask for details about a birding location. 

There can of course be auxiliary management pages built.  The four pages above should be developed in vue.js.  You can, for instance, assign one group member to develop each page. 

## Index page

### Implementation/usage decisions
The first time a user logs in, they should see a map centered around the bay area, populated with the sightings from the prepopulated database information. From there, they can search for a species, select a species from the dropdown that appears, and see the sightings for just that species. Once a species is selected, an 'undo' button pops up that lets the user undo the species selection, going back to show all species sightings on the map. They can also click 'Start Drawing', and once 4 points have been selected (to create a polygon), the button changes to display 'Go to Location' and takes the user to the location page. They can also click 'Select Location' to select a single location on the map. Once one is selected, the button changes to 'Create Checklist' to take the user to the checklist creation page. Only one action is valid at a time (you can either draw a polygon or select a location). If one wants to clear the map or undo a button click (such as clicking 'Start Drawing' but changing their mind and not wanting to draw anything), click 'Clear'.

## Checklist Pages

### Implementation
In order to input a new checklist, the user must select a single location on the home page map, and then select 'Create checklist'. This leads them to the checklist page. 

The user can input the observation date, time the observation started, and duration of the observation at the top of the page. Date and time are required, however duration is not. If the user navigates away from the page without saving, but sightings are inputted, the checklist is still saved without the date and time info, so it can be edited later. Otherwise, if save is not clicked, a checklist is not created. 

There is also a search bar at the top of the page, which allows the user to search through their checklist if they wish to, for example for editing the count of a specific species. 

The user can use the add species field to add to their list, and when the user starts typing a dropdown comes up, from which they can select if it exists in the database, but they can also manually enter the details (in case it has never been seen). The default amount for count is 1 if not specified. The user can either use the 'add' button or hit enter from either field (add or quantity, but only when focused) to add to the list. The checklist itself has options for incrementing/decrementing the count and deleting the sighting. 

When 'Save Checklist' is clicked, a modal pops up, which informs the user that their list has been saved, and gives them the option to go to 'My Checklists' or simply click 'ok', which takes them back to the home page. 

The My Checklists page shows the user a list of all checklists they have created, with the latitute,longitude, and the observation details (not including species or count). They also have 4 options for each checklist.

- View: open the checklist in view only mode ('view checklist' page)
- View on map: go to the map location on the index page
- Edit: open the checklist in edit mode ('checklist' page)
- Delete: delete the entire checklist

## Stats Page

In order to see the stats page, the user can click on the "My Stats" button in the navigation bar. There, they are able to see a summary of total statistics, including the total number of birds, total number of distinct species, and distinct locations in which they have seen birds. They can also see a chart displaying the number of birds they have seen over time. Next to the chart, there is a list of individual species buttons. Users can click each species button to toggle between a chart of all sightings and a chart of sightings for that species.

If there is no user data, no chart is loaded and a message prompting users to add checklists is displayed.

### Location
after users draw a polygon on the index page & clicks the stats per location button the user will be redirected to the location page. if they've selected a region with no data the areas of the page will be blank. Otherwise the user will be able to see a list of species seen in the area, which users entered the most sightings, and a graph of the total sightings seen over time. By selected a species, the chart will update to show a graph specific to the selected species. 

### Instructions
This is the page users see when they log in. They should see a map, centered on their region, with a density indication of where birds have been seen. The page should contain links to submit a checklist (the checklist page) and “My birding” (the stats page). 
On the map, users should be able to draw a rectangle, and click on a button that says “statistics on region”.  This leads them to the statistics page for the selected region. 
The map is also governed by a species selection box.  Users can select a species, and the map will show the density of that species. 

### Map Implementation 

Maps can be implemented in two ways: via Google Maps, or Leaflet.
[This example]

#### Google Maps  

You can find the [Google Maps API documentation here](https://developers.google.com/maps/documentation/javascript/overview).  You will need to get an API key from Google.

You can look at [this example](https://github.com/learn-py4web/vote-map/blob/master/static/js/edit.js) for how to integrate a Google Map in your app with vue.js; the example is for Vue2 but the difference with Vue3 is small. 

You can use a [Heatmap Layer](https://developers.google.com/maps/documentation/javascript/heatmaplayer) to display bird density.  You can then use the drawing library to let users draw rectangles; see the documentation [here](https://developers.google.com/maps/documentation/javascript/examples/drawing-tools) and [here](https://developers.google.com/maps/documentation/javascript/drawinglayer#overview).

#### Leaflet

Another very nice library is [Leaflet](https://leafletjs.com/)  .  You can use it with OpenStreetMap tiles for this type of applications. In an app I wrote some time ago, I created a Leaflet map and added listeners like this: 

```
    app.init = () => {
        app.map = L.map('map').setView([51.505, -0.09], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(app.map);
        // Adds listener.
        app.map.on('click', app.click_listener);
        app.map.on('dbclick', app.dbclick_listener);
    };
```

To draw polygons, you create a polygon: 

```
    app.drawing_polygon = L.polygon([], {color: 'red'}).addTo(app.map);
```

and when people click, you add the coordinates to the polygon: 

```
    app.click_listener = function (e) {
        // If we are drawing, it's one more point for our polygon.
        app.drawing_coords.push(e.latlng);
        app.drawing_polygon.setLatLngs(app.drawing_coords);
    };
```

In the project, you need to draw rectangles, and you can look at the [documentation](https://leafletjs.com/reference.html#rectangle) and invent some similar code. 
For the heatmap, you may be able to use [this plugin](https://github.com/Leaflet/Leaflet.heat). 

### Species selection

There must be some way of choosing which species to display on the map. If no species is selected, you should show data for all species.  You can have a search box with autocomplete in which users can select the species, etc. 

## Checklist page

In this page, users can enter a checklist.  This page should be accessed by selecting a position on the map page, and click on an "enter checklist" button.  Users need to be logged in to enter a checklist. 

In the checklist page, you should have on top a search bar that enables to select the species, so that if one enters "spar" one sees only the sparrows.  Then, for each species, there should be a row in a table with species name, a place where users can enter a number of birds seen, and a button to increment the number of birds seen. 

When the user is done, they can click on a "submit" button, and the checklist is saved.

There should be some additional page where users see the list of checklists they have submitted, and where they can delete them, or go edit them (via the checklist page).  This "My Checklists" page 

## Location page

When users select a region on the map page and click on "region information" (or similar), they should be able to view the statistics for that region. The statistics should include:

- A list of species seen in the region, with the number of checklists and total number of sightings for the region. 
- Some kind of graph showing the number of birds in a species seen over time. For example, when one clicks on a species in the above list, such graph should be displayed. 
- Some information on the top contributors for the region. 

You can use the [D3.js](https://d3js.org/) library to create visualizations, or the [Chart.js](https://www.chartjs.org/) library.  Other libraries are also possible.

## User statistics

Users should be able to see their own statistics.  This page should show things like: 
- A list of all species they have seen, searchable.  When they click on a species, they should see some visualization of when they saw it, and if one liked, even where (you can include a map here). 
- Some visualization of how their bird-watching has trended in time. 

## Developing your app

### Development advice 

I advise developing the database schema first, discussing it all togehter.  Once that is in place, each person can take the lead in developing one of the pages, and you can use synthetic data to test and develop the pages (using the data I will provide, or augmenting it with your own data).

### Sample data

You should prime the database with [this data](https://drive.google.com/drive/folders/1NV5vMn0h3O5peppvBHqcdJAudPQe_Qkg?usp=sharing). 
The data is in the form of three csv files, which can be loaded into the database, for example by reading them via the `csv` Python module and inserting them into the database: 

- `species.csv` contains the species of birds (about 400). 
- `checklists.csv` contains the checklists.  Each checklist has a user, a location, and a data, among other fields. 
- `sightings.csv` contains the sightings.  Each sighting has a checklist, a species, and a number of birds seen.

The checklists and sightings are linked by the `SAMPLING EVENT IDENTIFIER` field. 
Note that while the original data comes from 10 days of eBird checklists in the area, it has been modified, so the data does not correspond to real observations (you may find strange observations, such as sparrows in the ocean!). 

To prime the database, you can use code in `models.py` like this:

```
if db(db.species).isempty():
    with open('species.csv', 'r') as f:
        reader = csv.reader(f)
        for row in reader:
            db.species.insert(name=row[0])
```

and similarly for the other tables.

## Project Submission

### Project repository

You should create a ***private*** repository on GitHub, and add as collaborators: 
- `lucadealfaro`
- `Fallenhh`
- `mathewNJoseph`

You will be able to make the project public, if you so wish, after the project is graded.

### By November 17

Please provide by November 17 the details on your project, including the members and the GitHub location of the repository, using [this form](https://docs.google.com/forms/d/e/1FAIpQLSderx0Rco4qotKG2-1-tZHpKfNU1lQELCdyn7219QwFr1OACg/viewform?usp=sf_link).

### By Thursday, December 12

#### Project submission

You should submit the project to [this form](https://docs.google.com/forms/d/e/1FAIpQLSfb6Y0sCuNWBsKgr4mkHPT7xLZXlr1WGJVK-9hSskPpIqOyOQ/viewform?usp=sf_link).
The project should be submitted as a zip file containing the project directory; please verify that the zip enables someone to run the project without any additional information. 
A `zipit.py` program will be provided here shortly for zipping the project. 

#### Peer evaluation

You should also fill a [peer evaluation](https://docs.google.com/forms/d/e/1FAIpQLScZ7Ux-SsqclZkBblviTJuxXvIKC0rCvqO6TkjYYxj83xay1g/viewform?usp=sf_link). 

## Project grading

The project will be graded on the following criteria:

- Code quality
- Security
- User interface
- Completeness
- Creativity

The project will be graded by the instructor and the TAs.  We will look in detail at the commit log of the project, so please make sure to commit often and with meaningful messages, and make sure everybody commits their own code so we can attribute the work correctly.
# Bird-Watching
