"use strict";


// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data: function () {
        return {
            // Complete as you see fit.
            my_value: 1, // This is an example.
            map: undefined,
        };
    },
    methods: {
        // Complete as you see fit.
        my_function: function () {
            // This is an example.
            this.my_value += 1;
        },

        initMap: function() {
            this.map = L.map('map').setView(this.center, this.zoom);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(this.map);
        },
        mounted: function() {
            this.initMap();
        }

    },
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(my_callback_url).then(function (r) {
        app.vue.my_value = r.data.my_value;
    });
}

app.load_data();

