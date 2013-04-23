var terminal = angular.module('terminal', []);


function TerminalControl($scope) {
  
    $scope.counter = -1;
    var timer;
    
    $scope.source = 'Paste your source transcript here';
    $scope.lines = [];
    
    $scope.generated = false;
    $scope.hasBegun = false;
    $scope.generatedFiles = {};
    
    var v = document.getElementById('demo');
    
    function convertSec(sec){
      return parseInt(sec * 1000);
    }
    
    $scope.convert = function(milli,deli){
      if (!deli) deli = ','
      var milliseconds = milli % 1000;
      var seconds = Math.floor((milli / 1000) % 60);
      var minutes = Math.floor((milli / (60 * 1000)) % 60);
      
      return zeroFill(minutes,2) + ":" + zeroFill(seconds,2) + deli + zeroFill(milliseconds,3);
    }
    
    
    function zeroFill(number, width) {
      var fillZeroes = "00000000000000000000";
      var input = number + "";  // make sure it's a string
      return(fillZeroes.slice(0, width - input.length) + input);
    }
    
    
    $scope.jsonOutput = function(json){
        return angular.toJson(json,true); 
    }
    
    $scope.vttOutput = function(array){
      var output = "WEBVTT\n\n";
      for (var i=0; i<array.length; i++){
        output += i+1;
        output += '\n';
        //debugger;
        output += $scope.convert(array[i].start,'.') + ' --> ';
        
        var next = (array[i+1]===undefined) ? convertSec(v.duration) : array[i+1].start ;
        if (next === undefined) debugger;
        next = next? next -1 : next;
        console.log('next: ' + next);
        output += $scope.convert((array[i].end)?(array[i].end):next,'.');
        output += '\n';
        output += array[i].words;
        output += '\n\n';
      }
      $scope.generatedFiles.vtt = output;
      return output;  
    }

    $scope.srtOutput = function(array){
      console.log(array);
      var output = "";
      for (var i=0; i<array.length; i++){
        output += i+1;
        output += '\n';
        //debugger;
        output += $scope.convert(array[i].start) + ' --> ';
        
        var next = (array[i+1]===undefined) ? convertSec(v.duration) : array[i+1].start ;
        if (next === undefined) debugger;
        next = next? next -1 : next;
        console.log('next: ' + next);
        output += $scope.convert((array[i].end)?(array[i].end):next);
        output += '\n';
        output += array[i].words;
        output += '\n\n';
      }
      return output;
    }
    
    $scope.start = function(e){
        if($scope.counter >= $scope.lines.length-1){
          return false;
        }
        $scope.counter++;
        //$scope.lines[counter].start = Date.now() - timer; 
  
        $scope.lines[$scope.counter].start = parseInt(v.currentTime * 1000);
    }
    
    $scope.end = function(e){
        if ($scope.counter > $scope.lines.length-1){
          return false;
        }
     //$scope.lines[counter].end = Date.now() - timer; 
        $scope.lines[$scope.counter].end = parseInt(v.currentTime * 1000);
        if($scope.counter == $scope.lines.length-1){
          $scope.counter++;
          
        }
    }
    
    $scope.begin = function(e){
      v.currentTime = 0;
      v.play();
      //document.getElementById('demo').play()
      timer = Date.now();
      $scope.hasBegun = true;
    }

    $scope.handleKeypress = function(e) {

      e.preventDefault(); 
      e.stopPropagation();
      if (e.which == 32){

        $scope.start();
       
      }
      else if (e.which === 115){
      
        $scope.end();
        //s
      }
      else if (e.which === 13){
        //s
        $scope.begin();
        
      }
       $scope.$apply();
    };
    
    $scope.percentage = function(time){
        console.log(time);
        console.log(convertSec(v.duration));
        return (time / convertSec(v.duration)) * 100
    }
    
    $scope.generate = function() {


      $scope.counter = -1
      $scope.lines = [];
      var raw = $scope.source.split('\n');
      for (var i = 0;i<raw.length;i++){
        if (raw[i].trim() !== ""){
            $scope.lines.push({words:raw[i],start:0,end:0})       
        }
         
      }
      
      $scope.generated = true;
      console.log($scope.lines);

    }
    
    $scope.remove = function(i){
      console.log('remove:' + i);
      $scope.lines.splice(i,1);
    }
    
    $scope.pause = function(){
      v.pause();
    }
    
    $scope.download = function(type){

        var blob = new Blob([$scope.generatedFiles[type]], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "Friday"+"."+type);
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
                keypressFn(scope, {$event: evt});
            //});
        });
    };
});