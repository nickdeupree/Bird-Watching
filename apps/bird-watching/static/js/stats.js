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
            total_birds: 0,
            distinct_species: 0,
            distinct_locations: 0,
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
    mounted() {
        // Call the chart update when the component is mounted
        this.update_total_sightings_chart();
    },
    watch: {
        // Watch sighting_stats to update the chart whenever it changes
        sighting_stats: function() {
            this.update_total_sightings_chart();
        }
    },
    methods: {
        select_species: function(species) {
            console.log("species is", species);
            this.selected_species = species;
            this.update_species_chart();  // Update chart when a species is selected
        },

        get_total_observations_by_species: function() {
            // Find the species in total_species that matches selected_species COMMON_NAME
            console.log("Selected Species:", this.selected_species);
            console.log("Total Species Array:", this.total_species);

            // const species = this.total_species.find(s => s.species.COMMON_NAME === this.selected_species);
            // console.log("Found Species:", species);
            // const total_observations = this.total_species.find(s => s.species.COMMON_NAME === this.selected_species)?.total_observations || 0;
            // console.log("total observations are", total_observations);
            const species = this.total_species.find(s => s.species.COMMON_NAME === this.selected_species.COMMON_NAME);
            console.log("species is", species);
            console.log("this.selected species is", this.selected_species);

            // Return the total_observations of the matching species, or 0 if not found
            const total_observations = species ? species.total_observations : 0;
            console.log("Total Observations:", total_observations);

            return total_observations;


            // return species ? species.total_observations : 0;
        },

        update_species_chart: function() {
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
        },

        update_total_sightings_chart: function() {
            const sightings = this.sighting_stats;
            console.log("All sightings:", sightings);

            if (this.totalSightingsChart_instance) {
                this.totalSightingsChart_instance.destroy();  // Destroy the old chart instance
            }

            // Aggregate sightings by date for the total chart
            const dateCounts = {};

            sightings.forEach(sighting => {
                const date = sighting.checklist.OBSERVATION_DATE;

                if (dateCounts[date]) {
                    dateCounts[date] += 1;  // Increment count for this date
                } else {
                    dateCounts[date] = 1;  // First sighting for this date
                }
            });

            // Prepare the data for the total sightings chart
            const labels = Object.keys(dateCounts);  // Get the dates
            const data = Object.values(dateCounts);  // Get the counts

            // Optionally, sort the dates (chronologically)
            labels.sort((a, b) => new Date(a) - new Date(b));

            // Create the total sightings Chart.js instance
            const ctx = document.getElementById('totalSightingsChart').getContext('2d');
            this.totalSightingsChart_instance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,  // Dates on x-axis
                    datasets: [{
                        label: 'Total Sightings of Birds',
                        data: data,  // Number of sightings on y-axis
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0)', // No fill under the curve
                        fill: false,  // No fill under the curve
                        tension: 0.1,  // Smooth the curve
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            },
                            type: 'category', // x-axis treats labels as categories (dates)
                            ticks: {
                                autoSkip: true,  // Skip labels if too many
                                maxRotation: 90, // Rotate labels for better readability
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Number of Birds'
                            },
                            beginAtZero: true
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
        app.vue.total_birds = r.data.total_birds;
        app.vue.distinct_species = r.data.distinct_species;
        app.vue.distinct_locations = r.data.distinct_locations;
        console.log('total species are ', app.vue.total_species);
        console.log('total species should be ', r.data.total_species);
        console.log('total birds is', app.vue.total_birds);
        console.log('total birds is', app.vue.distinct_species);
        console.log('total birds is', app.vue.distinct_locations);
    });
};

app.load_data();