import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let currentUrl = '';

console.log("======================================================");
console.log("🚇 Ngrok Tunnel Watcher Started");
console.log("   Waiting for ngrok to start (e.g., 'ngrok http 8080')");
console.log("======================================================\n");

// Poll the ngrok local API to wait for it to be ready
async function watchTunnel() {
  setInterval(async () => {
    try {
      const res = await fetch('http://127.0.0.1:4040/api/tunnels');
      if (!res.ok) return;
      const data = await res.json();
      const tunnel = data.tunnels.find(t => t.public_url.startsWith('https'));
      
      if (tunnel) {
        const url = tunnel.public_url;
        
        if (url !== currentUrl) {
          currentUrl = url;
          console.log(`\n======================================================`);
          console.log(`✅ Ngrok tunnel active at: ${url}`);
          console.log(`======================================================\n`);

          // Update .env.local
          const envPath = path.resolve(process.cwd(), '.env.local');
          let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
          
          let changed = false;
          let previousUrl = '';
          
          if (envContent.includes('BASE_URL=')) {
            previousUrl = envContent.match(/BASE_URL=(.*)/)?.[1]?.trim() || '';
            if (previousUrl !== url) {
              console.warn(`⚠️ WARNING: Ngrok URL changed from ${previousUrl} to ${url}`);
              envContent = envContent.replace(/BASE_URL=.*/, `BASE_URL=${url}`);
              changed = true;
            }
          } else {
            envContent += `\nBASE_URL=${url}\n`;
            changed = true;
          }

          if (envContent.includes('SLACK_REDIRECT_URI=')) {
            envContent = envContent.replace(/SLACK_REDIRECT_URI=.*/, `SLACK_REDIRECT_URI=${url}/api/auth/slack/callback`);
            changed = true;
          } else {
            envContent += `SLACK_REDIRECT_URI=${url}/api/auth/slack/callback\n`;
            changed = true;
          }

          if (changed) {
            fs.writeFileSync(envPath, envContent);
            console.log(`✅ Updated .env.local with new BASE_URL and SLACK_REDIRECT_URI`);
            
            console.log(`\n🚨 DEVELOPER ACTION REQUIRED 🚨`);
            console.log(`1. Update your Slack App's OAuth Redirect URL to:`);
            console.log(`   👉 ${url}/api/auth/slack/callback`);
            console.log(`2. Restart your 'npm run dev' server so it picks up the new environment variables!\n`);
          } else {
            console.log(`✅ .env.local is already up to date with the current ngrok URL.`);
          }
        }
      }
    } catch (e) {
      // Ignore errors when ngrok isn't running
      if (currentUrl) {
        console.warn(`⚠️ Ngrok tunnel disconnected.`);
        currentUrl = '';
      }
    }
  }, 5000);
}

watchTunnel();
