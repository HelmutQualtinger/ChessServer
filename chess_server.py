from flask import Flask, request, jsonify, render_template
import chess
import chess.engine
import chess.pgn
import json
import io

app = Flask(__name__)

# Initialize Stockfish engine
engine = chess.engine.SimpleEngine.popen_uci("/usr/games/stockfish")

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Chess server is running"})

@app.route('/new_game', methods=['POST'])
def new_game():
    """Start a new chess game"""
    board = chess.Board()
    return jsonify({
        "board": board.fen(),
        "legal_moves": [str(move) for move in board.legal_moves],
        "game_over": board.is_game_over()
    })

@app.route('/make_move', methods=['POST'])
def make_move():
    """Make a move on the chess board"""
    data = request.get_json()
    
    if not data or 'fen' not in data or 'move' not in data:
        return jsonify({"error": "Missing 'fen' or 'move' in request"}), 400
    
    try:
        board = chess.Board(data['fen'])
        move = chess.Move.from_uci(data['move'])
        
        if move not in board.legal_moves:
            return jsonify({"error": "Illegal move"}), 400
        
        board.push(move)
        
        return jsonify({
            "board": board.fen(),
            "legal_moves": [str(move) for move in board.legal_moves],
            "game_over": board.is_game_over(),
            "result": board.result() if board.is_game_over() else None
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/get_best_move', methods=['POST'])
def get_best_move():
    """Get the best move from Stockfish"""
    data = request.get_json()
    
    if not data or 'fen' not in data:
        return jsonify({"error": "Missing 'fen' in request"}), 400
    
    try:
        board = chess.Board(data['fen'])
        time_limit = data.get('time_limit', 1.0)  # Default 1 second
        
        result = engine.play(board, chess.engine.Limit(time=time_limit))
        
        return jsonify({
            "best_move": str(result.move),
            "board": board.fen()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/analyze_position', methods=['POST'])
def analyze_position():
    """Analyze a chess position"""
    data = request.get_json()
    
    if not data or 'fen' not in data:
        return jsonify({"error": "Missing 'fen' in request"}), 400
    
    try:
        board = chess.Board(data['fen'])
        time_limit = data.get('time_limit', 1.0)
        
        info = engine.analyse(board, chess.engine.Limit(time=time_limit))
        
        return jsonify({
            "score": str(info["score"]),
            "best_move": str(info["pv"][0]) if info["pv"] else None,
            "depth": info.get("depth", 0),
            "nodes": info.get("nodes", 0)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/validate_fen', methods=['POST'])
def validate_fen():
    """Validate a FEN string"""
    data = request.get_json()
    
    if not data or 'fen' not in data:
        return jsonify({"error": "Missing 'fen' in request"}), 400
    
    try:
        board = chess.Board(data['fen'])
        return jsonify({
            "valid": True,
            "board": board.fen(),
            "turn": "white" if board.turn else "black",
            "legal_moves": [str(move) for move in board.legal_moves],
            "game_over": board.is_game_over()
        })
    
    except Exception as e:
        return jsonify({
            "valid": False,
            "error": str(e)
        })

@app.route('/game_info', methods=['POST'])
def game_info():
    """Get detailed game information"""
    data = request.get_json()
    
    if not data or 'fen' not in data:
        return jsonify({"error": "Missing 'fen' in request"}), 400
    
    try:
        board = chess.Board(data['fen'])
        
        return jsonify({
            "fen": board.fen(),
            "turn": "white" if board.turn else "black",
            "castling_rights": str(board.castling_rights),
            "en_passant": str(board.ep_square) if board.ep_square else None,
            "halfmove_clock": board.halfmove_clock,
            "fullmove_number": board.fullmove_number,
            "legal_moves": [str(move) for move in board.legal_moves],
            "is_check": board.is_check(),
            "is_checkmate": board.is_checkmate(),
            "is_stalemate": board.is_stalemate(),
            "is_game_over": board.is_game_over(),
            "result": board.result() if board.is_game_over() else None
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
