var gameVars = require('./gameVars')

var loadingScene = {
  name: 'loadingScene',
  create: function (sceneParams) {

    // fetch assets
    PIXI.loader

    .add('toolbarbg', 'assets/images/toolbarbg.png')
    .add('marker', 'assets/images/marker.png')
    .add('buttonR', 'assets/images/buttonR.png')
    .add('buttonC', 'assets/images/buttonC.png')
    .add('buttonI', 'assets/images/buttonI.png')
    .add('buttonSelection', 'assets/images/buttonSelection.png')
    .add('buttonRoad', 'assets/images/buttonRoad.png')

    .add('bg', 'assets/images/sc_map.png')

    .add('sc_car_01', 'assets/images/sc_car_01.png')
    .add('sc_car_02', 'assets/images/sc_car_02.png')
    .add('sc_car_03', 'assets/images/sc_car_03.png')
    .add('sc_car_04', 'assets/images/sc_car_04.png')
    .add('sc_car_05', 'assets/images/sc_car_05.png')
    .add('sc_car_06', 'assets/images/sc_car_06.png')
    .add('sc_car_07', 'assets/images/sc_car_07.png')
    .add('sc_car_08', 'assets/images/sc_car_08.png')
    .add('sc_car_09', 'assets/images/sc_car_09.png')
    .add('sc_car_10', 'assets/images/sc_car_10.png')
    .add('sc_car_11', 'assets/images/sc_car_11.png')

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
    .add('sc_house_small_02', 'assets/images/sc_house_small_02.png')
    .add('sc_house_small_03', 'assets/images/sc_house_small_03.png')

    .add('sc_house_01_2lev', 'assets/images/sc_house_01_2lev.png')
    .add('sc_house_01_4lev', 'assets/images/sc_house_01_4lev.png')
    .add('sc_house_01_6lev', 'assets/images/sc_house_01_6lev.png')

    .add('sc_commercials_01', 'assets/images/sc_commercials_01.png')
    .add('sc_commercials_02', 'assets/images/sc_commercials_02.png')
    .add('sc_commercials_03', 'assets/images/sc_commercials_03.png')

    .add('sc_industry_01', 'assets/images/sc_industry_01.png')
    .add('sc_industry_02', 'assets/images/sc_industry_02.png')
    .add('sc_industry_03', 'assets/images/sc_industry_03.png')
    .add('sc_industry_04', 'assets/images/sc_industry_04.png')
    .add('sc_industry_05', 'assets/images/sc_industry_05.png')

    .add('gridpoint', 'assets/images/gridpoint.png')
    .add('gridedge', 'assets/images/gridedge.png')

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
