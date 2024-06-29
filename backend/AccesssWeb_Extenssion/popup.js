document.getElementById('generateReport').addEventListener('click', () => {
    chrome.storage.local.get(['accessibilityResults'], (data) => {
        if (data.accessibilityResults) {
            fetch('http://localhost:3000/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ results: data.accessibilityResults })
            })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'accessibility-report.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => console.error('Error generating PDF:', error));
        } else {
            document.getElementById('result').textContent = 'No data available. Please run the checker first.';
        }
    });
});
