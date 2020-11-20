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
const WIDTH = parseInt(params.get('w') || 13, 10);
const HEIGHT = parseInt(params.get('h') || 6, 10);
const TREASURES = parseInt(params.get('t') || 8, 10);
const SKELETONS = parseInt(params.get('s') || 2, 10);
const POTS = parseInt(params.get('p') || 4, 10);
const GHOSTS = parseInt(params.get('g') || 2, 10);
const EDIT_MODE = !!params.get('e');

const SPRITES = {
    onload: play
};
SPRITES.ArrowDown = loadSprites('img/down-stand.svg', 'img/down-move1.svg', 'img/down-move3.svg');
SPRITES.ArrowLeft = loadSprites('img/left-stand.svg', 'img/left-move1.svg', 'img/left-move2.svg', 'img/left-move3.svg', 'img/left-move2.svg');
SPRITES.ArrowUp = loadSprites('img/up-stand.svg', 'img/up-move1.svg', 'img/up-move3.svg');
SPRITES.ArrowRight = loadSprites('img/right-stand.svg', 'img/right-move1.svg', 'img/right-move2.svg', 'img/right-move3.svg', 'img/right-move2.svg');
SPRITES.treasure = {
    chest: loadSprites('img/chest1-1.svg', 'img/chest1-2.svg'),
    gem1: loadSprites('img/gem1-1.svg', 'img/gem1-2.svg'),
    gem2: loadSprites('img/gem2-1.svg', 'img/gem2-2.svg'),
    gem3: loadSprites('img/gem3-1.svg', 'img/gem3-2.svg'),
};
SPRITES.skeleton = {
    sleep: loadSprites('img/skeleton1-1.svg', 'img/skeleton1-2.svg', 'img/skeleton2.svg'),
    wake: loadSprites('img/skeleton-stand1.svg', 'img/skeleton-stand2.svg', 'img/skeleton-stand3.svg'),
}
SPRITES.ghost = {
    sleep: loadSprites('img/ghost1.svg', 'img/ghost2.svg', 'img/ghost3.svg'),
    wake: loadSprites('img/ghost-stand1.svg', 'img/ghost-stand2.svg', 'img/ghost-stand3.svg'),
};
SPRITES.win = loadSprites('img/down-stand.svg', 'img/down-cheer.svg');

const SOUND = {
    background: new Audio('sound/background.ogg'),
    treasure: new Audio('sound/treasure.ogg'),
    skeleton: {
        wake: new Audio('sound/skeleton-wake.ogg'),
        dead: new Audio('sound/skeleton-dead.ogg'),
    },
    ghost: new Audio('sound/ghost.ogg'),
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
        const names = Object.keys(SPRITES.treasure);
        const name = names[Math.floor(Math.random() * names.length)];
        this.sprites = SPRITES.treasure[name];
    }
    draw(timestamp, ctx, x, y) {
        const spriteIdx = Math.floor((timestamp % (SETTINGS.moveTimeMs * 2)) / SETTINGS.moveTimeMs);
        const sprite = this.sprites[spriteIdx];
        const center = Math.floor(SETTINGS.cellSize / 2);
        const h = Math.floor(sprite.height);
        const w = Math.floor(sprite.width);
        x += center - Math.floor(w / 2);
        y += center - Math.floor(h / 2);
        ctx.drawImage(sprite, x, y, w, h);
    }
}

class Skeleton {
    constructor() {
        this.state = 'sleep';
        this.progress = false;
    }
    draw(timestamp, ctx, x, y) {
        const sprite = this._getSprite(timestamp);
        const center = Math.floor(SETTINGS.cellSize / 2);
        const h = Math.floor(sprite.height);
        const w = Math.floor(sprite.width);
        x += center - Math.floor(w / 2);
        y += center - Math.floor(h / 2);
        ctx.drawImage(sprite, x, y, w, h);
    }
    _getSprite(timestamp) {
        if (this.progress) {
            return SPRITES.skeleton.sleep[2];
        }
        switch (this.state) {
            case 'sleep':
                return SPRITES.skeleton.sleep[0];
            case 'dead':
                return SPRITES.skeleton.sleep[1];             
            case 'wake':
                const quarter = Math.floor((timestamp % (SETTINGS.moveTimeMs * 4)) / SETTINGS.moveTimeMs);
                const idx =
                    quarter === 0 ? 0 :
                    quarter === 2 ? 2 : 1
                return SPRITES.skeleton.wake[idx];
        }
    }
}

class Pot {
    constructor() {
    }
    draw(timestamp, ctx, x, y) {
        const sprite = SPRITES.ghost.sleep[0];
        const center = Math.floor(SETTINGS.cellSize / 2);
        const h = Math.floor(sprite.height);
        const w = Math.floor(sprite.width);
        x += center - Math.floor(w / 2);
        y += center - Math.floor(h / 2);
        ctx.drawImage(sprite, x, y, w, h);
    }
}


class Ghost {
    constructor() {
        this.state = 'sleep'
        this.progress = 0;
    }
    draw(timestamp, ctx, x, y) {
        const sprite = this._getSprite(timestamp);
        const center = Math.floor(SETTINGS.cellSize / 2);
        const h = Math.floor(sprite.height);
        const w = Math.floor(sprite.width);
        x += center - Math.floor(w / 2);
        y += center - Math.floor(h / 2);
        ctx.drawImage(sprite, x, y, w, h);
    }
    _getSprite(timestamp) {
        switch (this.state) {
            case 'sleep':
                return SPRITES.ghost.sleep[this.progress];
            case 'wake':
                const quarter = Math.floor((timestamp % (SETTINGS.moveTimeMs * 4)) / SETTINGS.moveTimeMs);
                const idx =
                    quarter === 0 ? 0 :
                    quarter === 2 ? 2 : 1
                return SPRITES.ghost.wake[idx];              
        }
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
    }
    canMove(direction) {
        const p = this.player;
        switch (direction) {
            case 'ArrowDown':
                return !this.horWalls[p.i + 1][p.j] && !this.isBlocked(p.i + 1, p.j);
            case 'ArrowLeft':
                return !this.verWalls[p.i][p.j] && !this.isBlocked(p.i, p.j - 1);
            case 'ArrowUp':
                return !this.horWalls[p.i][p.j] && !this.isBlocked(p.i - 1, p.j);
            case 'ArrowRight':
                return !this.verWalls[p.i][p.j + 1] && !this.isBlocked(p.i, p.j + 1);
            default:
                return false;
        }
    }
    isBlocked(i, j) {
        if (i < 0 || i >= this.height || j < 0 || j >= this.width) {
            return true;
        }
        const item = this.items[i][j]
        if (!item) {
            return false;
        }
        return item instanceof Ghost;
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
            } else {
                return;
            }
        }
        const moveProgress = (timestamp - p.moveTimestamp) / SETTINGS.moveTimeMs;
        this._processNeighborSkeletons(moveProgress);
        this._processNeighborGhosts(moveProgress);
        if (moveProgress > 1) {
            [p.i, p.j] = p.targetCell();
            if (this.items[p.i][p.j] instanceof Treasure || this.items[p.i][p.j] instanceof Pot) {
                if (--this.treasures === 0) {
                    SOUND.background.pause();
                    SOUND.win.play();
                    p.winTimestamp = timestamp;
                } else {
                    if (SOUND.treasure.paused) {
                        SOUND.treasure.play();
                    } else {
                        SOUND.treasure.currentTime = 0;
                    }
                }
                this.items[p.i][p.j] = null;
            }
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
    _processNeighborSkeletons(moveProgress) {
        const [i1, j1] = this.player.targetCell();
        if (this.items[i1][j1] instanceof Skeleton) {
            const skeleton = this.items[i1][j1];
            if (skeleton.state === 'wake') {
                skeleton.state = 'dead';
                skeleton.progress = true;
                SOUND.skeleton.dead.play();
            }
            if (moveProgress > 1) {
                skeleton.progress = false;
            }
        }
        for (const [di, dj] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
            const [i2, j2] = [i1 + di, j1 + dj];
            if (!this.items[i2] || !this.items[i2][j2]) {
                continue;
            }
            if (this.items[i2][j2] instanceof Skeleton) {
                const skeleton = this.items[i2][j2];
                if (skeleton.state === 'sleep') {
                    skeleton.state = 'wake';
                    skeleton.progress = true;
                    SOUND.skeleton.wake.play();
                }
                if (moveProgress > 1) {
                    skeleton.progress = false;
                }
            }
        }
    }
    _processNeighborGhosts(moveProgress) {
        const [i1, j1] = this.player.targetCell();
        for (const [di, dj] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
            const [i2, j2] = [i1 + di, j1 + dj];
            if (!this.items[i2] || !this.items[i2][j2]) {
                continue;
            }
            if (this.items[i2][j2] instanceof Ghost) {
                if (
                    (di === -1 && this.horWalls[i1][j1]) ||
                    (di === 1 && this.horWalls[i1 + 1][j1]) ||
                    (dj === -1 && this.verWalls[i1][j1]) ||
                    (dj === 1 && this.verWalls[i1][j1 + 1])) {
                    continue;
                }
                const ghost = this.items[i2][j2];
                if (ghost.state === 'sleep') {
                    if (!ghost.progress) {
                        SOUND.ghost.play();
                    }
                    ghost.progress = moveProgress < 0.5 ? 1 : 2;
                }
                if (moveProgress > 1) {
                    ghost.state = 'wake';
                }
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
        this._drawPlayer(timestamp, ctx);
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
    _drawItem(timestamp, ctx, i, j, Clazz) {
        const items = this.maze.items;
        if (!items[i] || !items[i][j]) {
            return;
        }
        const y = this.offsetY + i * SETTINGS.cellSize;
        const x = this.offsetX + j * SETTINGS.cellSize;
        const p = this.maze.player;
        items[i][j].draw(timestamp, ctx, x, y);
    }
    _drawPlayer(timestamp, ctx) {
        const p = this.maze.player;
        const y = this.offsetY + p.i * SETTINGS.cellSize;
        const x = this.offsetX + p.j * SETTINGS.cellSize;
        p.draw(timestamp, ctx, x, y);
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

    maze.treasures = TREASURES + POTS;
    for (let i = 0; i < TREASURES; i++) {
        putAtRandom(new Treasure());
    }
    for (let i = 0; i < SKELETONS; i++) {
        putAtRandom(new Skeleton());
    }
    for (let i = 0; i < POTS; i++) {
        putAtRandom(new Pot());
    }

    generateStep(Math.floor(Math.random() * h), Math.floor(Math.random() * w));
    
    function generateStep(i, j, depth) {
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

    for (let i = 0; i < GHOSTS; i++) {
        putAtRandom(new Ghost(), createLoop);
    }

    function putAtRandom(item, extraCheck) {
        let i;
        let j;
        do {
            i = Math.floor(Math.random() * h);
            j = Math.floor(Math.random() * w);
        } while ((i + j) <= 1 || maze.items[i][j] || (extraCheck && !extraCheck(i, j)));
        maze.items[i][j] = item;
    }

    function shuffleDir() {
        const a = ['u', 'l', 'r', 'd'];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function createLoop(i, j) {
        const start = [];
        if (!maze.horWalls[i][j]) {
            if (maze.items[i][j] instanceof Ghost) {
                return false;
            }
            start.push([i - 1, j]);
        }
        if (!maze.horWalls[i + 1][j]) {
            if (maze.items[i + 1][j] instanceof Ghost) {
                return false;
            }
            start.push([i + 1, j]);
        }
        if (!maze.verWalls[i][j]) {
            if (maze.items[i][j - 1] instanceof Ghost) {
                return false;
            }
            start.push([i, j - 1]);
        }
        if (!maze.verWalls[i][j + 1]) {
            if (maze.items[i][j + 1] instanceof Ghost) {
                return false;
            }
            start.push([i, j + 1]);
        }
        if (start.length != 2) {
            return false;
        }
        const dist = Array.from(Array(h + 1), () => Array(w + 1));
        flood(start[0], 1, i => i + 1);
        flood(start[1], -1, i => i - 1);
        const max = {
            dist: 0,
            wall: [],
            i: 0,
            j: 0,
        }
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                let d = Math.abs(dist[i][j] - dist[i + 1][j]);
                if (dist[i][j] * dist[i + 1][j] < 0 && d > max.dist) {
                    max.dist = d;
                    max.wall = maze.horWalls;
                    max.i = i + 1;
                    max.j = j;
                }
                d = Math.abs(dist[i][j] - dist[i][j + 1]);
                if (dist[i][j] * dist[i + 1][j] < 0 && d > max.dist) {
                    max.dist = d;
                    max.wall = maze.verWalls
                    max.i = i;
                    max.j = j + 1;
                }
            }
        }
        if (max.dist <= 3) {
            return false;
        }
        max.wall[max.i][max.j] = false;
        return true;
        
        function flood([i1, j1], val, upd) {
            dist[i1][j1] = val;
            for (const [di, dj] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
                if (
                    (di === -1 && maze.horWalls[i1][j1]) ||
                    (di === 1 && maze.horWalls[i1 + 1][j1]) ||
                    (dj === -1 && maze.verWalls[i1][j1]) ||
                    (dj === 1 && maze.verWalls[i1][j1 + 1])) {
                    continue;
                }
                const [i2, j2] = [i1 + di, j1 + dj];
                if (i2 === i && j2 === j) {
                    continue;
                }
                if (dist[i2][j2] || maze.items[i2][j2] instanceof Ghost) {
                    continue;
                }
                flood([i2, j2], upd(val), upd);
            }
        }
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

    reset();
    requestAnimationFrame(draw);

    function reset() {
        maze = new Maze(HEIGHT, WIDTH);
        if (!EDIT_MODE) {
            generateDFS(maze);
        }
        
        view = new Viewport(canvas, maze);
        view.offsetX = SETTINGS.cellSize;
        view.offsetY = SETTINGS.cellSize;
        SOUND.background.loop = true;
        SOUND.background.play();
    }

    function draw(timestamp) {
        maze.process(timestamp, Object.keys(pressedKeys));
        view.drawAll(timestamp);
        requestAnimationFrame(draw);
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
            const p = maze.player;
            if (p.i === i && p.j === j) {
                return;
            }
            const item = maze.items[i][j];
            maze.items[i][j] =
                item ? null :
                e.ctrlKey ? new Skeleton() :
                e.altKey ? new Ghost() :
                new Treasure();
            return;
        }
        if (dx > dy) {
            if (dy < -dx) {
                if (i > 0) {
                    maze.horWalls[i][j] = !maze.horWalls[i][j];
                }
            } else {
                if (j < maze.width - 1) {
                    maze.verWalls[i][j + 1] = !maze.verWalls[i][j + 1];
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
    }

    document.addEventListener('keydown', processKeyDown);
    document.addEventListener('keyup', processKeyUp);
    canvas.addEventListener('click', processClick);
}
