'use strict';

const SETTINGS = {
    cellSize: 120,
    wallWidth: 5,
    bgColor: '#444444',
    wallColor: '#ffdb4d',
    playerColor: '#ff3300',
    moveTimeMs: 500, 
    spriteTimeMs: 100, 
};

const params = new URLSearchParams(window.location.search);
const WIDTH = parseInt(params.get('w'), 10) || 13;
const HEIGHT = parseInt(params.get('h'), 10) || 6;
const TREASURES = parseInt(params.get('t'), 10) || 8;
const EDIT_MODE = !!params.get('e');

const SPRITES = {
    onload: play
};
SPRITES.ArrowDown = loadSprites('img/right-stand.svg', 'img/right-move1.svg', 'img/right-move2.svg', 'img/right-move3.svg', 'img/right-move2.svg');
SPRITES.ArrowLeft = loadSprites('img/left-stand.svg', 'img/left-move1.svg', 'img/left-move2.svg', 'img/left-move3.svg', 'img/left-move2.svg');
SPRITES.ArrowUp = loadSprites('img/right-stand.svg', 'img/right-move1.svg', 'img/right-move2.svg', 'img/right-move3.svg', 'img/right-move2.svg');
SPRITES.ArrowRight = loadSprites('img/right-stand.svg', 'img/right-move1.svg', 'img/right-move2.svg', 'img/right-move3.svg', 'img/right-move2.svg');
SPRITES.treasure = loadSprites('img/chest.svg', 'img/gem1.svg', 'img/gem2.svg', 'img/gem3.svg');
SPRITES.win = loadSprites('img/right-move1.svg', 'img/right-stand.svg', 'img/left-move3.svg', 'img/left-stand.svg');

const SOUND = {
    background: new Audio('sound/background.ogg'),
    treasure: new Audio('sound/treasure.ogg'),
    win: new Audio('sound/win.ogg'),
};

class Player {
    constructor(i, j) {
        this.i = i;
        this.j = j;
        this.direction = 'ArrowDown';
        this.moveTimestamp = null;
        this.winTimestamp = null;
    }
    draw(timestamp, ctx, x, y) {
        const center = Math.floor(SETTINGS.cellSize / 2);
        const size = Math.floor(SETTINGS.cellSize * 0.4);
        x += center;
        y += center;
        let sprite = SPRITES[this.direction][0];
        if (this.moveTimestamp) {
            const elapsed = timestamp - this.moveTimestamp;
            const offset = Math.min(SETTINGS.cellSize, Math.floor(SETTINGS.cellSize * elapsed / SETTINGS.moveTimeMs));
            switch (this.direction) {
                case 'ArrowDown':
                    y += offset;
                    break;
                case 'ArrowLeft':
                    x -= offset;
                    break;
                case 'ArrowUp':
                    y -= offset;
                    break;
                case 'ArrowRight':
                    x += offset;
                    break;
            }
            const spriteInterval = Math.floor(elapsed / SETTINGS.spriteTimeMs);
            const spriteIdx = (spriteInterval % (SPRITES[this.direction].length - 1)) + 1;
            sprite = SPRITES[this.direction][spriteIdx];
        } else if (this.winTimestamp) {
            const elapsed = timestamp - this.winTimestamp;
            const spriteInterval = Math.floor(elapsed / SETTINGS.moveTimeMs);
            const spriteIdx = spriteInterval % SPRITES.win.length;
            sprite = SPRITES.win[spriteIdx];
        }
        ctx.drawImage(sprite, x + size, y + size, -2 * size, -2 * size);
    }
    targetCell() {
        switch (this.direction) {
            case 'ArrowDown':
                return [this.i + 1, this.j];
            case 'ArrowLeft':
                return [this.i, this.j - 1];
            case 'ArrowUp':
                return [this.i - 1, this.j];
            case 'ArrowRight':
                return [this.i, this.j + 1];
        }
    }
}

class Treasure {
    constructor() {
        const spriteIdx = Math.floor(Math.random() * SPRITES.treasure.length);
        this.sprite = SPRITES.treasure[spriteIdx];
    }
    draw(timestamp, ctx, x, y) {
        const center = Math.floor(SETTINGS.cellSize / 2);
        const mul = 1.4;
        const h = Math.floor(this.sprite.height * mul);
        const w = Math.floor(this.sprite.width * mul);
        x += center - Math.floor(w / 2);
        y += center - Math.floor(h / 2);
        ctx.drawImage(this.sprite, x, y, w, h);
    }
}

class Maze {
    constructor(height, width) { 
        this.height = height; 
        this.width = width;
        this.horWalls = Array.from(Array(height + 1), () => Array(width));
        this.verWalls = Array.from(Array(height), () => Array(width + 1));
        this.items = Array.from(Array(height), () => Array(width));
        this.player = new Player(0, 0);
        this.treasures = 0;
        this.changedCells = [];
        this.init();
    }
    init() {
        for (let j = 0; j < this.width; j++) {
            this.horWalls[0][j] = true;
            this.horWalls[this.height][j] = true;
        }
        for (let i = 0; i < this.height; i++) {
            this.verWalls[i][0] = true;
            this.verWalls[i][this.width] = true;
        }
        this.items[0][0] = this.player;
    }
    canMove(direction) {
        const p = this.player;
        switch (direction) {
            case 'ArrowDown':
                return !this.horWalls[p.i + 1][p.j];
            case 'ArrowLeft':
                return !this.verWalls[p.i][p.j];
            case 'ArrowUp':
                return !this.horWalls[p.i][p.j];
            case 'ArrowRight':
                return !this.verWalls[p.i][p.j + 1];
            default:
                return false;
        }
    }
    tryMoveAny(directions) {
        for (const direction of directions) {
            this.player.direction = direction;
            if (this.canMove(direction)) {
                return true;
            }
        }
        return false;
    }
    process(timestamp, directions) {
        const p = this.player;
        this.changedCells = [[p.i, p.j]];
        if (!p.moveTimestamp) {
            if (this.tryMoveAny(directions)) {
                p.moveTimestamp = timestamp;
            }
            return;
        }
        this.changedCells.push(p.targetCell());
        if (timestamp - p.moveTimestamp > SETTINGS.moveTimeMs) {
            this.items[p.i][p.j] = null;
            [p.i, p.j] = p.targetCell();
            if (this.items[p.i][p.j] instanceof Treasure) {
                if (--this.treasures === 0) {
                    SOUND.background.pause();
                    SOUND.win.play();
                    p.winTimestamp = timestamp;
                } else {
                    if (SOUND.treasure.paused) {
                        SOUND.treasure.play();
                    } else {
                        SOUND.treasure.fastSeek(0);
                    }
                }
            }
            this.items[p.i][p.j] = p;
            if (p.winTimestamp) {
                p.winTimestamp = p.moveTimestamp + SETTINGS.moveTimeMs;
            }
            if (this.tryMoveAny(directions)) {
                p.moveTimestamp += SETTINGS.moveTimeMs;
            } else {
                p.moveTimestamp = null;
            }
        }
    }
    isAnimating() {
        return this.player.moveTimestamp || this.player.winTimestamp;
    }
}

class Viewport {
    constructor(canvas, maze) {
        this.canvas = canvas;
        this.maze = maze;
        this.offsetX = 0;
        this.offsetY = 0;
    }
    drawAll(timestamp) {
        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = SETTINGS.bgColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = SETTINGS.wallColor;
        for (let i = 0; i <= this.maze.height; i++) {
            for (let j = 0; j <= this.maze.width; j++) {
                this._drawWall(timestamp, ctx, i, j, true);
                this._drawWall(timestamp, ctx, i, j, false);
            }
        }
        for (let i = 0; i <= this.maze.height; i++) {
            for (let j = 0; j <= this.maze.width; j++) {
                this._drawItem(timestamp, ctx, i, j);
            }
        }
    }
    drawChanged(timestamp) {
        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = SETTINGS.bgColor;
        for (const [i, j] of this.maze.changedCells) {
            this._clearCell(timestamp, ctx, i, j);
        }
        ctx.fillStyle = SETTINGS.wallColor;
        for (const [i, j] of this.maze.changedCells) {
            this._drawWall(timestamp, ctx, i, j, true);
            this._drawWall(timestamp, ctx, i, j, false);
        }
        for (const [i, j] of this.maze.changedCells) {
            this._drawItem(timestamp, ctx, i, j);
        }
    }
    _clearCell(timestamp, ctx, i, j) {
        const y = this.offsetY + i * SETTINGS.cellSize + SETTINGS.wallWidth;
        const x = this.offsetX + j * SETTINGS.cellSize + SETTINGS.wallWidth;
        const size = SETTINGS.cellSize - 2 * SETTINGS.wallWidth;
        ctx.fillRect(x, y, size, size);
        ctx.fillRect(x, y - 2 * SETTINGS.wallWidth, size, 2 * SETTINGS.wallWidth);
        ctx.fillRect(x - 2 * SETTINGS.wallWidth, y, 2 * SETTINGS.wallWidth, size);
    }
    _drawWall(timestamp, ctx, i, j, isHor) {
        const walls = isHor ? this.maze.horWalls : this.maze.verWalls;
        if (!walls[i] || !walls[i][j]) {
            return;
        }
        const y = this.offsetY + i * SETTINGS.cellSize - SETTINGS.wallWidth;
        const x = this.offsetX + j * SETTINGS.cellSize - SETTINGS.wallWidth;
        const w = 2 * SETTINGS.wallWidth;
        const l = SETTINGS.cellSize + w;
        if (isHor) {
            ctx.fillRect(x, y, l, w);
        } else {
            ctx.fillRect(x, y, w, l);
        }
    
    }
    _drawItem(timestamp, ctx, i, j) {
        const items = this.maze.items;
        if (!items[i] || !items[i][j]) {
            return;
        }
        const y = this.offsetY + i * SETTINGS.cellSize;
        const x = this.offsetX + j * SETTINGS.cellSize;
        items[i][j].draw(timestamp, ctx, x, y);
    }
}

function generateDFS(maze) {
    const h = maze.height;
    const w = maze.width;
    const visited = Array.from(Array(h), () => Array(w));

    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            maze.verWalls[i][j] = true;
            maze.horWalls[i][j] = true;
        }
    }

    maze.treasures = TREASURES;
    for (let d = 0; d < TREASURES; d++) {
        let i;
        let j;
        do {
            i = Math.floor(Math.random() * h);
            j = Math.floor(Math.random() * w);
        } while (maze.items[i][j]);
        maze.items[i][j] = new Treasure();
    }

    generateStep(Math.floor(Math.random() * h), Math.floor(Math.random() * w));
    
    function generateStep(i, j) {
        visited[i][j] = true;
        for (const dir of shuffleDir()) {
            switch (dir) {
                case 'u':
                    if (i > 0 && !visited[i - 1][j]) {
                        maze.horWalls[i][j] = false;
                        generateStep(i - 1, j);
                    }
                    break;
                case 'd':
                    if (i < h - 1 && !visited[i + 1][j]) {
                        maze.horWalls[i + 1][j] = false;
                        generateStep(i + 1, j);
                    }
                    break;
                case 'l':
                    if (j > 0 && !visited[i][j - 1]) {
                        maze.verWalls[i][j] = false;
                        generateStep(i, j - 1);
                    }
                    break;
                case 'r':
                    if (j < w - 1 && !visited[i][j + 1]) {
                        maze.verWalls[i][j + 1] = false;
                        generateStep(i, j + 1);
                    }
                    break;

            }
        }
    }

    function shuffleDir() {
        const a = ['u', 'l', 'r', 'd'];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
}

function loadSprites(...urls) {
    return urls.map(url => {
        SPRITES.loadCount = !SPRITES.loadCount ? 1 : SPRITES.loadCount + 1;
        const img = new Image();
        img.onload = decLoadCount;
        img.src = url;
        return img;
    });
    function decLoadCount() {
        if (--SPRITES.loadCount === 0) {
            SPRITES.onload();
        }
    }
}

function play() {
    const canvas = document.getElementById('maze');
    let maze;
    let view;

    let pressedKeys = {};
    let animation = null;

    reset();

    function reset() {
        maze = new Maze(HEIGHT, WIDTH);
        if (!EDIT_MODE) {
            generateDFS(maze);
        }
        
        view = new Viewport(canvas, maze);
        view.offsetX = SETTINGS.cellSize;
        view.offsetY = SETTINGS.cellSize;
        view.drawAll();
        SOUND.background.loop = true;
        SOUND.background.play();
    }

    function moveAnimation(timestamp) {
        maze.process(timestamp, Object.keys(pressedKeys));
        view.drawChanged(timestamp);
        if (maze.isAnimating()) {
            animation = requestAnimationFrame(moveAnimation);
        } else {
            animation = null;
        }
    }

    function processKeyDown(e) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'ArrowUp':
            case 'ArrowDown':
                break;
            case 'Enter':
            case ' ':
                if (maze.player.winTimestamp) {
                    reset();
                }
                return;
            case 'Escape':
                reset();
                return;
            default:
                return;
        }
        pressedKeys[e.key] = true;
        if (!animation) {
            animation = window.requestAnimationFrame(moveAnimation);
        }
    }

    function processKeyUp(e) {
        delete pressedKeys[e.key];
    }

    function processClick(e) {
        if (!EDIT_MODE) {
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const i = Math.floor((y - view.offsetY) / SETTINGS.cellSize);
        const j = Math.floor((x - view.offsetX) / SETTINGS.cellSize);
        if (i < 0 || i >= maze.height || j < 0 || j >= maze.width) {
            return;
        }
        const dx = x - (view.offsetX + j * SETTINGS.cellSize + SETTINGS.cellSize / 2);
        const dy = y - (view.offsetY + i * SETTINGS.cellSize + SETTINGS.cellSize / 2);
        if (Math.abs(dx) < SETTINGS.cellSize / 4 && Math.abs(dy) < SETTINGS.cellSize / 4) {
            const item = maze.items[i][j];
            if (item instanceof Player) {
                return;
            }
            maze.items[i][j] = item ? null : new Treasure();
            view.drawAll();
            return;
        }
        if (dx > dy) {
            if (dy < -dx) {
                if (i > 0) {
                    maze.horWalls[i][j] = !maze.horWalls[i][j];
                }
            } else {
                if (j < maze.width - 1) {
                    maze.verWalls[i][j + 1] = !maze.horWalls[i][j + 1];
                }
            }
        } else {
            if (dx < -dy) {
                if (j > 0) {
                    maze.verWalls[i][j] = !maze.verWalls[i][j];
                }
            } else {
                if (i < maze.height - 1) {
                    maze.horWalls[i + 1][j] = !maze.horWalls[i + 1][j];
                }
            }
            
        }
        view.drawAll();
    }

    document.addEventListener('keydown', processKeyDown);
    document.addEventListener('keyup', processKeyUp);
    canvas.addEventListener('click', processClick);
}
