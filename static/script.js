$(document).ready(function() {
    let board = null;
    let game = new Chess();
    let statusEl = $('#game-status');
    let whiteTimer = null;
    let blackTimer = null;
    let whiteTime = 0;
    let blackTime = 0;
    let currentPlayerTimer = null;
    let gameStarted = false;
    let gameEnded = false;

    // Time modes in seconds
    const TIME_MODES = {
        unlimited: 0,
        blitz: 5 * 60,      // 5 minutes
        rapid: 15 * 60,     // 15 minutes
        classical: 30 * 60  // 30 minutes
    };

    // --- Timer Functions ---
    function initializeTimers() {
        const timeMode = $('#time-mode').val();
        const timeInSeconds = TIME_MODES[timeMode];
        
        if (timeInSeconds === 0) {
            whiteTime = 0;
            blackTime = 0;
            updateTimerDisplay();
            return;
        }
        
        whiteTime = timeInSeconds;
        blackTime = timeInSeconds;
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const whiteDisplay = whiteTime === 0 ? '∞' : formatTime(whiteTime);
        const blackDisplay = blackTime === 0 ? '∞' : formatTime(blackTime);
        
        $('#white-timer').text(`White: ${whiteDisplay}`);
        $('#black-timer').text(`Black: ${blackDisplay}`);
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        if (whiteTime === 0 && blackTime === 0) return; // Unlimited mode
        
        if (currentPlayerTimer) {
            clearInterval(currentPlayerTimer);
        }
        
        currentPlayerTimer = setInterval(() => {
            if (gameEnded) {
                clearInterval(currentPlayerTimer);
                return;
            }
            
            if (game.turn() === 'w') {
                whiteTime--;
                if (whiteTime <= 0) {
                    whiteTime = 0;
                    endGame('Black wins on time!');
                }
            } else {
                blackTime--;
                if (blackTime <= 0) {
                    blackTime = 0;
                    endGame('White wins on time!');
                }
            }
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        if (currentPlayerTimer) {
            clearInterval(currentPlayerTimer);
            currentPlayerTimer = null;
        }
    }

    // --- ChessboardJS Configuration ---
    function onDragStart(source, piece, position, orientation) {
        if (gameEnded) return false;
        if (game.game_over()) return false;
        if (piece.search(/^b/) !== -1) return false; // Only allow white pieces
        
        if (!gameStarted) {
            gameStarted = true;
            startTimer();
        }
        
        return true;
    }

    function onDrop(source, target) {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';
        
        updateStatus();
        
        if (!game.game_over()) {
            getBestMove();
        }
        
        return true;
    }

    function onSnapEnd() {
        board.position(game.fen());
    }

    function updateStatus() {
        let status = '';
        const moveColor = game.turn() === 'b' ? 'Black' : 'White';

        if (game.in_checkmate()) {
            status = `Game over, ${moveColor} is in checkmate.`;
            endGame(status);
        } else if (game.in_draw()) {
            status = 'Game over, drawn position.';
            endGame(status);
        } else {
            status = `${moveColor} to move.`;
            if (game.in_check()) {
                status += ` ${moveColor} is in check.`;
            }
        }
        statusEl.html(status);
    }

    function getBestMove() {
        if (!game.game_over() && !gameEnded) {
            $.ajax({
                url: '/get_best_move',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ fen: game.fen() }),
                success: function(data) {
                    if (!gameEnded) {
                        game.move(data.best_move, { sloppy: true });
                        board.position(game.fen());
                        updateStatus();
                    }
                },
                error: function() {
                    console.log('Error getting best move');
                }
            });
        }
    }

    function endGame(message) {
        gameEnded = true;
        gameStarted = false;
        stopTimer();
        statusEl.html(message);
        $('#surrender-btn').prop('disabled', true);
    }

    function startNewGame() {
        game.reset();
        board.start();
        gameStarted = false;
        gameEnded = false;
        stopTimer();
        initializeTimers();
        updateStatus();
        $('#surrender-btn').prop('disabled', false);
    }

    function surrender() {
        if (!gameEnded) {
            endGame('White surrenders. Black wins!');
        }
    }

    // --- Board Configuration ---
    const config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };
    
    board = Chessboard('board', config);
    initializeTimers();
    updateStatus();

    // --- Event Handlers ---
    $('#new-game-btn').on('click', startNewGame);
    $('#surrender-btn').on('click', surrender);
    
    $('#time-mode').on('change', function() {
        if (!gameStarted) {
            initializeTimers();
        }
    });
});
