var Easystarjs = require('easystarjs')
var gameVars = require('./gameVars')

var easystar = new Easystarjs.js()
var easystarGrid = []

var gameScene = {
  name: 'gameScene',
  create: function (sceneParams) {

  },
  destroy: function () {
    this.container.destroy()
  },
  update: function () {
    
  },
  draw: function () {
    global.renderer.render(this.container)
  },
}

module.exports = gameScene
