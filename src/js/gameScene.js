var gameVars = require('./gameVars')

var rowCount = 9
var columnCount = 9

var TILE_SIZE = 64
var tiles

var container // container of the whole scene
var worldContainer // the world
var tileContainer // all tiles

var gameScene = {
  name: 'gameScene',
  create: function (sceneParams) {

    // create all pixi containers
    container = new PIXI.Container()
    worldContainer = new PIXI.Container()
    tileContainer = new PIXI.Container()

    worldContainer.addChild(tileContainer)

    container.addChild(worldContainer)

    global.baseStage.addChild(container)

    // create the tiles
    tiles = []

    for (var r = 0; r < rowCount; r++) {
      tiles[r] = []

      for (var c = 0; c < columnCount; c++) {

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

        tile.container.addChild(texture)

        tileContainer.addChild(tile.container)

        tiles[r][c] = tile
      }
    }

  },
  destroy: function () {
    container.destroy()
  },
  update: function () {
    
  },
  draw: function () {
    global.renderer.render(container)
  },
}

module.exports = gameScene
