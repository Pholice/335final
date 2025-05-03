let session;

async function displayAdvice() {
    const factElement = document.getElementById("fact");

    if (!factElement) {
        console.error("Element with ID 'fact' not found!");
        return;
    }

    factElement.innerHTML = "Fetching some advice...";

    try {
        const response = await fetch('https://api.adviceslip.com/advice', {
            cache: 'no-cache' 
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.slip && data.slip.advice) {
            const adviceText = data.slip.advice;
            factElement.innerHTML = adviceText;
        } else {
            throw new Error("Invalid data format received from Advice Slip API.");
        }

    } catch (error) {
        console.error('Error fetching advice:', error);
        factElement.innerHTML = `Sorry, couldn't fetch advice. Error: ${error.message}`;
    }
}

async function saveAdvice() {
    const adviceElement = document.getElementById("fact");
    const adviceText = adviceElement?.textContent;

    if (!adviceText || adviceText === "Your advice will appear here..." || adviceText.startsWith("Fetching")) {
        alert("No valid advice is currently displayed to save!");
        return;
    }

    const saveUrl = '/api/save-advice';

    try {
        const response = await fetch(saveUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({advice: adviceText })
        });

        const result = await response.json(); 

        if (!response.ok || !result.success) {
            throw new Error(result.message || `Server error: ${response.status}`);
        }

        console.log('Save successful:', result);
        alert('Advice saved successfully!');

    } catch (error) {
        console.error('Error saving advice:', error);
        alert(`Failed to save advice: ${error.message}`);
    }
}