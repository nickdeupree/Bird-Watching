"use strict";

let app = {};

// add delay to function calls. 
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

app.vue = Vue.createApp({
    data() {
        return {
            speciesList: [],
            topContributors: [],
            totalLists: 0,
            totalSightings: 0,
            polygonCoords: [],
            checklists: [],
            selectedSpecies: null,
            chart: null,
        };
    },
    methods: {
        resetChart() {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
        },
        // create and display a chart for a specific species
        loadSpeciesChart(speciesName) {
            if (this.isLoading) return;
            this.isLoading = true;
            this.selectedSpecies = speciesName;

            axios.post(get_species_sightings_over_time_url, { species_name: speciesName })
                .then(response => {
                    const data = response.data.data;
                    const dates = data.map(item => item.date);
                    const counts = data.map(item => item.count);

                    const ctx = document.getElementById('myChart')?.getContext('2d');
                    if (!ctx) {
                        console.error('Canvas context is not available');
                        return;
                    }

                    this.resetChart();

                    this.chart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: [{
                                label: `Sightings of ${speciesName} over time`,
                                data: counts,
                                borderColor: 'rgba(75, 192, 192, 1)',
                                fill: false
                            }]
                        },
                        options: {
                            scales: {
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Date'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Number of Birds'
                                    }
                                }
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error('Error fetching species sightings:', error);
                })
                .finally(() => {
                    this.isLoading = false; 
                });
        },
        // create and display a chart for all species in the selected location
        loadTotalSightingsChart() {
            if (this.isLoading) return;
            this.isLoading = true;
            this.selectedSpecies = "Total Species Sightings";
        
            const sightingsByDate = {};
        
            this.checklists.forEach(checklist => {
                const date = checklist.OBSERVATION_DATE;
                sightingsByDate[date] = 0;
            });
        
            if (this.sightings && this.sightings.length > 0) {
                this.sightings.forEach(sighting => {
                    const sightingId = String(sighting.sightings.SAMPLING_EVENT_IDENTIFIER).trim();
                    
                    const matchingChecklists = this.checklists.filter(
                        c => String(c.SAMPLING_EVENT_IDENTIFIER).trim() === sightingId
                    );
                    
                    if (matchingChecklists.length > 0) {
                        const checklist = matchingChecklists[0];
                        const date = checklist.OBSERVATION_DATE;
                        if (!sightingsByDate[date]) {
                            sightingsByDate[date] = 0;
                        }
                        sightingsByDate[date] += 1;
                    } else {
                        console.warn('No matching checklist for sighting:', sighting);
                        console.log('Sighting Identifier:', sightingId);
                        console.log('Available Checklist Identifiers:', this.checklists.map(c => String(c.SAMPLING_EVENT_IDENTIFIER).trim()));
                    }
                });
            }
        
        
            const dates = Object.keys(sightingsByDate).sort();

            const counts = dates.map(date => sightingsByDate[date]);
        
            const ctx = document.getElementById('myChart').getContext('2d');
            
            this.resetChart();
        
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Total Species Sightings by Date',
                        data: counts,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        fill: false
                    }]
                },
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Number of Species Sightings'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
            
            this.isLoading = false;
        },
        debouncedLoadSpeciesChart: debounce(function(speciesName) {
            if (!this.isLoading){
                this.loadSpeciesChart(speciesName);
            }
        }, 1000),
        debouncedLoadTotalChart: debounce(function() {
            if (!this.isLoading){
                this.loadTotalSightingsChart();
            }
        }, 1000),
        handleSpeciesClick(speciesName) {
            if (speciesName === this.selectedSpecies) {
                this.debouncedLoadTotalChart();
            }
            else {
                this.debouncedLoadSpeciesChart(speciesName);
            }
        },
        fetchTopContributors() {
            const lats = this.polygonCoords.map(coord => coord[0]);
            const lngs = this.polygonCoords.map(coord => coord[1]);
            
            const min_lat = Math.min(...lats);
            const max_lat = Math.max(...lats);
            const min_lng = Math.min(...lngs);
            const max_lng = Math.max(...lngs);
    
            axios.post(get_top_contributors_url, {
                min_lat: min_lat,
                max_lat: max_lat,
                min_lng: min_lng,
                max_lng: max_lng
            })
            .then(response => {
                this.topContributors = response.data.contributors;
            })
            .catch(error => {
                console.error('Error fetching top contributors:', error);
            });
        },
        fetchChecklists() {
            if (this.polygonCoords.length === 0) {
                return;
            }
        
            const lats = this.polygonCoords.map(coord => coord[0]);
            const lngs = this.polygonCoords.map(coord => coord[1]);
        
            const min_lat = Math.min(...lats);
            const max_lat = Math.max(...lats);
            const min_lng = Math.min(...lngs);
            const max_lng = Math.max(...lngs);
            console.log('Bounding box:', min_lat, max_lat, min_lng, max_lng);
        
            axios.post(find_locations_in_range_url, {
                params: {
                    min_lat: min_lat,
                    max_lat: max_lat,
                    min_lng: min_lng,
                    max_lng: max_lng
                }
            })
            .then(response => {
                this.checklists = response.data.checklists;
                console.log('Checklists fetched:', this.checklists);
                this.processChecklists();
                this.fetchTopContributors();
            })
            .catch(error => {
                console.error('Error fetching checklists:', error);
            });
        },
        // Get relevant sighting and species data from the checklist
        processChecklists() {
            this.totalLists = this.checklists.length;
        
            const identifiers = this.checklists.map(cl => cl.SAMPLING_EVENT_IDENTIFIER);
        
            axios.post(get_sightings_for_checklist_url, {
                identifiers: identifiers
            })
            .then(response => {
                console.log("data received", response.data);
                const sightings = response.data.sightings;
                this.totalSightings = sightings.length;
                this.sightings = sightings;
                const speciesSet = new Set(sightings.map(s => s.COMMON_NAME));
                this.speciesList = Array.from(speciesSet);
                
                this.debouncedLoadTotalChart();
            })
            .catch(error => {
                console.error('Error fetching sightings:', error);
            });
        }
    },
    mounted() {
        // Get the coordinates of the polygon
        axios.get(load_user_polygon_url)
            .then(response => {
                this.polygonCoords = response.data.polygon_coords;
                console.log('Polygon loaded:', this.polygonCoords);
                this.fetchChecklists();
            })
            .catch(error => {
                console.error('Error loading user polygon:', error);
            });
    },
}).mount("#app");
