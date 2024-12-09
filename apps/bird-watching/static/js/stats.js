"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data: function() {
        return {
            user_email: null,
            species_list: [],
            total_species: [],
            sighting_stats: [],
            search_query: '',

        };
    },
    computed: {
        filtered_species_list: function() {
            let query = this.search_query.toLowerCase();
            return this.species_list.filter(species => {
                return species.COMMON_NAME.toLowerCase().includes(query);
            });
        }
    },
    methods: {
        // filter_species: function () {
        //     let query = this.search_query.toLowerCase();
        //     return this.species_list.filter(species => {
        //         return species.COMMON_NAME.toLowerCase().includes(query);
        //     });
        // }

    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(load_user_stats_url).then(function (r) {
        app.vue.user_email = r.data.user_email;
        // app.vue.species_list = r.data.species_list;
        app.vue.species_list = r.data.species_list.map(function(species) {
            species.COMMON_NAME = species.COMMON_NAME.replace(/\s*sp\.$/, ''); // Regex to match " sp."
            return species;
        });
        app.vue.total_species = r.data.total_species;
        app.vue.sighting_stats = r.data.sighting_stats;
        console.log('total species are ', app.vue.total_species);
        console.log('total species should be ', r.data.total_species);
    });
};

app.load_data();