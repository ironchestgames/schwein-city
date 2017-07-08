var gameVars = require('./gameVars')

var loadingScene = {
  name: 'loadingScene',
  create: function (sceneParams) {

    // fetch assets
    PIXI.loader

    .add('forest_1', 'assets/images/forest_1.png')
    .add('road', 'assets/images/road.png')
    .add('person', 'assets/images/person.png')

    .add('gridpoint', 'assets/images/gridpoint.png')
    
    .load(function () {
      this.changeScene('gameScene', sceneParams)
    }.bind(this))
  },
  destroy: function () {

  },
  update: function () {

  },
  draw: function () {

  },
}

module.exports = loadingScene
