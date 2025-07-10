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
    let moveHistory = [];
    let currentMoveIndex = -1;

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

    // --- Move List Functions ---
    function updateMoveList() {
        const moveListEl = $('#movelist');
        moveListEl.empty();
        
        const moves = game.history();
        
        for (let i = 0; i < moves.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = moves[i];
            const blackMove = moves[i + 1];
            
            const movePairDiv = $('<div class="move-pair"></div>');
            const moveNumberSpan = $(`<span class="move-number">${moveNumber}.</span>`);
            movePairDiv.append(moveNumberSpan);
            
            const whiteMoveSpan = $(`<span class="move-white" data-move-index="${i}">${whiteMove}</span>`);
            movePairDiv.append(whiteMoveSpan);
            
            if (blackMove) {
                const blackMoveSpan = $(`<span class="move-black" data-move-index="${i + 1}">${blackMove}</span>`);
                movePairDiv.append(blackMoveSpan);
            }
            
            moveListEl.append(movePairDiv);
        }
        
        // Scroll to bottom
        moveListEl.scrollTop(moveListEl[0].scrollHeight);
    }

    function highlightCurrentMove() {
        $('.move-white, .move-black').removeClass('move-current');
        if (currentMoveIndex >= 0) {
            $(`.move-white[data-move-index="${currentMoveIndex}"], .move-black[data-move-index="${currentMoveIndex}"]`).addClass('move-current');
        }
    }

    function goToMove(moveIndex) {
        const moves = game.history();
        if (moveIndex < 0 || moveIndex >= moves.length) return;
        
        // Create a new game and replay moves up to the selected move
        const tempGame = new Chess();
        for (let i = 0; i <= moveIndex; i++) {
            tempGame.move(moves[i]);
        }
        
        board.position(tempGame.fen());
        currentMoveIndex = moveIndex;
        highlightCurrentMove();
    }

    function goToCurrentPosition() {
        board.position(game.fen());
        currentMoveIndex = game.history().length - 1;
        highlightCurrentMove();
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
        // see if the move is legal
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q' // NOTE: always promote to a queen for example simplicity
        });

        // illegal move
        if (move === null) return 'snapback';

        updateStatus();
        updateMoveList(); // Update the move list
        
        // make random legal move for black
        window.setTimeout(getBestMove, 250);
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
                        updateMoveList();
                        goToCurrentPosition();
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
        moveHistory = [];
        currentMoveIndex = -1;
        stopTimer();
        initializeTimers();
        updateStatus();
        updateMoveList();
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

    // Movelist click handler using delegation
    $('#movelist').on('click', '.move-white, .move-black', function() {
        const moveIndex = parseInt($(this).data('move-index'));
        goToMove(moveIndex);
    });

    // Double-click to return to current position
    $('#movelist').on('dblclick', function() {
        goToCurrentPosition();
    });
});
