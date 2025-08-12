// src/utils/uploadToDiscord.js

export const uploadImageToDiscord = async (base64Png, betType = "General") => {
  try {
    console.log("📸 Starting image upload...");

    const res = await fetch("/api/upload-image", {
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
      const errorText = await res.text();
      throw new Error(`Upload failed with status ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log("✅ Upload successful:", data.message);
    return true;
  } catch (err) {
    console.error("❌ Upload failed:", err.message);
    throw err; // Re-throw to handle in the UI
  }
};

export default uploadImageToDiscord;
