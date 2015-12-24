function Game(messagehandler) {

  this.messageHandler = messagehandler;
  this.inGame = false;
  this.score = 0;
  this.music = null;
  this.preferredVolume = 0.3;
  this.maxVolume = 1.0;

  this.init();
}

Game.prototype.init = function() {
  console.log("Called game.init()");
  this.initGame(null);
};

Game.prototype.initGame = function(msg) {
  console.log("initGame:", msg);

  if (null === msg) {
    console.log("create empty gameboard");
    this.gameArea = new GameArea();
  }
  else {
    this.worm = new Worm();
    this.gameArea = new GameArea();
    this.amountOfFood = 8;
    this.foods = [];
    this.food = new Food();
  }

  this.initGameboard();
  this.score = 0;

};

Game.prototype.playMusic = function(volume) {
  console.log("Game: playMusic");
  if (this.music === null) {
    console.log("Game: creating new audio instance");
    this.music = new Audio('../media/retro.ogg');
    if (typeof this.music.loop == 'boolean')
    {
      this.music.loop = true;
    }
    else
    {
      this.music.addEventListener('ended', function() {
        this.music.volume = this.preferredVolume;
        this.music.currentTime = 0;
        this.music.play();
      }, false);
    }
    this.music.volume = volume;
  }
  this.music.play();
};

Game.prototype.stopMusic = function() {
  console.log("Game: stopMusic");
  this.music.pause();
  this.music.duration = 0;
};

Game.prototype.initGameboard = function() {
  console.log("initGameboard");

  document.getElementById('gameboard').innerHTML = "";
  var gameboard = '<p id="score"></p>';
  // Create grid
  gameboard += '<table id="gamegrid">';
  for(var i=0; i<this.gameArea.height; i++) {
    gameboard += '<tr>'; // New row
    for(var j=0; j<this.gameArea.width; j++) {
      var id = (j+(i*this.gameArea.height));
      var grid = '<td id="' + id + '"></td>';
      gameboard += grid;
    }
    gameboard += '</tr>';
  }
  gameboard += '</table>';
  gameboard += "W = up, A = left, S = down, D = right";
  gameboard += "&nbsp;&nbsp;&nbsp;";
  gameboard += '<input id="start_game" type="submit" ' +
               'value="StartGame"' +
               ' onclick="messageHandler.game.startGame()">';

  document.getElementById('gameboard').innerHTML = gameboard;

  this.updateGameboard();
};

  Game.prototype.updateGameboard = function() {
  //console.log("updateGameboard");
  for(var i=0; i<this.gameArea.height; i++) {
    for(var j=0; j<this.gameArea.width; j++) {
      var id = (j+(i*this.gameArea.height));
      document.getElementById(id).bgColor = this.gameArea.color;
      document.getElementById(id).innerHTML = "";
    }
  }
};

Game.prototype.setFood = function() {
  // Check if any food is missing
  // Set foods to random positions
  while(this.foods.length < this.amountOfFood) {
    // A long worm may cause problems
    // TODO: better algorithm for finding empty slot for food
    var gameAreaSize = this.gameArea.height*this.gameArea.width;
    var x = Math.floor(Math.random()*gameAreaSize);
    if (document.getElementById(x).bgColor == this.gameArea.color) {
      this.foods.push(x);
      document.getElementById(x).bgColor = this.food.color;
    }
  }
};

Game.prototype.removeFood = function(cell) {
  //console.log("Remove food", cell);
  for (var x=0; x<this.foods.length; x++) {
    if (this.foods[x] == cell) {
      this.foods.splice(x, 1);
    }
  }
  // Generate new food
  this.setFood();

};

Game.prototype.updateMatch = function(msg) {
  //console.log("update match");

  this.updateGameboard();

  // Render worms
  for (var id=0; id<msg.worms.length; id++) {
    for (var x=0; x<msg.worms[id].location.length; x++) {
      document.getElementById(msg.worms[id].location[x]).bgColor= 
      msg.worms[id].color;
    }
  }

  // Render foods
  for (var i=0; i<msg.food.length; i++) {
    document.getElementById(msg.food[i].location).bgColor = 
    msg.food[i].color;
    // Iteration 5 onwards - the alphabets
    document.getElementById(msg.food[i].location).innerHTML = 
    msg.food[i].character.toUpperCase();
  }

  // Print the word that needs a translation 
  // (the translation is there too, don't cheat! :)
  // ... or why not make it visible in title?
  var from = msg.word['from'];
  var answer = msg.word['answer'];

  document.getElementById("score").innerHTML = "<strong>" + 
  from.toUpperCase() + " = " + answer.toUpperCase() + 
    "</strong><br />";
  for (var j=0; j<msg.worms.length; j++) {
    // A little trick to play audio when score is increased
    if (msg.worms[j].name == this.messageHandler.username && 
        this.score < msg.worms[j].score) {
      //console.log("play ding")
      document.getElementById('pick_audio').play();
      this.score = msg.worms[j].score;
    }
    var htmlSeparator = "&nbsp;&nbsp|&nbsp;&nbsp;";
    var separator = (j+1 != msg.worms.length) ?  
                    htmlSeparator : "";

    document.getElementById("score").innerHTML += 
      '<strong><font color="' + msg.worms[j].color + '">' +
      msg.worms[j].name +'</font></strong>';

    document.getElementById("score").innerHTML += ":&nbsp;" + 
      msg.worms[j].score + separator;

  }
  if (msg.phase == "INIT") {
    console.log("Match INIT");
    this.initGame(msg);
    this.playMusic(this.preferredVolume);
    this.inGame = true;
  }
  if (msg.phase == "END") {
    console.log("Match END");
    this.stopMusic();
    this.endGame();
  }
};

Game.prototype.startGame = function() {
  console.log("Game: startGame");
  var msg = messages.message.START_SINGLEPLAYER_GAME_REQ.new();
  msg.username = this.messageHandler.getUsername();
  this.messageHandler.send(msg);
};

Game.prototype.handleInput = function(event) {
  if(false === this.isRunning()) {
    console.log("handleInput: not in game");
    return false;
  }

  var direction = null;
  var input = event.which | event.keyCode | event.charCode;
  switch (input) {
    case 65:
    case 97:
    case 37:
    //console.log("A");
    direction = 'left';
    break;

    case 68:
    case 100:
    case 39:
    //console.log("D");
    direction = 'right';
    break;

    case 83:
    case 115:
    case 40:
    //console.log("S");
    direction = 'down';
    break;

    case 87:
    case 119:
    case 38:
    //console.log("W");
    direction = 'up';
    break;

    default:
    console.log(input);
    break;
  }

  //console.log("Game.handleInput", direction);
  
  if (direction !== null) {
    var msg = messages.message.USER_INPUT.new();
    msg.direction = direction;
    msg.username = this.messageHandler.getUsername();
    this.messageHandler.send(msg);
  }
};

Game.prototype.endGame = function() {
  this.inGame = false;
  this.stopMusic();
};

Game.prototype.isRunning = function() {
  return this.inGame;
};
