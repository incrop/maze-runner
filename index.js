'use strict';

const SETTINGS = {
    cellSize: 120,
    wallWidth: 5,
    bgColor: '#444444',
    wallColor: '#ffdb4d',
    diamondColor: '#33ccff',
    playerColor: '#ff3300',
    moveTimeMs: 500, 
    spriteTimeMs: 100, 
};

const params = new URLSearchParams(window.location.search);
const WIDTH = parseInt(params.get('w'), 10) || 13;
const HEIGHT = parseInt(params.get('h'), 10) || 6;
const DIAMONDS = parseInt(params.get('d'), 10) || 8;

const SPRITES = {
    onload: play
};
SPRITES.ArrowDown = loadSprites('img/finn.svg', 'img/finn.svg');
SPRITES.ArrowLeft = loadSprites('img/finn-left.svg', 'img/finn-left.svg');
SPRITES.ArrowUp = loadSprites('img/finn.svg', 'img/finn.svg');
SPRITES.ArrowRight = loadSprites('img/finn.svg', 'img/finn.svg');
SPRITES.win = loadSprites('img/finn.svg', 'img/finn-left.svg');

const SOUND = {
    background: new Audio('sound/background.ogg'),
    diamond: new Audio('sound/diamond.ogg'),
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
}

class Diamond {
    constructor() {
    }
    draw(timestamp, ctx, x, y) {
        const center = Math.floor(SETTINGS.cellSize / 2);
        const size = Math.floor(SETTINGS.cellSize / 4);
        x += center;
        y += center;
        ctx.fillStyle = SETTINGS.diamondColor;
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();
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
        this.diamonds = 0;
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
        if (!p.moveTimestamp) {
            if (this.tryMoveAny(directions)) {
                p.moveTimestamp = timestamp;
            }
            return;
        }
        if (timestamp - p.moveTimestamp > SETTINGS.moveTimeMs) {
            this.items[p.i][p.j] = null;
            switch (p.direction) {
                case 'ArrowDown':
                    p.i += 1;
                    break;
                case 'ArrowLeft':
                    p.j -= 1;
                    break;
                case 'ArrowUp':
                    p.i -= 1;
                    break;
                case 'ArrowRight':
                    p.j += 1;
                    break;
            }
            if (this.items[p.i][p.j] instanceof Diamond) {
                if (--this.diamonds === 0) {
                    SOUND.background.pause();
                    SOUND.win.play();
                    p.winTimestamp = timestamp;
                } else {
                    if (SOUND.diamond.paused) {
                        SOUND.diamond.play();
                    } else {
                        SOUND.diamond.fastSeek(0);
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
    draw(timestamp) {
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
    _drawWall(_, ctx, i, j, isHor) {
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

    maze.diamonds = DIAMONDS;
    for (let d = 0; d < DIAMONDS; d++) {
        let i;
        let j;
        do {
            i = Math.floor(Math.random() * h);
            j = Math.floor(Math.random() * w);
        } while (maze.items[i][j]);
        maze.items[i][j] = new Diamond();
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
    let maze;
    let view;

    let pressedKeys = {};
    let animation = null;

    reset();

    function reset() {
        maze = new Maze(HEIGHT, WIDTH);
        generateDFS(maze);
        view = new Viewport(document.getElementById('maze'), maze);
        view.offsetX = SETTINGS.cellSize;
        view.offsetY = SETTINGS.cellSize;
        view.draw();
        SOUND.background.loop = true;
        SOUND.background.play();
    }

    function moveAnimation(timestamp) {
        maze.process(timestamp, Object.keys(pressedKeys));
        view.draw(timestamp);
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

    document.addEventListener('keydown', processKeyDown);
    document.addEventListener('keyup', processKeyUp);
}
