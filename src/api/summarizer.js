export async function summarizeTextFromURL(url) {
  try {
    const response = await fetch("https://rman.onrender.com/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // ignore JSON parse error
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.content) {
      throw new Error("No content returned from backend");
    }

    return data.content;
  } catch (err) {
    console.error("❌ Summarization error:", err);
    throw err;
  }
}
