const config = require('../config.json');
const fetch = require('node-fetch');

// Function to send a loadtrack request to Lavalink
async function sendLoadTrackRequest(trackUrl) {
  const response = await fetch(
    `http://${config.node.url}/v4/loadtracks?identifier=${trackUrl}`,
    {
      method: 'GET',
      headers: {
        Authorization: config.node.auth,
        'Content-Type': 'application/json',
      },
    }
  );

  if (response.ok) {
    const data = await response.json();
    console.log('Loadtrack request successful:', data);
  } else {
    console.error(
      'Loadtrack request failed:',
      response.status,
      response.statusText
    );
  }
}

// Example usage
const trackUrl = 'ytsearch:california love';
sendLoadTrackRequest(trackUrl);
