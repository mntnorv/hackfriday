var SYMBOL_SIZE = 32;
var CELL_MARGIN = 2;
var CELL_SIZE = SYMBOL_SIZE + (CELL_MARGIN * 2);
var MATRIX_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

var Line = function(screenW) {
  this.obj = new PIXI.DisplayObjectContainer();
  this.randomize(screenW);
};

Line.prototype.addToContainer = function(container) {
  container.addChild(this.obj);
  this.container = container;
};

Line.prototype.removeFromContainer = function() {
  this.container.removeChild(this.obj);
};

Line.prototype.removeIfOutOfBounds = function(screenW, screenH) {
  var x = this.obj.position.x;
  var y = this.obj.position.y;
  var halfSize = this.obj.height / 2;

  if ((x > screenW + halfSize) || (y > screenH + halfSize)) {
    this.removeFromContainer();
    return true;
  } else {
    return false;
  }
};

Line.prototype.randomize = function(screenW) {
  var x = Math.floor(getRandom(0, screenW / CELL_SIZE)) * CELL_SIZE;
  this.obj.position.x = x;
  this.obj.position.y = 0;
  this.textNodes = [];
  this.speed = getRandom(2, 16);
  this.length = Math.floor(getRandom(10, 20));
  this.lastY = -1 * this.length * CELL_SIZE;

  this.yMovement = 0;

  for (var i = 0; i < this.length; i++) {
    this.newChar();
  }

  this.colorize();
};

Line.prototype.newChar = function() {
  var characterIndex = Math.floor(getRandom(0, MATRIX_CHARS.length));
  var character = MATRIX_CHARS.charAt(characterIndex);
  var textNode = new PIXI.BitmapText(character, {
    font: SYMBOL_SIZE + 'px MatrixCode',
    fill: 'green'
  });

  this.lastY += CELL_SIZE;

  textNode.position.x = CELL_MARGIN;
  textNode.position.y = this.lastY;
  this.textNodes.push(textNode);
  this.obj.addChild(textNode);
};

Line.prototype.removeFirst = function() {
  this.obj.removeChild(this.textNodes[0]);
  this.textNodes.shift();
};

Line.prototype.colorize = function() {
  var length = this.textNodes.length;

  for (var i = length - 1; i >= 0; i--) {
    var green = Math.floor((255 / length) * i);
    var color = green << 8;
    this.textNodes[i].children[0].tint = color;
  }
};

Line.prototype.nextFrame = function(screenW, screenH) {
  var y = this.lastY - CELL_SIZE * (this.length - 1);
  this.yMovement += this.speed;

  if (y > screenH) {
    this.randomize(screenW);
  } else if (this.yMovement >= CELL_SIZE) {
    this.yMovement -= CELL_SIZE;
    this.newChar();
    this.removeFirst();
    this.colorize();
  }
};

window.addEventListener('load', function() {
  var w = 0;
  var h = 0;
  var renderer = new PIXI.WebGLRenderer(w, h);

  document.body.appendChild(renderer.view);
  var stage = new PIXI.Stage;

  var background = new PIXI.DisplayObjectContainer();
  var foreground = new PIXI.DisplayObjectContainer();

  stage.addChild(background);
  stage.addChild(foreground);

  var hackContainer = new PIXI.DisplayObjectContainer();
  var hackText = 'HACK FRIDAY';
  var lines = [];

  function linesForWidth(width) {
    return width / CELL_SIZE / 2;
  }

  function removeAllLines() {
    for (var i = lines.length - 1; i >= 0; i--) {
      lines[i].removeFromContainer();
    }

    lines = [];
  }

  function generateLines(count) {
    for (var i = count - 1; i >= 0; i--) {
      var line = new Line();
      lines.push(line);
      line.addToContainer(background);
    }
  }

  function handleResize() {
    var newW = window.innerWidth;
    var newH = window.innerHeight;

    renderer.resize(newW, newH);
    renderer.view.style.width  = newW + 'px';
    renderer.view.style.height = newH + 'px';

    removeAllLines();
    generateLines(linesForWidth(newW));

    var hackPosX = Math.floor((newW / 2) / CELL_SIZE) * CELL_SIZE - Math.floor(hackText.length / 2) * CELL_SIZE;
    var hackPosY = Math.floor((newH / 2) / CELL_SIZE) * CELL_SIZE;
    hackContainer.position.x = hackPosX;
    hackContainer.position.y = hackPosY;

    w = newW;
    h = newH;
  }

  var loader = new PIXI.AssetLoader(['fonts/matrix.xml']);

  loader.onComplete = function() {
    var graphics = new PIXI.Graphics();
    graphics.beginFill(0x000000);
    graphics.drawRect(0, 0, CELL_SIZE * hackText.length, CELL_SIZE);
    hackContainer.addChild(graphics);
    
    for (var i = 0; i < hackText.length; i++) {
      var bitmapText = new PIXI.BitmapText(hackText.charAt(i), {
        font: SYMBOL_SIZE + 'px MatrixCode'
      });
      bitmapText.position.x = i * CELL_SIZE + CELL_MARGIN;
      bitmapText.children[0].tint = 0xFF0000;
      hackContainer.addChild(bitmapText);
    }

    foreground.addChild(hackContainer);

    handleResize();
  };

  loader.load();

  window.addEventListener('resize', debounce(handleResize, 100));

  function animateLines() {
    for (var i = lines.length - 1; i >= 0; i--) {
      lines[i].nextFrame(w, h);
    }
  }

  requestAnimationFrame(animate);

  function animate() {
    animateLines();
    renderer.render(stage);
    requestAnimationFrame(animate);
  }
});
