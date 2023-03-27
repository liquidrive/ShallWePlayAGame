const inputElement = document.getElementById('input');
const outputElement = document.getElementById('output');
const typedTextElement = document.getElementById('typed-text');
const turnHistory = [];
const text = 'Would you like to play a game?';

document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('typed-text')) {
        // Display out quick intro
        typeText(0);
    } else {
        // Start the game
        const response = await initGame();

        outputElement.innerHTML = `
            <div>${response}</div>
        `;
        scrollToBottom();

        inputElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                processCommand(inputElement.value);
                inputElement.value = 'Loading, Please Wait...';
            }
        });
    }
});

async function initGame() {
    let result = await makeRequest('/api/initGame');
    turnHistory.push({"role": "assistant", "content": result});
    generateImage('A mysterious island at twilight surrounded by fog with a small boat pulling up to it. Black and white');

    return result;
}

async function generateNextTurn(prompt) {
    turnHistory.push({"role": "user", "content": prompt});

    let body = JSON.stringify({
        turnHistory: turnHistory,
    });

    let result = await makeRequest('/api/generateNextTurn', body);
    turnHistory.push({"role": "assistant", "content": result});

    return result;
}

async function generateImage(prompt) {
    const body = JSON.stringify({ prompt: prompt });

    try {
        const response = await fetch('/api/generateImage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body,
        });

        const imageData = await response.blob(); // Use response.blob() since the server returns a binary image
        const imageElement = document.getElementById('fixed-image');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 800;
        canvas.height = 250;

        const tempImage = new Image();
        tempImage.src = URL.createObjectURL(imageData);
        tempImage.onload = function () {
            // Calculate the scale factor and new height to maintain the aspect ratio
            const scaleFactor = 800 / tempImage.width;
            const newHeight = tempImage.height * scaleFactor;

            // Calculate the vertical offset to crop the image at the vertical center
            const yOffset = (newHeight - 50) / 2;

            // Draw the image scaled and cropped
            ctx.drawImage(tempImage, 0, -yOffset, 800, newHeight);
            imageElement.src = canvas.toDataURL();
        };
    } catch (error) {
        console.error('Error generating image:', error);
    }
}


async function makeRequest(url, body) {
    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body,
        });

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error communicating with the server:', error);
        return 'An error occurred while processing your request.';
    }
}

async function processCommand(command) {
    let result = await generateNextTurn(command);

    inputElement.value = '';
    outputElement.innerHTML += `
        <div class="input-line">
            <div class="prompt">>></div>
            <div>${command}</div>
        </div>
        <div>${result}</div>
    `;
    scrollToBottom();
}

function typeText(index) {
    if (index < text.length) {
        typedTextElement.textContent += text[index];
        setTimeout(() => typeText(index + 1), 100);
    } else {
        showOptions();
    }
}

function showOptions() {
    const yesButton = document.createElement('button');
    yesButton.textContent = 'Yes';
    yesButton.onclick = handleYesButtonClick;

    const noButton = document.createElement('button');
    noButton.textContent = 'No';
    noButton.onclick = handleNoButtonClick;

    typedTextElement.appendChild(document.createElement('br'));
    typedTextElement.appendChild(yesButton);
    typedTextElement.appendChild(noButton);
}

function handleYesButtonClick() {
   window.location.href = 'game.html';
}

function handleNoButtonClick() {
    window.location.href = 'https://www.google.com';
}

function scrollToBottom() {
    const terminal = document.getElementById('terminal');
    terminal.scrollTo(0, terminal.scrollHeight);
}
