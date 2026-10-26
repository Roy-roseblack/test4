const ngrok = require('ngrok');

async function startPublicServer() {
  try {
    // Start ngrok tunnel to localhost:3000
    const url = await ngrok.connect(3000);
    console.log('\n✅ PUBLIC SERVER STARTED!');
    console.log('═'.repeat(50));
    console.log('📡 Public URL:', url);
    console.log('═'.repeat(50));
    console.log('\nShare this URL with others:');
    console.log(url);
    console.log('\nYour website is now accessible from anywhere!');
    console.log('\nPress CTRL+C to stop the public server');

  } catch (error) {
    console.error('❌ Error starting public server:', error);
    process.exit(1);
  }
}

// Start the local server first
const localServer = require('./host.js');

// Wait for local server to start, then create ngrok tunnel
setTimeout(startPublicServer, 2000);
