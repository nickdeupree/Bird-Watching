"use strict";


// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data: function () {
        return {
            // Complete as you see fit.
            checklist: [], // should be a single checklist
            user_email: null,
            new_species: "",
            search_species: "",
            initial_quantity: 0,
            event_id: null // which checklist is currently being worked on
        };
    },
    methods: {
        // Complete as you see fit.
        add_species: function () {
            console.log("Adding species");
            let self = this;
            let time = this.getCurrentDateTime();
            axios.post(add_to_sightings_url, { // send to backend
                event_id: self.event_id,
                species_name: self.new_species,
                quantity: self._initial_quantity,
                input_time: time
            }).then(function (r) {
                self.checklist.unshift({ // should update a single entry in checklists
                    id: r.data.id,
                    species_name: self.new_species,
                    OBSERVATION_COUNT: self.initial_quantity,
                    input_time: time,
                    user_email: r.data.user_email // unsure if necessary at the moment
                });
                console.log("added", self.new_species)
                self.new_species = "";
                console.log(self.checklist)
            });
        }, update_quantity: function(idx, quantity) {
            let self = this;
            let species = this.checklist[idx];
            if (species.OBSERVATION_COUNT + quantity >= 0) {
                species.OBSERVATION_COUNT += quantity;
                axios.post(update_quantity_url, {
                    event_id: self.event_id,
                    species_id: species.id,
                    quantity: species.OBSERVATION_COUNT
                }).then(function (r) {
                    console.log("updated", species.species_name, "quantity to", species.OBSERVATION_COUNT);
                });
            }
        }, remove_item: function (idx) {
            let self = this;
            let species = this.checklist[idx];
            axios.post(remove_species_url, {
                event_id: self.event_id,
                species_id: species.id, // check if needs fixing
            }).then(function (r) {
                self.checklist.splice(idx, 1);
            });
        }, getCurrentDateTime: function () {
            const date = new Date();
            return date.toISOString().replace('T', ' ').split('.')[0];
        }, showModal: function () {
            document.getElementById("submitModal").classList.add("is-active");
        }, closeModal: function () {
            document.getElementById("submitModal").classList.remove("is-active");
        }
    }, 
    computed: {
        filter_species() {
            let self = this;
            if (this.search_species == "") {
                return this.checklist;
            } else {
                return this.checklist.filter((species) => {
                    return species.species_name.toLowerCase().includes(this.search_species.toLowerCase());
                });
            }
        },
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(load_sightings_url).then(function (r) {
        app.vue.event_id = r.data.event_id;
        app.vue.checklist = r.data.sightings;
    });
}

app.load_data();

