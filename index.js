'use strict';

const SETTINGS = {
    cellSize: 120,
    wallWidth: 5,
    bgColor: '#444444',
    wallColor: '#ffdb4d',
    playerColor: '#ff3300',
    moveTimeMs: 500, 
    spriteTimeMs: 100,
    fightTimeMs: 300,
    wanderTimeMs: [2000, 5000],
};

const STATE = {
    finn: {
        pressedKeys: {},
        playerMove: {},
    },
    jake: {
        pressedKeys: {},
        playerMove: {},
    },
    treasures: 0,
    win: false,
}

const params = new URLSearchParams(window.location.search);
const WIDTH = parseInt(params.get('width') || 13, 10);
const HEIGHT = parseInt(params.get('height') || 6, 10);
const TREASURES = parseInt(params.get('treasures') || 8, 10);
const SKELETONS = parseInt(params.get('skeletons') || 2, 10);
const POTS = parseInt(params.get('pots') || 4, 10);
const GHOSTS = parseInt(params.get('ghosts') || 2, 10);
const EDIT_MODE = !!params.get('edit');
const PLAYER = params.get('player') || 'finn';

const SPRITES = {
    onload: play
};
SPRITES.finn = {
    idle: {
        ArrowDown: loadSprites('img/finn-down-stand.svg'),
        ArrowLeft: loadSprites('img/finn-left-stand.svg'),
        ArrowUp: loadSprites('img/finn-up-stand.svg'),
        ArrowRight: loadSprites('img/finn-right-stand.svg'),
    },
    move: {
        ArrowDown: loadSprites('img/finn-down-move1.svg', 'img/finn-down-move3.svg'),
        ArrowLeft: loadSprites('img/finn-left-move1.svg', 'img/finn-left-move2.svg', 'img/finn-left-move3.svg', 'img/finn-left-move2.svg'),
        ArrowUp: loadSprites('img/finn-up-move1.svg', 'img/finn-up-move3.svg'),
        ArrowRight: loadSprites('img/finn-right-move1.svg', 'img/finn-right-move2.svg', 'img/finn-right-move3.svg', 'img/finn-right-move2.svg'),
    },
    fight: {
        ArrowDown: loadSprites('img/finn-down-fight1.svg', 'img/finn-down-fight2.svg', 'img/finn-down-fight1.svg'),
        ArrowLeft: loadSprites('img/finn-left-fight1.svg', 'img/finn-left-fight2.svg', 'img/finn-left-fight1.svg'),
        ArrowUp: loadSprites('img/finn-up-fight1.svg', 'img/finn-up-fight2.svg', 'img/finn-up-fight1.svg'),
        ArrowRight: loadSprites('img/finn-right-fight1.svg', 'img/finn-right-fight2.svg', 'img/finn-right-fight1.svg'),
    },
    win: loadSprites('img/finn-down-stand.svg', 'img/finn-down-cheer.svg')
};
SPRITES.jake = {
    idle: {
        ArrowDown: loadSprites('img/jake-down-stand.svg'),
        ArrowLeft: loadSprites('img/jake-left-stand.svg'),
        ArrowUp: loadSprites('img/jake-up-stand.svg'),
        ArrowRight: loadSprites('img/jake-right-stand.svg'),
    },
    move: {
        ArrowDown: loadSprites('img/jake-down-move1.svg', 'img/jake-down-move3.svg'),
        ArrowLeft: loadSprites('img/jake-left-move1.svg', 'img/jake-left-move2.svg', 'img/jake-left-move3.svg', 'img/jake-left-move2.svg'),
        ArrowUp: loadSprites('img/jake-up-move1.svg', 'img/jake-up-move3.svg'),
        ArrowRight: loadSprites('img/jake-right-move1.svg', 'img/jake-right-move2.svg', 'img/jake-right-move3.svg', 'img/jake-right-move2.svg'),
    },
    fight: {
        ArrowDown: loadSprites('img/jake-down-fight1.svg', 'img/jake-down-fight2.svg', 'img/jake-down-fight1.svg'),
        ArrowLeft: loadSprites('img/jake-left-fight1.svg', 'img/jake-left-fight2.svg', 'img/jake-left-fight1.svg'),
        ArrowUp: loadSprites('img/jake-up-fight1.svg', 'img/jake-up-fight2.svg', 'img/jake-up-fight1.svg'),
        ArrowRight: loadSprites('img/jake-right-fight1.svg', 'img/jake-right-fight2.svg', 'img/jake-right-fight1.svg'),
    },
    win: loadSprites('img/jake-down-stand.svg', 'img/jake-down-cheer1.svg', 'img/jake-down-stand.svg', 'img/jake-down-cheer2.svg')
};
SPRITES.treasure = {
    chest: loadSprites('img/chest1-1.svg', 'img/chest1-2.svg', 'img/chest1-3.svg', 'img/chest1-4.svg'),
    gem1: loadSprites('img/gem1-1.svg', 'img/gem1-2.svg', 'img/gem1-3.svg', 'img/gem1-4.svg'),
    gem2: loadSprites('img/gem2-1.svg', 'img/gem2-2.svg', 'img/gem2-3.svg', 'img/gem2-4.svg'),
    gem3: loadSprites('img/gem3-1.svg', 'img/gem3-2.svg', 'img/gem3-3.svg', 'img/gem3-4.svg'),
    gem4: loadSprites('img/gem4-1.svg', 'img/gem4-2.svg', 'img/gem4-3.svg', 'img/gem4-4.svg'),
};
SPRITES.skeleton = {
    sleep: loadSprites('img/skeleton-appear1.svg', 'img/skeleton-appear2.svg', 'img/skeleton-down-stand.svg'),
    idle: {
        ArrowDown: loadSprites('img/skeleton-down-stand.svg', 'img/skeleton-dance1.svg', 'img/skeleton-dance2.svg', 'img/skeleton-dance3.svg', 'img/skeleton-dance2.svg'),
        ArrowLeft: loadSprites('img/skeleton-left-stand.svg'),
        ArrowUp: loadSprites('img/skeleton-up-stand.svg'),
        ArrowRight: loadSprites('img/skeleton-right-stand.svg'),
    },
    move: {
        ArrowDown: loadSprites('img/skeleton-down-move1.svg', 'img/skeleton-down-move2.svg', 'img/skeleton-down-move3.svg', 'img/skeleton-down-move2.svg'),
        ArrowLeft: loadSprites('img/skeleton-left-move1.svg', 'img/skeleton-left-move2.svg', 'img/skeleton-left-move3.svg', 'img/skeleton-left-move2.svg'),
        ArrowUp: loadSprites('img/skeleton-up-move1.svg', 'img/skeleton-up-move2.svg', 'img/skeleton-up-move3.svg', 'img/skeleton-up-move2.svg'),
        ArrowRight: loadSprites('img/skeleton-right-move1.svg', 'img/skeleton-right-move2.svg', 'img/skeleton-right-move3.svg', 'img/skeleton-right-move2.svg'),
    },
    die: loadSprites('img/skeleton-die1.svg', 'img/skeleton-die2.svg'),
    dead: loadSprites('img/skeleton-die3.svg'),
}
SPRITES.ghost = {
    sleep: loadSprites('img/ghost1.svg', 'img/ghost2.svg', 'img/ghost3.svg'),
    wake: loadSprites('img/ghost-stand1.svg', 'img/ghost-stand2.svg', 'img/ghost-stand3.svg', 'img/ghost-stand2.svg'),
};

const SOUND = {
    background: new Audio('sound/background.ogg'),
    treasure: new Audio('sound/treasure.ogg'),
    skeleton: {
        wake: new Audio('sound/skeleton-wake.ogg'),
        die: new Audio('sound/skeleton-dead.ogg'),
    },
    ghost: new Audio('sound/ghost.ogg'),
    win: new Audio('sound/win.ogg'),
};

function playSound(sound) {
    if (!sound) {
        return;
    }
    if (sound.paused) {
        sound.play();
    } else {
        sound.currentTime = 0;
    }
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

class ECS {
    constructor() {
        this._entities = [];
        this._components = {};
        this._systems = [];
        const ecs = this;
        this.Entity = class {
            addComponent(name, component) {
                Object.setPrototypeOf(component, ecs._components[name]);
                this[name] = component;
            }
            removeComponent(name) {
                delete this[name];
            }
            remove() {
                const idx = ecs._entities.indexOf(this);
                if (idx < ecs._entities.length - 1) {
                    ecs._entities[idx] = ecs._entities[ecs._entities.length - 1];
                }
                ecs._entities.pop();
            }
        }
    }
    addEntity(entity) {
        Object.setPrototypeOf(entity, this.Entity.prototype);
        for (const [name, component] of Object.entries(entity)) {
            entity.addComponent(name, component);
        }
        this._entities.push(entity);
    }
    addComponent(name, component) {
        this._entities[name] = [];
        this._components[name] = component;
    }
    addCrossEntitySystem(system) {
        this._systems.push(system.bind(this));
    }
    addSystem(comps, system) {
        this.addCrossEntitySystem((entities, timestamp) => {
            entities.forEach(entity => {
                if (comps.every(comp => entity[comp])) {
                    const args = comps.map(comp => entity[comp]);
                    args.push(timestamp);
                    args.push(entity);
                    system.apply(this, args);
                }
            })
        });
    }
    tick(timestamp) {
        this._systems.forEach(system => {
            system(this._entities, timestamp);
        });
    }
}

function initECS(maze, viewport) {
    const ecs = new ECS();

    ecs.addComponent('pos', {
        i: 0,
        j: 0,
        blocks: false,
    });

    ecs.addComponent('move', {
        direction: 'ArrowDown',
        startTimestamp: null,
        progress: 0,
        moveSprites: {},
        idleSprites: {},
    });

    ecs.addComponent('idle', {
        sprites: [],
    });

    ecs.addComponent('treasure', {});

    ecs.addComponent('wake', {
        sound: null,
        respectWalls: false,
        startTimestamp: null,
        progress: 0,
        sprites: [],
        onWake: {},
    });

    ecs.addComponent('wander', {
        startTimestamp: null,
    });

    ecs.addComponent('die', {
        sound: null,
        progress: 0,
        sprites: [],
        onDie: {},
    });

    ecs.addComponent('draw', {
        sprite: null,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        zIdx: 0,
    });

    ecs.addComponent('player', {
        name: 'finn',
    });

    ecs.addComponent('fight', {
        startTimestamp: null,
        progress: 0,
        sprites: [],
    });

    // Update move progress
    ecs.addSystem(['move'], function(move, timestamp) {
        if (!move.startTimestamp) {
            return;
        }
        move.progress = (timestamp - move.startTimestamp) / SETTINGS.moveTimeMs;
    });    

    // Read pressed keys and start moving player
    ecs.addSystem(['player', 'fight', 'pos', 'move'], function(player, fight, pos, move, timestamp, entity) {
        const playerMove = {};
        STATE[player.name].playerMove = playerMove;
        if (move.progress > 0 && move.progress < 1) {
            return;
        }
        if (fight.startTimestamp) {
            return;
        }
        for (const direction of Object.keys(STATE[player.name].pressedKeys)) {
            if (direction === 'Enter') {
                if (move.startTimestamp) {
                    continue;
                }
                fight.startTimestamp = timestamp;
                const coords = maze.canMove(pos.i, pos.j, move.direction, true);
                if (coords) {
                    playerMove.fight = coords;
                }
                return;
            }
            move.direction = direction;
            const coords = maze.canMove(pos.i, pos.j, direction);
            if (!coords) {
                continue;
            }
            playerMove.started = coords;
            if (move.startTimestamp) {
                playerMove.finished = [pos.i, pos.j];
                move.startTimestamp += SETTINGS.moveTimeMs;
                move.progress -= 1;
            } else {
                move.startTimestamp = timestamp;
                move.progress = 0;
            }
            maze.remove(entity);
            [pos.i, pos.j] = coords;
            maze.add(entity)
            return;
        }
        if (move.progress >= 1) {
            playerMove.finished = [pos.i, pos.j];
            move.startTimestamp = null;
            move.progress = 0;
        }
    });

    // Collect treasures
    ecs.addSystem(['player', 'move'], function(player, move) {
        if (!STATE[player.name].playerMove.finished) {
            return;
        }
        const [i, j] = STATE[player.name].playerMove.finished;
        const treasure = maze.items[i][j].find(item => item.treasure);
        if (!treasure) {
            return;
        }
        maze.remove(treasure);
        treasure.remove();
        if (--STATE.treasures === 0) {
            SOUND.background.pause();
            playSound(SOUND.win);
            
            STATE.win = true;
        } else {
            playSound(SOUND.treasure);
        }
    });

    // Update win sprites
    ecs.addSystem(['player', 'move'], function(player, move) {
        if (!STATE.win) {
            return;
        }
        move.idleSprites = SPRITES[player.name].win;
    });

    // Update wake progress
    ecs.addSystem(['fight'], function(fight, timestamp) {
        if (!fight.startTimestamp) {
            return;
        }
        fight.progress = (timestamp - fight.startTimestamp) / SETTINGS.fightTimeMs;
        if (fight.progress >= 1) {
            fight.startTimestamp = null;
            fight.progress = 0;
        }
    });

    // Wake mobs
    ecs.addSystem(['wake', 'pos'], function(wake, pos, timestamp) {
        if (wake.startTimestamp) {
            return;
        }
        for (const playerName of ['finn', 'jake']) {
            if (!STATE[playerName].playerMove.started) {
                continue;
            }
            const [pi, pj] = STATE[playerName].playerMove.started;
            const di = pos.i - pi;
            const dj = pos.j - pj;
            if (Math.abs(di) + Math.abs(dj) > 1) {
                return;
            }
            if (wake.respectWalls) {
                if (
                    (di === 1 && maze.horWalls[pos.i][pos.j]) ||
                    (di === -1 && maze.horWalls[pos.i + 1][pos.j]) ||
                    (dj === 1 && maze.verWalls[pos.i][pos.j]) ||
                    (dj === -1 && maze.verWalls[pos.i][pos.j + 1])) {
                    return;
                } 
            }
            playSound(wake.sound);
            wake.startTimestamp = timestamp;
        }
    });

    // Update wake progress
    ecs.addSystem(['wake'], function(wake, timestamp, entity) {
        if (!wake.startTimestamp) {
            return;
        }
        wake.progress = (timestamp - wake.startTimestamp) / SETTINGS.moveTimeMs;
        if (wake.progress >= 1) {
            entity.removeComponent('wake');
            for (const [name, component] of Object.entries(wake.onWake)) {
                entity.addComponent(name, component);
            }
        }
    });

    // Start wandering
    ecs.addSystem(['wander', 'pos', 'move'], function(wander, pos, move, timestamp, entity) {
        if (!wander.startTimestamp) {
            wander.startTimestamp = timestamp + SETTINGS.wanderTimeMs[0] + Math.random() * (SETTINGS.wanderTimeMs[1] - SETTINGS.wanderTimeMs[0]);
        }
        if (move.progress >= 1) {
            move.startTimestamp = null;
            move.progress = 0;
        }
        if (wander.startTimestamp > timestamp) {
            return;
        }
        for (const direction of shuffle(['ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight'])) {
            const coords = maze.canMove(pos.i, pos.j, direction);
            if (!coords) {
                continue;
            }
            const [i, j] = coords;
            if (maze.items[i][j].length > 0) {
                continue;
            }
            move.startTimestamp = wander.startTimestamp;
            move.progress = 0;
            move.direction = direction;
            wander.startTimestamp = null;
            maze.remove(entity);
            [pos.i, pos.j] = coords;
            maze.add(entity)
            return;
        }
        wander.startTimestamp = null;
    });

    // Kill mobs
    ecs.addSystem(['die', 'pos'], function(die, pos, timestamp, entity) {
        if (die.startTimestamp) {
            return;
        }
        for (const playerName of ['finn', 'jake']) {
            if (!STATE[playerName].playerMove.fight) {
                continue;
            }
            const [pi, pj] = STATE[playerName].playerMove.fight;
            if (pos.i !== pi || pos.j !== pj) {
                return;
            }
            entity.removeComponent('move');        
            entity.removeComponent('idle');
            entity.removeComponent('wander');
            pos.blocks = false;
            playSound(die.sound);
            die.startTimestamp = timestamp;
        }
    });

    // Update die progress
    ecs.addSystem(['die'], function(die, timestamp, entity) {
        if (!die.startTimestamp) {
            return;
        }
        die.progress = (timestamp - die.startTimestamp) / SETTINGS.moveTimeMs;
        if (die.progress >= 1) {
            entity.removeComponent('die');
            for (const [name, component] of Object.entries(die.onDie)) {
                entity.addComponent(name, component);
            }
        }
    });

    // Update offsets for moving objects
    ecs.addSystem(['move', 'draw'], function(move, draw) {
        if (!move.startTimestamp) {
            draw.offsetX = 0;
            draw.offsetY = 0;
            return;
        }
        const offset = Math.min(SETTINGS.cellSize, Math.floor(SETTINGS.cellSize * (1 - move.progress)));
        switch (move.direction) {
            case 'ArrowDown':
                draw.offsetY = -offset;
                break;
            case 'ArrowUp':
                draw.offsetY = offset;
                break;
            case 'ArrowLeft':
                draw.offsetX = offset;
                break;
            case 'ArrowRight':
                draw.offsetX = -offset;
                break;
        }
    });

    // Update movable sprite
    ecs.addSystem(['move', 'draw'], function(move, draw, timestamp) {
        if (move.startTimestamp) {
            const sprites = Array.isArray(move.moveSprites) ? move.moveSprites : move.moveSprites[move.direction];
            const elapsed = timestamp - move.startTimestamp;
            const spriteIdx = Math.floor(elapsed / SETTINGS.spriteTimeMs) % sprites.length;
            draw.sprite = sprites[spriteIdx];
        } else {
            const sprites = Array.isArray(move.idleSprites) ? move.idleSprites : move.idleSprites[move.direction];
            const spriteIdx = Math.floor((timestamp % (SETTINGS.moveTimeMs * sprites.length)) / SETTINGS.moveTimeMs);
            draw.sprite = sprites[spriteIdx];
        }
    });

    // Update fight sprite
    ecs.addSystem(['fight', 'move', 'draw'], function(fight, move, draw, timestamp) {
        if (!fight.startTimestamp) {
            return;
        }
        const sprites = Array.isArray(fight.sprites) ? fight.sprites : fight.sprites[move.direction];
        const spriteIdx = Math.floor(sprites.length * fight.progress);
        draw.sprite = sprites[spriteIdx];
    });

    // Update idle sprite
    ecs.addSystem(['idle', 'draw'], function(idle, draw, timestamp) {
        const spriteIdx = Math.floor((timestamp % (SETTINGS.moveTimeMs * idle.sprites.length)) / SETTINGS.moveTimeMs);
        draw.sprite = idle.sprites[spriteIdx];
    });

    // Update wake sprite
    ecs.addSystem(['wake', 'draw'], function(wake, draw) {
        const spriteIdx = wake.startTimestamp === null ? 0 : Math.floor((wake.sprites.length - 1) * wake.progress) + 1;
        draw.sprite = wake.sprites[spriteIdx];
    });

    // Update die sprite
    ecs.addSystem(['die', 'draw'], function(die, draw) {
        if (!die.startTimestamp) {
            return;
        }
        const spriteIdx = die.startTimestamp === null ? 0 : Math.floor(die.sprites.length * die.progress);
        draw.sprite = die.sprites[spriteIdx];
    });

    // Redraw frame
    ecs.addCrossEntitySystem(function(entities) {
        viewport.drawMaze();
    
        entities = entities.filter(e => e.pos && e.draw).sort((e1, e2) => e1.draw.zIdx - e2.draw.zIdx);
        entities.forEach(({pos, draw}) => {
            const center = Math.floor(SETTINGS.cellSize / 2);
            const h = Math.floor(draw.sprite.height * draw.scale);
            const w = Math.floor(draw.sprite.width * draw.scale);
            const y = viewport.offsetY + pos.i * SETTINGS.cellSize + center - Math.floor(h / 2) + draw.offsetY;
            const x = viewport.offsetX + pos.j * SETTINGS.cellSize + center - Math.floor(w / 2) + draw.offsetX;
            viewport.context.drawImage(draw.sprite, x, y, w, h);
        });
    });
    return ecs;
}

function Player(i, j, name) {
    return {
        pos: {i, j, blocks: true},
        move: {
            idleSprites: SPRITES[name].idle,
            moveSprites: SPRITES[name].move,
        },
        draw: {zIdx: 10},
        player: {
            name: name,
        },
        fight: {
            sprites: SPRITES[name].fight,
        },
    };
}

function Treasure(i, j) {
    const names = Object.keys(SPRITES.treasure);
    const name = names[Math.floor(Math.random() * names.length)];
    return {
        pos: {i, j},
        treasure: {},
        idle: {
            sprites: SPRITES.treasure[name],
        },
        draw: {},
    };
}

function Pot(i, j) {
    return {
        pos: {i, j},
        treasure: {},
        idle: {
            sprites: [SPRITES.ghost.sleep[0]],
        },
        draw: {},
    };
}

function Skeleton(i, j) {
    return {
        pos: {i, j, blocks: true},
        wake: {
            sound: SOUND.skeleton.wake,
            sprites: SPRITES.skeleton.sleep,
            respectWalls: false,
            onWake: {
                move: {
                    direction: 'ArrowDown',
                    startTimestamp: null,
                    progress: 0,
                    moveSprites: SPRITES.skeleton.move,
                    idleSprites: SPRITES.skeleton.idle,
                }
            },
        },
        wander: {},
        die: {
            sound: SOUND.skeleton.die,
            sprites: SPRITES.skeleton.die,
            onDie: {
                idle: {sprites: SPRITES.skeleton.dead}
            },
        },
        draw: {},
    };
}

function Ghost(i, j) {
    return {
        pos: {i, j, blocks: true},
        wake: {
            sound: SOUND.ghost,
            sprites: SPRITES.ghost.sleep,
            respectWalls: true,
            onWake: {
                idle: {sprites: SPRITES.ghost.wake}
            },
        },
        die: {
            sprites: [...SPRITES.ghost.sleep].reverse(),
            onDie: {
                idle: {sprites: [SPRITES.ghost.sleep[0]]},
                treasure: {},
            },
        },
        draw: {},
    };
}

class Maze {
    constructor(height, width) { 
        this.height = height; 
        this.width = width;
        this.horWalls = Array.from(Array(height + 1), () => Array(width));
        this.verWalls = Array.from(Array(height), () => Array(width + 1));
        this.items = Array.from(Array(height), () => Array.from(Array(width), () => []));
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
    canMove(i, j, direction, ignoreBlocked) {
        switch (direction) {
            case 'ArrowDown':
                return !this.horWalls[i + 1][j] && (ignoreBlocked || !this.isBlocked(i + 1, j) )? [i + 1, j] : null;
            case 'ArrowLeft':
                return !this.verWalls[i][j] && (ignoreBlocked || !this.isBlocked(i, j - 1)) ? [i, j - 1] : null;
            case 'ArrowUp':
                return !this.horWalls[i][j] && (ignoreBlocked || !this.isBlocked(i - 1, j)) ? [i - 1, j] : null;
            case 'ArrowRight':
                return !this.verWalls[i][j + 1] && (ignoreBlocked || !this.isBlocked(i, j + 1)) ? [i, j + 1] : null;
            default:
                return null;
        }
    }
    isBlocked(i, j) {
        if (i < 0 || i >= this.height || j < 0 || j >= this.width) {
            return true;
        }
        return this.items[i][j].some(item => item.pos && item.pos.blocks);
    }
    remove(entity) {
        const items = this.items[entity.pos.i][entity.pos.j];
        items.splice(items.indexOf(entity), 1);
    }
    add(entity) {
        const items = this.items[entity.pos.i][entity.pos.j];
        items.push(entity);
    }
}

class Viewport {
    constructor(canvas, maze) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.maze = maze;
        this.offsetX = 0;
        this.offsetY = 0;
    }
    drawMaze() {
        const ctx = this.context;
        ctx.fillStyle = SETTINGS.bgColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = SETTINGS.wallColor;
        for (let i = 0; i <= this.maze.height; i++) {
            for (let j = 0; j <= this.maze.width; j++) {
                this._drawWall(ctx, i, j, true);
                this._drawWall(ctx, i, j, false);
            }
        }
    }
    _drawWall(ctx, i, j, isHor) {
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
}

function generateDFS(maze, ecs) {
    const h = maze.height;
    const w = maze.width;
    const visited = Array.from(Array(h), () => Array(w));

    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            maze.verWalls[i][j] = true;
            maze.horWalls[i][j] = true;
        }
    }

    STATE.treasures = TREASURES + POTS + GHOSTS;
    for (let i = 0; i < TREASURES; i++) {
        putAtRandom(Treasure);
    }
    for (let i = 0; i < SKELETONS; i++) {
        putAtRandom(Skeleton);
    }
    for (let i = 0; i < POTS; i++) {
        putAtRandom(Pot);
    }

    generateStep(Math.floor(Math.random() * h), Math.floor(Math.random() * w));
    
    function generateStep(i, j) {
        visited[i][j] = true;
        for (const dir of shuffle(['u', 'l', 'r', 'd'])) {
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
        putAtRandom(Ghost, createLoop);
    }

    function putAtRandom(create, extraCheck) {
        let i;
        let j;
        do {
            i = Math.floor(Math.random() * h);
            j = Math.floor(Math.random() * w);
        } while ((i + j) <= 1 || (i + j) >= (h + w - 3) || maze.items[i][j].length || (extraCheck && !extraCheck(i, j)));
        const entity = create(i, j);
        ecs.addEntity(entity);
        maze.add(entity);
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
            if (maze.isBlocked(i - 1, j)) {
                return false;
            }
            start.push([i - 1, j]);
        }
        if (!maze.horWalls[i + 1][j]) {
            if (maze.isBlocked(i + 1, j)) {
                return false;
            }
            start.push([i + 1, j]);
        }
        if (!maze.verWalls[i][j]) {
            if (maze.isBlocked(i, j - 1)) {
                return false;
            }
            start.push([i, j - 1]);
        }
        if (!maze.verWalls[i][j + 1]) {
            if (maze.isBlocked(i, j + 1)) {
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
                if (dist[i][j] * dist[i][j + 1] < 0 && d > max.dist) {
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
                if (dist[i2][j2] || maze.isBlocked(i2, j2)) {
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
    let viewport;
    let ecs;
    let raf;

    reset();

    document.addEventListener('keydown', processKeyDown);
    document.addEventListener('keyup', processKeyUp);
    canvas.addEventListener('click', processClick);

    function reset() {
        STATE.win = false;

        
        maze = new Maze(HEIGHT, WIDTH);
        
        viewport = new Viewport(canvas, maze);
        viewport.offsetX = SETTINGS.cellSize;
        viewport.offsetY = SETTINGS.cellSize;

        ecs = initECS(maze, viewport);

        if (!EDIT_MODE) {
            generateDFS(maze, ecs);
        }

        switch (PLAYER) {
            case 'jake':
                ecs.addEntity(Player(0, 0, 'jake'));
                break;
            case 'both':
                ecs.addEntity(Player(0, 0, 'jake'));
                ecs.addEntity(Player(maze.height - 1, maze.width - 1, 'finn'));
                break;
            default:
                ecs.addEntity(Player(0, 0, 'finn'));
                break;
        }

        SOUND.background.loop = true;
        SOUND.background.play();

        if (!raf) {
            raf = requestAnimationFrame(draw);
        }
    }

    function draw(timestamp) {
        ecs.tick(timestamp)
        requestAnimationFrame(draw);
    }

    function processKeyDown(e) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'ArrowUp':
            case 'ArrowDown':
                STATE.finn.pressedKeys[e.key] = true;
                break;
            case 'a':
                STATE.jake.pressedKeys.ArrowLeft = true;
                break;
            case 'd':
                STATE.jake.pressedKeys.ArrowRight = true;
                break;
            case 'w':
                STATE.jake.pressedKeys.ArrowUp = true;
                break;
            case 's':
                STATE.jake.pressedKeys.ArrowDown = true;
                break;
            case ' ':
                if (STATE.win) {
                    reset();
                }
                if (PLAYER === 'both') {
                    STATE.jake.pressedKeys.Enter = true;
                } else {
                    STATE[PLAYER].pressedKeys.Enter = true;
                }
                break;
            case 'Enter':
                if (STATE.win) {
                    reset();
                }
                if (PLAYER === 'both') {
                    STATE.finn.pressedKeys.Enter = true;
                } else {
                    STATE[PLAYER].pressedKeys.Enter = true;
                }
                break;
            case 'Escape':
                reset();
                return;
            default:
                return;
        }
    }

    function processKeyUp(e) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'ArrowUp':
            case 'ArrowDown':
                delete STATE.finn.pressedKeys[e.key];
                break;
            case 'a':
                delete STATE.jake.pressedKeys.ArrowLeft;
                break;
            case 'd':
                delete STATE.jake.pressedKeys.ArrowRight;
                break;
            case 'w':
                delete STATE.jake.pressedKeys.ArrowUp;
                break;
            case 's':
                delete STATE.jake.pressedKeys.ArrowDown;
                break;
            case ' ':
                if (PLAYER === 'both') {
                    delete STATE.jake.pressedKeys.Enter;
                } else {
                    delete STATE[PLAYER].pressedKeys.Enter;
                }
                break;
            case 'Enter':
                if (PLAYER === 'both') {
                    delete STATE.finn.pressedKeys.Enter;
                } else {
                    delete STATE[PLAYER].pressedKeys.Enter;
                }
                break;
           }
    }

    function processClick(e) {
        if (!EDIT_MODE) {
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const i = Math.floor((y - viewport.offsetY) / SETTINGS.cellSize);
        const j = Math.floor((x - viewport.offsetX) / SETTINGS.cellSize);
        if (i < 0 || i >= maze.height || j < 0 || j >= maze.width) {
            return;
        }
        const dx = x - (viewport.offsetX + j * SETTINGS.cellSize + SETTINGS.cellSize / 2);
        const dy = y - (viewport.offsetY + i * SETTINGS.cellSize + SETTINGS.cellSize / 2);
        if (Math.abs(dx) < SETTINGS.cellSize / 4 && Math.abs(dy) < SETTINGS.cellSize / 4) {
            const item = maze.items[i][j][0];
            if (item && item.player) {
                return;
            }
            const NewItem =
                item ? null :
                e.ctrlKey ? Skeleton :
                e.altKey ? Ghost :
                Treasure;
            if (item) {
                maze.remove(item);
                item.remove();
            } else {
                const newItem = NewItem(i, j);
                maze.add(newItem);
                ecs.addEntity(newItem);
            }

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
}
