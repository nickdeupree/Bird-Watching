"use strict";

let app = {};

app.data = {
    data: function () {
        return {
            // Complete as you see fit.
            checklist: [], // should be a single checklist
            all_species: [], // should be a list of all species
            new_species: "",
            search_species: "", // species name searched by user
            initial_quantity: null, // quantity of species typed by user
            event_id: null, // which checklist is currently being worked on,
            max_char_width: 1, // width of the quantity field
            missing_species_name: false, // flag for missing species name
            checklist_empty: true, // flag for empty checklist
            showDropdown: false, // flag for showing species dropdown
            observation_date: null,
            observation_time: null,
            duration: null
        };
    },
    methods: {
        // Complete as you see fit.
        add_species: function () {
            let self = this;
            self.missing_species_name = false;
            if (self.new_species.trim() === "") {
                console.log("Species name was not inputted");
                self.missing_species_name = true;
                return;
            }

            if (self.initial_quantity == null) {
                self.initial_quantity = 1;
            }
            self.initial_quantity = Number(self.initial_quantity);
            let idx = this.checklist.findIndex(
                (item) => item.species_name.toLowerCase() === this.new_species.trim().toLowerCase()
            );

            if (idx !== -1) {
                console.log("Updating quantity");
                self.update_quantity(idx, self.initial_quantity - self.checklist[idx].OBSERVATION_COUNT);
                self.new_species = "";
                self.initial_quantity = null;
            } else {
                console.log("Adding species");
                axios.post(add_to_sightings_url, { // send to backend
                    event_id: self.event_id,
                    species_name: self.new_species.trim(),
                    quantity: self.initial_quantity
                }).then(function (r) {
                    self.checklist.unshift({ // should update a single entry in checklists
                        OBSERVATION_COUNT: self.initial_quantity,
                        SAMPLING_EVENT_IDENTIFIER: self.event_id,
                        id: r.data.id,
                        species_id: r.data.species_id,
                        species_name: self.new_species.trim()
                    });
                    console.log("added", self.new_species)
                    self.new_species = "";
                    self.initial_quantity = null;
                    self.checklist_empty = false;
                });
            }
            self.fixWidth();
        }, select_species: function (species) {
            let self = this;
            self.new_species = species.COMMON_NAME;
            self.showDropdown = false;
            this.$nextTick(() => {
                this.$refs.count.focus();
            });
        }, update_quantity: function (idx, quantity) {
            let self = this;
            let species = this.checklist[idx];
            if (species.OBSERVATION_COUNT + quantity >= 0) {
                species.OBSERVATION_COUNT += quantity;
                axios.post(update_quantity_url, {
                    event_id: self.event_id,
                    species_id: species.species_id,
                    quantity: species.OBSERVATION_COUNT
                }).then(function (r) {
                    console.log("updated", species.species_name, "quantity to", species.OBSERVATION_COUNT);
                });
            }
            self.fixWidth();
        }, remove_item: function (idx) {
            let self = this;
            let species = this.checklist[idx];
            axios.post(remove_species_url, {
                event_id: self.event_id,
                species_id: species.species_id,
            }).then(function (r) {
                try {
                    if (r.data == 'ok') {
                        self.checklist.splice(idx, 1);
                        if (self.checklist.length == 0) {
                            self.checklist_empty = true;
                        }
                    }
                } catch (e) {
                    console.log('failed to delete species')
                }
            });
            self.fixWidth();
        }, moveFocus: function (id) {
            this.$nextTick(() => {
                this.$refs[id].focus();
            });
        }, showModal: function () {
            let self = this;
            console.log(self.observation_date, self.observation_time, self.duration);
            axios.post(save_checklist_url, {
                event_id: self.event_id,
                observation_date: self.observation_date,
                observation_time: self.observation_time,
                duration: self.duration
            }).then(function (r) {
            });
            document.getElementById("submitModal").classList.add("is-active");
            window.addEventListener('keydown', this.handleEscapeKey);
        }, closeModal: function () {
            document.getElementById("submitModal").classList.remove("is-active");
            window.removeEventListener('keydown', this.handleEscapeKey);
        }, handleEscapeKey: function (e) {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        }, handleClickOutside(event) {
            const dropdown = this.$refs.dropdown;
            const input = this.$refs.species_input;
            if (dropdown && input) {
                if (!dropdown.contains(event.target) && !input.contains(event.target)) {
                    this.showDropdown = false;
                }
            }
        }, fixWidth: function () {
            let self = this;
            let width = '3ch';
            if (self.checklist.length > 0) {
                let maxQuantity = Math.max(...this.checklist.map(entry => entry.OBSERVATION_COUNT));
                width = `${Math.max(maxQuantity.toString().length, 3)}ch`;
            }
            self.max_char_width = width;
        }
    },
    computed: {
        filter_species() {
            let self = this;
            if (this.search_species == "") {
                return this.checklist;
            } else if (this.checklist.length == 0) {
                return [];
            } else {
                return this.checklist.filter((species) => {
                    return species.species_name.toLowerCase().includes(this.search_species.toLowerCase());
                });
            }
        }, show_species() {
            this.showDropdown = true;
            if (this.new_species.trim() === "") {
                return [];
            }
            return this.all_species.filter((species) =>
                species.COMMON_NAME.toLowerCase().includes(this.new_species.toLowerCase())
            );
        }
    }, mounted() {
        document.addEventListener('click', this.handleClickOutside);
    }, beforeDestroy() {
        document.removeEventListener('click', this.handleClickOutside);
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(load_sightings_url).then(function (r) {
        app.vue.event_id = r.data.event_id;
        app.vue.all_species = r.data.all_species;
        app.vue.checklist = r.data.sightings;
        if (app.vue.checklist.length > 0) {
            app.vue.checklist_empty = false;
        }
        app.vue.observation_date = (r.data.obs_date);
        app.vue.observation_time = (r.data.obs_time);
        app.vue.duration = r.data.obs_dur;
        app.vue.fixWidth();
    });
}

app.load_data();

