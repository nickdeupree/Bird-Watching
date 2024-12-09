"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data: function() {
        return {
            user_email: null,
            species_list: [],

        };
    },
    methods: {

    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(load_user_stats_url).then(function (r) {
        app.vue.user_email = r.data.user_email;
        app.vue.species_list = r.data.species_list;
        console.log('stats are ', app.vue.species_list);
        console.log('stats should be ', r.data.species_list);
    });
};

app.load_data();