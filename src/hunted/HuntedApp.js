(function(window) {
	
	var HuntedApp = function() {

		var	that = this,
			numChasersToSpawn = 1,
			paused = false,
			wrapRadius = 2000,
			chasers = [],
			projectiles = [],
			canvas = document.getElementById("canvas"),
			stage = new Stage(canvas),
			fpsLabel = PTUtils.makeFPSLabel(),
			scaleStage = new ScaleStage(),
			trackingStage = new TrackingStage(),
			levelText = new Text("-- fps","bold 20px Arial","#FFF"),

			parallaxScroller = new ParallaxScroller({
				app: this,
				trackingStage : trackingStage,
				wrapRadius: wrapRadius,
				numItems: 50
			}),

			itemScroller = new ItemScroller({
				scaleStage: scaleStage,
				trackingStage: trackingStage,
				wrapRadius: wrapRadius,
				numItems: 50
			}),

			ship = new Ship({
				name: "hero",
				controlsClass: ShipControlsKeyboard,
				skinClass: ShipSkinGeneric,
				drag: 0.95,
				thrustLimit: 2,
				boostThrust: 3,
				boostFuelLimit: 20,
				boostRegenerateFrequency: 10,
				steeringResponse: 2,
				steeringLimit: 10,
				launcherSpread: 5,
				projectileThrust: 40,
				shotsPerLaunch: 1,
				projectileLife: 20,
				projectileLimit: 200,
				projectiles: projectiles
			}),

			avoider = new Ship({
				name: "avoider",
				controlsClass: ShipControlsAIAvoid,
				target: ship
			}),

			wanderer = new Ship({
				name: "wanderer",
				controlsClass: ShipControlsAIWander
			});

		stage.addChild(fpsLabel, levelText, scaleStage);

		levelText.x = 10; levelText.y = 40;

		scaleStage.addChild(trackingStage);
		scaleStage.addChildAt(parallaxScroller, 0);
		scaleStage.setTargetScale(0.75);

		trackingStage.addChild(itemScroller);
		trackingStage.addChild(ship);
		trackingStage.addChild(avoider);
		trackingStage.addChild(wanderer);
		trackingStage.setTrackingTarget(ship);
		
		setupTicker();
		rigPauseKey();
		resize();
		start();

		function setupTicker() {
			Ticker.setFPS(30);
			Ticker.addListener(that);
			engageTick();
		}

		function engageTick() {
			that.tick = function(){
				checkForHits();
				stage.update();
			};
		}

		function disengageTick() { 
			that.tick = undefined;
		}

		function start() {
			_.each(chasers, function(chaser){ chaser.kill(); });
			chasers = [];
			// numChasersToSpawn = 1; // would kick you back to level 1
			if (numChasersToSpawn > 1) numChasersToSpawn--;
			trackingStage.addChild(ship);
			spawnChasers();
		}

		function gameOver() {
			$(document).bind('keydown', 'space',function onRestartSpacePressed() {
					start();
					$(document).unbind('keydown', onRestartSpacePressed);
				}
			);
		}

		function spawnChasers() {
			//LEVEL UP??
			_.times(numChasersToSpawn, spawnChaser);
			levelText.text = "LEVEL " + numChasersToSpawn;
			numChasersToSpawn++;
		}

		function spawnChaser() {
			var chaser = new Ship({
				name: "chaser: " + Math.random(),
				controlsClass: ShipControlsAIChase,
				skinClass: ShipSkinGoon,
				thrustLimit: 4,
				steeringAccuracy: 10,
				steeringLimit: 10,
				target: ship
			});
			
			var spawnPoint = PTUtils.polarDegrees(wrapRadius, Math.random()*360);
			chaser.x = ship.x + spawnPoint.x;
			chaser.y = ship.y + spawnPoint.y;
			chasers.push(chaser);
			trackingStage.addChild(chaser);
		}

		function checkForHits(){

			if (chasers.length > 0) {

				// check chasers against ship for hit

				_.each(chasers, function(chaser) {
					var globalLauncherPoint = chaser.launcher.localToGlobal(0, 0);
					var globalShipPoint = ship.localToGlobal(0, 0);
					var distToShip = PTUtils.distance(globalLauncherPoint, globalShipPoint);
					
					if (distToShip < 40) {
						var localHitPoint = ship.globalToLocal(globalLauncherPoint.x, globalLauncherPoint.y);
						var hit = ship.hitTest(localHitPoint.x, localHitPoint.y);
						if (hit) {
							ship.kill();
							gameOver();
						}
					}

					// while you're at it check projectiles against chaser for hit

					_.each(projectiles, function(projectile) {

						var dist = PTUtils.distance(new Point(chaser.x, chaser.y), new Point(projectile.x, projectile.y));

						if (dist < 40) {
							var localHitPoint = projectile.localToLocal(0, 0, chaser); 
							var hit = chaser.hitTest(localHitPoint.x, localHitPoint.y);
							if (hit) {
								trackingStage.removeChild(chaser);
								for (var k = 0; k < chasers.length; k++) {
									if (chaser === chasers[k]) {
										chasers.splice(k, 1);
									}
								}
								if (chasers.length === 0) {
									spawnChasers();
								}
							}
						}

					});
				});
			}

		}

		function rigPauseKey() {
			$(document).bind('keydown', 'p', function() {
				if (paused) {
					unPause();
				} else {
					pause();
				}

				function pause() {
					$(document).bind('keydown', 'space', onPauseSpacePressed);
					console.log("PAUSE");
					that.tick = undefined;
					paused = true;
				}

				function unPause() {
					$(document).unbind('keydown', onPauseSpacePressed);
					console.log("UNPAUSE");
					engageTick();
					paused = false;
				}

				function onPauseSpacePressed() {
					console.log("PAUSE SPACE");
					unPause();
				}
			});
		}

	
		function resize() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			scaleStage.x = canvas.width / 2;
			scaleStage.y = canvas.height / 2; 
			stage.update();
		}

		window.onresize = resize;
		window.sp = ship.props;

	};

	window.HuntedApp = HuntedApp;

}(window));