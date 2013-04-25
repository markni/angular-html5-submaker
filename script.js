var terminal = angular.module('terminal', []);


function TerminalControl($scope) {

    $scope.counter = -1;
    var timer;

    $scope.active = 0;
    $scope.source = 'Paste your source transcript here\nThis is the second line\nThis is the third line';
    $scope.lines = [];
    $scope.videoUrl = null;

    $scope.generated = false;
    $scope.hasBegun = false;
    $scope.generatedFiles = {};


    var v = document.getElementById('editingview');

    function convertSec(sec) {
        return parseInt(sec * 1000);
    }







    $scope.convert = function(milli, deli) {
        if (!deli) deli = ','
        var milliseconds = milli % 1000;
        var seconds = Math.floor((milli / 1000) % 60);
        var minutes = Math.floor((milli / (60 * 1000)) % 60);

        return zeroFill(minutes, 2) + ":" + zeroFill(seconds, 2) + deli + zeroFill(milliseconds, 3);
    }

    $scope.currentPlayTime = "00:00.0000";

    $scope.navigatedTo = function(start, i, milli, autoplay) {
        if (start) {
            $scope.counter = i - 1;
        }
        else {
            $scope.counter = i;
        }
        return navigatedTo(milli, autoplay);
    }

    function navigatedTo(milli, autoplay) {

        v.currentTime = milli / 1000;
        autoplay && v.play();

    }

    $scope.openFileSelector = function() {
        var fileSelector = document.getElementById('fileSelector');
        performClick(fileSelector);
    }

    function performClick(node) {
        var evt = document.createEvent("MouseEvents");
        evt.initEvent("click", true, false);
        node.dispatchEvent(evt);
    }


    function zeroFill(number, width) {
        var fillZeroes = "00000000000000000000";
        var input = number + ""; // make sure it's a string
        return (fillZeroes.slice(0, width - input.length) + input);
    }


    $scope.jsonOutput = function(json) {
        console.log('json');
        return angular.toJson(json, true);
    }
    $scope.createTrack = function(array) {
        var track;
        if (v.textTracks && v.textTracks[0]){
            console.log('has old cues!'); //clear old tracks
            track = v.textTracks[0];
            if (track.cues){
                var len = track.cues.length;
                for (var i =0;i<len;i++){
                    track.cues && track.cues[0] && track.removeCue(track.cues[0]);
                }    
            }
            
        }
        else{
            console.log('no old cues!');
            track = v.addTextTrack("subtitles");    
        }
        
        if (isNaN(v.textTracks[0].mode)) {
            track.mode = "showing";
        }
        else {
            track.mode = 2;
        }
         
        for (var i = 0; i < array.length; i++) {
            
            var begin = array[i].begin / 1000;
            var next  = (array[i + 1] === undefined) ? (v.duration || 0) : (array[i + 1].begin) / 1000;
            next = next ? next - 0.001 : next;
            
            var end = (array[i].end) ? (array[i].end / 1000) : next;
            
            var text = array[i].words;
            
            if (begin && end && text){
                track.addCue(createCue(begin, end, text));
                console.log('addCue: ' + text +' ' + begin + ' --> ' + end);
            }
        }


    }

    function createCue(start, end, text) {
        var cue;
        if (isNaN(v.textTracks[0].mode)) {
            cue = new TextTrackCue(start, end, text);
        }
        else {
            cue = new TextTrackCue(text, start, end, '', '', '', true);
        }
        return cue;
    };

    $scope.vttOutput = function(array) {
        var output = "WEBVTT\n\n";
        for (var i = 0; i < array.length; i++) {
            output += i + 1;
            output += '\n';
            //debugger;
            output += $scope.convert(array[i].begin, '.') + ' --> ';

            var next = (array[i + 1] === undefined) ? convertSec(v.duration || 0) : array[i + 1].begin;
            if (next === undefined) debugger;
            next = next ? next - 1 : next;
            output += $scope.convert((array[i].end) ? (array[i].end) : next, '.');
            output += '\n';
            output += array[i].words;
            output += '\n\n';
            


            
        }
        $scope.generatedFiles.vtt = output;
        $scope.createTrack(array);
        return output;
    }

    $scope.srtOutput = function(array) {

        var output = "";
        for (var i = 0; i < array.length; i++) {
            output += i + 1;
            output += '\n';
            //debugger;
            output += $scope.convert(array[i].begin) + ' --> ';

            var next = (array[i + 1] === undefined) ? convertSec(v.duration || 0) : array[i + 1].begin;
            if (next === undefined) debugger;
            next = next ? next - 1 : next;

            output += $scope.convert((array[i].end) ? (array[i].end) : next);
            output += '\n';
            output += array[i].words;
            output += '\n\n';
        }
        $scope.generatedFiles.srt = output;
        return output;
    }

    $scope.begin = function(e) {
        if ($scope.counter >= $scope.lines.length - 1) {
            return false;
        }
        $scope.counter++;
        //$scope.lines[counter].begin = Date.now() - timer; 

        $scope.lines[$scope.counter].begin = parseInt(v.currentTime * 1000);
    }

    $scope.end = function(e) {
        if ($scope.counter > $scope.lines.length - 1) {
            return false;
        }
        //$scope.lines[counter].end = Date.now() - timer; 
        $scope.lines[$scope.counter].end = parseInt(v.currentTime * 1000);
        if ($scope.counter == $scope.lines.length - 1) {
            $scope.counter++;

        }
    }

    $scope.start = function(e) {
        v.currentTime = 0;
        v.play();
        //document.getElementById('demo').play()
        timer = Date.now();
        $scope.hasBegun = true;
    }

    $scope.handleKeypress = function(e) {

        e.preventDefault();
        e.stopPropagation();
        if (e.which == 32) {

            $scope.begin();

        }
        else if (e.which === 115) {

            $scope.end();
            //s
        }
        else if (e.which === 13) {
            //s
            $scope.start();

        }
        $scope.$apply();
    };

    $scope.percentage = function(time) {
        return (time / convertSec(v.duration)) * 100
    }

    $scope.generate = function() {


        $scope.counter = -1
        $scope.lines = [];
        var raw = $scope.source.split('\n');
        for (var i = 0; i < raw.length; i++) {
            if (raw[i].trim() !== "") {
                $scope.lines.push({
                    words: raw[i],
                    begin: 0,
                    end: 0
                })
            }

        }

        $scope.generated = true;
        $scope.active = 2;


    }

    $scope.remove = function(i) {

        $scope.lines.splice(i, 1);
    }

    $scope.add = function(i) {
        v.pause();
        $scope.lines.splice(i + 1, 0, {
            words: "@",
            begin: parseInt(v.currentTime*1000) ||0,
            end: 0
        });
    }


    $scope.pause = function() {
        v.pause();
    }

    $scope.download = function(type) {

        var blob = new Blob([$scope.generatedFiles[type]], {
            type: "text/plain;charset=utf-8"
        });
        saveAs(blob, "Friday" + "." + type);
    }

    function stopEvent(e) {
        if (e.preventDefault) e.preventDefault();
    }

    $scope.onFileSelected = function(e) {
        var f = this.files[0];
        var fileURL = URL.createObjectURL(f);
        $scope.videoUrl = fileURL;
        $scope.$apply();


    }

    $scope.onDrop = function(e) {


        stopEvent(e);
        var f = e.dataTransfer.files[0];

        var fileURL = URL.createObjectURL(f);

        $scope.videoUrl = fileURL;
        $scope.$apply();


    }

    $scope.onDragOver = function(e) {
        stopEvent(e);
        e.dataTransfer.dropEffect = 'copy';
        $scope.onDrag = true;
        $scope.$apply();
        return false;
    }

    $scope.onDragLeave = function(e) {
        stopEvent(e);
        $scope.onDrag = false;
        $scope.$apply();
        return false;
    }

    $scope.onDragbegin = function(e) {
        stopEvent(e);
        e.dataTransfer.dropEffect = 'copy';
        return false;

    }

    $scope.setToCurrentTime = function(i,target){
       $scope.lines[i][target] = parseInt(v.currentTime *1000);  
        
    }

    $scope.back = function(i, target) {
        if ($scope.lines[i][target] && $scope.lines[i][target] - 100 >= 0) {
            $scope.lines[i][target] -= 100;
            navigatedTo($scope.lines[i][target], true);
        }

    }

    $scope.forward = function(i, target) {
        $scope.lines[i][target] += 100;
        navigatedTo($scope.lines[i][target], true);

    }

    $scope.onTimeUpdate = function() {
        $scope.currentPlayTime = $scope.convert(parseInt(v.currentTime * 1000), '.');
        $scope.$apply();
    }






}


terminal.directive('onKeypress', function($parse) {
    return function(scope, elm, attrs) {
        //Evaluate the variable that was passed
        //In this case we're just passing a variable that points
        //to a function we'll call each keyup
        var keypressFn = $parse(attrs.onKeypress);
        elm.bind('keypress', function(evt) {
            //$apply makes sure that angular knows 
            //we're changing something
            //scope.$apply(function() {
            keypressFn(scope, {
                $event: evt
            });
            //});
        });
    };
});


terminal.directive("dropZone", function() {
    return function(scope, elm) {

        elm.bind('dragover', scope.onDragOver);

        elm.bind('dragenter', scope.onDragbegin);

        elm.bind('dragleave', scope.onDragLeave);

        elm.bind('drop', scope.onDrop);

    }

});

terminal.directive('fileSelector', function() {
    return function(scope, elm) {
        elm.bind('change', scope.onFileSelected);
    }

})


