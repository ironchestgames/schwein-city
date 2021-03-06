var Easystarjs = require('./easystar/easystar')
var randomInteger = require('random-integer')
var normalizeRange = require('normalize-range')
var shuffleArray = require('shuffle-array')
var fillRange = require('fill-range')
var gameVars = require('./gameVars')
var presetMap = require('./presetMap')

const BNP_GLOBAL_DEDUCTION = 0.001
const BNP_WORKER_ADDITION = 0.004
const BNP_SHOPPING_ADDITION = 0.0015

const DRIVING_FATIGUE_MULTIPLIER = 0.1
const REST_RECOVERY_MULTIPLIER = 0.4
const WORK_TIREDNESS_MULTIPLIER = 0.4

// tile variables
var TILE_SIZE = 32
var tiles

var rowCount = 768 / TILE_SIZE
var columnCount = 1024 / TILE_SIZE - 2

var ZONE_R = 'ZONE_R'
var ZONE_C = 'ZONE_C'
var ZONE_I = 'ZONE_I'

var BUILDING_R_01 = 'BUILDING_R_01'
var BUILDING_C_01 = 'BUILDING_C_01'
var BUILDING_I_01 = 'BUILDING_I_01'

var MAX_LATEST_PATHS = 7

// people
var people

// BNP
var bnp

var PEOPLE_RESTING = 'PEOPLE_RESTING'
var PEOPLE_FIND_WORKPLACE = 'PEOPLE_FIND_WORKPLACE'
var PEOPLE_FINDING_PATH = 'PEOPLE_FINDING_PATH'
var PEOPLE_DRIVING = 'PEOPLE_DRIVING'
var PEOPLE_WORKING = 'PEOPLE_WORKING'
var PEOPLE_NO_PATH = 'PEOPLE_NO_PATH'
var PEOPLE_GO_TO_WORK = 'PEOPLE_GO_TO_WORK'
var PEOPLE_GO_HOME = 'PEOPLE_GO_HOME'
var PEOPLE_FIND_SHOP = 'PEOPLE_FIND_SHOP'
var PEOPLE_GO_TO_SHOP = 'PEOPLE_GO_TO_SHOP'
var PEOPLE_SHOPPING = 'PEOPLE_SHOPPING'

// camera
var VIEW_WIDTH = columnCount * TILE_SIZE
var VIEW_HEIGHT = rowCount * TILE_SIZE

// road pathfinding for cars
var easystar
var easystarGrid

// tile pathfinding for laying roads
var tilePathfindingObject
var tilePathfindingGrid

// marker
var markedTile
var markerSprite

// tools
var BUTTON_R = 'BUTTON_R'
var BUTTON_C = 'BUTTON_C'
var BUTTON_I = 'BUTTON_I'
var BUTTON_ROAD = 'BUTTON_ROAD'
var BUTTON_REMOVE_ROAD = 'BUTTON_REMOVE_ROAD'
var BUTTON_SELECTION = 'BUTTON_SELECTION'

var selectedTool // one of the RCI above
var isRoadToolPathingActive = false // NOTE: determines phases of road tool
var shouldBuildRoad = false // NOTE: used since pathfinding is async
var roadToolFirstPosition = {x: 0, y: 0}
var roadToolSecondPosition = {x: 0, y: 0}
var roadToolPath = []
var roadToolEasystarId

// pixi containers
var container // container of the whole scene
var worldContainer // the world
var tileContainer // all tiles
var roadDrawingContainer // showing where the road would be placed
var carsContainer // cars
var markerContainer // for the mouse marker
var inputContainer // for the invisible input layers
var toolsWindowContainer // tools, like RCI and road buttons

// Pixi handles for updating graphics
var bnpText

var bnpPerMinuteText

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

var calcTilePathEntrance = function (tile) {
  var adjacentTile
  var c = tile.x
  var r = tile.y

  adjacentTile = getTile(c, r + 1)
  if (adjacentTile) {
    if (isTileTerrainOfType(adjacentTile, gameVars.TERRAIN_ROAD)) {
      return {
        x: c * 2 + 1,
        y: r * 2 + 2,
      }
    }
  }

  adjacentTile = getTile(c - 1, r)
  if (adjacentTile) {
    if (isTileTerrainOfType(adjacentTile, gameVars.TERRAIN_ROAD)) {
      return {
        x: c * 2 - 1,
        y: r * 2 + 1,
      }
    }
  }

  adjacentTile = getTile(c, r - 1)
  if (adjacentTile) {
    if (isTileTerrainOfType(adjacentTile, gameVars.TERRAIN_ROAD)) {
      return {
        x: c * 2,
        y: r * 2 - 1,
      }
    }
  }

  adjacentTile = getTile(c + 1, r)
  if (adjacentTile) {
    if (isTileTerrainOfType(adjacentTile, gameVars.TERRAIN_ROAD)) {
      return {
        x: c * 2 + 2,
        y: r * 2,
      }
    }
  }

  return null
}

var getGridXY = function (screenX, screenY) {
  var gridX = Math.floor(normalizeRange.limit(
      0,
      columnCount - 1,
      screenX / TILE_SIZE))
  var gridY = Math.floor(normalizeRange.limit(
      0,
      rowCount - 1,
      screenY / TILE_SIZE))
  return {
    x: gridX,
    y: gridY,
  }
}

var isScreenXYInsideGrid = function (screenX, screenY) {
  var gridX = screenX / TILE_SIZE
  var gridY = screenY / TILE_SIZE

  if (gridX < 0 || gridX >= columnCount || gridY < 0 || gridY >= rowCount) {
    return false
  }
  return true
}

var allTiles = function(_func) {
  for (var i = 0; i < tiles.length; i++) {
    for (var j = 0; j < tiles[i].length; j++) {
      _func(tiles[i][j])
    }
  }
}

var isTileTerrainOfType = function (tile, terrainType) {
  if (tile && tile.terrain === terrainType) {
    return true
  }
  return false
}

var isTileZoneOfType = function (tile, zoneType) {
  if (tile && tile.zone === zoneType) {
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

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_road_06'].texture))

  // turnaround - exit to the left
  } else if (!isTileRightRoad &&
      !isTileDownRoad &&
      isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_road_05'].texture))

  // turnaround - exit to the top
  } else if (!isTileRightRoad &&
      !isTileDownRoad &&
      !isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_road_04'].texture))

  // turnaround - exit to the bottom
  } else if (!isTileRightRoad &&
      isTileDownRoad &&
      !isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_road_03'].texture))

  // straight horizontal
  } else if (isTileRightRoad &&
      !isTileDownRoad &&
      isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.RIGHT, Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT, Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_road_01'].texture))

  // straight vertical
  } else if (!isTileRightRoad &&
      isTileDownRoad &&
      !isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP, Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM, Easystarjs.LEFT])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_road_02'].texture))

  // turn, exits: left + down
  } else if (!isTileRightRoad &&
      isTileDownRoad &&
      isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_turn_02'].texture))

  // turn, exits: left + up
  } else if (!isTileRightRoad &&
      !isTileDownRoad &&
      isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_turn_03'].texture))

  // turn, exits: right + down
  } else if (isTileRightRoad &&
      isTileDownRoad &&
      !isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_turn_01'].texture))

  // turn, exits: right + up
  } else if (isTileRightRoad &&
      !isTileDownRoad &&
      !isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_turn_04'].texture))

  // T-cross, horizontal + down
  } else if (isTileRightRoad &&
      isTileDownRoad &&
      isTileLeftRoad &&
      !isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.RIGHT, Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT, Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT, Easystarjs.BOTTOM])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_crossroad_02'].texture))

  // T-cross, horizontal + up
  } else if (isTileRightRoad &&
      !isTileDownRoad &&
      isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.RIGHT, Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.RIGHT, Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT, Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_crossroad_03'].texture))

  // T-cross, vertical + right
  } else if (isTileRightRoad &&
      isTileDownRoad &&
      !isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP, Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM, Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM, Easystarjs.LEFT])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_crossroad_05'].texture))

  // T-cross, vertical + left
  } else if (!isTileRightRoad &&
      isTileDownRoad &&
      isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP, Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP, Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM, Easystarjs.LEFT])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_crossroad_04'].texture))

  // X-cross
  } else if (isTileRightRoad &&
      isTileDownRoad &&
      isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP, Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM, Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP, Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM, Easystarjs.LEFT])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_crossroad_01'].texture))

  // a completely unconnected road tile
  } else if (!isTileRightRoad &&
      !isTileDownRoad &&
      !isTileLeftRoad &&
      !isTileUpRoad) {

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_road_02'].texture))
  }


  easystarGrid[r * 2][c * 2] = tile.terrain
  easystarGrid[r * 2][c * 2 + 1] = tile.terrain
  easystarGrid[r * 2 + 1][c * 2] = tile.terrain
  easystarGrid[r * 2 + 1][c * 2 + 1] = tile.terrain

  easystar.setGrid(easystarGrid)
}

var updateAdjacentTiles = function (tile) {
  var c = tile.x
  var r = tile.y

  var adjacentTiles = [
    getTile(c + 1, r),
    getTile(c, r + 1),
    getTile(c - 1, r),
    getTile(c, r - 1),
  ]

  // update adjacent road tiles
  for (var i = 0; i < adjacentTiles.length; i++) {
    var adjacentTile = adjacentTiles[i]
    if (adjacentTile) {
      if (isTileTerrainOfType(adjacentTile, gameVars.TERRAIN_ROAD)) {
        updateRoadTile(adjacentTile)
      }
    }
  }

  // update adjacent tiles path entrances (if needed)
  if (tile.terrain === gameVars.TERRAIN_ROAD) {
    for (var i = 0; i < adjacentTiles.length; i++) {
      var adjacentTile = adjacentTiles[i]
      if ((adjacentTile.zone === ZONE_R || adjacentTile.zone === ZONE_I || adjacentTile.zone === ZONE_C) &&
          adjacentTile.building &&
          adjacentTile.pathEntrance === null) {
        adjacentTile.pathEntrance = calcTilePathEntrance(adjacentTile)
      }
    }
  }
}

var buildRoadPath = function (path) {
  for (var i = 0; i < path.length; i++) {
    let pathPosition = path[i]
    let tile = tiles[pathPosition.y][pathPosition.x]
    tile.zone = null
    tile.building = null
    tile.terrain = gameVars.TERRAIN_ROAD
    tileContainer.removeChild(tile.container)
    terrainContainer.addChild(tile.container)
    updateRoadTile(tile)

    updateAdjacentTiles(tile)
  }

  shouldBuildRoad = false

  roadDrawingContainer.removeChildren()
}

var gameScene = {
  name: 'gameScene',
  create: function (sceneParams) {

    // create all pixi containers
    container = new PIXI.Container()
    worldContainer = new PIXI.Container()
    terrainContainer = new PIXI.Container()
    tileContainer = new PIXI.Container()
    carsContainer = new PIXI.Container()
    pathGridContainer = new PIXI.Container()
    roadDrawingContainer = new PIXI.Container()
    latestPathsContainer = new PIXI.Container()
    markerContainer = new PIXI.Container()
    inputContainer = new PIXI.Container()
    toolsWindowContainer = new PIXI.Container()

    // add bg image
    {
      let image = new PIXI.Sprite(PIXI.loader.resources['bg'].texture)
      worldContainer.addChild(image)
    }

    // layer order
    worldContainer.addChild(markerContainer)
    worldContainer.addChild(terrainContainer)
    worldContainer.addChild(carsContainer)
    worldContainer.addChild(roadDrawingContainer)
    worldContainer.addChild(latestPathsContainer)
    worldContainer.addChild(tileContainer)
    worldContainer.addChild(pathGridContainer)

    container.addChild(worldContainer)
    container.addChild(inputContainer)
    container.addChild(toolsWindowContainer)

    global.baseStage.addChild(container)


    // offset the cars
    carsContainer.x = TILE_SIZE / 4
    carsContainer.y = TILE_SIZE / 4

    // offset latest path grid
    latestPathsContainer.x = TILE_SIZE / 4
    latestPathsContainer.y = TILE_SIZE / 4

    // debug things
    pathGridContainer.visible = false

    // create the tiles
    tiles = []

    for (var r = 0; r < rowCount; r++) {
      tiles[r] = []

      // NOTE: backwards because top right tile sprite should be furthest to the back...
      for (var c = columnCount - 1; c >= 0; c--) {

        var terrain = gameVars.TERRAIN_FOREST

        // tile definition
        var tile = {
          x: c,
          y: r,
          terrain: terrain,
          container: new PIXI.Container(),
          warningContainer: new PIXI.Container(),
          zone: null,
          buildTimeout: null,
          building: null,
          latestPaths: [],
          averageArrivalTiredness: null,
          commercialCount: null,
          tier1Sprite: null,
          tier2Sprite: null,
          tier3Sprite: null,
          tier4Sprite: null,
          tier5Sprite: null,
          tier6Sprite: null,
          tier7Sprite: null
        }

        // set tile position
        tile.container.x = tile.x * TILE_SIZE
        tile.container.y = tile.y * TILE_SIZE

        // set tile offset
        tile.container.y += -TILE_SIZE

        var no_path_icon = new PIXI.Sprite(PIXI.loader.resources['no_path_warning_icon'].texture)
        no_path_icon.x = tile.x * TILE_SIZE
        no_path_icon.y = tile.y * TILE_SIZE
        no_path_icon.visible = false
        tile.warningContainer.addChild(no_path_icon)

        tileContainer.addChild(tile.container)
        tileContainer.addChild(tile.warningContainer)

        tiles[r].unshift(tile) // NOTE: ...but still have the tiles in correct order left-to-right
      }
    }

    // create the people
    people = []
    window.people = people // NOTE: for debugging
    window.tiles = tiles

    // init bnp
    bnp = 0.0

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
    easystar.setIterationsPerCalculation(1000)

    // set up road laying pathfinding
    tilePathfindingObject = new Easystarjs.js()
    tilePathfindingGrid = []

    // create the path grid for road laying pathfinding
    for (var r = 0; r < rowCount; r++) {
      tilePathfindingGrid[r] = []
      for (var c = 0; c < columnCount; c++) {
        var tile = tiles[r][c]
        tilePathfindingGrid[r][c] = tile.terrain
      }
    }

    // set up pathfinding
    tilePathfindingObject.setGrid(tilePathfindingGrid)
    tilePathfindingObject.setAcceptableTiles([gameVars.TERRAIN_FOREST, gameVars.TERRAIN_ROAD])
    tilePathfindingObject.setIterationsPerCalculation(1000)

    // set up mouse marker
    markerSprite = new PIXI.Sprite(PIXI.loader.resources['marker'].texture)

    var inputArea = new PIXI.Sprite(PIXI.Texture.EMPTY)
    inputArea.width = VIEW_WIDTH
    inputArea.height = VIEW_HEIGHT
    inputArea.interactive = true
    inputArea.on('mousemove', function (event) {
      var mouseX = event.data.global.x
      var mouseY = event.data.global.y
      if (isScreenXYInsideGrid(mouseX, mouseY) == false) {
        // TODO: hide marker and reset tint
        return
      }
      var gridPosition = getGridXY(mouseX, mouseY)

      if (isRoadToolPathingActive === false) {

        markerSprite.x = gridPosition.x * TILE_SIZE
        markerSprite.y = gridPosition.y * TILE_SIZE

        let tile = tiles[gridPosition.y][gridPosition.x]

        // unmark old marked tile
        // TODO: less assuming of the children
        if (markedTile && markedTile !== tile && markedTile.container && markedTile.container.children.length) {
          for (let i = 0; i < markedTile.container.children.length; i++) {
            markedTile.container.children[i].tint = 0xffffff // NOTE: reset tint
          }
        }

        // mark new tile
        markedTile = tile
        if (markedTile.building || markedTile.terrain === gameVars.TERRAIN_ROAD) {
          for (let i = 0; i < markedTile.container.children.length; i++) {
            markedTile.container.children[i].tint = 0xffff00
          }
        }

      } else if (isRoadToolPathingActive === true) {

        if (roadToolSecondPosition.x !== gridPosition.x ||
            roadToolSecondPosition.y !== gridPosition.y) {

          roadToolSecondPosition.x = gridPosition.x
          roadToolSecondPosition.y = gridPosition.y

          // cancel any old pathfinding
          tilePathfindingObject.cancelPath(roadToolEasystarId)

          // find new path
          roadToolEasystarId = tilePathfindingObject.findPath(
          roadToolFirstPosition.x,
          roadToolFirstPosition.y,
          roadToolSecondPosition.x,
          roadToolSecondPosition.y,
          function (path) {
            roadToolPath = path
            if (shouldBuildRoad === true) {
              buildRoadPath(roadToolPath)
            } else {

              roadDrawingContainer.removeChildren()

              for (let i = 0; i < roadToolPath.length; i++) {
                let pathPosition = roadToolPath[i]
                let sprite = new PIXI.Sprite(PIXI.loader.resources['road_temp_path'].texture)
                sprite.x = pathPosition.x * TILE_SIZE
                sprite.y = pathPosition.y * TILE_SIZE
                roadDrawingContainer.addChild(sprite)
              }
            }
          })
        }

      }
    })
    inputArea.on('click', function (event) {
      var gridPosition = getGridXY(event.data.global.x, event.data.global.y)
      var tile = tiles[gridPosition.y][gridPosition.x]

      // console.log(gridPosition.x, gridPosition.y, selectedTool, tile)

      // remove lastest path
      latestPathsContainer.removeChildren()

      // perform button click
      if (selectedTool == BUTTON_R) {
        tile.zone = ZONE_R
        tile.building = null
        tile.terrain = gameVars.TERRAIN_FOREST
        tile.container.removeChildren()
        tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_zone_residents'].texture))
        tile.pathEntrance = calcTilePathEntrance(tile)

        updateAdjacentTiles(tile)

      } else if (selectedTool == BUTTON_C) {
        tile.zone = ZONE_C
        tile.building = null
        tile.terrain = gameVars.TERRAIN_FOREST
        tile.container.removeChildren()
        tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_zone_commercial'].texture))
        tile.pathEntrance = calcTilePathEntrance(tile)

        updateAdjacentTiles(tile)

      } else if (selectedTool == BUTTON_I) {
        tile.zone = ZONE_I
        tile.averageArrivalTiredness = 0
        tile.building = null
        tile.terrain = gameVars.TERRAIN_FOREST
        tile.container.removeChildren()
        tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_zone_industry'].texture))
        tile.pathEntrance = calcTilePathEntrance(tile)

        updateAdjacentTiles(tile)

      } else if (selectedTool == BUTTON_ROAD) {

        // first click, start path finding for road drawing
        if (isRoadToolPathingActive === false) {

          isRoadToolPathingActive = true

          roadToolFirstPosition.x = gridPosition.x
          roadToolFirstPosition.y = gridPosition.y

        // second click, build road
        } else if (isRoadToolPathingActive === true) {

          isRoadToolPathingActive = false
          shouldBuildRoad = true // NOTE: this might seem redundant, but is due to pathfinding async

          buildRoadPath(roadToolPath)

        }

      } else if (selectedTool == BUTTON_REMOVE_ROAD) {
        tile.zone = null
        tile.building = null
        tile.terrain = gameVars.TERRAIN_FOREST
        tile.container.removeChildren()
        let c2 = tile.x * 2
        let r2 = tile.y * 2

        easystar.setDirectionalCondition(c2, r2, [])
        easystar.setDirectionalCondition(c2 + 1, r2, [])
        easystar.setDirectionalCondition(c2, r2 + 1, [])
        easystar.setDirectionalCondition(c2 + 1, r2 + 1, [])

        updateAdjacentTiles(tile)

      } else if (selectedTool == BUTTON_SELECTION) {
        console.log('Tile', tile)

        if (tile.averageArrivalTiredness)
          console.log('Average tiredness', tile.averageArrivalTiredness)

        if (tile.commercialCount)
          console.log('Commercial count', tile.commercialCount)

        // add the path
        let pathColors = [
          0xdf7126,
          0x37946e,
          0x5b6ee1,
          0xd95763,
          0x76428a,
          0x8f563b,
          0xd77bba,
        ]
        for (let i = 0; i < tile.latestPaths.length; i++) {
          let pathObject = tile.latestPaths[i]
          let pathColor = pathColors.shift() // NOTE: relaying on max latest paths

          for (let j = 0; j < pathObject.path.length; j++) {

            // draw dot
            let point = pathObject.path[j]
            let sprite = new PIXI.Sprite(PIXI.loader.resources['gridpoint'].texture)
            sprite.anchor.x = 0.5
            sprite.anchor.y = 0.5
            sprite.x = point.x / 2 * TILE_SIZE
            sprite.y = point.y / 2 * TILE_SIZE
            sprite.tint = pathColor
            latestPathsContainer.addChild(sprite)

            // draw edge to next dot
            if (j < pathObject.path.length - 1) {
              let nextPoint = pathObject.path[j + 1]
              let sprite = new PIXI.Sprite(PIXI.loader.resources['gridedge'].texture)
              let angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x)
              sprite.anchor.y = 0.5
              sprite.rotation = angle
              sprite.x = point.x / 2 * TILE_SIZE
              sprite.y = point.y / 2 * TILE_SIZE
              sprite.tint = pathColor
              latestPathsContainer.addChild(sprite)
            }
          }
        }
      }
    })

    markerContainer.addChild(markerSprite)
    inputContainer.addChild(inputArea)

    // set up tools window
    var toolbarLogo = new PIXI.Sprite(PIXI.loader.resources['toolbar_logo'].texture)
    toolsWindowContainer.addChild(toolbarLogo)

    var toolButtonContainer = new PIXI.Container()
    toolButtonContainer.y = toolbarLogo.height
    toolsWindowContainer.addChild(toolButtonContainer)

    var selectTool = function (buttonConstant, buttonSprite) {

      // deselect all buttons
      buttonR.texture = PIXI.loader.resources['toolbar_residental_inactiv'].texture
      buttonC.texture = PIXI.loader.resources['toolbar_commercials_inactiv'].texture
      buttonI.texture = PIXI.loader.resources['toolbar_industry_inactiv'].texture
      buttonRoad.texture = PIXI.loader.resources['toolbar_roads_inactiv'].texture
      buttonRemoveRoad.texture = PIXI.loader.resources['toolbar_bulldozer_inactiv'].texture
      buttonSelection.texture = PIXI.loader.resources['toolbar_information_inactiv'].texture

      // select the clicked button
      if (buttonConstant === BUTTON_R) {
        buttonR.texture = PIXI.loader.resources['toolbar_residental_activ'].texture
      } else if (buttonConstant === BUTTON_C) {
        buttonC.texture = PIXI.loader.resources['toolbar_commercials_activ'].texture
      } else if (buttonConstant === BUTTON_I) {
        buttonI.texture = PIXI.loader.resources['toolbar_industry_activ'].texture
      } else if (buttonConstant === BUTTON_ROAD) {
        buttonRoad.texture = PIXI.loader.resources['toolbar_roads_activ'].texture
      } else if (buttonConstant === BUTTON_REMOVE_ROAD) {
        buttonRemoveRoad.texture = PIXI.loader.resources['toolbar_bulldozer_activ'].texture
      } else if (buttonConstant === BUTTON_SELECTION) {
        buttonSelection.texture = PIXI.loader.resources['toolbar_information_activ'].texture
      }

      selectedTool = buttonConstant
    }

    var buttonR = new PIXI.Sprite(PIXI.loader.resources['toolbar_residental_inactiv'].texture)
    buttonR.interactive = true
    buttonR.on('click', function (event) {
      selectTool(BUTTON_R, buttonR)
    })
    toolButtonContainer.addChild(buttonR)

    var buttonC = new PIXI.Sprite(PIXI.loader.resources['toolbar_commercials_inactiv'].texture)
    buttonC.interactive = true
    buttonC.y = buttonC.height
    buttonC.on('click', function (event) {
      selectTool(BUTTON_C, buttonC)
    })
    toolButtonContainer.addChild(buttonC)

    var buttonI = new PIXI.Sprite(PIXI.loader.resources['toolbar_industry_inactiv'].texture)
    buttonI.interactive = true
    buttonI.y = buttonI.height * 2
    buttonI.on('click', function (event) {
      selectTool(BUTTON_I, buttonI)
    })
    toolButtonContainer.addChild(buttonI)

    var buttonRoad = new PIXI.Sprite(PIXI.loader.resources['toolbar_roads_inactiv'].texture)
    buttonRoad.interactive = true
    buttonRoad.y = buttonRoad.height * 3
    buttonRoad.on('click', function (event) {
      selectTool(BUTTON_ROAD, buttonRoad)
    })
    toolButtonContainer.addChild(buttonRoad)

    var buttonRemoveRoad = new PIXI.Sprite(PIXI.loader.resources['toolbar_bulldozer_inactiv'].texture)
    buttonRemoveRoad.interactive = true
    buttonRemoveRoad.y = buttonRemoveRoad.height * 4
    buttonRemoveRoad.on('click', function (event) {
      selectTool(BUTTON_REMOVE_ROAD, buttonRemoveRoad)
    })
    toolButtonContainer.addChild(buttonRemoveRoad)

    var buttonSelection = new PIXI.Sprite(PIXI.loader.resources['toolbar_information_inactiv'].texture)
    buttonSelection.interactive = true
    buttonSelection.y = buttonSelection.height * 5
    buttonSelection.on('click', function (event) {
      selectTool(BUTTON_SELECTION, buttonSelection)
    })
    toolButtonContainer.addChild(buttonSelection)

    var bnpLabel = new PIXI.Text("BNP:", {fontFamily : 'Helvetica', fontSize: 10, fill : 0x000000})
    bnpLabel.x = 5
    bnpLabel.y = buttonSelection.height * 6
    toolButtonContainer.addChild(bnpLabel)

    bnpText = new PIXI.Text("-", {fontFamily : 'Helvetica', fontSize: 10, fill : 0x000000 })
    bnpText.x = 5
    bnpText.y = buttonSelection.height * 6 + 12
    toolButtonContainer.addChild(bnpText)

    bnpPerMinuteText = new PIXI.Text("-", {fontFamily : 'Helvetica', fontSize: 10, fill : 0x2bce1c})
    bnpPerMinuteText.x = 5
    bnpPerMinuteText.y = buttonSelection.height * 6 + 24
    toolButtonContainer.addChild(bnpPerMinuteText)

    toolsWindowContainer.x = 1024 - TILE_SIZE * 2

    // load preset map, NOTE: for dev
    if (presetMap) {
      for (let r = 0; r < presetMap.length; r++) {
        for (let c = 0; c < presetMap[r].length; c++) {
          if (presetMap) {
            let presetValue = presetMap[r][c]

            if (presetValue === 'x') {
              let tile = tiles[r][c]
              tile.terrain = gameVars.TERRAIN_ROAD
              easystarGrid[r * 2][c * 2] = tile.terrain
              easystarGrid[r * 2][c * 2 + 1] = tile.terrain
              easystarGrid[r * 2 + 1][c * 2] = tile.terrain
              easystarGrid[r * 2 + 1][c * 2 + 1] = tile.terrain
              tileContainer.removeChild(tile.container)
              terrainContainer.addChild(tile.container)
              updateRoadTile(tile)
              updateAdjacentTiles(tile)

            } else if (presetValue === 'R') {
              let tile = tiles[r][c]
              tile.zone = ZONE_R
              tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_zone_residents'].texture))

            } else if (presetValue === 'C') {
              let tile = tiles[r][c]
              tile.zone = ZONE_C
              tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_zone_commercial'].texture))

            } else if (presetValue === 'I') {
              let tile = tiles[r][c]
              tile.zone = ZONE_I
              tile.averageArrivalTiredness = 0
              tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_zone_industry'].texture))

            }
          }
        }
      }
    }
    easystar.setGrid(easystarGrid)

  },
  destroy: function () {
    container.destroy()
  },
  update: function (dt) {

    // Store old bnp for later calcs
    bnpBeforeUpdate = bnp

    // run pathfinding
    easystar.calculate()
    tilePathfindingObject.calculate()

    // update people/cars
    for (var i = 0; i < people.length; i++) {

      let person = people[i]
      let currentTile = getTile(person.currentTileC, person.currentTileR)

      let pathCallback = function (path) {
        if (path === null || path.length === 0) {
          this.state = PEOPLE_NO_PATH
          this.timer = 4000
        } else {

          // save path to buildings
          {
            let departureTile = getTile(this.currentTileC, this.currentTileR)
            if (departureTile.building !== null) {
              departureTile.latestPaths.unshift({
                path: JSON.parse(JSON.stringify(path)), // TODO: optimize here
                // TODO: add energy cost
              })

              // keep the array at a reasonable length
              while (departureTile.latestPaths.length > MAX_LATEST_PATHS) {
                departureTile.latestPaths.pop()
              }
            }

          }

          // set path and variables on person
          this.path = path
          this.destinationTileC = this.wantedDestinationTileC
          this.destinationTileR = this.wantedDestinationTileR
          this.state = PEOPLE_DRIVING
          this.car = createCar(path, this.currentTileC, this.currentTileR, this.carModel)
        }
      }.bind(person)

      switch (person.state) {
        case PEOPLE_RESTING:
          person.values.tiredness -= dt * REST_RECOVERY_MULTIPLIER * getCommercialModifier(currentTile.commercialCount)
          if (person.values.tiredness < 0) {
            person.state = PEOPLE_GO_TO_WORK
          }

          // NOTE: reset shop, to find new one next time
          person.shoppingTileC = null
          person.shoppingTileR = null

          break

        case PEOPLE_WORKING:
          person.values.tiredness += dt * WORK_TIREDNESS_MULTIPLIER
          bnp = bnp + BNP_WORKER_ADDITION
          if (person.values.tiredness > 4000) {
            person.state = PEOPLE_GO_TO_SHOP
          }
          break

        case PEOPLE_SHOPPING:
          person.values.tiredness -= dt * REST_RECOVERY_MULTIPLIER * getCommercialModifier(currentTile.commercialCount)
          bnp = bnp + BNP_SHOPPING_ADDITION
          if (person.values.tiredness < 3000) {
            person.state = PEOPLE_GO_HOME
          }
          break

        case PEOPLE_GO_HOME:
          person.state = PEOPLE_FINDING_PATH
          let currentTileEntrance = getTile(person.currentTileC, person.currentTileR).pathEntrance
          let homeTileEntrance = getTile(person.homeTileC, person.homeTileR).pathEntrance
          person.wantedDestinationTileC = person.homeTileC
          person.wantedDestinationTileR = person.homeTileR
          easystar.findPath(
              currentTileEntrance.x,
              currentTileEntrance.y,
              homeTileEntrance.x,
              homeTileEntrance.y,
              pathCallback)
          break

        case PEOPLE_GO_TO_WORK:
          if (person.hasWorkplace === true) {

            // no building on tile, find another workplace
            if (getTile(person.workplaceTileC, person.workplaceTileR).building === null) {
              person.hasWorkplace = false
              person.state = PEOPLE_FIND_WORKPLACE

            } else {
              person.state = PEOPLE_FINDING_PATH
              let currentTileEntrance = getTile(person.currentTileC, person.currentTileR).pathEntrance
              let workplaceTileEntrance = getTile(person.workplaceTileC, person.workplaceTileR).pathEntrance
              person.wantedDestinationTileC = person.workplaceTileC
              person.wantedDestinationTileR = person.workplaceTileR
              easystar.findPath(
                  currentTileEntrance.x,
                  currentTileEntrance.y,
                  workplaceTileEntrance.x,
                  workplaceTileEntrance.y,
                  pathCallback)
            }

          } else {
            person.state = PEOPLE_FIND_WORKPLACE
          }
          break

        case PEOPLE_GO_TO_SHOP:
          if (person.shoppingTileC !== null && person.shoppingTileR !== null) {

            // no building on tile, find another shop
            if (getTile(person.shoppingTileC, person.shoppingTileR).building === null) {
              person.state = PEOPLE_FIND_SHOP

            } else {
              person.state = PEOPLE_FINDING_PATH
              let currentTileEntrance = getTile(person.currentTileC, person.currentTileR).pathEntrance
              let shoppingTileEntrance = getTile(person.shoppingTileC, person.shoppingTileR).pathEntrance
              person.wantedDestinationTileC = person.shoppingTileC
              person.wantedDestinationTileR = person.shoppingTileR
              easystar.findPath(
                  currentTileEntrance.x,
                  currentTileEntrance.y,
                  shoppingTileEntrance.x,
                  shoppingTileEntrance.y,
                  pathCallback)
            }

          } else {
            person.state = PEOPLE_FIND_SHOP
          }
          break

        case PEOPLE_FIND_WORKPLACE:

          // find a random workplace
          {
            let randomRowIndeces = shuffleArray(fillRange(0, tiles.length - 1))
            let randomColumnIndeces = shuffleArray(fillRange(0, tiles[0].length - 1))
            loop: for (var i = 0; i < randomRowIndeces.length; i++) {
              let r = randomRowIndeces[i]
              for (var j = 0; j < randomColumnIndeces.length; j++) {
                let c = randomColumnIndeces[j]
                if (tiles[r][c].building === BUILDING_I_01) {
                  person.hasWorkplace = true
                  person.workplaceTileC = c
                  person.workplaceTileR = r
                  break loop
                }
              }
            }
          }

          // go back to resting
          person.state = PEOPLE_RESTING

          break

        case PEOPLE_FIND_SHOP:

          // find a random shop
          {
            let randomRowIndeces = shuffleArray(fillRange(0, tiles.length - 1))
            let randomColumnIndeces = shuffleArray(fillRange(0, tiles[0].length - 1))
            loop: for (var i = 0; i < randomRowIndeces.length; i++) {
              let r = randomRowIndeces[i]
              for (var j = 0; j < randomColumnIndeces.length; j++) {
                let c = randomColumnIndeces[j]
                let tile = tiles[r][c]
                if (tile.zone === ZONE_C && tile.building != null) {
                  person.shoppingTileC = c
                  person.shoppingTileR = r
                  break loop
                }
              }
            }
          }

          // go back to working
          person.state = PEOPLE_WORKING

          break

        case PEOPLE_FINDING_PATH:
          // pass, wait for easystar
          break

        case PEOPLE_DRIVING:
          person.values.tiredness += dt * DRIVING_FATIGUE_MULTIPLIER

          let car = person.car
          var nextTileInPath = car.path[0]

          // calc speed
          var speed = car.speed

          // calc angle and position delta
          var dx = nextTileInPath.x / 2 * TILE_SIZE - car.container.x
          var dy = nextTileInPath.y / 2 * TILE_SIZE - car.container.y

          var angle = Math.atan2(dy, dx)

          // move cars not upon each other
          var carFrontPoint = car.frontPoint.toGlobal(new PIXI.Point(0, 0))
          for (let j = 0; j < people.length; j++) {
            let otherPerson = people[j]
            if (otherPerson !== person && otherPerson.car !== null) {

              // calc other back to car front distance
              let otherPersonBackPoint = otherPerson.car.backPoint.toGlobal(new PIXI.Point(0, 0))
              let dx = otherPersonBackPoint.x - carFrontPoint.x
              let dy = otherPersonBackPoint.y - carFrontPoint.y
              let backToFrontDistance = Math.sqrt(dx * dx + dy * dy)

              // find car in front and slow down
              if (backToFrontDistance < car.touchRadius + otherPerson.car.touchRadius) {
                speed = car.speed * 0.1 // NOTE: * 0.1 because solves deadlock in crossroads and double spawns
              }
            }
          }

          // update car image
          car.container.x += Math.cos(angle) * speed
          car.container.y += Math.sin(angle) * speed
          car.container.rotation = angle

          // continue path
          var distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < speed * 2) {
            car.path.shift()

            // we have arrived if the path is empty
            if (car.path.length == 0) {

              // set the current tile
              person.currentTileC = person.destinationTileC
              person.currentTileR = person.destinationTileR

              // remove car
              carsContainer.removeChild(person.car.container)
              person.car = null

              // change state, TODO: better this
              let currentTile = getTile(person.currentTileC, person.currentTileR)
              if (currentTile.building === BUILDING_I_01) {
                //modify arrival tiredness average
                currentTile.averageArrivalTiredness = (currentTile.averageArrivalTiredness + person.values.tiredness) / 2
                person.state = PEOPLE_WORKING
              } else if (currentTile.building === BUILDING_R_01) {
                person.state = PEOPLE_RESTING
              } else if (currentTile.zone === ZONE_C && currentTile.building) {
                person.state = PEOPLE_SHOPPING

              // if building is gone
              } else {

                // home gone, remove person
                if (getTile(person.homeTileC, person.homeTileR).building === null) {
                  person.removeMe = true
                }

                // workplace gone, go home
                if (getTile(person.workplaceTileC, person.workplaceTileR).building === null) {
                  person.hasWorkplace = false
                  person.state = PEOPLE_GO_HOME
                }

                // shop gone, go home
                if (getTile(person.shoppingTileC, person.shoppingTileR).building === null) {
                  person.state = PEOPLE_GO_HOME
                }
              }
            }
          }
          break

        case PEOPLE_NO_PATH:
          if (person.timer === null)
            console.error("Set a timer ya dingus")

          let tile = tiles[person.currentTileR][person.currentTileC]

          person.timer -= dt
          tile.warningContainer.children[0].visible = true
          if (person.timer < 0) {
            tile.warningContainer.children[0].visible = false
            person.timer = null
            person.state = (person.currentTileC === person.homeTileC && person.currentTileR === person.homeTileR) ?
              PEOPLE_GO_TO_WORK : PEOPLE_GO_HOME;
          }

          break
      }

    }

    // remove houseless people
    for(var i = people.length - 1; i >= 0; i--) {
      let person = people[i]
      if(person.removeMe) {
        if (person.car && person.car.container) {
          person.car.container.destroy()
        }
        people.splice(i, 1)
      }
    }

    // Iterate all tiles and do stuff
    allTiles((tile) => {

      // construct buildings
      calcTile(tile, ZONE_R, BUILDING_R_01, ['sc_house_small_01', 'sc_house_small_02'][randomInteger(1)])
      calcTile(tile, ZONE_C, BUILDING_C_01, ['sc_commercials_01', 'sc_commercials_02', 'sc_commercials_03'][randomInteger(2)])
      calcTile(tile, ZONE_I, BUILDING_I_01, ['sc_industry_01', 'sc_industry_02', 'sc_industry_03', 'sc_industry_04', 'sc_industry_05'][randomInteger(4)])

      countCommercialInArea(tile)
    })


    // Global BNP deduction
    bnp = Math.max(0, bnp - BNP_GLOBAL_DEDUCTION)
    const bnpDiff = bnp - bnpBeforeUpdate

    // Update BNP text
    bnpText.text = (Math.round(bnp * 100) / 100)

    bnpPerMinuteText.style.fill = (bnpDiff < 0) ? 0xc64a41 : 0x2bce1c;
    const prependText = (bnpDiff < 0) ? "" : "+";
    bnpPerMinuteText.text = prependText + (Math.round(bnpDiff * 100000) / 100000)
  },
  draw: function () {
    global.renderer.render(container)
  },
}

function countCommercialInArea(tile) {
  if (tile.zone !== ZONE_R) return;

  let count = 0
  for (let c = tile.x - 4; c <= tile.x + 4; c++) {
    for (let r = tile.y - 4; r <= tile.y + 4; r++) {
      if (tiles[r] && tiles[r][c] && tiles[r][c].zone === ZONE_C && tiles[r][c].building) {
        count++
      }
    }
  }
  let modifier = getCommercialModifier(count)
  if (tile.tier1Sprite) {
    tile.tier1Sprite.visible = false
    tile.tier2Sprite.visible = false
    tile.tier3Sprite.visible = false
    tile.tier4Sprite.visible = false
    tile.tier5Sprite.visible = false
    tile.tier6Sprite.visible = false
    tile.tier7Sprite.visible = false
    if (modifier === 1) {
      tile.tier1Sprite.visible = true
    } else if (modifier === 4) {
      tile.tier2Sprite.visible = true
    } else if (modifier === 10) {
      tile.tier3Sprite.visible = true
    } else if (modifier === 20) {
      tile.tier5Sprite.visible = true
    } else if (modifier === 25) {
      tile.tier6Sprite.visible = true
    } else if (modifier > 25) {
      tile.tier7Sprite.visible = true
    }
  }
  tile.commercialCount = count
}

function getCommercialModifier(count) {
  if (count > 15) {
    return 30
  } else if (count > 10) {
    return 25
  } else if (count > 6) {
    return 20
  } else if (count > 3) {
    return 10
  } else if (count > 0) {
    return 4
  }
  return 1
}

function calcTile(tile, zone, building, resource) {
  if (tile.zone === zone && tile.building === null) {

    if (tile.buildTimeout === null) {
      let times = [1,1,1,1,1] //[100, 150, 200, 250, 300]
      tile.buildTimeout = times[Math.floor(Math.random() * 4)]
    } else {
      tile.buildTimeout--
    }
    if (tile.buildTimeout <= 0) {

      if (zone === ZONE_R) {
        tile.buildTimeout = null
        tile.building = building
        tile.container.removeChildren()

        tile.tier1Sprite = new PIXI.Sprite(PIXI.loader.resources[resource].texture)
        tile.tier2Sprite = new PIXI.Sprite(PIXI.loader.resources['sc_house_small_03'].texture)
        tile.tier3Sprite = new PIXI.Sprite(PIXI.loader.resources['sc_house_01_2lev'].texture)
        tile.tier4Sprite = new PIXI.Sprite(PIXI.loader.resources['sc_house_01_4lev'].texture)
        tile.tier5Sprite = new PIXI.Sprite(PIXI.loader.resources['sc_house_01_6lev'].texture)
        tile.tier6Sprite = new PIXI.Sprite(PIXI.loader.resources['sc_residental_06'].texture)
        tile.tier7Sprite = new PIXI.Sprite(PIXI.loader.resources['sc_residental_05'].texture)
        tile.container.addChild(tile.tier1Sprite)
        tile.container.addChild(tile.tier2Sprite)
        tile.container.addChild(tile.tier3Sprite)
        tile.container.addChild(tile.tier4Sprite)
        tile.container.addChild(tile.tier5Sprite)
        tile.container.addChild(tile.tier6Sprite)
        tile.container.addChild(tile.tier7Sprite)

        // people definition
        let moverIn = {
          homeTileC: tile.x,
          homeTileR: tile.y,
          car: null,
          carModel: randomInteger(10),
          currentTileC: tile.x,
          currentTileR: tile.y,

          hasWorkplace: false,
          workplaceTileC: null,
          workplaceTileR: null,

          shoppingTileC: null,
          shoppingTileR: null,

          timer: null,

          state: PEOPLE_RESTING,

          // simulation values (in ms)
          values: {
            tiredness: 2000,
          },
        }
        people.push(moverIn)

      } else if (zone === ZONE_C) {

        // can get entrance (road connection)
        if (calcTilePathEntrance(tile) !== null) {

          tile.buildTimeout = null
          tile.building = building
          tile.container.removeChildren()

          tile.tier1Sprite = new PIXI.Sprite(PIXI.loader.resources[resource].texture)
          tile.container.addChild(tile.tier1Sprite)

        // no road connection, try again
        } else {
          tile.buildTimeout = null
        }

      } else if (zone === ZONE_I) {
        tile.buildTimeout = null
        tile.building = building
        tile.container.removeChildren()

        tile.tier1Sprite = new PIXI.Sprite(PIXI.loader.resources[resource].texture)
        tile.container.addChild(tile.tier1Sprite)

      }
    }
  }
}

function createCar(path, tileC, tileR, carModel) {

  // car definition
  var car = {
    x: path[0].x,
    y: path[0].y,
    speed: 1.1 + Math.random() * 0.4,
    container: new PIXI.Container(),
    path: path
  }

  let resourceName = [
    'sc_car_01',
    'sc_car_02',
    'sc_car_03',
    'sc_car_04',
    'sc_car_05',
    'sc_car_06',
    'sc_car_07',
    'sc_car_08',
    'sc_car_09',
    'sc_car_10',
    'sc_car_11'][carModel]

  var sprite = new PIXI.Sprite(PIXI.loader.resources[resourceName].texture)
  sprite.x = -sprite.width / 2
  sprite.y = -sprite.height / 2

  car.touchRadius = sprite.height / 2

  var frontPoint = new PIXI.Sprite(PIXI.Texture.EMPTY)
  frontPoint.x = sprite.x + sprite.width * 0.75
  frontPoint.y = sprite.y + sprite.height / 2
  car.frontPoint = frontPoint

  var backPoint = new PIXI.Sprite(PIXI.Texture.EMPTY)
  backPoint.x = sprite.x + sprite.width * 0.25
  backPoint.y = sprite.y + sprite.height / 2
  car.backPoint = backPoint

  car.container.x = car.x / 2 * TILE_SIZE
  car.container.y = car.y / 2 * TILE_SIZE

  car.container.addChild(sprite)
  car.container.addChild(frontPoint)
  car.container.addChild(backPoint)

  carsContainer.addChild(car.container)

  return car
}

module.exports = gameScene
