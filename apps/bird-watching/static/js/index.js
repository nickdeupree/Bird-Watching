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
    };

    app.enumerate = (a) => {
        let k = 0;
        a.map((e) => { e._idx = k++; });
        return a;
    };

    app.methods = {
        toggle_drawing() {
            this.is_drawing = !this.is_drawing;
        },
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

// This takes the (empty) app object, and initializes it.
init(app);
