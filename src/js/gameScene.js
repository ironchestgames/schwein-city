var Easystarjs = require('./easystar/easystar')
var randomInteger = require('random-integer')
var normalizeRange = require('normalize-range')
var gameVars = require('./gameVars')

// tile variables
var rowCount = 4
var columnCount = 4

var TILE_SIZE = 32
var tiles

// camera
var VIEW_WIDTH = columnCount * TILE_SIZE
var VIEW_HEIGHT = rowCount * TILE_SIZE

// cars
var cars
 
// pathfinder
var easystar
var easystarGrid

// marker
var markerSprite

// pixi containers
var container // container of the whole scene
var worldContainer // the world
var tileContainer // all tiles
var carsContainer // cars
var markerContainer // for the mouse marker

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

var getGridXY = function (screenX, screenY) {
  var gridX = Math.floor(normalizeRange.limit(
      0,
      columnCount,
      screenX / TILE_SIZE))
  var gridY = Math.floor(normalizeRange.limit(
      0,
      TILE_SIZE * rowCount,
      screenY / TILE_SIZE))
  return {
    x: gridX,
    y: gridY,
  }
}

var isTileTerrainOfType = function (tile, terrainType) {
  if (tile && tile.terrain === terrainType) {
    return true
  }
  return false
}

var updateRoadTile = function (tile) {
  var c = tile.x
  var r = tile.y
  var c2 = c * 2
  var r2 = r * 2
  var isTileRightRoad = isTileTerrainOfType(getTile(c + 1, r), gameVars.TERRAIN_ROAD)
  var isTileDownRoad = isTileTerrainOfType(getTile(c, r + 1), gameVars.TERRAIN_ROAD)
  var isTileLeftRoad = isTileTerrainOfType(getTile(c - 1, r), gameVars.TERRAIN_ROAD)
  var isTileUpRoad = isTileTerrainOfType(getTile(c, r - 1), gameVars.TERRAIN_ROAD)

  // turnaround - exit to the right
  if (isTileRightRoad &&
      !isTileDownRoad &&
      !isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

  // turnaround - exit to the left
  } else if (!isTileRightRoad &&
      !isTileDownRoad &&
      isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

  // turnaround - exit to the top
  } else if (!isTileRightRoad &&
      !isTileDownRoad &&
      !isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

  // turnaround - exit to the bottom
  } else if (!isTileRightRoad &&
      isTileDownRoad &&
      !isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM])

  // straight horizontal
  } else if (isTileRightRoad &&
      !isTileDownRoad &&
      isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

  // straight vertical
  } else if (!isTileRightRoad &&
      isTileDownRoad &&
      !isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM])

  // turn, exits: left + down
  } else if (!isTileRightRoad &&
      isTileDownRoad &&
      isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM])

  // turn, exits: left + up
  } else if (!isTileRightRoad &&
      !isTileDownRoad &&
      isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

  // turn, exits: right + down
  } else if (isTileRightRoad &&
      isTileDownRoad &&
      !isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM])

  // turn, exits: right + up
  } else if (isTileRightRoad &&
      !isTileDownRoad &&
      !isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

  // T-cross, horizontal + down
  } else if (isTileRightRoad &&
      isTileDownRoad &&
      isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.RIGHT, Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT, Easystarjs.BOTTOM])

  // T-cross, horizontal + up
  } else if (isTileRightRoad &&
      !isTileDownRoad &&
      isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT, Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.RIGHT, Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

  // T-cross, vertical + right
  } else if (isTileRightRoad &&
      isTileDownRoad &&
      !isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP, Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM, Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM, Easystarjs.LEFT])

  // T-cross, vertical + left
  } else if (!isTileRightRoad &&
      isTileDownRoad &&
      isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP, Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP, Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM, Easystarjs.LEFT])

  // X-cross
  } else if (isTileRightRoad &&
      isTileDownRoad &&
      isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP, Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM, Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP, Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM, Easystarjs.LEFT])

  }
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
    markerContainer = new PIXI.Container()

    // layer order
    worldContainer.addChild(tileContainer)
    worldContainer.addChild(pathGridContainer)
    worldContainer.addChild(carsContainer)

    container.addChild(worldContainer)
    container.addChild(markerContainer)

    global.baseStage.addChild(container)

    // create the tiles
    var roadtiles = ['1_0', '1_1', '1_2', '0_1', '2_1']
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
          updateRoadTile(tile)

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
    for (var i = 0; i < 10; i++) {
      var car = {
        x: randomInteger(0, columnCount * 2 - 1),
        y: randomInteger(0, rowCount * 2 - 1),
        targetX: randomInteger(0, columnCount * 2 - 1),
        targetY: randomInteger(0, rowCount * 2 - 1),
        speed: 0.5 + randomInteger(1, 10) / 10,
        container: new PIXI.Container(),
      }

      var sprite = new PIXI.Sprite(PIXI.loader.resources['sc_car_01'].texture)
      sprite.x = -sprite.width / 2
      sprite.y = -sprite.height / 2

      car.container.x = car.x / 2 * TILE_SIZE
      car.container.y = car.y / 2 * TILE_SIZE

      car.container.addChild(sprite)

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

    // set up mouse marker
    markerSprite = new PIXI.Sprite(PIXI.loader.resources['marker'].texture)

    var inputArea = new PIXI.Sprite(PIXI.Texture.EMPTY)
    inputArea.width = VIEW_WIDTH
    inputArea.height = VIEW_HEIGHT
    inputArea.interactive = true
    inputArea.on('mousemove', function (event) {
      var gridPosition = getGridXY(event.data.global.x, event.data.global.y)

      markerSprite.x = gridPosition.x * TILE_SIZE
      markerSprite.y = gridPosition.y * TILE_SIZE
    })
    inputArea.on('click', function (event) {
      var gridPosition = getGridXY(event.data.global.x, event.data.global.y)

      tiles[gridPosition.y][gridPosition.x].container.alpha = 0.5 // TODO: something vettigt
    })


    markerContainer.addChild(markerSprite)
    markerContainer.addChild(inputArea)


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
        var speed = car.speed

        var dx = nextTileInPath.x / 2 * TILE_SIZE - car.container.x
        var dy = nextTileInPath.y / 2 * TILE_SIZE - car.container.y

        var angle = Math.atan2(dy, dx)

        // car.x += Math.cos(angle) * speed
        // car.y += Math.sin(angle) * speed

        // update car image
        // car.container.x = Math.round(car.x)
        // car.container.y = Math.round(car.y)
        car.container.x += Math.cos(angle) * speed
        car.container.y += Math.sin(angle) * speed
        car.container.rotation = angle

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
