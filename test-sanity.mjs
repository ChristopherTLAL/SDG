// test-sanity.mjs (Final Test: Using basic Node.js fetch)

const projectId = "waxbya4l";
const dataset = "production";
const query = encodeURIComponent(`*[_type == "post"][0]{_id}`);

const url = `https://${projectId}.api.sanity.io/v2021-10-21/data/query/${dataset}?query=${query}`;

console.log('--- [Final Test] Attempting a direct network request to Sanity...');
console.log('Requesting URL:', url);

async function runTest() {
  try {
    // We create a timeout manually
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId); // Clear the timeout if the request succeeds

    if (!response.ok) {
      console.error(`!!! Test Failed: Network response was not ok. Status: ${response.status}`);
      const errorBody = await response.text();
      console.error('Error Body:', errorBody);
      return;
    }

    const data = await response.json();
    console.log('✅✅✅ SUCCESS! Direct network connection to Sanity is working.');
    console.log('Received data:', data);

  } catch (error) {
    console.error('!!! Test Failed with an error:');
    console.error(error);
  }
}

runTest();