function updateTime() {
    // Create a new Date object for UTC
    const now = new Date();
    const utcHours = now.getUTCHours().toString().padStart(2, '0');
    const utcMinutes = now.getUTCMinutes().toString().padStart(2, '0');
    const utcSeconds = now.getUTCSeconds().toString().padStart(2, '0');
    
    // Format the time as HH:MM:SS
    const utcTime = `${utcHours}:${utcMinutes}:${utcSeconds}`;

    // Display the time on the page
    document.getElementById('time').textContent = utcTime;
    return utcTime
}

// Update the time every second
//setInterval(updateTime, 1000);

// Call updateTime on page load to immediately display the current time
//updateTime();

module.exports = {
    updateTime
};