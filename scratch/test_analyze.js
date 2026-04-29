
const { analyze } = require('./api/_lib/analyze');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function test() {
  const body = {
    input: "Build a new payment gateway for Stripe",
    memory: {},
    useMemory: false
  };
  try {
    const result = await analyze(body, process.env.GEMINI_API_KEY);
    console.log("Success:", JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
