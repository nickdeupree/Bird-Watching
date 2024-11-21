"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data: function() {
        return {
            speciesList: [],
            topContributors: [],
            selectedSpecies: null,
            chart: null ,
            totalLists: 0,
            totalSightings: 0
        };
    },
    methods: {
        go_back() {
            window.history.back();
        },
        selectSpecies(species) {
            this.selectedSpecies = species;
            this.loadSpeciesChart();
        },
        loadSpeciesChart() {
            // Data points for y = x + 1
            const xValues = [0, 1, 2, 3, 4, 5];
            const yValues = xValues.map(x => x + 1);

            const ctx = document.getElementById('myChart').getContext('2d');

            if (this.chart) {
                // Update existing chart data
                this.chart.data.labels = xValues;
                this.chart.data.datasets[0].data = yValues;
                this.chart.update();
            } else {
                // Create new chart
                this.chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: xValues,
                        datasets: [{
                            label: 'y = x + 1',
                            data: yValues,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            fill: false
                        }]
                    },
                    options: {
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'x'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'y'
                                }
                            }
                        }
                    }
                });
            }
        }
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    // Initialize the chart
    this.vue.loadSpeciesChart();
};

app.load_data();