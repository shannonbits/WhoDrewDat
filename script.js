// Firebase configuration - Replace with your actual config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Game state
let gameState = {
    roomId: null,
    players: {},
    currentDrawer: null,
    currentWord: "",
    roundTime: 60,
    scores: {},
    gameStarted: false,
    timer: null
};

// Player configuration
let playerConfig = {
    id: generateId(),
    name: "Anonymous",
    avatar: {
        style: "simple",
        color: "#6a5acd",
        accessory: "none"
    },
    score: 0,
    isDrawing: false
};

// DOM elements
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const playersList = document.getElementById('playersList');
const wordDisplay = document.getElementById('wordDisplay');
const gameStateDisplay = document.getElementById('gameState');
const timerDisplay = document.getElementById('timer');
const lobbyModal = document.getElementById('lobbyModal');
const usernameInput = document.getElementById('usernameInput');
const avatarStyle = document.getElementById('avatarStyle');
const avatarColor = document.getElementById('avatarColor');
const avatarAccessory = document.getElementById('avatarAccessory');
const avatarPreview = document.getElementById('avatarPreview');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const createRoomBtn = document.getElementById('createRoomBtn');
const roomCodeInput = document.getElementById('roomCodeInput');
const roomInfo = document.getElementById('roomInfo');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const startGameBtn = document.getElementById('startGameBtn');
const gameArea = document.querySelector('.game-area');

// Drawing variables
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let drawingHistory = [];
let currentPath = [];

// Word bank
const wordBank = {
    easy: ["Apple", "House", "Tree", "Car", "Dog", "Cat", "Sun", "Moon", "Book", "Ball"],
    medium: ["Airplane", "Elephant", "Mountain", "Guitar", "Dragon", "Castle", "Spider", "Pizza", "Doctor", "Robot"],
    hard: ["Skyscraper", "Hippopotamus", "Chandelier", "Kaleidoscope", "Archaeologist", "Xylophone", "Quarantine", "Zucchini", "Jukebox", "Ninja"]
};

// Initialize the game
function initGame() {
    initCanvas();
    initCustomization();
    setupEventListeners();
    
    // Check for room ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    if (roomId) {
        roomCodeInput.value = roomId;
    }
}

// Initialize drawing canvas
function initCanvas() {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = brushSize.value;
    ctx.strokeStyle = colorPicker.value;
    
    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch support for mobile
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
}

// Initialize avatar customization
function initCustomization() {
    // Event listeners for changes
    usernameInput.addEventListener('input', updatePlayerConfig);
    avatarStyle.addEventListener('change', updatePlayerConfig);
    avatarColor.addEventListener('input', updatePlayerConfig);
    avatarAccessory.addEventListener('change', updatePlayerConfig);
    
    // Initial render
    updatePlayerConfig();
}

function updatePlayerConfig() {
    playerConfig = {
        ...playerConfig,
        name: usernameInput.value.trim() || "Anonymous",
        avatar: {
            style: avatarStyle.value,
            color: avatarColor.value,
            accessory: avatarAccessory.value
        }
    };
    renderAvatar();
}

function renderAvatar() {
    // Clear previous avatar
    avatarPreview.innerHTML = '';
    
    // Create canvas for avatar
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // Draw avatar based on configuration
    drawAvatar(ctx, playerConfig.avatar);
    
    // Add to preview
    avatarPreview.appendChild(canvas);
}

function drawAvatar(ctx, avatar) {
    // Base circle
    ctx.beginPath();
    ctx.arc(50, 50, 40, 0, Math.PI * 2);
    ctx.fillStyle = avatar.color;
    ctx.fill();
    
    // Different styles
    switch(avatar.style) {
        case 'animal':
            // Draw animal features (example: cat)
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(35, 35, 8, 0, Math.PI * 2); // Left eye
            ctx.arc(65, 35, 8, 0, Math.PI * 2); // Right eye
            ctx.fill();
            
            // Nose
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.arc(50, 50, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Whiskers
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            // Left whiskers
            ctx.beginPath();
            ctx.moveTo(45, 50);
            ctx.lineTo(20, 45);
            ctx.moveTo(45, 55);
            ctx.lineTo(20, 55);
            // Right whiskers
            ctx.moveTo(55, 50);
            ctx.lineTo(80, 45);
            ctx.moveTo(55, 55);
            ctx.lineTo(80, 55);
            ctx.stroke();
            break;
            
        case 'robot':
            // Draw robot features
            ctx.fillStyle = '#333333';
            ctx.fillRect(30, 30, 40, 40);
            
            // Eyes
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.arc(40, 40, 5, 0, Math.PI * 2);
            ctx.arc(60, 40, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Mouth
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(40, 60);
            ctx.lineTo(60, 60);
            ctx.stroke();
            break;
            
        case 'monster':
            // Draw monster features
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(50, 50, 35, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(40, 40, 8, 0, Math.PI * 2);
            ctx.arc(60, 40, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Mouth
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(50, 60, 15, 0, Math.PI);
            ctx.fill();
            break;
            
        default: // simple
            // Draw simple face
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(35, 35, 5, 0, Math.PI * 2); // Left eye
            ctx.arc(65, 35, 5, 0, Math.PI * 2); // Right eye
            ctx.fill();
            
            // Smile
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(50, 50, 15, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
    }
    
    // Add accessories
    switch(avatar.accessory) {
        case 'hat':
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.moveTo(20, 30);
            ctx.lineTo(80, 30);
            ctx.lineTo(70, 10);
            ctx.lineTo(30, 10);
            ctx.closePath();
            ctx.fill();
            break;
            
        case 'glasses':
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            // Left lens
            ctx.rect(25, 35, 20, 10);
            // Right lens
            ctx.rect(55, 35, 20, 10);
            // Bridge
            ctx.moveTo(45, 40);
            ctx.lineTo(55, 40);
            ctx.stroke();
            break;
            
        case 'crown':
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(30, 20);
            ctx.lineTo(50, 40);
            ctx.lineTo(70, 20);
            ctx.lineTo(65, 40);
            ctx.lineTo(80, 30);
            ctx.lineTo(70, 50);
            ctx.lineTo(50, 45);
            ctx.lineTo(30, 50);
            ctx.lineTo(20, 30);
            ctx.lineTo(35, 40);
            ctx.closePath();
            ctx.fill();
            break;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Drawing tools
    colorPicker.addEventListener('input', () => {
        ctx.strokeStyle = colorPicker.value;
    });
    
    brushSize.addEventListener('input', () => {
        ctx.lineWidth = brushSize.value;
    });
    
    clearBtn.addEventListener('click', clearCanvas);
    undoBtn.addEventListener('click', undoLastStroke);
    
    // Chat
    sendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    // Lobby buttons
    joinRoomBtn.addEventListener('click', joinRoom);
    createRoomBtn.addEventListener('click', createRoom);
    startGameBtn.addEventListener('click', startGame);
}

// Drawing functions
function startDrawing(e) {
    if (!playerConfig.isDrawing) return;
    
    isDrawing = true;
    [lastX, lastY] = getMousePos(canvas, e);
    currentPath = [];
    currentPath.push({ 
        x: lastX, 
        y: lastY, 
        color: colorPicker.value, 
        size: brushSize.value 
    });
    drawDot(lastX, lastY);
}

function draw(e) {
    if (!isDrawing || !playerConfig.isDrawing) return;
    
    const [x, y] = getMousePos(canvas, e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    [lastX, lastY] = [x, y];
    currentPath.push({ 
        x, 
        y, 
        color: colorPicker.value, 
        size: brushSize.value 
    });
    
    // Send drawing data to other players
    sendDrawingData();
}

function drawDot(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, brushSize.value / 2, 0, Math.PI * 2);
    ctx.fill();
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        if (currentPath.length > 0) {
            drawingHistory.push(currentPath);
        }
    }
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawingHistory = [];
    if (playerConfig.isDrawing && gameState.roomId) {
        database.ref(`rooms/${gameState.roomId}/drawing`).set(null);
    }
}

function undoLastStroke() {
    if (drawingHistory.length > 0) {
        drawingHistory.pop();
        redrawCanvas();
        if (playerConfig.isDrawing && gameState.roomId) {
            sendFullDrawing();
        }
    }
}

function redrawCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawingHistory.forEach(path => {
        if (path.length === 0) return;
        
        ctx.strokeStyle = path[0].color;
        ctx.lineWidth = path[0].size;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
    });
}

// Touch event handlers
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return [
        evt.clientX - rect.left,
        evt.clientY - rect.top
    ];
}

// Room management functions
function createRoom() {
    if (!playerConfig.name) {
        alert("Please enter your name first!");
        return;
    }

    // Generate a 4-digit room code
    const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    gameState.roomId = roomCode;

    // Show the room info
    roomCodeDisplay.textContent = roomCode;
    document.querySelector('.room-options').style.display = 'none';
    roomInfo.style.display = 'block';

    // Initialize room in Firebase
    database.ref(`rooms/${roomCode}`).set({
        gameState: {
            gameStarted: false,
            currentDrawer: null,
            currentWord: "",
            roundTime: 60
        },
        players: {},
        drawing: null,
        chat: null
    }).then(() => {
        // Add the host to the room
        addPlayerToRoom(roomCode);
        
        // Update URL
        updateUrlWithRoomCode(roomCode);
        
        // Setup room listeners
        setupRoomListeners(roomCode);
    }).catch(error => {
        console.error("Error creating room:", error);
        alert("Error creating room. Please try again.");
    });
}

function joinRoom() {
    if (!playerConfig.name) {
        alert("Please enter your name first!");
        return;
    }

    const roomCode = roomCodeInput.value.trim();
    if (!roomCode) {
        alert("Please enter a room code!");
        return;
    }

    // Check if room exists
    database.ref(`rooms/${roomCode}`).once('value').then(snapshot => {
        if (snapshot.exists()) {
            gameState.roomId = roomCode;
            
            // Hide lobby and show game area
            lobbyModal.style.display = 'none';
            gameArea.style.display = 'flex';
            
            // Add player to room
            addPlayerToRoom(roomCode);
            
            // Setup realtime listeners
            setupRoomListeners(roomCode);
            
            // Update URL
            updateUrlWithRoomCode(roomCode);
        } else {
            alert("Room not found! Please check the code and try again.");
        }
    }).catch(error => {
        console.error("Error joining room:", error);
        alert("Error joining room. Please try again.");
    });
}

function addPlayerToRoom(roomCode) {
    const playerRef = database.ref(`rooms/${roomCode}/players/${playerConfig.id}`);
    
    playerRef.set({
        name: playerConfig.name,
        avatar: playerConfig.avatar,
        score: 0,
        isDrawing: false
    });

    // Remove player when they disconnect
    playerRef.onDisconnect().remove();
}

function setupRoomListeners(roomCode) {
    // Listen for players
    database.ref(`rooms/${roomCode}/players`).on('value', (snapshot) => {
        gameState.players = snapshot.val() || {};
        updatePlayersList();
        
        // Check if we should start game (host only)
        if (Object.keys(gameState.players).length >= 2 && 
            document.querySelector('.room-options').style.display === 'none' &&
            !gameState.gameStarted) {
            // Only host can start the game
            roomInfo.style.display = 'block';
        }
    });
    
    // Listen for drawing updates
    database.ref(`rooms/${roomCode}/drawing`).on('child_added', (snapshot) => {
        if (!playerConfig.isDrawing) {
            const stroke = snapshot.val();
            drawRemoteStroke(stroke);
        }
    });
    
    // Listen for chat messages
    database.ref(`rooms/${roomCode}/chat`).on('child_added', (snapshot) => {
        const message = snapshot.val();
        addChatMessage(message.text, message.sender, message.type);
        
        // Check if message is a correct guess
        if (message.type === 'guess' && playerConfig.isDrawing) {
            checkGuess(message.text, message.senderId);
        }
    });
    
    // Listen for game state changes
    database.ref(`rooms/${roomCode}/gameState`).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState.currentDrawer = data.currentDrawer;
            gameState.currentWord = data.currentWord;
            gameState.roundTime = data.roundTime;
            gameState.gameStarted = data.gameStarted;
            
            updateGameDisplay();
            
            if (gameState.gameStarted && gameState.currentDrawer === playerConfig.id) {
                playerCanDraw(true);
            } else {
                playerCanDraw(false);
            }
        }
    });
}

function startGame() {
    if (!gameState.roomId) return;
    
    database.ref(`rooms/${gameState.roomId}/gameState`).update({
        gameStarted: true
    });
    
    // Hide room info and show game area
    roomInfo.style.display = 'none';
    gameArea.style.display = 'flex';
    
    // Start the first round
    startRound();
}

function startRound() {
    if (!gameState.roomId) return;
    
    // Clear canvas
    clearCanvas();
    
    // Choose drawer
    const playerIds = Object.keys(gameState.players);
    let nextDrawerIndex = 0;
    
    if (gameState.currentDrawer) {
        const currentIndex = playerIds.indexOf(gameState.currentDrawer);
        nextDrawerIndex = (currentIndex + 1) % playerIds.length;
    }
    
    const nextDrawer = playerIds[nextDrawerIndex];
    
    // Choose word
    const difficulty = Math.random() < 0.5 ? 'medium' : (Math.random() < 0.7 ? 'easy' : 'hard');
    const words = wordBank[difficulty];
    const word = words[Math.floor(Math.random() * words.length)];
    
    // Update game state
    gameState.currentDrawer = nextDrawer;
    gameState.currentWord = word;
    gameState.roundTime = 60;
    
    database.ref(`rooms/${gameState.roomId}/gameState`).update({
        currentDrawer: nextDrawer,
        currentWord: word,
        roundTime: 60
    });
    
    // Set player drawing status
    Object.keys(gameState.players).forEach(playerId => {
        database.ref(`rooms/${gameState.roomId}/players/${playerId}/isDrawing`).set(playerId === nextDrawer);
    });
    
    // Add system message
    addSystemMessage(`New round started! ${gameState.players[nextDrawer].name} is drawing.`);
    
    // Start timer
    startTimer();
}

function startTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    
    gameState.timer = setInterval(() => {
        gameState.roundTime--;
        database.ref(`rooms/${gameState.roomId}/gameState/roundTime`).set(gameState.roundTime);
        
        if (gameState.roundTime <= 0) {
            clearInterval(gameState.timer);
            endRound();
        }
        
        updateGameDisplay();
    }, 1000);
}

function endRound() {
    if (!gameState.roomId) return;
    
   
