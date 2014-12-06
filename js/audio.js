/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

tiltApp.factory('audio', function() {

    var _sounds = {},
        _soundVolume = 1,
        _soundMuted = false,
		_musicMuted = false,
        _gain,
        audioContext;

    function init() {
		_soundMuted = (localStorage['soundMuted'] == 'true') || false;
		_musicMuted = (localStorage['musicMuted'] == 'true') || false;

        if('webkitAudioContext' in window) {
            //noinspection JSUnresolvedFunction
            audioContext = new webkitAudioContext();
            console.log('using webkitAudioContext');
            _gain = audioContext.createGain();
            _gain.gain.value = (_soundMuted) ? 0 : _soundVolume;
           _gain.connect(audioContext.destination);
        }
    }

    /*function load(url, id, settings) {
        window.setTimeout(_load, 10, url, id, settings);
    }*/

    function load(url, id, settings) {
        settings = settings || {
            audios: null,
            buffer: null,
            volume: 1,
            streaming: false,
            loop: false,
            delayIfPlayed: null,
            lastTimePlayed: 0
        };
        settings.volume = settings.volume || 1;
        _sounds[id] = settings;

        if (audioContext && !settings.streaming) {
            var request = new XMLHttpRequest();

            if (!request) {
                console.log('Could not create XMLHttpRequest.');
                return false;
            }

            tilt.preloadCounter += 1;

            // the third parameter is "async". Setting this to false because Phonegap does not support it:
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            request.timeout = 1000;

            request.addEventListener('load', function(event) {
//                if (event.target.status == 200 && event.target.response) {
                if (event.target.response) {
					audioContext.decodeAudioData(event.target.response, function onSuccess(decodedBuffer) {
						settings.buffer = decodedBuffer;
						console.log('loaded sound resource ' + url);
					}, function onFailure(){
						console.log('ERROR: decoding audio buffer failed: resource ' + url);
					});
                }
                else
                    console.log('ERROR: could not load sound resource ' + url);
                tilt.preloadedCounter += 1;
            }, false);

            request.addEventListener('error', function(event) {
                console.log('could not load sound resource');
                tilt.preloadedCounter += 1;
            }, false);

            request.send();
        }
        else {
            var audio = new Audio(url);
            audio.loop = settings.loop;
            settings.audios = [];
            settings.audios.push(audio);
            console.log('created audio element with source "' + url);
        }
    }

    function play(id) {
        var setting = _sounds[id];

		if ((setting.streaming && _musicMuted) || (!setting.streaming && _soundMuted))
			return;

        var timeStamp = Date.now();

        if (setting.delayIfPlayed && (timeStamp - setting.lastTimePlayed < setting.delayIfPlayed)) {
            window.setTimeout(play, setting.delayIfPlayed, id);
            return;
        }
        else if (timeStamp - setting.lastTimePlayed < 5) {
            // prevent the same sound from being played again at the same time:
            return;
        }

        setting.lastTimePlayed = timeStamp;

        if (audioContext && setting.buffer) {
            var source = audioContext.createBufferSource();
            source.buffer = setting.buffer;
            source.connect(_gain);
            source.start(0);
            //console.log('playing sound ', id);
        }
        else {

           var audio;

            if (setting.audios) {
                var l = setting.audios.length;
                for (var i = 0; i < l; i++) {
                    var a = setting.audios[i];
                    if (a.paused || a.ended) {
                        audio = a;
                    }
                }


                if (!audio && !setting.streaming) {
                    audio = new Audio(setting.audios[0].src);
                    setting.audios.push(audio);
                  //  console.log('additional audio created');
                }

                if (audio) {
                    audio.volume = setting.volume;

					audio.play();
                        //console.log('playing sound ', id);
                }
            }
            else
                console.log('No audio with id "' + id + '" preloaded');
        }
    }

   /* function _setVolume(value) {
        _volume = value;
        if (audioContext) {
            _gain.gain.value = _volume;
        }

        for (var id in _audios) {
            var l = _audios[id].length;
            for (var i = 0; i < l; i++) {
                //_audios[id][i].volume = _volume;
                _audios[id][i].muted = !_volume;

            }
        }
    }*/

	function _setSoundMuted(value) {

		if (value && window.plugins && window.plugins.testFlight) {
			window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Muted Sounds');
		}

		_soundMuted = value;
		localStorage['soundMuted'] = value.toString();
		if (audioContext) {
			_gain.gain.value = (_soundMuted) ? 0 : _soundVolume;
		}
		else {
			// fallback if there is no audioContext:

			for (var id in _sounds) {
				var sound = _sounds[id];
				if (sound.audios && !sound.streaming) {
					var l = sound.audios.length;
					for (var i = 0; i < l; i++) {
						var audio = sound.audios[i];
						//audio.muted = _muted;

						// muted does not work on iOS. pause and play the sound instead:
						if (_soundMuted) {
							audio.pause();
						}
						else if (audio.loop)
							audio.play();
					}
				}
			}
		}
	}

	function _setMusicMuted(value) {

		if (value && window.plugins && window.plugins.testFlight) {
			window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Muted Music');
		}

		_musicMuted = value;
		localStorage['musicMuted'] = value.toString();

		for (var id in _sounds) {
			var sound = _sounds[id];
			if (sound.audios && sound.streaming) {
				var l = sound.audios.length;
				for (var i = 0; i < l; i++) {
					//_audios[id][i].volume = _volume;
					var audio = sound.audios[i];
					//audio.muted = _muted;

					// muted does not work on iOS. pause and play the sound instead:
					if (_musicMuted) {
						audio.pause();
					}
					else if (audio.loop)
						audio.play();
				}
			}
		}
	}

	init();

    var audio = {
        load: load,
        play: play,
		get soundMuted() { return _soundMuted; },
		set soundMuted(value) { _setSoundMuted(value); },
		get musicMuted() { return _musicMuted; },
		set musicMuted(value) { _setMusicMuted(value); }
    };

	tilt.audio = audio;

	return audio;
 });