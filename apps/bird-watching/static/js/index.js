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
        toggle_drawing() {
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
                    this.polygon = this.drawing_polygon;
                    this.drawing_polygon = null;
                }

                this.map.off('click');
            }
        },

        updateSpecies() {
            console.log('Species name entered:', this.searched);
        },

        clickChecklist() {
            console.log('Checklist button clicked');
        }
    };

    app.vue = Vue.createApp({
        data() {
            return app.data;
        },
        methods: app.methods,
        mounted() {
            // Add a timeout to initialize the map after 2 seconds
            setTimeout(() => {
                this.map = L.map("map").setView([51.505, -0.09], 13);
                L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    maxZoom: 19,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                }).addTo(this.map);
            }, 100); // adding slight delay to help with rendering
        },
    });

    // Mount the Vue app to the target element.
    app.vue.mount("#vue-target");
};

init(app);

app.load_data = function () {
    axios.get(load_species_url).then((r) => {
        app.data.all_species = r.data.species;

    });
}

app.load_data();
