/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link https://github.com/ahackel/tilt
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

tiltApp.factory('progress', function(levels) {

	var _currentLevel,
	    _levelProgress = {};

	function saveState() {
		localStorage.setItem("currentLevel", _currentLevel);
		localStorage.setItem("levelProgress", JSON.stringify(_levelProgress));
	}

	function restoreState() {
		_currentLevel = localStorage.getItem("currentLevel") || levels.get(0).id;
		if (levels.getIndex(_currentLevel) < 0)
			_currentLevel = levels.getByCategory('Simple')[0];

		var s = localStorage.getItem("levelProgress");
		if (s)
			_levelProgress = JSON.parse(s);
		else
			_levelProgress = {};
	}

	function reset() {
		localStorage.clear();
		restoreState();
	}

	function isLevelLocked(id) {
		var currentIndex = 0,
			index = levels.getIndex(id),
			category = levels.getCategoryFromId(id);

		if (_currentLevel)
			currentIndex = levels.getIndex(_currentLevel);

		return !tilt.UNLOCK_ALL_LEVELS && category !== 'Custom' && index > currentIndex;
	}

    function isLevelPerfectlySolved(id) {
        var index = levels.getIndex(id),
            minMoves = levels[index].moves,
            progress = _levelProgress[id],
            moves = progress && progress.moves;

        if (minMoves && moves)
            return moves <= minMoves;
        else
            return false;
    }

	function isCategoryLocked(category) {
		// is this level not available in free edition?
		if (levels.getCategoryIndex(category) > levels.lengthCategories - 1)
			return true;

		var currentIndex = 0;
		if (_currentLevel)
			currentIndex = levels.getCategoryIndex(levels.getCategoryFromId(_currentLevel));
		var index = levels.getCategoryIndex(category);
		return !tilt.UNLOCK_ALL_LEVELS && category !== 'Custom' && index > currentIndex;
	}

	function getLevelProgress(id) {
		return _levelProgress[id];
	}

	function reportLeaderboardScore(id) {
		var category = levels.getCategoryFromId(id),
			categoryScore = progress.getCategoryScore(category);

		if (window.plugins && window.plugins.gameCenter) {
			console.log('updating Leaderboard', category, categoryScore);
			window.plugins.gameCenter.reportScore(category, categoryScore);
		}
	}

	function reportAchievements(id) {
		// all levels of category solved:
		var category = levels.getCategoryFromId(id);

		var success = function(){  },
			failed = function(){  };

		if (window.plugins && window.plugins.gameCenter) {
			var achievementName, percent;

			percent = getCategorySolvedPercentage(category);
			achievementName = "SOLVED_" + category;
			console.log('Reporting achievement', achievementName, percent);
			window.plugins.gameCenter.reportAchievement(achievementName, percent, success, failed);

			if (percent >= 100)
				if (tilt.DEVELOPER && window.plugins && window.plugins.testFlight) {
					window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Got Achievement ' + achievementName);
				}

			percent = getCategorySolvedPercentage(category, true);
			achievementName = "SOLVED_PERFECTLY_" + category;
			console.log('Reporting achievement', achievementName, percent);
			window.plugins.gameCenter.reportAchievement(achievementName, percent, success, failed);

			if (percent >= 100)
				if (tilt.DEVELOPER && window.plugins && window.plugins.testFlight) {
					window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Got Achievement ' + achievementName);
				}
		}
	}

	function update(id, moves, time, score, stars, replay) {
		var	newHighscore = false,
			currentIndex = levels.getIndex(_currentLevel),
			index = levels.getIndex(id),
			level = levels.get(id);

		if (index == -1)
			return false;

		if (!_levelProgress[id]) {
			_levelProgress[id] = {
				moves: moves,
				time: time,
				score: score,
				stars: stars,
				replay: replay
			};
			newHighscore = true;
		}
		else {
			// new highscore reached?
			var p = _levelProgress[id];
			if (score > p.score || (score === p.score && time < p.time)) {
				p.moves = moves;
				p.time = time;
				p.score = score;
				p.stars = stars;
				p.replay = replay;

				newHighscore = true;
			}
		}

		if (index < levels.length - 1)
			unlockLevel(levels.get(index + 1).id);
		else if (index > currentIndex)
			unlockLevel(id);

		saveState();

		if (newHighscore) {
			// new highscore reached?
			reportLeaderboardScore(id);
			reportAchievements(id);
		}

		if (window.plugins && window.plugins.testFlight) {
			//	window.plugins.testFlight.openFeedbackView(function(){}, function(){});
			window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Finished Level ' + id);
			if (newHighscore)
				window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Reached new highscore');
			if (level.moves && moves < level.moves)
				window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Has beaten the developer');
		}

		return newHighscore;
	}

	function getCategoryScore(category){
		var totalScore = 0,
			levelIds = levels.getByCategory(category);
		for (var i in levelIds) {
			var progress = _levelProgress[levelIds[i]];
			if (progress) {
				totalScore += progress.score;
			}
		}
		return totalScore;
	}

	function getTotalScore(){
		var totalScore = 0,
			l = levels.length;
		for (var i = 0; i < l; i++) {
			var level = levels.get(i);
				progress = _levelProgress[level.id];
			if (progress) {
				totalScore += progress.score;
			}
		}
		return totalScore;
	}

	function getCategorySolvedPercentage(category, perfect){
		var total = 0,
			solved = 0,
			levelIds = levels.getByCategory(category);

		for (var i = 0; i < levelIds.length; i++) {
			var progress = _levelProgress[levelIds[i]];

			if (perfect) {
				total += 3; // number of stars
				if (progress && progress.stars)
					solved += progress.stars;
			}
			else {
				total += 1; // number of levels
				if (progress && progress.score)
					solved += 1;
			}
		}
		return (total > 0) ? solved * 100.0 / total : 0;
	}

	function unlockLevel(id) {
		var indexCurrent = levels.getIndex(_currentLevel),
			indexNew = levels.getIndex(id);

		if (indexNew > indexCurrent)
			_currentLevel = id;

		saveState();
	}

	restoreState();

	var progress = {
		isCategoryLocked: isCategoryLocked,
		isLevelLocked: isLevelLocked,
        isLevelPerfectlySolved: isLevelPerfectlySolved,
		update: update,
		reset: reset,
		getLevelProgress: getLevelProgress,
		getCategoryScore: getCategoryScore,
		getTotalScore: getTotalScore,
		unlockLevel: unlockLevel,
        get isReset() { return localStorage.length === 0 },
		get currentLevel() { return _currentLevel; },
		get currentCategory() { return levels.getCategoryFromId(_currentLevel); }
	};

	tilt.progress = progress;


	return progress;


});

