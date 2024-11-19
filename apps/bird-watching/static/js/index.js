"use strict";


// This will be the object that will contain the Vue attributes
// and be used to initialize it.

const MapComponent = {
    template: `
        <div id="map" style="height: 500px; width: 100%;"></div>
    `,
    data() {
        return {
            map: null, // The Leaflet map instance
        };
    },
    methods: {
        click_listener(e) {
            console.log("Map clicked at", e.latlng);
        },
        dbclick_listener(e) {
            console.log("Map double-clicked at", e.latlng);
        },
    },
    mounted() {
        this.map = L.map("map").setView([51.505, -0.09], 13);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(this.map);

        this.map.on("click", this.click_listener);
        this.map.on("dblclick", this.dbclick_listener);
    },
    beforeUnmount() {
        if (this.map) {
            this.map.off("click", this.click_listener);
            this.map.off("dblclick", this.dbclick_listener);
            this.map.remove();
        }
    },
};

let app = {};

app.data = {
    data: function () {
        return {
            // Complete as you see fit.
            my_value: 1, // This is an example.
        };
    },
    methods: {
        // Complete as you see fit.
        my_function: function () {
            // This is an example.
            this.my_value += 1;
        }

    },

    components: {
        MapComponent
    }
};



app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(my_callback_url).then(function (r) {
        app.vue.my_value = r.data.my_value;
    });
}

app.load_data();

