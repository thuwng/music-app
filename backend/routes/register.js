const fetch = require("node-fetch").default;

async function registerUser() {
  try {
    const response = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "thuwng", password: "20102005" }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `HTTP error! Status: ${response.status}, Response: ${text}`
      );
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

registerUser();
