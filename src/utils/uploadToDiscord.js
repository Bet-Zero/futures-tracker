// src/utils/uploadToDiscord.js

export const uploadImageToDiscord = async (base64Png, betType = "General") => {
  try {
    const res = await fetch("http://localhost:3001/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageData: base64Png,
        betType,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");

    console.log("✅ Upload successful:", data.message);
    return true;
  } catch (err) {
    console.error("❌ Upload failed:", err);
    return false;
  }
};
