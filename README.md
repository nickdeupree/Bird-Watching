# Project: Bird Watching App

The goal of the project is to build a bird-watching app/site, loosely modeled on ebird.org.  The project has been chosen in a way that will let us play with many interesting features in web development, including developing responsive one-page apps, maps integration, user communication, and more. 

The project is organized around the following main pages: 

- Index page.  Welcomes users and shows a map of bird densities. 
- Checklist page.  Enables users to enter a checklist. 
- Stats page.  Enables users to see stats and compilations about their own data. 
- Location page.  Enables users to ask for details about a birding location. 

To run this site, run ./py4web.sh and go to http://127.0.0.1:8000/bird-watching

## General Decisions - Everyone

We decided to make the index page with the map available to everyone. Therefore, all users, logged in or not, can see the heatmap of all birds and be able to search different species to see the heatmap for individual species. In our implementation, we decided to require that users be logged in for all the other pages - location, checklists, and user stats - because this is how they can interact with each other and keep track of their own bird watching. If the user tries to go to these pages, they are directed to either log in or sign up. If the want to navigate back to the map without logging in, they can click on the Let's go bird watching! button in the navigation bar, which redirects them to the index page.

## Index page - Ananya

### Implementation/usage decisions
The first time a user logs in, they should see a map centered around the bay area, populated with the sightings from the prepopulated database information. From there, they can search for a species, select a species from the dropdown that appears, and see the sightings for just that species. Once a species is selected, an 'undo' button pops up that lets the user undo the species selection, going back to show all species sightings on the map. They can also click 'Start Drawing', and once 4 points have been selected (to create a polygon), the button changes to display 'Go to Location' and takes the user to the location page. They can also click 'Select Location' to select a single location on the map. Once one is selected, the button changes to 'Create Checklist' to take the user to the checklist creation page. Only one action is valid at a time (you can either draw a polygon or select a location). If one wants to clear the map or undo a button click (such as clicking 'Start Drawing' but changing their mind and not wanting to draw anything), click 'Clear'.

## Checklist Pages - Nikita

### Implementation
In order to input a new checklist, the user must select a single location on the home page map, and then select 'Create checklist'. This leads them to the checklist page. 

The user can input the observation date, time the observation started, and duration of the observation at the top of the page. Date and time are required, however duration is not. If the user navigates away from the page without saving, but sightings are inputted, these sightings are not saved. The save button needs to be clicked, in order for a checklist to be created.

There is also a search bar at the top of the page, which allows the user to search through their checklist if they wish to, for example for editing the count of a specific species. 

The user can use the add species field to add to their list, and when the user starts typing a dropdown comes up, from which they can select if it exists in the database, but they can also manually enter the details (in case it has never been seen). The default amount for count is 1 if not specified. The user can either use the 'add' button or hit enter from either field (add or quantity, but only when focused) to add to the list. The checklist itself has options for incrementing/decrementing the count and deleting the sighting. 

When 'Save Checklist' is clicked, a modal pops up, which informs the user that their list has been saved, and gives them the option to go to 'My Checklists' or simply click 'ok', which takes them back to the home page. 

The My Checklists page shows the user a list of all checklists they have created, with the latitute,longitude, and the observation details (not including species or count). They also have 4 options for each checklist.

- View: open the checklist in view only mode ('view checklist' page)
- View on map: go to the map location on the index page
- Edit: open the checklist in edit mode ('checklist' page)
- Delete: delete the entire checklist

## Stats Page - Anusha

In order to see the stats page, the user can click on the "My Stats" button in the navigation bar. There, they are able to see a summary of total statistics, including the total number of birds, total number of distinct species, and distinct locations in which they have seen birds. They can also see a chart displaying the number of birds they have seen over time. Next to the chart, there is a list of individual species buttons. Users can click each species button to toggle between a chart of all sightings and a chart of sightings for that species.

If there is no user data, no chart is loaded and a message prompting users to add checklists is displayed.

## Location - Nick
after users draw a polygon on the index page & clicks the stats per location button the user will be redirected to the location page. if they've selected a region with no data the areas of the page will be blank. Otherwise the user will be able to see a list of species seen in the area, which users entered the most sightings, and a graph of the total sightings seen over time. By selected a species, the chart will update to show a graph specific to the selected species. 

## Stats and Location Graph Notes
We added a wait time every time graphs are loaded on the stats and location pages for two reasons: 
1) So that there are no errors in rendering the graph if the page hasn't loaded yet.
2) It's a fun feature that allows users to view the graphs as they dynamically change when buttons are toggled.

### Map Implementation 

#### Leaflet
[Leaflet](https://leafletjs.com/).  
Heatmap: [this plugin](https://github.com/Leaflet/Leaflet.heat). 

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

# Bird-Watching
Apart from the Leaflet links and the sample data, all initial project instructions have been replaced with details of our implementation.
