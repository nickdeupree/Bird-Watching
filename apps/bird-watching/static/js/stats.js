"use strict";

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
        app.vue.is_loading = false; // Set is_loading to false
        app.vue.update_species_chart(); // Update the chart with the loaded data
    }).catch(function (error) {
        console.error("Error loading data:", error);
        app.vue.is_loading = false; // Set loading state to false even with error
    });
};

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

app.data = {
    data: function() {
        return {
            user_email: null,
            species_list: [], // list for all of the species 
            total_species: [], // list of species and their total counts
            sighting_stats: [], // list of user sighting stats, including date, species, and # of sightings
            total_birds: 0, // total overall number of birds
            distinct_species: 0, // total number of distinct species 
            distinct_locations: 0, // total number of locations
            search_query: '', // for the search bar for species list
            selected_species: null,  // flag for current selected species from list
            chart_instance: null, // for the chart that is displayed
            is_loading: true,

        };
    },
    computed: {
        // Filter the species list to show what's displayed 
        filtered_species_list: function() {
            let query = this.search_query.toLowerCase();
            return this.species_list.filter(species => {
                return species.COMMON_NAME.toLowerCase().includes(query);
            });
        },
        // Filter sighting stats to show stats for the selected species  
        selected_species_sightings: function() {
            if (this.selected_species) {
                console.log("Selected species:", this.selected_species);
        
                // Filter sightings by comparing species.COMMON_NAME to the selected species
                const filtered_sightings = this.sighting_stats.filter(sighting => {
                    return sighting.species.COMMON_NAME === this.selected_species.COMMON_NAME;
                });
                
                return filtered_sightings;
            }
            return [];
        }
    },
    mounted() {
        app.load_data();
    },
    methods: {
        // Method used to toggle species buttons
        select_species: function(species) {
            if (this.selected_species === species) {
                console.log("same species is clicked", this.selected_species)
                this.selected_species = null;
            } else {
                console.log("new species is chosen", this.selected_species)
                this.selected_species = species;
            }
            this.debounced_update_species_chart(); 
        },

        // Method for finding the total number of observations for a species
        get_total_observations_by_species: function() {
            // Find the species in total_species that matches selected_species COMMON_NAME
            const species = this.total_species.find(s => s.species.COMMON_NAME === this.selected_species.COMMON_NAME);
            // Return the total_observations of the matching species, or 0 if not found
            const total_observations = species ? species.total_observations : 0;
            console.log("Total Observations:", total_observations);
            return total_observations;

        },

        debounced_update_species_chart: debounce(function(speciesName) {
            if (!this.isLoading){
                this.update_species_chart();
            }
        }, 1000),

        // Method used to update chart 
        update_species_chart: function() {

            // Check to see if chart is still loading
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
                sightings = this.sighting_stats;  // Display data for all sightings if no data is selected
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
        
            const monthYearCounts = {};
        
            // Extract data from list of sightings data for graph
            sightings.forEach(sighting => {
                const date = new Date(sighting.checklist.OBSERVATION_DATE);
                
                const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' }); // Format to Month YYYY
                
                const observationCount = sighting.sightings.OBSERVATION_COUNT; // Get observation count of sighting
                
                // Add to observation count for each month YYYY
                if (monthYearCounts[monthYear]) {
                    monthYearCounts[monthYear] += observationCount;
                } else {
                    monthYearCounts[monthYear] = observationCount;
                }
            });
        
            const labels = Object.keys(monthYearCounts);  // x-axis data
            const data = Object.values(monthYearCounts);  // y-axis data
        
            labels.sort((a, b) => new Date(a) - new Date(b)); // Sort dates chronologically
        
            // Create the Chart instance
            this.chart_instance = new Chart(ctx, {
                type: 'bar', 
                data: {
                    labels: labels, 
                    datasets: [{
                        label: this.selected_species ? `Sightings of ${this.selected_species.COMMON_NAME}` : 'Total Sightings',
                        data: data,  
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
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
                            type: 'category',  
                            labels: labels,  
                            ticks: {
                                autoSkip: true,  
                                maxRotation: 90, 
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
