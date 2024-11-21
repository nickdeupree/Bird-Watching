// File: static/js/location.js

const app = Vue.createApp({
    methods: {
        go_back() {
            window.history.back();
        }
    }
});

app.mount('#app');