#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_new_game():
    """Test creating a new game"""
    try:
        response = requests.post(f"{BASE_URL}/new_game")
        data = response.json()
        print(f"New game: {response.status_code}")
        print(f"Starting FEN: {data['board']}")
        print(f"Legal moves count: {len(data['legal_moves'])}")
        return response.status_code == 200, data['board']
    except Exception as e:
        print(f"New game test failed: {e}")
        return False, None

def test_make_move(fen):
    """Test making a move"""
    try:
        # Make the move e2e4 (King's pawn opening)
        payload = {
            "fen": fen,
            "move": "e2e4"
        }
        response = requests.post(f"{BASE_URL}/make_move", json=payload)
        data = response.json()
        print(f"Make move: {response.status_code}")
        print(f"New FEN: {data['board']}")
        return response.status_code == 200, data['board']
    except Exception as e:
        print(f"Make move test failed: {e}")
        return False, None

def test_get_best_move(fen):
    """Test getting best move from Stockfish"""
    try:
        payload = {
            "fen": fen,
            "time_limit": 1.0
        }
        response = requests.post(f"{BASE_URL}/get_best_move", json=payload)
        data = response.json()
        print(f"Best move: {response.status_code}")
        print(f"Stockfish suggests: {data['best_move']}")
        return response.status_code == 200
    except Exception as e:
        print(f"Best move test failed: {e}")
        return False

def test_analyze_position(fen):
    """Test position analysis"""
    try:
        payload = {
            "fen": fen,
            "time_limit": 1.0
        }
        response = requests.post(f"{BASE_URL}/analyze_position", json=payload)
        data = response.json()
        print(f"Position analysis: {response.status_code}")
        print(f"Score: {data['score']}")
        print(f"Best move: {data['best_move']}")
        return response.status_code == 200
    except Exception as e:
        print(f"Position analysis test failed: {e}")
        return False

def run_tests():
    """Run all tests"""
    print("=== Chess Server Test Suite ===\n")
    
    # Test health
    if not test_health():
        print("❌ Server is not healthy. Exiting tests.")
        return
    
    print("✅ Health check passed\n")
    
    # Test new game
    success, initial_fen = test_new_game()
    if not success:
        print("❌ New game test failed")
        return
    
    print("✅ New game test passed\n")
    
    # Test making a move
    success, new_fen = test_make_move(initial_fen)
    if not success:
        print("❌ Make move test failed")
        return
    
    print("✅ Make move test passed\n")
    
    # Test getting best move
    if not test_get_best_move(new_fen):
        print("❌ Best move test failed")
        return
    
    print("✅ Best move test passed\n")
    
    # Test position analysis
    if not test_analyze_position(new_fen):
        print("❌ Position analysis test failed")
        return
    
    print("✅ Position analysis test passed\n")
    
    print("🎉 All tests passed! Chess server is working correctly.")

if __name__ == "__main__":
    run_tests()