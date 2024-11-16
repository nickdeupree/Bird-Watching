"use strict";


// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data: function () {
        return {
            // Complete as you see fit.
            my_value: 1, // This is an example.
            center: {  lat: -34.397, lng: 150.644 }
        };
    },
    methods: {
        // Complete as you see fit.
        my_function: function () {
            // This is an example.
            this.my_value += 1;
        },

        initMap: async function () {
            const { Map } = await google.maps.importLibrary("maps");

            this.map = new Map(document.getElementById("map"), {
                center: { lat: -34.397, lng: 150.644 },
                zoom: 8,
            });
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

