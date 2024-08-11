// public/javascripts/auth.js

function checkAuth() {
  return fetch('/auth-check')
    .then(response => {
      if (response.status === 403) {
        return response.json().then(data => {
          console.log(data.message); // Log the access denied message
          window.location.href = data.redirect; // Automatic redirect to login page
          throw new Error(data.message);
        });
      }
      return response.json();
    })
    .then(data => {
      if (data.authenticated) {
        console.log('User is authenticated');
      } else {
        throw new Error('User is not authenticated');
      }
    })
    .catch(error => {
      console.error('Authentication error:', error);
    });
}

// Export the function if using browserify
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { checkAuth };
}