"use strict";


// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data: function () {
        return {
            // Complete as you see fit.
            checklists: [], // should be a nested array so that each item in checklist is a individual checklist
            user_email: null,
            new_species: "",
            quantity: 0,
            event_id: null // which checklist is currently being worked on
        };
    },
    methods: {
        // Complete as you see fit.
        add_species: function () {
            let self = this;
            let time = this.getCurrentDateTime();
            axios.post(add_to_sightings_url, { // send to backend
                event_id: self.event_id,
                species_name: self.new_species,
                quantity: self.quantity,
                input_time: time
            }).then(function (r) {
                self.checklists[event_id].unshift({ // should update a single entry in checklists
                    id: r.data.id,
                    species_name: self.species_name,
                    quantity: self.quantity,
                    input_time: time,
                    user_email: r.data.user_email // unsure if necessary at the moment
                });
            });
        }
    },
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(load_sightings_url).then(function (r) {
        app.vue.event_id = r.data.event_id;
        app.vue.checklists[app.vue.event_id] = r.data.sightings;
    });
}

app.load_data();

