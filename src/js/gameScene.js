var Easystarjs = require('easystarjs')
var randomInteger = require('random-integer')
var normalizeRange = require('normalize-range')
var gameVars = require('./gameVars')

// tile variables
var rowCount = 20
var columnCount = 20

var TILE_SIZE = 32
var tiles

// cars
var cars
 
// pathfinder
var easystar = new Easystarjs.js()
var easystarGrid = []

var container // container of the whole scene
var worldContainer // the world
var tileContainer // all tiles
var carsContainer // cars

var gameScene = {
  name: 'gameScene',
  create: function (sceneParams) {

    // create all pixi containers
    container = new PIXI.Container()
    worldContainer = new PIXI.Container()
    tileContainer = new PIXI.Container()
    carsContainer = new PIXI.Container()

    // layer order
    worldContainer.addChild(tileContainer)
    worldContainer.addChild(carsContainer)

    container.addChild(worldContainer)

    global.baseStage.addChild(container)

    // create the tiles
    tiles = []

    for (var r = 0; r < rowCount; r++) {
      tiles[r] = []
      easystarGrid.push([])

      for (var c = 0; c < columnCount; c++) {

        easystarGrid[r].push(gameVars.TERRAIN_FOREST)

        var tile = {
          x: c,
          y: r,
          terrain: gameVars.TERRAIN_FOREST,
          container: new PIXI.Container(),
        }

        // set tile position
        tile.container.x = tile.x * TILE_SIZE
        tile.container.y = tile.y * TILE_SIZE

        var texture = new PIXI.Sprite(PIXI.loader.resources['forest_1'].texture)
        texture.y = -TILE_SIZE

        tile.container.addChild(texture)

        tileContainer.addChild(tile.container)

        tiles[r][c] = tile
      }
    }

    // create cars
    cars = []

    // add cars NOTE: test
    for (var i = 0; i < 1; i++) {
      var car = {
        x: randomInteger(0, columnCount - 1),
        y: randomInteger(0, rowCount - 1),
        targetX: randomInteger(0, columnCount - 1),
        targetY: randomInteger(0, rowCount - 1),
        container: new PIXI.Container(),
        laneOffsetContainer: new PIXI.Container(),
      }

      car.container.x = car.x * TILE_SIZE
      car.container.y = car.y * TILE_SIZE

      car.laneOffsetContainer.addChild(new PIXI.Sprite(PIXI.loader.resources['person'].texture))

      car.container.addChild(car.laneOffsetContainer)

      cars.push(car)

      carsContainer.addChild(car.container)
    }

    // set up pathfinding
    easystar.setGrid(easystarGrid)
    easystar.setAcceptableTiles([gameVars.TERRAIN_FOREST])
    easystar.setTileCost(gameVars.TERRAIN_FOREST, 1)
    easystar.setIterationsPerCalculation(global.loop.getFps())

    // cars test
    for (var i = 0; i < cars.length; i++) {
      var car = cars[i]
      easystar.findPath(car.x, car.y, car.targetX, car.targetY, function(path) {
        if (path !== null) {
          this.path = path
        }
      }.bind(car))
    }

  },
  destroy: function () {
    container.destroy()
  },
  update: function () {

    easystar.calculate()

    // move cars
    for (var i = 0; i < cars.length; i++) {
      var car = cars[i]

      if (car.path && car.path.length) {
        var nextTileInPath = car.path[0]
        var speed = 0.5

        var dx = nextTileInPath.x * TILE_SIZE - car.container.x
        var dy = nextTileInPath.y * TILE_SIZE - car.container.y

        var angle = Math.atan2(dy, dx)

        // set position
        car.container.x += Math.cos(angle) * speed
        car.container.y += Math.sin(angle) * speed

        // lane offsets
        var laneOffsetX = 0
        var laneOffsetY = 0

        console.log(angle)
        angle = normalizeRange.wrap(0, Math.PI * 2, angle)

        if (normalizeRange.test(0, 0.01, angle) || normalizeRange.test(Math.PI * 2 - 0.01, Math.PI * 2, angle)) {
          laneOffsetY = TILE_SIZE / 2
          console.log('RIGHT', angle)

        } else if (normalizeRange.test(Math.PI * 0.5 - 0.01, Math.PI * 0.5 + 0.01, angle)) {
          laneOffsetX = -TILE_SIZE / 2
          console.log('DOWN', angle)

        } else if (normalizeRange.test(Math.PI * 1 - 0.01, Math.PI * 1 + 0.01, angle)) {
          laneOffsetY = -TILE_SIZE / 2
          console.log('LEFT', angle)

        } else if (normalizeRange.test(Math.PI * 1.5 - 0.01, Math.PI * 1.5 + 0.01, angle)) {
          laneOffsetX = -TILE_SIZE / 2
          console.log('UP', angle)

        } else {
          console.log(angle)
        }

        car.laneOffsetContainer.x = laneOffsetX
        car.laneOffsetContainer.y = laneOffsetY

        // continue path
        var distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < speed * 2) {
          car.path.shift()
        }
      }
    }
  },
  draw: function () {
    global.renderer.render(container)
  },
}

module.exports = gameScene
