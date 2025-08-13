// src/utils/uploadToDiscord.js

export const uploadImageToDiscord = async (base64Png, betType = "General") => {
  try {
    // Use a relative path that will work with our Vercel configuration
    const botApiUrl = "/bot-api/upload-image";

    console.log(`🔄 Uploading to Discord via: ${botApiUrl}`);

    const res = await fetch(botApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Png,
        betType,
      }),
    });

    if (!res.ok) {
      const data = await res
        .json()
        .catch(() => ({ error: "Failed to parse response" }));
      throw new Error(data.error || `Upload failed with status: ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ Upload successful:", data.message);
    return true;
  } catch (err) {
    console.error("❌ Upload failed:", err);
    throw err; // Re-throw to allow caller to handle the error
  }
};
