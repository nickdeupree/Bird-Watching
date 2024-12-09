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
            selected_species: null,  // Store selected species
            chart_instance: null,     // Store Chart.js instance

        };
    },
    computed: {
        filtered_species_list: function() {
            let query = this.search_query.toLowerCase();
            return this.species_list.filter(species => {
                return species.COMMON_NAME.toLowerCase().includes(query);
            });
        },
        selected_species_sightings: function() {
            if (this.selected_species) {
                return this.sighting_stats.filter(sighting => sighting.species === this.selected_species.COMMON_NAME);
            }
            return [];
        }
    },
    methods: {
        select_species: function(species) {
            this.selected_species = species;
            this.update_chart();  // Update chart when a species is selected
        },

        update_chart: function() {
            const sightings = this.selected_species_sightings;
            if (this.chart_instance) {
                this.chart_instance.destroy();  // Destroy the old chart instance
            }

            // Prepare data for Chart.js
            const labels = [];
            const data = [];

            sightings.forEach(sighting => {
                const date = sighting.OBSERVATION_DATE;
                console.log("date is", date);
                if (!labels.includes(date)) {
                    labels.push(date);
                    data.push(1);  // First sighting on this date
                } else {
                    const index = labels.indexOf(date);
                    data[index] += 1;  // Increment sightings for this date
                }
            });

            // Create the Chart.js instance
            const ctx = document.getElementById('speciesChart').getContext('2d');
            this.chart_instance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,  // Dates on x-axis
                    datasets: [{
                        label: `Sightings of ${this.selected_species.COMMON_NAME}`,
                        data: data,  // Number of sightings on y-axis
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true,
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Date',
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Number of Sightings',
                            },
                            beginAtZero: true,
                        }
                    }
                }
            });
        }
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
        app.vue.species_list = r.data.species_list;
        // app.vue.species_list = r.data.species_list.map(function(species) {
        //     species.COMMON_NAME = species.COMMON_NAME.replace(/\s*sp\.$/, ''); // Regex to match " sp."
        //     return species;
        // });
        app.vue.total_species = r.data.total_species;
        app.vue.sighting_stats = r.data.sighting_stats;
        console.log('total species are ', app.vue.total_species);
        console.log('total species should be ', r.data.total_species);
    });
};

app.load_data();