var Easystarjs = require('./easystar/easystar')
var randomInteger = require('random-integer')
var normalizeRange = require('normalize-range')
var gameVars = require('./gameVars')

// tile variables
var rowCount = 4
var columnCount = 4

var TILE_SIZE = 32
var tiles

// cars
var cars
 
// pathfinder
var easystar
var easystarGrid

var container // container of the whole scene
var worldContainer // the world
var tileContainer // all tiles
var carsContainer // cars

var pathGridContainer // for debug

var getTile = function (x, y) {
  if (y < 0 ||
      y > rowCount - 1 ||
      x < 0 ||
      x > columnCount - 1) {
    return null
  }
  return tiles[y][x]
}

var isTileTerrainOfType = function (tile, terrainType) {
  if (tile && tile.terrain === terrainType) {
    return true
  }
  return false
}

var gameScene = {
  name: 'gameScene',
  create: function (sceneParams) {

    // create all pixi containers
    container = new PIXI.Container()
    worldContainer = new PIXI.Container()
    tileContainer = new PIXI.Container()
    carsContainer = new PIXI.Container()
    pathGridContainer = new PIXI.Container()

    // layer order
    worldContainer.addChild(tileContainer)
    worldContainer.addChild(pathGridContainer)
    worldContainer.addChild(carsContainer)

    container.addChild(worldContainer)

    global.baseStage.addChild(container)

    // create the tiles
    var roadtiles = ['0_0', '1_0', '2_0', '3_0',]// '3_1', '3_2']
    tiles = []

    for (var r = 0; r < rowCount; r++) {
      tiles[r] = []

      for (var c = 0; c < columnCount; c++) {

        var terrain = gameVars.TERRAIN_FOREST
        var texture = new PIXI.Sprite(PIXI.loader.resources['forest_1'].texture)
        if (roadtiles.includes(c + '_' + r)) {
          terrain = gameVars.TERRAIN_ROAD
          texture = new PIXI.Sprite(PIXI.loader.resources['road'].texture)
        }

        var tile = {
          x: c,
          y: r,
          terrain: terrain,
          container: new PIXI.Container(),
        }

        // set tile position
        tile.container.x = tile.x * TILE_SIZE
        tile.container.y = tile.y * TILE_SIZE

        texture.y = -TILE_SIZE

        tile.container.addChild(texture)

        tileContainer.addChild(tile.container)

        tiles[r][c] = tile
      }
    }

    // init easystar
    easystar = new Easystarjs.js()
    easystarGrid = []

    // create the path grid
    for (var r = 0; r < rowCount; r++) {
      easystarGrid[r * 2] = []
      easystarGrid[r * 2 + 1] = []

      for (var c = 0; c < columnCount; c++) {

        var tile = tiles[r][c]
        easystarGrid[r * 2][c * 2] = tile.terrain
        easystarGrid[r * 2][c * 2 + 1] = tile.terrain
        easystarGrid[r * 2 + 1][c * 2] = tile.terrain
        easystarGrid[r * 2 + 1][c * 2 + 1] = tile.terrain

        if (tile.terrain === gameVars.TERRAIN_ROAD) {
          var tileRight = getTile(c + 1, r)
          var tileDown = getTile(c, r + 1)
          var tileLeft = getTile(c - 1, r)
          var tileUp = getTile(c, r - 1)

          if (isTileTerrainOfType(tileRight, gameVars.TERRAIN_ROAD) &&
              !isTileTerrainOfType(tileDown, gameVars.TERRAIN_ROAD) &&
              !isTileTerrainOfType(tileLeft, gameVars.TERRAIN_ROAD) &&
              !isTileTerrainOfType(tileUp, gameVars.TERRAIN_ROAD)) {
            easystar.setDirectionalCondition(c * 2, r * 2, [Easystarjs.RIGHT])
            easystar.setDirectionalCondition(c * 2 + 1, r * 2, [Easystarjs.RIGHT])
            easystar.setDirectionalCondition(c * 2, r * 2 + 1, [Easystarjs.TOP])
            easystar.setDirectionalCondition(c * 2 + 1, r * 2 + 1, [Easystarjs.LEFT])
            console.log(c, r)

          } else if (!isTileTerrainOfType(tileRight, gameVars.TERRAIN_ROAD) &&
              !isTileTerrainOfType(tileDown, gameVars.TERRAIN_ROAD) &&
              isTileTerrainOfType(tileLeft, gameVars.TERRAIN_ROAD) &&
              !isTileTerrainOfType(tileUp, gameVars.TERRAIN_ROAD)) {
            easystar.setDirectionalCondition(c * 2, r * 2, [Easystarjs.RIGHT])
            easystar.setDirectionalCondition(c * 2 + 1, r * 2, [Easystarjs.BOTTOM])
            easystar.setDirectionalCondition(c * 2, r * 2 + 1, [Easystarjs.LEFT])
            easystar.setDirectionalCondition(c * 2 + 1, r * 2 + 1, [Easystarjs.LEFT])
            console.log(c, r)

          } else if (isTileTerrainOfType(tileRight, gameVars.TERRAIN_ROAD) &&
              !isTileTerrainOfType(tileDown, gameVars.TERRAIN_ROAD) &&
              isTileTerrainOfType(tileLeft, gameVars.TERRAIN_ROAD) &&
              !isTileTerrainOfType(tileUp, gameVars.TERRAIN_ROAD)) {
            easystar.setDirectionalCondition(c * 2, r * 2, [Easystarjs.RIGHT])
            easystar.setDirectionalCondition(c * 2 + 1, r * 2, [Easystarjs.RIGHT])
            easystar.setDirectionalCondition(c * 2, r * 2 + 1, [Easystarjs.LEFT])
            easystar.setDirectionalCondition(c * 2 + 1, r * 2 + 1, [Easystarjs.LEFT])
            console.log(c, r)
          }
        }

        // debug gridpoint image
        var p = new PIXI.Sprite(PIXI.loader.resources['gridpoint'].texture)
        p.x = c * TILE_SIZE
        p.y = r * TILE_SIZE
        pathGridContainer.addChild(p)

        var p = new PIXI.Sprite(PIXI.loader.resources['gridpoint'].texture)
        p.x = c * TILE_SIZE + TILE_SIZE / 2
        p.y = r * TILE_SIZE
        pathGridContainer.addChild(p)

        var p = new PIXI.Sprite(PIXI.loader.resources['gridpoint'].texture)
        p.x = c * TILE_SIZE
        p.y = r * TILE_SIZE + TILE_SIZE / 2
        pathGridContainer.addChild(p)

        var p = new PIXI.Sprite(PIXI.loader.resources['gridpoint'].texture)
        p.x = c * TILE_SIZE + TILE_SIZE / 2
        p.y = r * TILE_SIZE + TILE_SIZE / 2
        pathGridContainer.addChild(p)

      }
    }

    // set up pathfinding
    easystar.setGrid(easystarGrid)
    easystar.setAcceptableTiles([gameVars.TERRAIN_ROAD])
    easystar.setTileCost(gameVars.TERRAIN_ROAD, 1)
    easystar.setIterationsPerCalculation(global.loop.getFps()) // TODO: why fps???

    // create cars
    cars = []

    // add cars NOTE: test
    for (var i = 0; i < 1; i++) {
      var car = {
        // x: randomInteger(0, columnCount * 2 - 1),
        // y: randomInteger(0, rowCount * 2 - 1),
        x: 3,
        y: 1,
        // targetX: randomInteger(0, columnCount * 2 - 1),
        // targetY: randomInteger(0, rowCount * 2 - 1),
        targetX: 1,
        targetY: 1,
        container: new PIXI.Container(),
      }

      car.container.x = car.x / 2 * TILE_SIZE
      car.container.y = car.y / 2 * TILE_SIZE

      car.container.addChild(new PIXI.Sprite(PIXI.loader.resources['person'].texture))

      cars.push(car)

      carsContainer.addChild(car.container)
    }

    // cars test
    for (var i = 0; i < cars.length; i++) {
      var car = cars[i]
      easystar.findPath(car.x, car.y, car.targetX, car.targetY, function(path) {
        if (path !== null) {
          this.path = path
        } else {
          console.log('NO PATH')
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

        var dx = nextTileInPath.x / 2 * TILE_SIZE - car.container.x
        var dy = nextTileInPath.y / 2 * TILE_SIZE - car.container.y

        var angle = Math.atan2(dy, dx)

        // set position
        car.container.x += Math.cos(angle) * speed
        car.container.y += Math.sin(angle) * speed

        // continue path
        var distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < speed * 2) {
          car.path.shift()
          if (car.path.length == 0) {
            console.log('FRAMME')
          }
        }
      }
    }
  },
  draw: function () {
    global.renderer.render(container)
  },
}

module.exports = gameScene
