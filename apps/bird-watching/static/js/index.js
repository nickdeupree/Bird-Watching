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
        checklists: [],
        heatmapData: [],
        filteredSpecies: [],
    };

    app.enumerate = (a) => {
        let k = 0;
        a.map((e) => { e._idx = k++; });
        return a;
    };

    app.methods = {
        toggleDrawing: function () {
            if(this.is_drawing === false){
                if (this.drawing_polygon){
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
                    axios.post(save_user_polygon_url,
                        {
                            polygon_coords: this.drawing_coords
                        }
                    ).then(() => {
                        console.log("Polygon saved successfully!");
                    });
                }

                this.map.off('click');
            }
        },
        selectLocation: function () {
            let selectPointHandler = (e) => {
                let { lat, lng } = e.latlng;
                console.log(lat, lng)
                L.marker([lat, lng]).addTo(this.map)
                axios.post(save_user_point_url, {
                    coord: [lat, lng],
                })
                this.map.off('click', selectPointHandler);
            };
            alert("Click on the map to select a location.");
            this.map.on('click', selectPointHandler);
        },

        updateSelectedSpecies: function () {
            if (this.searched.trim()) {
                this.selected_species = this.searched.trim();
                console.log(`Selected species updated to: ${this.selected_species}`);
            }
        },

        selectSpecies: function(species) {
            this.selected_species = species;
            console.log(`Selected species updated to: ${this.selected_species}`);
        },

        updateFilteredSpecies: function () {
            // Update filteredSpecies dynamically based on the search query
            if (this.searched.trim() === "") {
                this.filteredSpecies = [];
            } else {
                this.filteredSpecies = this.all_species.filter((species) =>
                    species.COMMON_NAME.toLowerCase().includes(this.searched.toLowerCase())
                );
            }
        },


        load_data: function () {
            let self = this;
            axios.get(load_species_url).then((r) => {
                self.all_species = r.data.all_species
                console.log(self.all_species)
                self.heatmapData = r.data.species
                    .filter((sighting) => sighting.latitude !== null && sighting.longitude !== null)
                    .map((sighting) => {
                        return [
                            sighting.latitude,
                            sighting.longitude,
                            sighting.observation_count
                        ];
                    });

                console.log("heatmapData", self.heatmapData);
                setTimeout(() => {
                    self.map = L.map("map").setView([36.98, -121.98], 13);
                    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                        maxZoom: 19,
                        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    }).addTo(self.map);

                    if (self.heatmapData.length > 0) {
                        L.heatLayer(self.heatmapData, { radius: 25 }).addTo(self.map);
                    } else {
                        console.error("No valid heatmap data found.");
                    }
                }, 1); // Adding slight delay to help with rendering
            })

        },
    };

    app.vue = Vue.createApp({
        data() {
            return app.data;
        },
        methods: app.methods,
       
        mounted() {
            this.load_data();
        },
    });

    // Mount the Vue app to the target element.
    app.vue.mount("#vue-target");
};

init(app);