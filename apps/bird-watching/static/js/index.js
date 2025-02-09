"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {
    app.data = {
        user_email: null,
        is_drawing: false,
        is_selecting: false,
        map: null,
        drawing_polygon: null,
        drawing_coords: [],
        polygon: null,
        searched: '',
        selected_species: null,
        all_species: [],
        heatmapData: [],
        allHeatmapData: [],
        heatLayer: null,
        marker: null,
        handleSelecting: false,
        handleDrawing: false,
        center: { LATITUDE: 37.7749, LONGITUDE: -122.4194 },
    };

    app.enumerate = (a) => {
        let k = 0;
        a.map((e) => { e._idx = k++; });
        return a;
    };

    app.methods = {
        //Handling whether the button should be allowing polygon drawing 
        //or take the user to the location page
        handleDrawingClick() {
            if (this.is_drawing) {
                this.is_drawing = false;
                if (this.drawing_polygon) {
                    axios.post(save_user_polygon_url, {
                        polygon_coords: this.drawing_coords
                    }).then(() => {
                        console.log("Polygon saved successfully!");
                    });
                }
                this.map.off('click');
                window.location.href = location_url;
            } else {
                this.is_drawing = true;
                this.toggleDrawing();
            }
        },

        //Handling whether the button should be allowing location selection 
        //or taking to the checklist page
        handleSelectingClick() {
            if (this.is_selecting) {
                this.is_selecting = false;
                window.location.href = checklist_url; 
            } else {
                this.is_selecting = true;
                this.selectLocation();
            }
        },
        //Function to toggle drawing of the polygon
        toggleDrawing: function () {
            this.handleDrawing = true;
            
            this.clearDrawing();

            if (this.is_drawing) {
                this.drawing_polygon = L.polygon([], { color: 'red' }).addTo(this.map);
                this.drawing_coords = [];

                this.map.on('click', (e) => {
                    if (this.drawing_coords.length < 4) {
                        const { lat, lng } = e.latlng;
                        this.drawing_coords.push([lat, lng]);
                        this.drawing_polygon.setLatLngs(this.drawing_coords);
                    } else {
                        L.popup()
                            .setLatLng(e.latlng)
                            .setContent("Max 4 points are allowed; stop drawing.")
                            .openOn(this.map);
                    }
                    if (this.drawing_coords.length === 4) {
                        this.handleDrawing = false;
                    }    
                });
                
            } 
        },

        //Function to clear the drawing of the polygon from the map
        clearDrawing() {
            if (this.drawing_polygon) {
                this.drawing_polygon.remove();  
                this.drawing_polygon = null;    
                this.drawing_coords = [];  
                this.is_drawing = false;
                this.handleDrawing = false; 
                this.map.off('click');   
            }

            if (this.marker != null) {
                this.map.removeLayer(this.marker);
                this.marker = null;
                this.is_selecting = false;
            }
        },

        //Function to clear the map of any drawing and also 
        //undo the previous button click by resetting the variables
        clearMap() {
            this.clearDrawing();
            this.is_drawing = false;
            this.handleDrawing = false; 
            this.marker = null;
            this.is_selecting = false;
            this.handleSelecting = false;
        },

        //Function to select the location on the map and place the marker
        selectLocation: function () {
            if (this.is_selecting) {
                if (this.drawing_polygon) {
                    this.drawing_polygon.remove();
                    this.drawing_polygon = null;
                }
    
                let self = this;
                self.handleSelecting = true;
                this.clearDrawing();
                
                let selectPointHandler = (e) => {
                    let { lat, lng } = e.latlng;

                    self.marker = L.marker([lat, lng]).addTo(self.map);

                    axios.post(save_user_point_url, {
                        lat: lat,
                        lng: lng,
                    }).then(response => {
                        console.log('Point saved:', response);
                    }).catch(error => {
                        console.error('Error saving point:', error);
                    });
                    self.map.off('click', selectPointHandler);
                    self.handleSelecting = false;
                };
                this.map.on('click', selectPointHandler);
            }

        },

        //Function to update the selected species based on the search
        updateSelectedSpecies: function () {
            if (this.searched.trim()) {
                let foundSpecies = this.all_species.find(species =>
                    species.COMMON_NAME.toLowerCase() === this.searched.trim().toLowerCase()
                );
                if (foundSpecies) {
                    this.selected_species = foundSpecies;
                    console.log(`Selected species updated to: ${this.selected_species}`);
                    this.updateHeatmap()
                } else {
                    console.error("Species not found.");
                }
            }
        },

        //Function to update selected species based on the 
        //species selected from the dropdown
        selectSpecies: function (species) {
            this.selected_species = species;
            this.searched = '';
            console.log('Selected species updated to:', this.selected_species);

            this.updateHeatmap();
        },

        //Function to undo the selected species
        undo: function () {
            this.selected_species = null;
            this.updateHeatmap();
        },

        //Function to update the heatmap based on the selected species
        updateHeatmap() {
            try {
                // Removing the existing heatmap layer
                if (this.heatLayer) {
                    this.map.removeLayer(this.heatLayer);
                    this.heatLayer = null;
                }
                if (this.selected_species === null) {
                    let heatmapLayerData = this.allHeatmapData.map(item => item.slice(0, 3));
                    this.heatLayer = L.heatLayer(heatmapLayerData, { radius: 25 }).addTo(this.map);
                } else {
                    // Only adding the heatmap layer if there is filtered data
                    if (this.filteredHeatmapData.length > 0) {
                        let heatmapLayerData = this.filteredHeatmapData.map(item => item.slice(0, 3));
                        this.heatLayer = L.heatLayer(heatmapLayerData, { radius: 25 }).addTo(this.map);
                    } else {
                        console.error("No valid heatmap data found.");
                    }
                }
            } catch {
                console.error("Error updating heatmap.");
            }
        },

        load_data: function () {
            let self = this;
            axios.get(load_species_url).then((r) => {
                self.all_species = r.data.all_species;
                if(r.data.center !== null){
                    self.center = r.data.center;
                }
                console.log(self.center);
                
                self.heatmapData = r.data.species
                    .filter((sighting) => sighting.latitude !== null && sighting.longitude !== null)
                    .map((sighting) => {
                        return [
                            sighting.latitude,
                            sighting.longitude,
                            sighting.observation_count,
                            sighting.species_id
                        ];
                    });
                self.allHeatmapData = self.heatmapData;
                setTimeout(() => {
                    self.map = L.map("map").setView([this.center.LATITUDE, this.center.LONGITUDE], 8.5);
                    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                        maxZoom: 19,
                        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    }).addTo(self.map);

                    if (self.heatmapData.length > 0) {
                        let heatmapLayerData = self.heatmapData.map(item => item.slice(0, 3));  // Get only the first 3 values
                        self.heatLayer = L.heatLayer(heatmapLayerData, { radius: 25 }).addTo(self.map);
                    } else {
                        console.error("No valid heatmap data found.");
                    }
                }, 1); // Adding slight delay to help with rendering
            });
        },
    };

    app.vue = Vue.createApp({
        data() {
            return app.data;
        },
        methods: app.methods,
        computed: {
            isLocationSelected() {
                return this.marker !== null;
            },

            isPolygonDrawn() {
                return this.drawing_polygon !== null && this.drawing_coords.length > 3;
            },

            filteredSpecies() {
                if (this.searched.trim() === "") {
                    return [];
                }
                return this.all_species.filter((species) =>
                    species.COMMON_NAME.includes(this.searched.toLowerCase())
                );
            },

            filteredHeatmapData() {
                if (!this.selected_species) {
                    return [];
                }
                return this.heatmapData
                    .filter((sighting) => sighting[0] !== null && sighting[1] !== null)
                    .filter((sighting) => sighting[3] === this.selected_species.id);
            }
        },
        mounted() {
            this.load_data();
        },
    });

    app.vue.mount("#vue-target");
};

init(app);
