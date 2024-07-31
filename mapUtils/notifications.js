const L = require('leaflet');

function notifications() {
    let notificationControl = L.control
        .notifications({
            position: 'bottomright',
            closable: true,
            dismissable: true,
            timeout: 300000,
            });
    return notificationControl;
}

module.exports = {
    notifications,
}
