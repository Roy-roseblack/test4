const ngrok = require('ngrok');

async function startPublicServer() {
  try {
    console.log('Starting ngrok tunnel to port 3000...');

    // Connect ngrok to port 3000
    const url = await ngrok.connect(3000);

    console.log('\n' + '='.repeat(70));
    console.log('✅ PUBLIC SERVER IS LIVE!');
    console.log('='.repeat(70));
    console.log('\n📡 PUBLIC URL:');
    console.log(`   ${url}`);
    console.log('\n🌐 Share this link with anyone to access your website:');
    console.log(`   ${url}`);
    console.log('\n📋 Test Accounts:');
    console.log('   • Username: sam | Password: password123 (Leader)');
    console.log('   • Username: testuser | Password: password123');
    console.log('   • Username: testdean | Password: password123');
    console.log('\n💡 Or sign up to create a new account!');
    console.log('\n⚠️  Press CTRL+C to stop the public server');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error starting public server:', error.message);
    console.error('Make sure your local server is running on port 3000');
    process.exit(1);
  }
}

// Start ngrok
startPublicServer();

// Keep the process alive
process.on('SIGINT', async () => {
  console.log('\n\nShutting down public server...');
  await ngrok.kill();
  process.exit(0);
});
