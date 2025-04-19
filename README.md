# AI Zena: Neural Explorer (Beta)

A web-based cognitive exploration game where players navigate a grid using voice commands or keyboard controls to reach targets while avoiding traps. The game collects data on player decision-making patterns and movement strategies.

## Features

- Voice command navigation
- Keyboard controls (Arrow keys or WASD)
- Dynamic difficulty progression
- Trap avoidance mechanics
- Data collection and analysis
- Real-time feedback system

## Technologies Used

- HTML5
- CSS3
- JavaScript
- P5.js for graphics
- Web Speech API for voice recognition

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-zena-neural-explorer.git
```

2. Due to Web Speech API security requirements, the game must be served over HTTPS or localhost. To run locally:
```bash
python -m http.server 3100
```
Then visit `http://localhost:3100` in your browser.

## Controls

- Voice Commands: "Up", "Down", "Left", "Right" (or alternative commands like "North", "South", etc.)
- Keyboard: Arrow keys or WASD
- Click "Activate Voice Control" to enable voice commands

## Browser Support

- Chrome (recommended)
- Edge
- Firefox (voice features may be limited)
- Safari (voice features may be limited)

## Contributing

This is a beta version. Feel free to submit issues and enhancement requests.

## License

MIT License - feel free to use this code for your own projects.

## Credits

Created as part of the AI Zena project series. 