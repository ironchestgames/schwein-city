var gameVars = require('./gameVars')

var loadingScene = {
  name: 'loadingScene',
  create: function (sceneParams) {

    // fetch assets
    PIXI.loader

    .add('marker', 'assets/images/marker.png')
    .add('buttonR', 'assets/images/buttonR.png')
    .add('buttonC', 'assets/images/buttonC.png')
    .add('buttonI', 'assets/images/buttonI.png')
    .add('buttonRoad', 'assets/images/buttonRoad.png')

    .add('forest_1', 'assets/images/forest_1.png')
    .add('road', 'assets/images/road.png')
    .add('person', 'assets/images/person.png')
    .add('sc_car_01', 'assets/images/sc_car_01.png')

    .add('sc_crossroad_01', 'assets/images/sc_crossroad_01.png')
    .add('sc_crossroad_02', 'assets/images/sc_crossroad_02.png')
    .add('sc_crossroad_03', 'assets/images/sc_crossroad_03.png')
    .add('sc_crossroad_04', 'assets/images/sc_crossroad_04.png')
    .add('sc_crossroad_05', 'assets/images/sc_crossroad_05.png')
    .add('sc_road_01', 'assets/images/sc_road_01.png')
    .add('sc_road_02', 'assets/images/sc_road_02.png')
    .add('sc_road_03', 'assets/images/sc_road_03.png')
    .add('sc_road_04', 'assets/images/sc_road_04.png')
    .add('sc_road_05', 'assets/images/sc_road_05.png')
    .add('sc_road_06', 'assets/images/sc_road_06.png')
    .add('sc_turn_01', 'assets/images/sc_turn_01.png')
    .add('sc_turn_02', 'assets/images/sc_turn_02.png')
    .add('sc_turn_03', 'assets/images/sc_turn_03.png')
    .add('sc_turn_04', 'assets/images/sc_turn_04.png')

    .add('sc_zone_residents', 'assets/images/sc_zone_residents.png')
    .add('sc_zone_commercial', 'assets/images/sc_zone_commercial.png')
    .add('sc_zone_industry', 'assets/images/sc_zone_industry.png')

    .add('sc_house_small_01', 'assets/images/sc_house_small_01.png')

    .add('sc_house_01_2lev', 'assets/images/sc_house_01_2lev.png')

    .add('sc_house_01_4lev', 'assets/images/sc_house_01_4lev.png')

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
