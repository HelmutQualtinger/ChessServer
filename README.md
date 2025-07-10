# Chess Server

A Docker-based chess server using Stockfish engine with REST API endpoints.

## Quick Start

1. **Start Docker Desktop** (if not already running)

2. **Build and run the container:**
   ```bash
   docker-compose up --build
   ```

   Or manually:
   ```bash
   docker build -t chess-server .
   docker run -p 5000:5000 chess-server
   ```

3. **Test the server:**
   ```bash
   python test_chess_server.py
   ```

## API Endpoints

### Health Check
- **GET** `/health` - Check if server is running

### Game Operations
- **POST** `/new_game` - Start a new chess game
- **POST** `/make_move` - Make a move on the board
  - Body: `{"fen": "...", "move": "e2e4"}`
- **POST** `/validate_fen` - Validate a FEN string
  - Body: `{"fen": "..."}`
- **POST** `/game_info` - Get detailed game information
  - Body: `{"fen": "..."}`

### Engine Operations
- **POST** `/get_best_move` - Get Stockfish's best move
  - Body: `{"fen": "...", "time_limit": 1.0}`
- **POST** `/analyze_position` - Analyze position with Stockfish
  - Body: `{"fen": "...", "time_limit": 1.0}`

## Example Usage

```bash
# Health check
curl http://localhost:5000/health

# Start new game
curl -X POST http://localhost:5000/new_game

# Make a move
curl -X POST http://localhost:5000/make_move \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "move": "e2e4"}'

# Get best move
curl -X POST http://localhost:5000/get_best_move \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", "time_limit": 1.0}'
```

## Files

- `Dockerfile` - Container configuration
- `docker-compose.yml` - Docker Compose configuration
- `chess_server.py` - Flask chess server application
- `requirements.txt` - Python dependencies
- `test_chess_server.py` - Test suite for the chess server