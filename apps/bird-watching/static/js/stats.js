"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.load_data = function () {
    axios.get(load_user_stats_url).then(function (r) {
        app.vue.user_email = r.data.user_email;
        app.vue.species_list = r.data.species_list;
        app.vue.total_species = r.data.total_species;
        app.vue.sighting_stats = r.data.sighting_stats;
        app.vue.total_birds = r.data.total_birds;
        app.vue.distinct_species = r.data.distinct_species;
        app.vue.distinct_locations = r.data.distinct_locations;
        console.log('total birds should be', r.data.total_birds);
        console.log('total birds is', app.vue.total_birds);
        console.log('total birds is', app.vue.distinct_species);
        console.log('total birds is', app.vue.distinct_locations);
        app.vue.is_loading = false; // Set is_loading to false
        app.vue.update_species_chart(); // Update the chart with the loaded data
    }).catch(function (error) {
        console.error("Error loading data:", error);
        app.vue.is_loading = false;  // Ensure the loading state is set to false even if there's an error
    });
};

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
            is_loading: true,

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
            }
            return [];
        }
    },
    mounted() {
        app.load_data();
    },
    watch: {
        // selected_species(newSpecies, oldSpecies) {
        //     console.log("Selected species changed:", newSpecies);
        //     this.update_species_chart();  // Update chart when a species is selected
        // }
    },
    methods: {
        select_species: function(species) {
            if (this.selected_species === species) {
                console.log("same species is clicked", this.selected_species)
                this.selected_species = null;
            } else {
                console.log("new species is chosen", this.selected_species)
                this.selected_species = species;
            }
            this.update_species_chart(); 
            // console.log("species is", species);
            // this.selected_species = species;
            // this.update_species_chart();  // Update chart when a species is selected
        },

        get_total_observations_by_species: function() {
            // Find the species in total_species that matches selected_species COMMON_NAME
            console.log("Selected Species:", this.selected_species);
            console.log("Total Species Array:", this.total_species);

            const species = this.total_species.find(s => s.species.COMMON_NAME === this.selected_species.COMMON_NAME);
            console.log("species is", species);
            console.log("this.selected species is", this.selected_species);

            // Return the total_observations of the matching species, or 0 if not found
            const total_observations = species ? species.total_observations : 0;
            console.log("Total Observations:", total_observations);

            return total_observations;

        },

        // reset_to_total_sightings: function() {
        //     console.log("Resetting to total sightings view.");
        //     this.selected_species = null;  // Reset selected species
        //     this.update_species_chart();   // Update the chart to show total sightings
        // },

        update_species_chart: function() {
            if (this.is_loading) {
                console.log("Data is still loading...");
                return; // Prevent chart update until data is loaded
            }
        
            let sightings;
            
            // Check if a species is selected
            if (this.selected_species) {
                sightings = this.selected_species_sightings;  // Filtered sightings for the selected species
                console.log("Filtered sightings for species:", sightings);
            } else {
                sightings = this.sighting_stats;  // Use all sightings if no species is selected
                console.log("All sightings:", sightings);
            }
        
            if (sightings.length === 0) {
                console.log("No sightings available for the chart.");
                return;  // Don't render the chart if there's no data
            }
        
            const canvas = document.getElementById('speciesChart');
            if (!canvas) {
                console.error("Canvas element not found!");
                return;
            }
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error("Canvas context is invalid.");
                return;
            }
        
            // Destroy the old chart if it exists
            if (this.chart_instance) {
                console.log("Destroying previous chart...");
                this.chart_instance.destroy();
            }
        
            // Aggregate sightings by Month Year (e.g., "January 2021") and sum OBSERVATION_COUNT
            const monthYearCounts = {};
        
            sightings.forEach(sighting => {
                const date = new Date(sighting.checklist.OBSERVATION_DATE);
                
                // Format the date to "Month YYYY" (e.g., "January 2021")
                const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' }); // "January 2021"
                
                // Add the observation count for the sighting (instead of just counting sightings)
                const observationCount = sighting.sightings.OBSERVATION_COUNT;
                
                // Sum the OBSERVATION_COUNT for each month-year
                if (monthYearCounts[monthYear]) {
                    monthYearCounts[monthYear] += observationCount;
                } else {
                    monthYearCounts[monthYear] = observationCount;
                }
            });
        
            // Prepare the data for the chart
            const labels = Object.keys(monthYearCounts);  // Get the "Month YYYY" labels
            const data = Object.values(monthYearCounts);  // Get the sum of observation counts for each month-year
        
            // Sort the dates chronologically by month-year
            labels.sort((a, b) => new Date(a) - new Date(b));
        
            // Create the Chart.js instance
            this.chart_instance = new Chart(ctx, {
                type: 'bar',  // Change chart type to 'bar'
                data: {
                    labels: labels,  // Dates (Month YYYY) on x-axis
                    datasets: [{
                        label: this.selected_species ? `Sightings of ${this.selected_species.COMMON_NAME}` : 'Total Sightings',
                        data: data,  // Sum of observation counts on y-axis
                        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Bar color
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Month Year',
                            },
                            type: 'category',  // Treat the dates as categories
                            labels: labels,  // Month Year labels on the x-axis
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
    }
};

app.vue = Vue.createApp(app.data).mount("#app");
