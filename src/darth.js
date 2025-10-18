const handleGeneratePodcast = async () => {
  if (!urlInput.trim()) return;
  setLoading(true);
  setError(null);

  try {
    const response = await fetch('https://rman.onrender.com/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: urlInput })
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Received:', data);
      // Do something with data.content — e.g., send it to TTS or display it
    } else {
      throw new Error(data.error || "Failed to extract article");
    }
  } catch (err) {
    console.error(err);
    setError("Error: " + err.message);
  } finally {
    setLoading(false);
  }
};
