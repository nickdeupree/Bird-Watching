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
        map: null,
        drawing_polygon: null,
        drawing_coords: [],
        polygon: null,
        searched: '',
        selected_species: null,
        all_species: [],
        heatmapData: [],
        heatmapLayer: null,
        marker: null
    };

    app.enumerate = (a) => {
        let k = 0;
        a.map((e) => { e._idx = k++; });
        return a;
    };

    app.methods = {
        toggleDrawing: function () {
            if (this.is_drawing === false) {
                if (this.drawing_polygon) {
                    this.drawing_polygon.remove();
                    this.drawing_polygon = null;
                }
            }

            this.is_drawing = !this.is_drawing;
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
                });
            } else {
                if (this.drawing_polygon) {
                    axios.post(save_user_polygon_url, {
                        polygon_coords: this.drawing_coords
                    }).then(() => {
                        console.log("Polygon saved successfully!");
                    });
                }

                this.map.off('click');
            }
        },
        selectLocation: function () {
            let selectPointHandler = (e) => {
                let { lat, lng } = e.latlng;
                
                if (this.marker != null){
                    this.map.removeLayer(this.marker);
                    this.marker = null;
                }

                this.marker = L.marker([lat, lng]).addTo(this.map);
               
                axios.post(save_user_point_url, {
                    lat: lat,
                    lng: lng,
                }).then(response => {
                    console.log('Point saved:', response);
                }).catch(error => {
                    console.error('Error saving point:', error);
                });
                this.map.off('click', selectPointHandler);
            };
            alert("Click on the map to select a location.");
            this.map.on('click', selectPointHandler);
        },

        updateSelectedSpecies: function () {
            console.log(this.searched)
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

        selectSpecies: function (species) {
            this.selected_species = species;
            this.searched = species.COMMON_NAME;
            console.log('Selected species updated to:', this.selected_species);

            this.updateHeatmap();
        },

        updateHeatmap() {
            // Removing the existing heatmap layer
            if (this.heatLayer) {
                this.map.removeLayer(this.heatLayer);
                this.heatLayer = null;
            }
            // Only adding the heatmap layer if there is filtered data
            if (this.filteredHeatmapData.length > 0) {
                console.log(this.filteredHeatmapData)
                let heatmapLayerData = this.filteredHeatmapData.map(item => item.slice(0, 3));  // Get only the first 3 values
                console.log(heatmapLayerData)
                this.heatLayer = L.heatLayer(heatmapLayerData, { radius: 25 }).addTo(this.map);
            } else {
                console.error("No valid heatmap data for the selected species.");
            }
        },

        load_data: function () {
            let self = this;
            axios.get(load_species_url).then((r) => {
                self.all_species = r.data.all_species;
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

                setTimeout(() => {
                    self.map = L.map("map").setView([36.98, -121.98], 13);
                    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                        maxZoom: 19,
                        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    }).addTo(self.map);

                    if (self.heatmapData.length > 0) {
                        let heatmapLayerData = self.heatmapData.map(item => item.slice(0, 3));  // Get only the first 3 values
                        this.heatLayer = L.heatLayer(heatmapLayerData, { radius: 25 }).addTo(self.map);
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
                    .filter((sighting) => sighting[0] !== null && sighting[1] !== null) // Check for valid latitude/longitude
                    .filter((sighting) => sighting[3] === this.selected_species.id); // Check species ID match
            }
        },
        mounted() {
            this.load_data();
        },
    });

    app.vue.mount("#vue-target");
};

init(app);
