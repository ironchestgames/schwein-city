
var version = require('./version')
console.log(version)
var PIXI = require('pixi.js')
var browserGameLoop = require('browser-game-loop')
var windowLoad = require('window-load')
var ob = require('obscen')
var loadingScene = require('./loadingScene')
var gameScene = require('./gameScene')

var fpsText

var setUpGameRenderer = function () {

  // init pixi renderer
  var noWebgl = !!localStorage.getItem('vars:noWebgl')
  var renderer = PIXI.autoDetectRenderer(1024, 768, {}, noWebgl)
  document.body.appendChild(renderer.view)
  renderer.backgroundColor = 0x115511

  var appContainer = new PIXI.Container()
  var baseStage = new PIXI.Container()
  var debugTexts = new PIXI.Container()

  appContainer.addChild(baseStage)
  appContainer.addChild(debugTexts)

  global.appContainer = appContainer
  global.baseStage = baseStage
  global.renderer = renderer

  // debug monitor text
  if (!global.DEBUG_MONITOR) {
    debugTexts.visible = false
  }

  fpsText = new PIXI.Text('This is a pixi text', {
    fill: 0xffffff,
  })
  debugTexts.addChild(fpsText)

}

windowLoad(function () {

  global.DEBUG_MONITOR = !!localStorage.getItem('DEBUG_MONITOR')

  // init obscen
  var sceneManager = new ob.SceneManager()

  sceneManager.setScenes([
    loadingScene,
    gameScene,
    ])

  // init browserGameLoop
  var timestep = 1000 / 30
  var loop = browserGameLoop({
    updateTimeStep: timestep,
    fpsFilterStrength: 20,
    slow: 1,
    input: function() {},
    update: function(step) {
      global.sceneManager.update(step)
    },
    render: function(ratio) {
      global.sceneManager.draw(renderer, ratio)
      fpsText.text = 'fps: ' + Math.round(loop.getFps())
      global.renderer.render(global.appContainer)
    },
  })
  loop.timestep = timestep

  global.sceneManager = sceneManager
  global.loop = loop

  var intervalId = setInterval(function () {

    // set up everything pixi for the game
    setUpGameRenderer()

    // start with load scene
    global.sceneManager.changeScene('loadingScene')

    // start!
    clearInterval(intervalId)
    global.loop.start()

  }, 100)


  var audio = new Audio('assets/schwien_city_01.ogg');
  audio.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
  }, false);
  audio.play();

})

