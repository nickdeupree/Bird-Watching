"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data: function() {
        return {
            user_email: null,
            user_stats: [],

        };
    },
    methods: {

    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(load_user_stats_url).then(function (r) {
        app.vue.user_email = r.data.user_email;
        app.vue.user_stats = r.data.user_stats;
        console.log('stats are ', app.vue.user_stats);
        console.log('stats should be ', r.data.user_stats);
    });
    console.log('stats are ', app.vue.user_stats);
    // console.log('stats are ', r.data.user_stats);
};

app.load_data();