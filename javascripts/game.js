const gameHeight = 4
const gameWidth = 7

const baseXP = 4

const playerClass = "player"
const emptyClass = "empty"
const usedClass = "used"
const monsterClass = "monster"
const trapClass = "trap"
const helpfulClass = "helpful"
const spellClass = "spell"
const treasureClass = "treasure"
const doorClass = "door"

const poisonDamage = 0.05 //This is a percentage of max life(ie: 0.1 = 10%)

// Tile weights, higher means more chance.
// A good way to visualize this is to ensure the weights sum to 28(the board area).
// That way the weights become average tiles of the given type per level.
const curesWeight = 1
const treasuresWeight = 1
const spellsWeight = 2
const poisonsWeight = 2
const healsWeight = 4
const trapsWeight = 2
const monstersWeight = 16

//Monster minimum levels
const waspUnlockLevel = 1
const ghostUnlockLevel = 1
const spiderUnlockLevel = 5
const snakeUnlockLevel = 10
const hydraUnlockLevel = 15
const demonUnlockLevel = 20
const wormUnlockLevel = 25
const tickUnlockLevel = 30
const wolfUnlockLevel = 35
const impUnlockLevel = 40
const crocodileUnlockLevel = 45
const dragonUnlockLevel = 50

class OutsideGameBoardError extends RangeError {
    constructor(x, y) {
        super(`Coordinates (${x}, ${y}) outside game board!`)
    }
}

class Position {
    constructor(x, y) {
        if (!(x >= 0 && x <= gameWidth - 1 && y >= 0 && y <= gameHeight - 1)) {
            throw new OutsideGameBoardError(x, y)
        }
        this._x = x
        this._y = y
    }

    get x() {
        return this._x
    }

    get y() {
        return this._y
    }

    add(direction) {
        return new Position(this.x + direction.x, this.y + direction.y)
    }

    getTile() {
        return gameBoard[this.x][this.y]
    }

    interact() {
        console.log(gameBoard[this.x][this.y])
        gameBoard[this.x][this.y].interact()
    }

    isEmpty() {
        return gameBoard[this.x][this.y] instanceof Empty
    }

    setEmpty() {
        gameBoard[this.x][this.y] = new Empty(this)
    }

    setUsed() {
        gameBoard[this.x][this.y] = new Used(this)
    }

    static fromElement(element) {
        const match = element.attr("id").match(/(\d+)_(\d+)/)
        return new Position(parseInt(match[1]), parseInt(match[2]))
    }
}

/**
 * This is an abstract class that represents a game tile.
 */
class Tile {
    /**
     * @param tileClass {string} Class of this tile
     * @param position {Position} Position of this tile
     */
    constructor(tileClass, position) {
        this.tileClass = tileClass
        this.position = position
        if (this.constructor === Tile) {
            throw "Cannot instantiate this class"
        }
    }

    /**
     * Sets this square info/style at the given coordinates
     */
    drawTile() {
        let element = $(`#${this.position.x}_${this.position.y}`)
        element.attr("class", this.tileClass)
        element.text(this.constructor.name.slice(0, 3))
        element.hover(this.setDescription, clearDescription)
    }

    /**
     * A kind of abstract method.
     * This will be called when a player moves on this tile.
     * @return {boolean} True if player moved to this tile successfully.
     */
    interact() {
        console.log(this)
        throw "Interaction not defined!"
    }

    setDescription() {
        const coords = Position.fromElement($(this))
        gameBoard[coords.x][coords.y].description()
    }

    /**
     * A kind of abstract method.
     * This will be called when someone hovers or clicks on this tile.
     */
    description() {
        throw "Description not defined!"
    }

    /**
     * Creates a new instance of this type
     * @param args What to pass to the constructor
     * @return {*} Something that extends this class
     */
    static create(...args) {
        return new this(...args)
    }

    /**
     * @return {boolean} Minimum floor this tile can show in.
     */
    static get unlocked() {
        return true
    }

    /**
     * @return {number} Probabilistic weight when generating the board, higher means more probable
     */
    static get weight() {
        return 1
    }
}

class Empty extends Tile {
    constructor(position) {
        super(emptyClass, position)
    }

    interact() {}

    description() {
        const descriptionArea = $(".description")
        descriptionArea.addClass("other-description")
        descriptionArea.append($("<div/>", {class: "name"}).text(this.constructor.name))
        descriptionArea.append($("<div/>", {class: "desc"}).text("Nothing to see here, keep moving!"))
    }
}

class Used extends Tile {
    constructor(position) {
        super(usedClass, position)
    }

    interact() {}

    description() {
    }
}

class Monster extends Tile {
    constructor(position) {
        super(monsterClass, position)
        this._hp = this.maxHP
    }

    get maxHP() {
        return 1
    }

    get dmg() {
        return 1
    }

    get xp() {
        return 1
    }

    get hp() {
        return this._hp
    }

    /**
     * Sets the hp of this monster. If it reaches 0 clears the tile and awards the player this mobs xp
     * @param value
     */
    set hp(value) {
        if (value <= 0) {
            player.xp += this.xp
            this.position.setEmpty()
        } else {
            this._hp = value
        }
    }

    interact() {
        player.hp -= this.dmg * Math.ceil(this.hp / player.dmg)
        this.hp = 0
    }

    description() {
        const descriptionArea = $(".description")
        descriptionArea.addClass("monster-description")
        descriptionArea.append($("<div/>", {class: "name"}).text(this.constructor.name))
        descriptionArea.append($("<div/>", {class: "hp"}).text("HP:").append($("<p/>").text(`${this.hp}/${this.maxHP}`)))
        descriptionArea.append($("<div/>", {class: "dmg"}).text("Damage:").append($("<p/>").text(this.dmg)))
        descriptionArea.append($("<div/>", {class: "xp"}).text("Exp:").append($("<p/>").text(this.xp)))
    }
}

class Trap extends Tile {
    constructor(position) {
        super(trapClass, position)
    }

    get dmg() {
        return 0
    }

    get poisoned() {
        return false
    }

    interact() {
        player.hp -= this.dmg
        if (this.poisoned) {
            player.poison()
        }
        this.position.setEmpty()
    }

    description() {
        const descriptionArea = $(".description")
        descriptionArea.addClass("other-description")
        descriptionArea.append($("<div/>", {class: "name"}).text(this.constructor.name))
        let text
        if (this.dmg > 0 && this.poisoned === false) {
            text = `You take ${this.dmg} damage.`
        } else if (this.dmg === 0 && this.poisoned) {
            text = `You become poisoned losing ${poisonDamage * 100}% of your maximum life when you move.`
        } else {
            text = `You take ${this.dmg} damage and you become poisoned losing ${poisonDamage * 100}% of your maximum life when you move.`
        }

        descriptionArea.append($("<div/>", {class: "desc"}).text(text))
    }
}

class Helpful extends Tile {
    constructor(position, cure = false) {
        super(helpfulClass, position)
        this.cure = cure
    }

    interact() {
        player.hp += this.healing
        if (this.cure) {
            player.Cure()
        }
        this.position.setEmpty()
    }

    description() {
        const descriptionArea = $(".description")
        descriptionArea.addClass("other-description")
        descriptionArea.append($("<div/>", {class: "name"}).text(this.constructor.name))
        descriptionArea.append($("<div/>", {class: "desc"}).text(`Heals you for ${this.healing}${this.cure ? ", and cures you from being Poisoned." : "."}`))
    }
}

class Spell extends Tile {
    constructor(position) {
        super(spellClass, position)
    }
    interact() {
        this.cast()
        this.position.setEmpty()
    }
}

class Treasure extends Tile {
    constructor(position) {
        super(treasureClass, position)
    }
}

class Door extends Tile {
    constructor(position) {
        super(doorClass, position)
    }

    interact() {
        createNextLevel()
    }

    description() {
        const descriptionArea = $(".description")
        descriptionArea.addClass("other-description")
        descriptionArea.append($("<div/>", {class: "name"}).text(this.constructor.name))
        descriptionArea.append($("<div/>", {class: "desc"}).text($("." + doorClass).length === 1 ? "The entrance to the next level!" : "Click to start this level here."))
    }
}

//Monsters
class Wasp extends Monster {
    constructor(position) {
        super(position)
    }

    get maxHP() {
        return 1
    }

    get dmg() {
        return 1
    }

    get xp() {
        return 2
    }


    static get unlocked() {
        return waspUnlockLevel <= currentFloor
    }

    static get weight() {
        return waspUnlockLevel
    }
}

class Ghost extends Monster {
    constructor(position) {
        super(position)
    }

    get maxHP() {
        return 4
    }

    get dmg() {
        return 1
    }

    get xp() {
        return 4
    }


    static get unlocked() {
        return ghostUnlockLevel <= currentFloor
    }

    static get weight() {
        return ghostUnlockLevel
    }
}

class Spider extends Monster {
    constructor(position) {
        super(position)
    }

    get maxHP() {
        return 6
    }

    get dmg() {
        return 3
    }

    get xp() {
        return 18
    }


    static get unlocked() {
        return spiderUnlockLevel <= currentFloor
    }

    static get weight() {
        return spiderUnlockLevel
    }
}

class Snake extends Monster {
    constructor(position) {
        super(position)
    }

    get maxHP() {
        return 4
    }

    get dmg() {
        return 10
    }

    get xp() {
        return 40
    }


    static get unlocked() {
        return snakeUnlockLevel <= currentFloor
    }

    static get weight() {
        return snakeUnlockLevel
    }
}

class Hydra extends Monster {
    constructor(position) {
        super(position)
    }

    get maxHP() {
        return 4
    }

    get dmg() {
        return 15
    }

    get xp() {
        return 60
    }


    static get unlocked() {
        return hydraUnlockLevel <= currentFloor
    }

    static get weight() {
        return hydraUnlockLevel
    }
}

class Demon extends Monster {
    constructor(position) {
        super(position)
    }

    get maxHP() {
        return 25
    }

    get dmg() {
        return 4
    }

    get xp() {
        return 100
    }


    static get unlocked() {
        return demonUnlockLevel <= currentFloor
    }

    static get weight() {
        return demonUnlockLevel
    }
}

class Worm extends Monster {
    constructor(position) {
        super(position)
    }

    get maxHP() {
        return 35
    }

    get dmg() {
        return 6
    }

    get xp() {
        return 210
    }


    static get unlocked() {
        return wormUnlockLevel <= currentFloor
    }

    static get weight() {
        return wormUnlockLevel
    }
}

class Tick extends Monster {
    constructor(position) {
        super(position)
    }

    get maxHP() {
        return 10
    }

    get dmg() {
        return 28
    }

    get xp() {
        return 280
    }


    static get unlocked() {
        return tickUnlockLevel <= currentFloor
    }

    static get weight() {
        return tickUnlockLevel
    }
}

class Wolf extends Monster {
    constructor(position) {
        super(position)
    }

    get maxHP() {
        return 38
    }

    get dmg() {
        return 12
    }

    get xp() {
        return 456
    }


    static get unlocked() {
        return wolfUnlockLevel <= currentFloor
    }

    static get weight() {
        return wolfUnlockLevel
    }
}

class Imp extends Monster {
    constructor(position) {
        super(position)
    }

    get maxHP() {
        return 20
    }

    get dmg() {
        return 40
    }

    get xp() {
        return 80
    }


    static get unlocked() {
        return impUnlockLevel <= currentFloor
    }

    static get weight() {
        return impUnlockLevel
    }
}

class Crocodile extends Monster {
    constructor(position) {
        super(position)
    }

    get maxHP() {
        return 90
    }

    get dmg() {
        return 12
    }

    get xp() {
        return 1080
    }


    static get unlocked() {
        return crocodileUnlockLevel <= currentFloor
    }

    static get weight() {
        return crocodileUnlockLevel
    }
}

class Dragon extends Monster {
    constructor(position) {
        super(position)
    }

    get maxHP() {
        return 50
    }

    get dmg() {
        return 40
    }

    get xp() {
        return 2000
    }


    static get unlocked() {
        return dragonUnlockLevel <= currentFloor
    }

    static get weight() {
        return dragonUnlockLevel
    }
}

//Traps
class Spike extends Trap {
    constructor(position) {
        super(position)
    }

    get dmg() {
        return currentFloor + 1
    }
}

class Poison extends Trap {
    constructor(position) {
        super(position)
    }

    get poisoned() {
        return true
    }
}

//Treasure
class Key extends Treasure {
    constructor(position, keys = 1) {
        super(position)
        this.keys = keys
    }

    interact() {
        player.keys += this.keys
        this.position.setEmpty()
    }

    description() {
        const descriptionArea = $(".description")
        descriptionArea.addClass("other-description")
        descriptionArea.append($("<div/>", {class: "name"}).text(this.constructor.name))
        descriptionArea.append($("<div/>", {class: "desc"}).text(`You get ${this.keys} key${this.keys === 1 ? "" : "s"}. You can use them to open chests.`))
    }
}

class Chest extends Treasure {
    constructor(position) {
        super(position)
    }

    interact() {
        if (player.keys > 0) {
            player.keys--
            player.maxHP++
            player.magic++
            player.dmg++
            this.position.setEmpty()
        }
    }

    description() {
        const descriptionArea = $(".description")
        descriptionArea.addClass("other-description")
        descriptionArea.append($("<div/>", {class: "name"}).text(this.constructor.name))
        descriptionArea.append($("<div/>", {class: "desc"}).text(`Requires 1 key to open. You get +1 maximum HP, Attack and Magic if you manage to open it.`))
    }
}

//Healing
class Heart extends Helpful {
    constructor(position) {
        super(position)
    }

    get healing() {
        return Math.max(4, Math.ceil(player.maxHP / 2))
    }

    description() {
        const descriptionArea = $(".description")
        descriptionArea.addClass("other-description")
        descriptionArea.append($("<div/>", {class: "name"}).text(this.constructor.name))
        descriptionArea.append($("<div/>", {class: "desc"}).text(`Heals you for ${this.healing}.`))
    }
}

class Cure extends Helpful {
    constructor(position) {
        super(position, true)
    }

    get healing() {
        return 5
    }

    description() {
        const descriptionArea = $(".description")
        descriptionArea.addClass("other-description")
        descriptionArea.append($("<div/>", {class: "name"}).text(this.constructor.name))
        descriptionArea.append($("<div/>", {class: "desc"}).text(`Heals you for ${this.healing}, and cures you from being Poisoned.`))
    }
}

//Spells
class Bolt extends Spell {
    constructor(position) {
        super(position)
    }

    static get boltDamage() {
        return player.magic * 2
    }

    cast() {
        const around = [directions.up, directions.upRight, directions.right, directions.downRight,
            directions.down, directions.downLeft, directions.left, directions.upLeft]

        around.forEach(dir => {
            try {
                const tile = this.position.add(dir).getTile()
                if (tile instanceof Monster) {
                    // noinspection JSUnresolvedFunction
                    tile.hp -= Bolt.boltDamage
                }
            } catch (e) {
                if (e instanceof OutsideGameBoardError) {
                    //Do nothing, this will return undefined but its fine
                } else {
                    throw e;
                }
            }
        }, this)
    }

    description() {
        const descriptionArea = $(".description")
        descriptionArea.addClass("other-description")
        descriptionArea.append($("<div/>", {class: "name"}).text(this.constructor.name))
        descriptionArea.append($("<div/>", {class: "desc"}).text(`Deals ${Bolt.boltDamage} damage to all nearby monsters.`))
    }
}

class Player extends Tile {
    constructor(hp, magic, dmg, lives) {
        super(playerClass, undefined)
        this._hp = hp
        this.maxHP = hp
        this.magic = magic
        this.dmg = dmg
        this._lives = lives

        this.level = 1
        this.keys = 0
        this._xp = 0
        this.poisoned = false
        this.xpToLevel = baseXP
        this.levelUps = 0
        this.score = 0
    }

    get lives() {
        return this._lives
    }

    set lives(value) {
        if (value === 0) {
            const causes = [
                "You ran out of lives.",
                "You died too many times.",
                "Ded.",
                "Rekt.",
                "Try not dying.",
                "You Self-Sacrificed.",
                "Did not look left or right before crossing to the other side.",
                "Never heard from again.",
                "What are you looking at!?"
            ]
            gameOver(causes)
        } else {
            this._lives = value
        }
    }

    get hp() {
        return this._hp
    }

    set hp(value) {
        this._hp = Math.min(Math.ceil(value), this.maxHP)
        if (this.hp <= 0) {
            this.lives--
        }
    }

    get xp() {
        return this._xp
    }

    set xp(value) {
        const excessXP = value - this.xpToLevel
        if (value >= this.xpToLevel) {
            this.level++
            this.hp = this.maxHP
            this.xpToLevel = Math.ceil(baseXP * Math.max(this.level ** .75, 1.1 ** this.level))
            this.levelUps++
            this.xp = excessXP
            this.score += value - excessXP
        } else {
            this._xp = value
            this.score += value
        }
    }

    Cure() {
        this.poisoned = false
    }

    poison() {
        this.poisoned = true
    }

    /**
     * Interacts with the tile in the given direction and moves there if it is/becomes empty.
     * @param direction
     */
    interactAndMove(direction) {
        const target = this.position.add(direction)
        target.interact()
        if (target.isEmpty()) {
            this.moveTo(target)
        }
    }

    /**
     * Moves player to the given empty tile
     * @param target Tile to move player into
     */
    moveTo(target) {
        if (this.poisoned) {
            this.hp -= Math.ceil(poisonDamage * this.maxHP)
        }
        this.position.setUsed()
        this.position = target
        if (this.movesAvailable() === 0) {
            const causes = [
                "No where else to move.",
                "You got cornered.",
                "No escape!",
                "You got lost.",
                "Better than dying, right?",
                "At least you are alive.",
                "Still, didn't die."
            ]
            gameOver(causes)
        } else {
            gameBoard[this.position.x][this.position.y] = this
            drawBoard()
        }
    }

    /**
     * @return {number} The number of tiles the player can move into.
     */
    movesAvailable() {
        const possibilities = [directions.up, directions.right, directions.down, directions.left]
        possibilities.map(d => {
            try {
                return this.position.add(d).getTile()
            } catch (e) {
                if (e instanceof OutsideGameBoardError) {
                    //Do nothing, this will return undefined but its fine
                } else {
                    throw e;
                }
            }
        }, this)

        return possibilities.reduce((total, p) => total + (p instanceof Used === false && (this.keys > 0 || p instanceof Chest === false)), 0)
    }

    description() {
        function lifeDescription(player) {
            if (player.hp === player.maxHP) {
                return "You are ready to fight!"
            } else if (player.hp >= (3 * player.maxHP / 4)) {
                return "You look good."
            } else if (player.hp >= player.maxHP / 3) {
                return "You look rough, you could use some healing."
            } else if (player.hp > 1) {
                return "You've seen better days, you need to seek healing fast"
            } else {
                return "You are at the death's door, you comin' in? We are expected!"
            }
        }

        const descriptionArea = $(".description")
        descriptionArea.addClass("other-description")
        descriptionArea.append($("<div/>", {class: "name"}).text("You"))
        descriptionArea.append($("<div/>", {class: "desc"}).text(`This is you. ${lifeDescription(this)}`))
    }
}

let currentFloor = 0
let player = new Player(5, 2, 1, 1)

/**
 *
 * @type {Array.<Array.<Tile>>}
 */
let gameBoard = new Array(gameWidth).fill(null).map(() => new Array(gameHeight).fill(null))

class TileType extends Array {
    /**
     * @param weight {number}
     * @param array {Array.<Tile>}
     */
    constructor(weight, ...array) {
        super(...array)
        this.weight = weight
        this.unlocked = true
    }
}

let monsters = new TileType(monstersWeight, Dragon, Crocodile, Imp, Wolf, Tick, Worm, Demon, Hydra, Snake, Spider, Ghost, Wasp)
let traps = new TileType(trapsWeight, Spike)
let poisons = new TileType(poisonsWeight, Poison)
let treasures = new TileType(treasuresWeight, Key, Chest)
let heals = new TileType(healsWeight, Heart)
let spells = new TileType(spellsWeight, Bolt)
let cures = new TileType(curesWeight, Cure)

let possibleTileTypes = [
    monsters,
    traps,
    poisons,
    treasures,
    heals,
    spells,
    cures
].sort((a, b) => b.weight - a.weight)

function setSeed(seed) {
    return Math.seedrandom(seed)
}

/**
 * Gets a random number from [0, max[
 * @param max {number} Number to limit the random outputted
 * @returns {number} random number from [0, max[
 */
function randomUpTo(max) {
    return Math.floor(Math.random() * max)
}

/**
 * Picks an item according to the weights, more weight being more probable
 * @param {Array.<{weight: number, unlocked: number}>} allPossibilities
 * @return {*} The chosen item
 */
function pickPossibility(allPossibilities) {
    const currentPossibilities = allPossibilities.filter(p => p.unlocked)
    let random = randomUpTo(currentPossibilities.reduce((sum, value) => sum + value.weight, 0))
    let total = 0
    for (let p of currentPossibilities) {
        total += p.weight
        if (random < total) {
            return p
        }
    }
}

/**
 * Returns an array with 2 coordinates for the doors.
 * @return {{a:Position, b:Position}}
 */
function createNewDoorPositions() {
    const doorA = new Position(randomUpTo(Math.floor(gameWidth / 2)), randomUpTo(gameHeight))
    const doorB = new Position(gameWidth - 1 - randomUpTo(Math.floor(gameWidth / 2)), randomUpTo(gameHeight))
    return {a: doorA, b: doorB}
}

function createNextLevel() {
    incrementFloor()
    gameBoard.forEach((column, x) => {
        column.forEach((t, y) => {
            gameBoard[x][y] = pickPossibility(pickPossibility(possibleTileTypes)).create(new Position(x, y))
        })
    })
    let doors = createNewDoorPositions()
    gameBoard[doors.a.x][doors.a.y] = new Door(doors.a)
    gameBoard[doors.b.x][doors.b.y] = new Door(doors.b)
    drawBoard()
    $(".door").click(pickDoor)
}

function pickDoor() {
    const doors = $(".door")
    if (doors.length === 2) {
        const clickedDoor = Position.fromElement($(this))
        console.log(`Picked door at ${clickedDoor.x}, ${clickedDoor.y}`)
        gameBoard[clickedDoor.x][clickedDoor.y] = player
        player.position = clickedDoor
        doors.off("click") //Disable selecting any doors
        drawBoard()
    }
}

/**
 * This is a kind of enum for possible directions.
 */
class Direction {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

const directions = {
    up: new Direction(0, 1),
    upRight: new Direction(1, 1),
    right: new Direction(1, 0),
    downRight: new Direction(1, -1),
    down: new Direction(0, -1),
    downLeft: new Direction(-1, -1),
    left: new Direction(-1, 0),
    upLeft: new Direction(-1, 1),
    none: new Direction(0, 0)
}

document.onkeydown = e => {
    e = e || window.event
    let direction = directions.none

    switch (e.keyCode) {
        case 37:
            //left
            direction = directions.left
            break
        case 38:
            //up
            direction = directions.up
            break
        case 39:
            //right
            direction = directions.right
            break
        case 40:
            //down
            direction = directions.down
            break
    }

    if (direction !== directions.none) {
        const doors = $(".door")
        if ($(".level-up").hasClass("hidden") === false) {
            let id
            switch (direction) {
                case directions.left:
                    id = "level-up-hp"
                    break
                case directions.down:
                    id = "level-up-dmg"
                    break
                case directions.right:
                    id = "level-up-magic"
                    break
            }
            const button = $("#" + id)
            button.click()
            button.css("background-color", "#568ccc")
            setTimeout(function() {
                button.css('background-color', "");
            }, 100);
        } else if(doors.length > 1) {
            const doorPositions = doors.map(function() {
                return Position.fromElement($(this))
            }).toArray()

            let door
            switch (direction) {
                case directions.up:
                    door = doorPositions[0].y > doorPositions[1].y ? doors[0] : doors[1]
                    break
                case directions.down:
                    door = doorPositions[0].y < doorPositions[1].y ? doors[0] : doors[1]
                    break
                case directions.left:
                    door = doorPositions[0].x < doorPositions[1].x ? doors[0] : doors[1]
                    break
                case directions.right:
                    door = doorPositions[0].x > doorPositions[1].x ? doors[0] : doors[1]
                    break
            }
            $(door).click()
        } else if (player.position !== undefined) {
            try {
                player.interactAndMove(direction)
            } catch (e) {
                if (e instanceof OutsideGameBoardError) {
                    //Do nothing
                } else {
                    throw e;
                }
            }
        }
    }
}

function incrementFloor() {
    currentFloor++
    $("#floor").text(currentFloor)
}

function gameOver(moreCauses) {
    const causes = [
        "GG",
        "Nice try.",
        "Better luck next time.",
        "Try not failing...",
        "That's all you can do?",
        "Not like this...",
        "You tried, and failed!",
        "Really?",
        "Ever tried being good at this?",
        "Counting this one as a victory.",
        "Bullshit!",
        "Not fair!"
    ].concat(moreCauses)
    $("#death-cause").text(causes[randomUpTo(causes.length)])
    $("#score").text("Score: " + player.score)
    $("#game-over").removeClass("hidden")
    document.onkeydown = function () {
        location.reload()
    }
    $("body, html").click(function () {
        location.reload()
    })
}

function pickLevelUp() {
    const id = $(this).attr("id")
    if (id === "level-up-hp") {
        $("#level-up-hp")
        player.maxHP++
        player.hp++
    } else if (id === "level-up-dmg") {
        player.dmg++
    } else {
        player.magic++
    }
    player.levelUps--
    if (player.levelUps === 0) {
        $(".level-up").addClass("hidden")
    }
    updateStats()
}

function updateStats() {
    const hp = $("#hp")
    hp.text(player.hp + "/" + player.maxHP)
    $("#lvl").text(player.level)
    $("#magic").text(player.magic)
    $("#dmg").text(player.dmg)
    $("#keys").text(player.keys)
    $("#xp").text(player.xp + "/" + player.xpToLevel)

    if (player.poisoned) {
        hp.addClass("poisoned")
    } else {
        hp.removeClass("poisoned")
    }
}

function clearDescription() {
    const descriptionArea = $(".description")
    descriptionArea.html("")
    descriptionArea.attr("class", "description ui")
}

function drawBoard() {
    for (let x in gameBoard) {
        for (let y in gameBoard[x]) {
            gameBoard[x][y].drawTile()
        }
    }
    if (player.levelUps > 0 && $("#game-over").hasClass("hidden")) {
        $(".level-up").removeClass("hidden")
    }
    updateStats()
}

$(document).ready(function () {
    const squares = $(".square-area")
    squares.css("grid-template-columns", `repeat(${gameWidth}, 1fr)`)
    for (let y = gameHeight - 1; y >= 0; y--) {
        for (let x = 0; x < gameWidth; x++) {
            squares.append($("<div/>", {id: x + "_" + y}))
        }
    }
    createNextLevel()
    $(".level-up > div").click(pickLevelUp)
})