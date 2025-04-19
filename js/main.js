class DataCollector {
    constructor() {
        this.sessionData = {
            rounds: [],
            currentRound: {
                startTime: 0,
                moves: [],
                success: false,
                timeTaken: 0
            }
        };
    }

    startRound() {
        this.sessionData.currentRound = {
            startTime: Date.now(),
            moves: [],
            success: false,
            timeTaken: 0
        };
    }

    logMove(command) {
        this.sessionData.currentRound.moves.push({
            command,
            timestamp: Date.now() - this.sessionData.currentRound.startTime
        });
    }

    endRound(success) {
        this.sessionData.currentRound.success = success;
        this.sessionData.currentRound.timeTaken = Date.now() - this.sessionData.currentRound.startTime;
        this.sessionData.rounds.push(this.sessionData.currentRound);
    }

    getStats() {
        const totalRounds = this.sessionData.rounds.length;
        const successfulRounds = this.sessionData.rounds.filter(r => r.success).length;
        const averageTime = this.sessionData.rounds.reduce((acc, r) => acc + r.timeTaken, 0) / totalRounds;
        
        return {
            totalRounds,
            successRate: (successfulRounds / totalRounds) * 100,
            averageTime: averageTime / 1000, // in seconds
            movePatterns: this.analyzeMovePatterns()
        };
    }

    analyzeMovePatterns() {
        const patterns = {};
        this.sessionData.rounds.forEach(round => {
            round.moves.forEach(move => {
                patterns[move.command] = (patterns[move.command] || 0) + 1;
            });
        });
        return patterns;
    }
}

class Game {
    constructor() {
        this.gridSize = 5;
        this.cellSize = 80;
        this.playerPos = { x: 2, y: 2 };
        this.targetPos = { x: 0, y: 0 };
        this.movesLeft = 6;
        this.gameActive = false;
        this.voiceActive = false;
        this.recognition = null;
        this.wins = 0;
        this.aizenaMessages = {
            welcome: [
                "Welcome to the Neural Matrix. Your journey begins.",
                "Initiating cognitive interface. Prepare for neural exploration.",
                "The Grid awaits your command. Navigate with purpose."
            ],
            move: [
                "Signal shifting...",
                "Processing movement pattern...",
                "Neural pathway forming..."
            ],
            success: [
                "Signal synced. Pattern match detected.",
                "Neural alignment confirmed.",
                "Cognitive resonance achieved."
            ],
            failure: [
                "Signal lost. Recalibrating neural channel...",
                "Pattern mismatch detected. Resetting grid...",
                "Neural connection interrupted. Realigning..."
            ],
            victory: [
                "Cognitive patterning stabilized. Neural signature aligned with expected parameters.",
                "You have completed Chapter 1 of the Neural Matrix.",
                "Your voice and choices have formed a data echo, now recorded in the Nexus of Understanding.",
                "\nAssessment: You exhibit emerging consistency, directional reasoning, and adaptive learning — vital traits for neural exploration. Your interaction has enhanced AIZENA's awareness of human problem-solving."
            ]
        };
        this.lastCommand = '';
        this.commandCooldown = false;
        this.setupVoiceRecognition();
        this.setupKeyboardControls();
        this.setupEventListeners();
        this.dataCollector = new DataCollector();
        this.updateStatus();
        this.traps = []; // Array to store multiple trap positions
        this.roundData = [];
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('voice-btn').addEventListener('click', () => this.toggleVoice());
    }

    setupVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            document.getElementById('voice-btn').style.display = 'none';
            return;
        }

        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
        this.recognition.lang = 'en-US';

        const commands = new Map([
            ['up', [0, -1]],
            ['down', [0, 1]],
            ['left', [-1, 0]],
            ['right', [1, 0]],
            ['top', [0, -1]],
            ['bottom', [0, 1]],
            ['north', [0, -1]],
            ['south', [0, 1]],
            ['west', [-1, 0]],
            ['east', [1, 0]]
        ]);

        this.recognition.onstart = () => {
            document.getElementById('voice-feedback').textContent = 'Listening...';
        };

        this.recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase().trim();
            
            if (command === this.lastCommand && this.commandCooldown) {
                return;
            }

            document.getElementById('voice-feedback').textContent = `Command: ${command}`;
            this.lastCommand = command;

            for (const [key, value] of commands) {
                if (command.includes(key)) {
                    this.movePlayer(value[0], value[1]);
                    
                    this.commandCooldown = true;
                    setTimeout(() => {
                        this.commandCooldown = false;
                    }, 100);
                    
                    break;
                }
            }

            if (this.voiceActive) {
                try {
                    this.recognition.start();
                } catch (e) {
                    setTimeout(() => this.recognition.start(), 50);
                }
            }
        };

        this.recognition.onerror = (event) => {
            if (event.error !== 'no-speech') {
                console.error('Voice error:', event.error);
            }
            if (this.voiceActive) {
                try {
                    this.recognition.start();
                } catch (e) {
                    setTimeout(() => this.recognition.start(), 50);
                }
            }
        };

        this.recognition.onend = () => {
            if (this.voiceActive) {
                try {
                    this.recognition.start();
                } catch (e) {
                    setTimeout(() => this.recognition.start(), 50);
                }
            }
        };
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;

            const moves = {
                'ArrowUp': [0, -1],
                'ArrowDown': [0, 1],
                'ArrowLeft': [-1, 0],
                'ArrowRight': [1, 0],
                'w': [0, -1],
                's': [0, 1],
                'a': [-1, 0],
                'd': [1, 0]
            };

            if (moves[e.key]) {
                const [dx, dy] = moves[e.key];
                this.movePlayer(dx, dy);
                document.getElementById('voice-feedback').textContent = `Using: ${e.key}`;
            }
        });
    }

    startGame() {
        if (this.wins >= 6) {
            this.gameActive = false;
            this.showVictorySequence();
            return;
        }

        this.gameActive = true;
        this.movesLeft = 6;
        this.playerPos = { x: 2, y: 2 };
        this.setRandomTarget();
        this.updateAizenaMessage(this.getRandomMessage('welcome'));
        setTimeout(() => {
            this.updateAizenaMessage(`Find the signal in tile ${this.getTileNumber(this.targetPos)}`);
        }, 2000);
        this.dataCollector.startRound();
        this.updateStatus();
    }

    showVictorySequence() {
        let messageIndex = 0;
        const messages = this.aizenaMessages.victory;
        
        const showNextMessage = () => {
            if (messageIndex < messages.length) {
                this.updateAizenaMessage(messages[messageIndex]);
                messageIndex++;
                if (messageIndex < messages.length) {
                    setTimeout(showNextMessage, 2000);
                }
            }
        };
        
        showNextMessage();
    }

    setRandomTarget() {
        let newPos;
        do {
            newPos = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (newPos.x === 2 && newPos.y === 2);
        this.targetPos = newPos;
        this.setRandomTraps();
    }

    setRandomTraps() {
        this.traps = []; // Clear existing traps
        const numTraps = this.wins + 1; // Number of traps increases with wins
        
        for (let i = 0; i < numTraps; i++) {
            let newPos;
            let attempts = 0;
            const maxAttempts = 50; // Prevent infinite loops
            
            do {
                newPos = {
                    x: Math.floor(Math.random() * this.gridSize),
                    y: Math.floor(Math.random() * this.gridSize)
                };
                attempts++;
            } while (
                attempts < maxAttempts && (
                    // Don't place trap on center, target, or existing traps
                    (newPos.x === 2 && newPos.y === 2) || // Center
                    (newPos.x === this.targetPos.x && newPos.y === this.targetPos.y) || // Target
                    this.traps.some(trap => trap.x === newPos.x && trap.y === newPos.y) || // Existing traps
                    !this.isPathPossible(newPos) // Check if path is still possible
                )
            );
            
            if (attempts < maxAttempts) {
                this.traps.push(newPos);
            }
        }
    }

    isPathPossible(newTrap) {
        // Create a temporary array of all traps including the new one
        const allTraps = [...this.traps, newTrap];
        
        // Calculate minimum moves needed to reach target
        const minMoves = Math.abs(this.targetPos.x - 2) + Math.abs(this.targetPos.y - 2);
        
        // Check if any trap blocks the direct path
        const blockedPaths = allTraps.filter(trap => 
            (trap.x === 2 && trap.y === this.targetPos.y) || // Vertical path blocked
            (trap.y === 2 && trap.x === this.targetPos.x)    // Horizontal path blocked
        );
        
        // Each blocked path requires 2 extra moves to go around
        return minMoves + (blockedPaths.length * 2) <= this.movesLeft;
    }

    getTileNumber(pos) {
        return pos.y * this.gridSize + pos.x + 1;
    }

    getRandomMessage(type) {
        const messages = this.aizenaMessages[type];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    updateAizenaMessage(message, type = 'move') {
        const messageElement = document.getElementById('aizena-message');
        messageElement.style.opacity = '0';
        
        setTimeout(() => {
            messageElement.textContent = message;
            messageElement.style.opacity = '1';
        }, 500);
    }

    movePlayer(dx, dy) {
        if (this.movesLeft <= 0) return;

        const newX = this.playerPos.x + dx;
        const newY = this.playerPos.y + dy;

        if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
            this.playerPos.x = newX;
            this.playerPos.y = newY;
            this.movesLeft--;

            // Store the move with command
            const command = this.getCommandFromDirection(dx, dy);
            this.dataCollector.logMove(command);

            // Check if player stepped on any trap
            const steppedOnTraps = this.traps.filter(trap => 
                this.playerPos.x === trap.x && this.playerPos.y === trap.y
            );
            
            if (steppedOnTraps.length > 0) {
                this.movesLeft -= steppedOnTraps.length;
                this.updateAizenaMessage(`Trap${steppedOnTraps.length > 1 ? 's' : ''} activated! ${steppedOnTraps.length} move${steppedOnTraps.length > 1 ? 's' : ''} lost.`);
            }

            this.updateStatus();

            if (this.playerPos.x === this.targetPos.x && this.playerPos.y === this.targetPos.y) {
                this.handleWin();
            } else if (this.movesLeft === 0) {
                this.handleLoss();
            }
        }
    }

    getCommandFromDirection(dx, dy) {
        if (dx === 0 && dy === -1) return 'up';
        if (dx === 0 && dy === 1) return 'down';
        if (dx === -1 && dy === 0) return 'left';
        if (dx === 1 && dy === 0) return 'right';
        return 'unknown';
    }

    handleWin() {
        this.wins++;
        this.updateStatus();
        this.dataCollector.endRound(true);
        this.updateAizenaMessage(this.getRandomMessage('success'));
        
        if (this.wins >= 6) {
            setTimeout(() => this.showEndgameSequence(), 1000); // Add delay before showing endgame sequence
        } else {
            this.startGame();
        }
    }

    showEndgameSequence() {
        this.gameActive = false;
        this.showEndgamePopup1();
    }

    showEndgamePopup1() {
        const popup = document.getElementById('endgamePopup1');
        const proceedBtn = document.getElementById('proceedBtn1');
        
        popup.style.display = 'flex';
        proceedBtn.onclick = () => {
            popup.style.display = 'none';
            setTimeout(() => this.showEndgamePopup2(), 100); // Small delay to ensure smooth transition
        };
    }

    showEndgamePopup2() {
        const popup = document.getElementById('endgamePopup2');
        const proceedBtn = document.getElementById('proceedBtn2');
        const dataSummary = document.getElementById('data-summary');
        
        // Generate summary table
        let tableHTML = '<table>';
        tableHTML += '<tr><th>Round</th><th>Target</th><th>Commands</th><th>Traps</th><th>Moves</th><th>Result</th></tr>';
        
        // Access the rounds data correctly
        const rounds = this.dataCollector.sessionData.rounds;
        
        rounds.forEach((round, index) => {
            // Get the moves for this round
            const moves = round.moves.map(m => m.command).join(', ');
            
            // Count traps triggered in this round
            const trapsTriggered = round.moves.filter(move => 
                this.traps.some(trap => 
                    move.x === trap.x && move.y === trap.y
                )
            ).length;
            
            tableHTML += `<tr>
                <td>${index + 1}</td>
                <td>${this.getTileNumber(this.targetPos)}</td>
                <td>${moves}</td>
                <td>${trapsTriggered}</td>
                <td>${round.moves.length}</td>
                <td>${round.success ? 'Success' : 'Failure'}</td>
            </tr>`;
        });
        
        tableHTML += '</table>';
        dataSummary.innerHTML = tableHTML;
        
        // Show the popup
        popup.style.display = 'flex';
        
        // Set up the proceed button
        proceedBtn.onclick = () => {
            popup.style.display = 'none';
            setTimeout(() => this.showEndgamePopup3(), 100);
        };
    }

    showEndgamePopup3() {
        const popup = document.getElementById('endgamePopup3');
        const backBtn = document.getElementById('backToGridBtn');
        
        popup.style.display = 'flex';
        backBtn.onclick = () => {
            popup.style.display = 'none';
            this.wins = 0;
            this.updateStatus();
            this.startGame();
        };
    }

    handleLoss() {
        this.dataCollector.endRound(false);
        this.updateAizenaMessage(this.getRandomMessage('failure'));
        this.startGame();
    }

    toggleVoice() {
        this.voiceActive = !this.voiceActive;
        if (this.voiceActive) {
            // Show voice commands popup
            const popup = document.getElementById('voiceCommandsPopup');
            popup.style.display = 'flex';
            
            // Set up close button
            document.getElementById('closeVoiceCommands').onclick = () => {
                popup.style.display = 'none';
                try {
                    this.recognition.start();
                    document.getElementById('voice-btn').textContent = 'Disable Voice Control';
                    document.getElementById('voice-feedback').textContent = 'Listening for commands...';
                } catch (e) {
                    setTimeout(() => this.recognition.start(), 50);
                }
            };
        } else {
            this.recognition.stop();
            document.getElementById('voice-btn').textContent = 'Activate Voice Control';
            document.getElementById('voice-feedback').textContent = 'Voice disabled. Use arrow keys or WASD';
        }
    }

    updateStatus() {
        document.getElementById('moves-left').textContent = this.movesLeft;
        document.getElementById('wins-count').textContent = `${this.wins}/6`;
    }
}

// p5.js setup
let game;
let canvas;

function setup() {
    canvas = createCanvas(400, 400);
    canvas.parent('game-canvas');
    game = new Game();
}

function draw() {
    background(10, 20);
    
    // Matrix rain effect
    fill(0, 245, 212, 20);
    noStroke();
    for (let i = 0; i < 50; i++) {
        const x = random(width);
        const y = (frameCount * 2 + random(height)) % height;
        rect(x, y, 2, 20);
    }
    
    drawGrid();
    drawTraps();
    drawPlayer();
    drawTarget();
}

function drawGrid() {
    stroke(76, 201, 240);
    strokeWeight(2);
    noFill();

    // Add pulsing effect to grid lines
    const pulse = sin(frameCount * 0.05) * 20 + 180;
    stroke(76, 201, 240, pulse);

    for (let i = 0; i <= game.gridSize; i++) {
        line(i * game.cellSize, 0, i * game.cellSize, height);
        line(0, i * game.cellSize, width, i * game.cellSize);
    }
}

function drawPlayer() {
    // Add glow effect
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = color(157, 78, 221);
    
    // Add subtle movement animation
    const pulse = sin(frameCount * 0.1) * 2;
    fill(157, 78, 221);
    noStroke();
    rect(
        game.playerPos.x * game.cellSize + pulse,
        game.playerPos.y * game.cellSize + pulse,
        game.cellSize - pulse * 2,
        game.cellSize - pulse * 2
    );
    
    drawingContext.shadowBlur = 0;
}

function drawTarget() {
    const pulse = sin(frameCount * 0.1) * 20 + 100;
    fill(0, 245, 212, pulse);
    noStroke();
    rect(
        game.targetPos.x * game.cellSize,
        game.targetPos.y * game.cellSize,
        game.cellSize,
        game.cellSize
    );
}

function drawTraps() {
    game.traps.forEach(trap => {
        const pulse = sin(frameCount * 0.1) * 20 + 100;
        fill(255, 0, 0, pulse);
        noStroke();
        rect(
            trap.x * game.cellSize,
            trap.y * game.cellSize,
            game.cellSize,
            game.cellSize
        );
    });
}

// Intro popup handling
document.addEventListener('DOMContentLoaded', () => {
    const introPopup = document.getElementById('introPopup');
    const beginBtn = document.getElementById('beginBtn');
    const startBtn = document.getElementById('start-btn');

    // Show intro popup first
    introPopup.style.display = 'flex';

    beginBtn.addEventListener('click', () => {
        introPopup.style.display = 'none';
        startBtn.click(); // Automatically start the game
    });
}); 