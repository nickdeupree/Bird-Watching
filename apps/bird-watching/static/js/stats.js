"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data: function() {
        return {

        };
    },
    methods: {

    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    // Initialize the chart
};

app.load_data();