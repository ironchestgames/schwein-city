var Easystarjs = require('./easystar/easystar')
var randomInteger = require('random-integer')
var normalizeRange = require('normalize-range')
var gameVars = require('./gameVars')
var presetMap = require('./presetMap')

const BNP_GLOBAL_DEDUCTION = 0.001
const BNP_WORKER_ADDITION = 0.004

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

// camera
var VIEW_WIDTH = columnCount * TILE_SIZE
var VIEW_HEIGHT = rowCount * TILE_SIZE

// pathfinder
var easystar
var easystarGrid

// marker
var markedTile
var markerSprite

// tools
var BUTTON_R = 'BUTTON_R'
var BUTTON_C = 'BUTTON_C'
var BUTTON_I = 'BUTTON_I'
var BUTTON_ROAD = 'BUTTON_ROAD'
var BUTTON_SELECTION = 'BUTTON_SELECTION'

var selectedTool // one of the RCI above

// pixi containers
var container // container of the whole scene
var worldContainer // the world
var tileContainer // all tiles
var carsContainer // cars
var markerContainer // for the mouse marker
var inputContainer // for the invisible input layers
var toolsWindowContainer // tools, like RCI and road buttons

// Pixi handles for updating graphics
var bnpText

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
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.RIGHT])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.LEFT])

    tile.container.removeChildren()
    tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_road_01'].texture))

  // straight vertical
  } else if (!isTileRightRoad &&
      isTileDownRoad &&
      !isTileLeftRoad &&
      isTileUpRoad) {
    easystar.setDirectionalCondition(c2, r2, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2, [Easystarjs.BOTTOM])
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.TOP])
    easystar.setDirectionalCondition(c2 + 1, r2 + 1, [Easystarjs.BOTTOM])

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
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT])
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
    easystar.setDirectionalCondition(c2, r2 + 1, [Easystarjs.LEFT])
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

  var adjacentTile = getTile(c + 1, r)
  if (adjacentTile) {
    if (isTileTerrainOfType(adjacentTile, gameVars.TERRAIN_ROAD)) {
      updateRoadTile(adjacentTile)
    }
  }

  adjacentTile = getTile(c, r + 1)
  if (adjacentTile) {
    if (isTileTerrainOfType(adjacentTile, gameVars.TERRAIN_ROAD)) {
      updateRoadTile(adjacentTile)
    }
  }

  adjacentTile = getTile(c - 1, r)
  if (adjacentTile) {
    if (isTileTerrainOfType(adjacentTile, gameVars.TERRAIN_ROAD)) {
      updateRoadTile(adjacentTile)
    }
  }

  adjacentTile = getTile(c, r - 1)
  if (adjacentTile) {
    if (isTileTerrainOfType(adjacentTile, gameVars.TERRAIN_ROAD)) {
      updateRoadTile(adjacentTile)
    }
  }
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
          zone: null,
          buildTimeout: null,
          building: null,
          latestPaths: [],
        }

        // set tile position
        tile.container.x = tile.x * TILE_SIZE
        tile.container.y = tile.y * TILE_SIZE

        // set tile offset
        tile.container.y += -TILE_SIZE

        tileContainer.addChild(tile.container)

        tiles[r].unshift(tile) // NOTE: ...but still have the tiles in correct order left-to-right
      }
    }

    // create the people
    people = []
    window.people = people // NOTE: for debugging

    // init pnp
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

      let tile = tiles[gridPosition.y][gridPosition.x]

      // unmark old marked tile
      // TODO: less assuming of the children
      if (markedTile && markedTile !== tile && markedTile.container && markedTile.container.children[0]) {
        markedTile.container.children[0].tint = 0xffffff // reset tint
      }

      // mark new tile
      markedTile = tile
      if (markedTile.building || markedTile.terrain === gameVars.TERRAIN_ROAD) {
        markedTile.container.children[0].tint = 0xffff00
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

        updateAdjacentTiles(tile)

      } else if (selectedTool == BUTTON_C) {
        tile.zone = ZONE_C
        tile.building = null
        tile.terrain = gameVars.TERRAIN_FOREST
        tile.container.removeChildren()
        tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_zone_commercial'].texture))

        updateAdjacentTiles(tile)

      } else if (selectedTool == BUTTON_I) {
        tile.zone = ZONE_I
        tile.building = null
        tile.terrain = gameVars.TERRAIN_FOREST
        tile.container.removeChildren()
        tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources['sc_zone_industry'].texture))

        updateAdjacentTiles(tile)

      } else if (selectedTool == BUTTON_ROAD) {
        tile.zone = null
        tile.building = null
        tile.terrain = gameVars.TERRAIN_ROAD
        tileContainer.removeChild(tile.container)
        terrainContainer.addChild(tile.container)
        updateRoadTile(tile)

        updateAdjacentTiles(tile)

      } else if (selectedTool == BUTTON_SELECTION) {
        console.log('Tile', tile)

        // add the path
        for (let i = 0; i < tile.latestPaths.length; i++) {
          let pathObject = tile.latestPaths[i]
          for (let j = 0; j < pathObject.path.length; j++) {

            // draw dot
            let point = pathObject.path[j]
            let sprite = new PIXI.Sprite(PIXI.loader.resources['gridpoint'].texture)
            sprite.anchor.x = 0.5
            sprite.anchor.y = 0.5
            sprite.x = point.x / 2 * TILE_SIZE
            sprite.y = point.y / 2 * TILE_SIZE
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
              latestPathsContainer.addChild(sprite)
            }
          }
        }
      }
    })

    markerContainer.addChild(markerSprite)
    inputContainer.addChild(inputArea)

    // set up tools window
    var toolbarBg = new PIXI.Sprite(PIXI.loader.resources['toolbarbg'].texture)
    toolbarBg.y = -TILE_SIZE / 4
    toolsWindowContainer.addChild(toolbarBg)

    var buttonR = new PIXI.Sprite(PIXI.loader.resources['buttonR'].texture)
    buttonR.interactive = true
    buttonR.x = 4
    buttonR.on('click', function (event) {
      selectedTool = BUTTON_R
    })
    toolsWindowContainer.addChild(buttonR)

    var buttonC = new PIXI.Sprite(PIXI.loader.resources['buttonC'].texture)
    buttonC.interactive = true
    buttonC.x = 4
    buttonC.y = buttonC.height
    buttonC.on('click', function (event) {
      selectedTool = BUTTON_C
    })
    toolsWindowContainer.addChild(buttonC)

    var buttonI = new PIXI.Sprite(PIXI.loader.resources['buttonI'].texture)
    buttonI.interactive = true
    buttonI.x = 4
    buttonI.y = buttonI.height * 2
    buttonI.on('click', function (event) {
      selectedTool = BUTTON_I
    })
    toolsWindowContainer.addChild(buttonI)

    var buttonRoad = new PIXI.Sprite(PIXI.loader.resources['buttonRoad'].texture)
    buttonRoad.interactive = true
    buttonRoad.x = 4
    buttonRoad.y = buttonRoad.height * 3
    buttonRoad.on('click', function (event) {
      selectedTool = BUTTON_ROAD
    })
    toolsWindowContainer.addChild(buttonRoad)

    var buttonSelection = new PIXI.Sprite(PIXI.loader.resources['buttonSelection'].texture)
    buttonSelection.interactive = true
    buttonSelection.y = buttonSelection.height * 4
    buttonSelection.on('click', function (event) {
      selectedTool = BUTTON_SELECTION
    })
    toolsWindowContainer.addChild(buttonSelection)

    var bnpLabel = new PIXI.Text("BNP:", {fontFamily : 'Helvetica', fontSize: 10, fill : 0xf8f8f8 })
    bnpLabel.x = 5
    bnpLabel.y = buttonSelection.height * 5
    toolsWindowContainer.addChild(bnpLabel)

    bnpText = new PIXI.Text("-", {fontFamily : 'Helvetica', fontSize: 10, fill : 0xf8f8f8 })
    bnpText.x = 5
    bnpText.y = buttonSelection.height * 5 + 10
    toolsWindowContainer.addChild(bnpText)

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

    easystar.calculate()

    // update people
    for (var i = 0; i < people.length; i++) {

      let person = people[i]
      let currentTile = getTile(person.currentTileC, person.currentTileR)

      let pathCallback = function (path) {
        if (path === null) {
          this.state = PEOPLE_NO_PATH
          this.timer = 4000
        } else {

          // save path to buildings
          {
            let departureTile = getTile(this.currentTileC, this.currentTileR)
            departureTile.latestPaths.unshift({
              path: JSON.parse(JSON.stringify(path)), // TODO: optimize here
              // TODO: add energy cost
            })

            // keep the array at a reasonable length
            while (departureTile.latestPaths.length > 5) {
              departureTile.latestPaths.pop()
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
          person.values.tiredness -= dt
          if (person.values.tiredness < 0) {
            person.state = PEOPLE_GO_TO_WORK
          }
          break

        case PEOPLE_GO_HOME:
          person.state = PEOPLE_FINDING_PATH
            person.wantedDestinationTileC = person.homeTileC
            person.wantedDestinationTileR = person.homeTileR
            easystar.findPath(
                person.currentTileC * 2,
                person.currentTileR * 2 + 2,
                person.homeTileC * 2,
                person.homeTileR * 2 + 2,
                pathCallback)
          break

        case PEOPLE_GO_TO_WORK:
          if (person.hasWorkplace === true) {
            person.state = PEOPLE_FINDING_PATH
            person.wantedDestinationTileC = person.workplaceTileC
            person.wantedDestinationTileR = person.workplaceTileR
            easystar.findPath(
                person.currentTileC * 2,
                person.currentTileR * 2 + 2,
                person.workplaceTileC * 2,
                person.workplaceTileR * 2 + 2,
                pathCallback)

          } else {
            person.state = PEOPLE_FIND_WORKPLACE
          }
          break

        case PEOPLE_FIND_WORKPLACE:

          // find a workplace
          loop: for (var r = 0; r < tiles.length; r++) {
            for (var c = 0; c < tiles[r].length; c++) {
              if (tiles[r][c].building === BUILDING_I_01) {
                person.hasWorkplace = true
                person.workplaceTileC = c
                person.workplaceTileR = r
                break loop
              }
            }
          }

          // go back to resting
          person.state = PEOPLE_RESTING

          break

        case PEOPLE_FINDING_PATH:
          // pass, wait for easystar
          break

        case PEOPLE_DRIVING:
          let car = person.car
          var nextTileInPath = car.path[0]
          var speed = car.speed

          var dx = nextTileInPath.x / 2 * TILE_SIZE - car.container.x
          var dy = nextTileInPath.y / 2 * TILE_SIZE - car.container.y

          var angle = Math.atan2(dy, dx)

          // car.x += Math.cos(angle) * speed
          // car.y += Math.sin(angle) * speed

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
                person.state = PEOPLE_WORKING
              } else if (currentTile.building === BUILDING_R_01) {
                person.state = PEOPLE_RESTING
              }
              // NOTE: add the rest of building types
            }
          }
          break

        case PEOPLE_WORKING:
          person.values.tiredness += dt
          bnp = bnp + BNP_WORKER_ADDITION
          if (person.values.tiredness > 4000) {
            person.state = PEOPLE_GO_HOME
          }
          break

        case PEOPLE_NO_PATH:
          if (person.timer === null)
            console.error("Set a timer ya dingus")

          person.timer -= dt
          if (person.timer < 0) {
            person.timer = null
            person.state = PEOPLE_GO_TO_WORK
          }

          break
      }

    }

    // Iterate all tiles and do stuff
    allTiles((tile) => {

      // construct buildings
      calcTile(tile, ZONE_R, BUILDING_R_01, ['sc_house_small_01', 'sc_house_small_02', 'sc_house_small_03', 'sc_house_01_2lev', 'sc_house_01_4lev', 'sc_house_01_6lev'][randomInteger(5)])
      calcTile(tile, ZONE_C, BUILDING_C_01, ['sc_commercials_01', 'sc_commercials_02', 'sc_commercials_03'][randomInteger(2)])
      calcTile(tile, ZONE_I, BUILDING_I_01, ['sc_industry_01', 'sc_industry_02', 'sc_industry_03', 'sc_industry_04', 'sc_industry_05'][randomInteger(4)])

    })


    // Global BNP deduction
    bnp = Math.max(0, bnp - BNP_GLOBAL_DEDUCTION)

    // Update BNP text
    bnpText.text = (Math.round(bnp * 100) / 100)
  },
  draw: function () {
    global.renderer.render(container)
  },
}

calcTile = function(tile, zone, building, resource) {
  if (tile.zone === zone && tile.building === null) {

    if (tile.buildTimeout === null) {
      let times = [1,1,1,1,1] //[100, 150, 200, 250, 300]
      tile.buildTimeout = times[Math.floor(Math.random() * 4)]
    } else {
      tile.buildTimeout--
    }
    if (tile.buildTimeout <= 0) {
      tile.buildTimeout = null
      tile.building = building
      tile.container.removeChildren()
      tile.container.addChild(new PIXI.Sprite(PIXI.loader.resources[resource].texture))

      if (zone === ZONE_R) {

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

          timer: null,

          state: PEOPLE_RESTING,

          // simulation values (in ms)
          values: {
            tiredness: 2000,
          },
        }
        people.push(moverIn)
      }
    }
  }
}

function createCar(path, tileC, tileR, carModel) {

  // car definition
  var car = {
    x: tileC * 2,
    y: (tileR * 2) + 2,
    speed: 0.5 + randomInteger(1, 10) / 10,
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

  car.container.x = car.x / 2 * TILE_SIZE
  car.container.y = car.y / 2 * TILE_SIZE

  car.container.addChild(sprite)

  carsContainer.addChild(car.container)

  return car
}

module.exports = gameScene
