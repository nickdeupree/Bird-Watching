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
                console.log("Selected species:", this.selected_species);
        
                // Filter sightings by comparing species.COMMON_NAME to the selected species
                const filtered_sightings = this.sighting_stats.filter(sighting => {
                    return sighting.species.COMMON_NAME === this.selected_species.COMMON_NAME;
                });
                
                console.log("Filtered list of sightings:", filtered_sightings);
                return filtered_sightings;
                // console.log("selected species is", this.selected_species);
                // console.log("filtered list is",this.sighting_stats.filter(sighting => sighting.species === this.selected_species.COMMON_NAME));
                // return this.sighting_stats.filter(sighting => sighting.species === this.selected_species.COMMON_NAME);
            }
            return [];
        }
    },
    methods: {
        select_species: function(species) {
            console.log("species is", species);
            this.selected_species = species;
            this.update_chart();  // Update chart when a species is selected
        },

        update_chart: function() {
            const sightings = this.selected_species_sightings;
            console.log("Filtered sightings for species:", sightings);
        
            if (this.chart_instance) {
                this.chart_instance.destroy();  // Destroy the old chart instance
            }
        
            // Aggregate sightings by date
            const dateCounts = {};
        
            sightings.forEach(sighting => {
                const date = sighting.checklist.OBSERVATION_DATE;
        
                if (dateCounts[date]) {
                    dateCounts[date] += 1;
                } else {
                    dateCounts[date] = 1;
                }
            });
        
            // Prepare the data for the chart
            const labels = Object.keys(dateCounts);  // Get the dates
            const data = Object.values(dateCounts);  // Get the counts
        
            // Optionally, sort the dates (chronologically)
            labels.sort((a, b) => new Date(a) - new Date(b));
        
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
                        fill: false,
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
                            type: 'category',  // Treat the dates as categories
                            labels: labels,  // Dates on the x-axis
                            ticks: {
                                autoSkip: true,  // Skip labels if needed
                                maxRotation: 90, // Rotate labels for better readability
                            }
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