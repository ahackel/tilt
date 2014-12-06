/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

tiltApp.factory('levels', function(store) {

	var _categories = ["Simple", "Beginner", "Nobounds", "Advanced"],

		_levels = [
	{ id: "Simple/First Moves",			elements: "                        B      bC      c                        ", moves: 7, tutorial: "TUTORIAL_1" },
	{ id: "Simple/Coins",				elements: "                        B    111                               b", moves: 11, tutorial: "TUTORIAL_2" },
	{ id: "Simple/Double",				elements: "B     1b                                                B     1b", moves: 7, tutorial: "TUTORIAL_3" },
	{ id: "Simple/Push Them Together",	elements: "1      21      2C              c       bB                       ", moves: 14, tutorial: "TUTORIAL_4" },
	{ id: "Simple/Build a Block",		elements: "B      B AAAAAA         2  bb 322  bb 32        1AAAAAA1B      B", moves: 18 },
	{ id: "Simple/Filter",				elements: "          BBCC     2 2  AAA1A1AA  3 3                     bbcc  ", moves: 9 },
	{ id: "Simple/Stacking",			elements: "BCBCBC31AAAAAA22      44                   bc 55   bc 55   bc 55", moves: 16, tutorial: "TUTORIAL_5" },
	{ id: "Simple/Snake",				elements: "BCBCBC  AAAAAA                11      112233  1122AAAAAA22bcbcbc", moves: 30 },
	{ id: "Simple/Snake Vertical",		elements: "BCBCBC 1  33334   2222Ab      Ac      Ab      Ac      Ab      Ac", moves: 23, tutorial: "TUTORIAL_6" },
	{ id: "Simple/Smoke Stack",			elements: "CCAccACC  AccA    A  A    A  A    A  A    A  A    A33A  44221111", moves: 27 },
	{ id: "Simple/Snake Reverse",		elements: "BCBCBC  AAAAAA            2   11 22   11 22   11 2AAAAAA  cbcbcb", moves: 35, tutorial: "TUTORIAL_7" },
	{ id: "Simple/Broken Box",			elements: "CC    CCC       C  CC         C   2115  AAA14cccAAA14cccAAA34ccc", moves: 13 },
	{ id: "Simple/Rotate",				elements: "         3BBCC   3 2 2  AAA1A1AAb  4 5  b       c       c       ", moves: 18 },
	{ id: "Simple/Swapping",			elements: "          BBCC     2 2  AAA1A1AA   3 344                  bcbc  ", moves: 14 },
	{ id: "Simple/Back and Forth",		elements: "          ACCA   AAccAA  Bb11bB  Bb11bB  AAccAA   ACCA          ", moves: 10 },
	{ id: "Simple/Door Mat",			elements: "                         CAAAA   1DccA    A  A   CAAAA   3d22   ", moves: 12, tutorial: "TUTORIAL_8" },

	{ id: "Beginner/Smoke Stack 2",		elements: "CCAbbABB  AccA    A  A    A  A    A  A    A  A    A11A    11    ", moves: 32 },
	{ id: "Beginner/Blockade",			elements: "  BBBB    CCCC          AA    AAAA1111AA    1111          bbbb  ", moves: 13 },
	{ id: "Beginner/Swap",				elements: "  CCCC    bbbb          AAAA AAAAAAA AAA      11  cccc11  BBBB  ", moves: 68 },
	{ id: "Beginner/Sorter",			elements: "   C B s   B C s   C B sAAA A AAAAA A AAAAAbAcAA   b c     b c  ", moves: 27 },
	{ id: "Beginner/Smoke Stack 3",		elements: "  AbbA    AccA    AccA    ACCA    ACCA    ABBA    A  A    1  1  ", moves: 53 },
	{ id: "Beginner/Pipe",				elements: "  1  1    ABBA    A  A    AccA    AbbA    A  A    ACCA     11   ", moves: 35 },
	{ id: "Beginner/Sorter 2",			elements: "sCBCCBB sBCBBCC sBCCBBC AAA A AAAAA A AAAbbbAcccAbbbAcccAbbbAccc", moves: 61 },
	{ id: "Beginner/Bar",				elements: "                BB11bbbbBB  AAAABB  AAAABB11bbbb                ", moves: 23 },
	{ id: "Beginner/Box",				elements: " BBBCCC              111   AA111   AA                    cccbbb ", moves: 18 },
	{ id: "Beginner/Split",				elements: "1        A    A  b    c    BC      BC   1b    c  A    A         ", moves: 29 },
	{ id: "Beginner/Cross",				elements: "  1  1    AccA   AABBAA                  AACCAA   AbbA          ", moves: 27 },
	{ id: "Beginner/Twirl",				elements: "          b       B1 Bb    AA1    1AA    bB 1B       b          ", moves: 10 },
	{ id: "Beginner/Rescue",			elements: "BD ds DBDD    DD           bb   c  bb  C        DDs  sDDBD    DB", moves: 39 },
	{ id: "Beginner/Rescue 2",			elements: "BDBDBDBDADADADAD                c  d   C          AAAA    bbbb  ", moves: 34 },
	{ id: "Beginner/6 Moves",			elements: "   BB     AbbA   AA  AA Cc   Cc Cc   Cc 1AABBAA   AbbA          ", moves: 6 },
	{ id: "Beginner/Door Mat 2",		elements: "                 CAAAAB   DccA    AbbD   CAAAAB   d11d          ", moves: 27 },

	{ id: "Nobounds/Shift",				elements: "c      c                   BB      CC                   b      b", moves: 8, noBounds: true, tutorial: "TUTORIAL_9" },
	{ id: "Nobounds/Baskets",			elements: "     AAA     Ac      Ac      AAA        AAAA BB AbbA CC A  A    ", moves: 19, noBounds: true },
	{ id: "Nobounds/Space Jail",		elements: "ADA  ADADBD  DcDAdA  AdA                AdA  AdADCD  DbDADA  ADA", moves: 21, noBounds: true },
	{ id: "Nobounds/Factory",			elements: "                bbbbcccc        CCBBCCBBAA                      ", moves: 19, noBounds: true },
	{ id: "Nobounds/Split 2",			elements: "          bbbb  s       AABBBBAAAACCCCAA          cccc          ", moves: 18, noBounds: true },
	{ id: "Nobounds/Sorter 3",			elements: "         BCBCB    C C      B            bAcAbAcAbAcAbAcAAAAAAAAA", moves: 24, noBounds: true },
	{ id: "Nobounds/Turn",				elements: " b       b       b      BBBABBBB b       b       b       b      ", moves: 90, noBounds: true },
	{ id: "Nobounds/Cross",				elements: "  A  A    ACCA  AAAbbAAA Bc  cB  Bc  cB AAAbbAAA  ACCA    A  A  ", moves: 60, noBounds: true },
	{ id: "Nobounds/Split 3",			elements: "A      A          b  b     BB      BB     b  b          A      A", moves: 61, noBounds: true },
	{ id: "Nobounds/Zipper",			elements: " A A A ABBBBBBBB A A A Abbbbbbbbbbbbbbbb A A A ABBBBBBBB A A A A", moves: 15, noBounds: true },
	{ id: "Nobounds/Asteroid",			elements: "AA      AA   CC         CC ccc  C  cbc  C  ccc B         C C    ", moves: 37, noBounds: true },
	{ id: "Nobounds/Make beds",			elements: "CCCCCCCC         bb  cc Abb  ccAAbb  ccA bb  cc         BBBBBBBB", moves: 79, noBounds: true },
	{ id: "Nobounds/Enchain",			elements: "CCC  BBBC      BCCC  BBB          ccc     cbbb    cccb  A  bbb  ", moves: 95, noBounds: true },
	{ id: "Nobounds/Space Jail 2",		elements: "AAA  AAADbD  DcDAdA  AdA   BC      CB   AdA  AdADcD  DbDAAA  AAA", moves: 38, noBounds: true },
	{ id: "Nobounds/Gap",				elements: "          BBBB    CCCC                   AsAsAsA c c c c b b b b", moves: 32, noBounds: true },
	{ id: "Nobounds/Turn 2",			elements: " b    c  b    c  b    c BBBAABBBCCCAACCC b    c  b    c  b    c ", moves: 128, noBounds: true },

	{ id: "Advanced/Exploded Box",		elements: "CC    CCC       C  CC         C              cccAA   cccAA   ccc", moves: 31 },
	{ id: "Advanced/Bar 2",				elements: "s      s        BC  bbbbBC  AAAABC  AAAABC  cccc               s", moves: 89 },
	{ id: "Advanced/Conquer",			elements: "                  ACCA  B CbbC BB CbbC B  ACCA       s  s      s", moves: 29 },
	{ id: "Advanced/Dance",				elements: "       s b   Bb  BAAAA s  ACCA    ACCA    AAAAB  bB   b s       ", moves: 36 },
	{ id: "Advanced/Football",			elements: "        sAB  CA sA    A ccB C bbcc B Cbb A    A sAB  CA         ", moves: 84 },
	{ id: "Advanced/Escape",			elements: "s                sACCA  b CBBC bb CBBC b sACCA                  ", moves: 43 },
	{ id: "Advanced/Sorter 4",			elements: "  CCC    BCBCB    BCB      B       sss  bAcAbAcAbAcAbAcAbAcAbAcA", moves: 43 },
	{ id: "Advanced/Circus",			elements: "        Bd    dB  DDDD sCbDccDbCCbDccDbC  DDDD  Bd    dB        ", moves: 68 },
	{ id: "Advanced/Barriers",			elements: " C    cs C AA c  B    bs B    bs C AA c  C    c  B AA b  B AA b ", moves: 63 },
	{ id: "Advanced/Brush",				elements: "    BAbb    B ss    CAbb    C  s    BAcc    B       BAbb    B   ", moves: 69 },
	{ id: "Advanced/Exploded Egg",		elements: "CC    CCC       C  CC         B              cccAA   cbcAA   ccc", moves: 55 },
	{ id: "Advanced/Evaporation",		elements: "s  cc  ss cccc  A cccc A A cc A   A  A          CC    CCCCCCCCCC", moves: 41 },
	{ id: "Advanced/Gaps",				elements: "          BBBB    CCCC                   AsAsAsA c c c c b b b b", moves: 49 },
	{ id: "Advanced/Back and Forth 2",	elements: "          DCCD   DDccDD  BbddbB  BbddbB  DDccDD   DCCD          ", moves: 27 },
	{ id: "Advanced/Let me in",			elements: "CCC     CCC     CCC                 DDDD    Dccc    Dcccd   Dccc", moves: 18 },
	{ id: "Advanced/Square",			elements: "        sAAbbAA sAB  BA  c CC c  c CC c  AB  BA sAAbbAA         ", moves: 67 }


	//{ id: "Impossible/Cross 4",			elements: "          AccA   AABBAA  bC  Cb  bC  Cb  AABBAA   AccA          " },
	//{ id: "Impossible/Cross 5",			elements: "          AccA   AACCAA  bB  Bb  bB  Bb  AACCAA   AccA          " }
];

	function init() {
		if (store.has('level_pack_1')) {
			// allow custom levels only in full version

			var storedLevels = JSON.parse(localStorage.getItem("levels"));
			if (storedLevels) {
				_levels = storedLevels.concat(_levels);
				_categories.unshift('Custom');
			}
		}
	}

	function each(fn) {
		for (var i = 0; i < _levels.length; i++)
			fn(_levels[i]);
	}

	function get(index) {
		if (index === undefined || index === null)
			return null;
		else if (angular.isNumber(index))
			return _levels[index];
		else if (angular.isString(index)) {
			var _index = getIndex(index);
			return (_index > -1) ? _levels[_index] : null;
		}
		else if (angular.isArray(index)) {
		    var result = [];
			for (var i = 0; i < index.length; i++)
				result.push(get(index[i]));
			return result;
		}
		else
			return null;
	}

	function getCategory(index) {
		if (!store.has('level_pack_1') && index > 0)
			return null;
		else
			return _categories[index];
	}

	function getByCategory(category) {
		var levels = [];
		each(function(level){
			if (getCategoryFromId(level.id) === category)
				levels.push(level.id);
		});
		return levels;
	}

	function getIndex(id) {
		for (var i = 0; i < _levels.length; i++) {
			if (_levels[i].id === id)
				return i;
		}
		return -1;
	}

	function getCategoryIndex(category) {
		var length = levels.lengthCategories;
		for (var i = 0; i < length; i++) {
			if (getCategory(i) === category)
				return i;
		}
		return -1;
	}

	function saveCustomLevels() {
		var customLevels = get(getByCategory('Custom'));

		if (customLevels.length > 0)
			localStorage.setItem("levels", JSON.stringify(customLevels));
		else
			localStorage.removeItem("levels");
	}


	function getCategoryFromId(id) {
		if (id)
			return id.split('/')[0];
		else
			return null;
	}

	function getNameFromId(id) {
		if (id)
			return id.split('/')[1];
		else
			return 0;
	}

	function countElements(id, code) {
		if (!id) return 0;
		var data = get(id),
			elements = data.elements;
		var count = 0;
		for (var i = 0; i < elements.length; i++)
			if (code.indexOf(elements[i]) > -1)
				count++;
		return count;
	}

	function getMaxStars(id) {
		return countElements(id, 's123');
	}

	function getNextLevel(id){
		var index = getIndex(id);
		if (index > -1) {
			if (!store.has('level_pack_1') && index >= 15)
				return null;

			if (index < _levels.length - 1)
				return _levels[index + 1].id;
		}
		return null;
	}

	function addCustomLevel(data) {
		var customLevels = getByCategory('Custom');

		if (_categories[0] !== 'Custom')
			_categories.unshift('Custom');

		_levels.splice(customLevels.length, 0, data);
	}

	function deleteCustomLevel(id) {
		var index = getIndex(id);
		if (index > -1) {
			_levels.splice(index, 1);

			if (getByCategory('Custom').length == 0)
				_categories.splice(0, 1);
		}
	}

	init();

	var levels = {
		get: get,
		each: each,
		getCategory: getCategory,
		getByCategory: getByCategory,
		getIndex: getIndex,
		getCategoryIndex: getCategoryIndex,
		get length() { return (store.has('level_pack_1')) ? _levels.length : 16; },
		get lengthCategories() { return (store.has('level_pack_1')) ? _categories.length : 1; },
		getCategoryFromId: getCategoryFromId,
		getNameFromId: getNameFromId,
		countElements: countElements,
		getMaxStars: getMaxStars,
		getNextLevel: getNextLevel,
		addCustomLevel: addCustomLevel,
		deleteCustomLevel: deleteCustomLevel,
		saveCustomLevels: saveCustomLevels
	};

	tilt.levels = levels;

	return levels;
});


