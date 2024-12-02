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
    };

    app.enumerate = (a) => {
        let k = 0;
        a.map((e) => { e._idx = k++; });
        return a;
    };

    app.computed = {
        filteredSpecies() {
            return this.all_species.filter(species =>
                species.toLowerCase().includes(this.searched.toLowerCase())
            );
        }
    };

    app.methods = {
        toggleDrawing: function () {
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
                    this.drawing_polygon = null;

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
                L.marker([lat, lng]).addTo(this.map)
                axios.post(save_user_point_url, {
                    coord: [lat,lng],
                })
                    .then(() => {
                        console.log("Point saved successfully!");
                    })
                this.map.off('click', selectPointHandler); // Remove the click event listener after selection
            };
            alert("Click on the map to select a location.");
            this.map.on('click', selectPointHandler);
        },

        updateSpecies: function () {
            console.log('Species name entered:', this.searched);
        },


    };

    app.vue = Vue.createApp({
        data() {
            return app.data;
        },
        methods: app.methods,
        mounted() {
            setTimeout(() => {
                this.map = L.map("map").setView([34, -118], 13);
                L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    maxZoom: 19,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                }).addTo(this.map);

                L.heatLayer(this.heatmapData, { radius: 25 }).addTo(this.map);
            }, 100); // adding slight delay to help with rendering
        },
    });

    // Mount the Vue app to the target element.
    app.vue.mount("#vue-target");
};

init(app);

app.load_data = function () {
    console.log("in here")
    let self = this;
    axios.get(load_species_url).then((r) => {
        // self.heatmapData = r.data.species;
        self.heatmapData = r.data.species.map((sighting) => {
            return [
                sighting.latitude,  
                sighting.longitude, 
                sighting.observation_count
            ];
        });
        console.log("heatmap", self.heatmapData)

        if (self.heatmapData && self.heatmapData.length > 0) {
            L.heatLayer(self.heatmapData, { radius: 25 }).addTo(self.map);
        } else {
            console.error("No valid heatmap data found.");
        }
       
    });
}

app.load_data();
