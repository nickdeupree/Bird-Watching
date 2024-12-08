"use strict";


// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data: function () {
        return {
            // Complete as you see fit.
            checklists: [], // should be a nested array so that each item in checklist is a individual checklist,
            checklist: [], // should be a single checklist
            filtered_checklist: [], // only show species that match search_species
            user_email: null,
            new_species: "",
            search_species: "",
            quantity: 0,
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
                quantity: self.quantity,
                input_time: time
            }).then(function (r) {
                self.checklist.unshift({ // should update a single entry in checklists
                    id: r.data.id,
                    species_name: self.new_species,
                    quantity: self.quantity,
                    input_time: time,
                    user_email: r.data.user_email // unsure if necessary at the moment
                });
                self.checklists[self.event_id] = self.checklist;
                console.log("added", self.new_species)
                self.new_species = "";
            });
        }, remove_item: function (idx) {
            let self = this;
            let species = this.checklist[idx];
            axios.post(remove_species_url, {
                id: species.id, // check if needs fixing
            }).then(function (r) {
                self.checklists[self.event_id].splice(idx, 1);
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
        app.vue.checklists[app.vue.event_id] = r.data.sightings;
        app.vue.checklist = app.vue.checklists[app.vue.event_id];
        app.vue.filtered_checklist = app.vue.checklist;
    });
}

app.load_data();

