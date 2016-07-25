window.requestAnimFrame = ( function() {
	return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				function( callback ) {
					window.setTimeout( callback, 1000 / 60 );
				};
})();
alert('Controls: \n \n W to go accelerate, \n A and D to turn, \n Click to fire, \n 1 to spawn enemies, \n E to fire missile');


/*objects*/
function Ball(argx, argy){
  this.x = argx;
  this.y = argy;
  this.speeding = false;
  this.radius = 10;
  this.angle = 45;
  this.speed = 0;
  this.maxSpeed = 5;
  this.turnSpeed = 0;
  this.maxTurnSpeed = 3;
  this.health = 10;
  this.maxHealth = 10;
  this.missileCooldown = 6*TIME.SECOND;
  this.lastMissile = new Date().getTime()-this.missileCooldown;
}
Ball.prototype = {
  update : function () {
    var rads = this.angle * Math.PI / 180;
    if(this.speeding){
      this.x += Math.cos(rads) * this.speed;
      this.y += Math.sin(rads) * this.speed;
    }else{
      this.decel();
      this.x += Math.cos(rads) * this.speed;
      this.y += Math.sin(rads) * this.speed;
    }
    if(this.x < 0){ this.x = WIDTH; }
    if(this.x > WIDTH){ this.x = 0; }
    if(this.y < 0){ this.y = HEIGHT; }
    if(this.y > HEIGHT){this.y = 0; }
    this.angle += this.turnSpeed;
    if(this.health <= 0){
      return 0;
    }
    return 1;
  },
  accel : function () {
    this.speeding = true;
    if(this.speed < this.maxSpeed){
      this.speed += 0.1;
    }else if(this.speed > this.maxSpeed){
      this.speed = this.maxSpeed;
    }
  },
  decel: function () {
    if(this.speed > 0){
      this.speed -= 0.1;
    }else if(this.speed < 0){
      this.speed += 0.1;
    }
  },
  takeDamage(arg){
    if(!arg){ arg = 1; }
    this.health -= arg;
  },
  heal: function(arg) {
    if(!arg){arg = 1; }
    if(this.health + arg > this.maxHealth){
      this.health = this.maxHealth;
    }else{
      this.health += arg;
    }
  },
  turn : function(arg){
    if(arg == "l"){this.turnSpeed = -this.maxTurnSpeed; }
    else{this.turnSpeed = this.maxTurnSpeed; }
  },
  stopTurning : function(){
    this.turnSpeed = 0;
  },
  getIndicator: function() {
    var point =  { x:0, y:0 };
    var rads = this.angle * Math.PI / 180;
    point.x = this.x + (Math.cos(rads) * 10);
    point.y = this.y + (Math.sin(rads) * 10);
    return point;
  },
  fire : function(arg){
    if(arg){
      var ang = calcAngle(mouse, this);
      var rad = ang * Math.PI / 180;
      var pt = {x: this.x + Math.cos(rad)* 25, y: this.y + Math.sin(rad)*25 };
      var angle = calcAngle(mouse, this);
      projectiles.push(new Projectile(angle, pt.x, pt.y, false));
      return;
    }
    projectiles.push(new Projectile(this.angle, pt.x, pt.y, 1, false));

  },
  draw: function(pctx){
    var tmp = pctx.fillStyle;
    var sstmp = pctx.strokeStyle;
    pctx.fillStyle = COLORS.WHITE;
    pctx.beginPath();
    pctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    pctx.fill();
    pctx.closePath();
    pctx.moveTo(this.x, this.y);
    var point = this.getIndicator();
    pctx.strokeStyle = COLORS.BLACK;
    pctx.lineTo(point.x, point.y);
    pctx.stroke();
    /*healthbar*/
    var barlen = 50
    pctx.fillStyle = COLORS.RED;
    pctx.fillRect(this.x-(barlen/2),this.y-(this.radius + 30), barlen, 8);
    pctx.fillStyle = COLORS.BLUE;
    pctx.fillRect(this.x-(barlen/2),this.y-(this.radius + 30), barlen*(this.health/this.maxHealth), 8);
    pctx.fillStyle = tmp;
    /*cursor*/
    var ang = calcAngle(mouse, this);
    var rad = ang * Math.PI / 180;
    var pt = {x: this.x + Math.cos(rad)* 30, y: this.y + Math.sin(rad)*30 };
    var pt2 = {x: this.x + Math.cos(rad)* 25, y: this.y + Math.sin(rad)*25 };

    var msang = calcAngle(mouse, this);
    var osPt = {
      x: pt2.x + Math.cos(msang*Math.PI/180)*10000,
      y: pt2.y + Math.sin(msang*Math.PI/180)*10000
    }
    pctx.beginPath();
    pctx.strokeStyle = "hsla(0, 100%, 33%, 0.35)";
    pctx.moveTo(pt2.x, pt2.y);
    pctx.lineTo(osPt.x, osPt.y);
    pctx.stroke();

    pctx.beginPath();
    pctx.moveTo(pt.x, pt.y);
    pctx.lineTo(pt2.x, pt2.y);
    pctx.arc(this.x, this.y, 10 + this.radius, rad-(Math.PI/5), rad+(Math.PI/5));
    pctx.lineTo(pt2.x, pt2.y);


    pctx.strokeStyle = "#FFFFFF";
    pctx.stroke();
    pctx.closePath();

    pctx.strokeStyle = sstmp;

  },
  missile: function () {
    if(new Date().getTime() - this.lastMissile > this.missileCooldown){
      missiles.push(new Missile(this.x, this.y, 7, false));
      this.lastMissile = new Date().getTime();
    }
  }
}

function Projectile(angle, startx, starty, damage, hostile){
  if(!damage){damage = 1; }
  this.x = startx;
  this.y = starty;
  this.damage = damage;
  this.hostile = hostile;
  this.speed = 6;
  this.Mspeed = 10;
  this.angle = angle;
  this.trail = [];
  var maxTrail = 3;
  while(maxTrail--){
    this.trail.push([this.x, this.y]);
  }
  AUDIO.Lazer.cloneNode(true).play();
}
Projectile.prototype = {
  update: function() {
    if(this.speed < this.Mspeed){this.speed += 0.1; }
    this.trail.pop();
    this.trail.unshift([this.x, this.y]);
    var  rad = this.angle * Math.PI / 180;
    this.x += Math.cos(rad) * this.speed;
    this.y += Math.sin(rad) * this.speed;
    if(this.hostile){
      if( dist(player, this) <= 10 ){
        this.hit();
        player.takeDamage(this.damage);
        projectileRemove(this);
        return 0;
      }
    } else {
      var i = enemies.length;
      while(i--){
        if(dist(this, enemies[i]) < enemies[i].size){
          this.hit();
          enemies[i].takeDamage(1);
          projectileRemove(this);
          return 0;
        }
      }
    }
    return 1;
  },
  draw: function(pctx){
    var tmp = pctx.strokeStyle;
    pctx.strokeStyle="#FF0000";
    pctx.beginPath();
    pctx.moveTo(this.trail[this.trail.length - 1][0], this.trail[this.trail.length - 1][1]);
    pctx.lineTo(this.x, this.y);
    pctx.stroke();
    pctx.strokeStyle = tmp;
  },
  hit: function(){
    for(i = 0; i<360; i+=20){
      particles.push(new Particle(i, this.x, this.y));
    }
    AUDIO.Hit.cloneNode(true).play();
  }
};

function Missile(x, y, damage, hostile){
  if(!x && !y){x = player.x; y = player.y; hostile = false;}
  this.x = x;
  this.y = y;
  this.angle = rand(0, 360);
  this.speed = 5;
  this.speedDecay = 0.98;
  this.damage = damage;
  this.armtime = 3*TIME.SECOND;
  this.detRadius = 3;
  this.spawntime = new Date().getTime();
  this.explRadius = 150;
  this.mtimeout = 5*TIME.SECOND;
  this.timeArmed = 0;
  this.armed = false;
  this.trail = [];
  this.ltrail = 5;
  AUDIO.Missile.cloneNode(true).play();
};
Missile.prototype = {
  update: function () {
    if(this.x < 0 || this.x > WIDTH || this.y < 0  || this.y > HEIGHT){
      missileRemove(this);
      return 0;
    }
    if(!this.armed){
      if(new Date().getTime() - this.spawntime > this.armtime && enemies.length != 0){
        this.armed = true;
        this.timeArmed = new Date().getTime();
        this.speed = 5;
        while(this.ltrail--){
          this.trail.push({x:this.x, y:this.y});
        }
      }
      this.speed *= this.speedDecay;
    }
    else {
      //missile is armed and ready
      if(enemies.length == 0){
        missileRemove(this);
        //explode!
        for(i = 0; i<360; i+=15){
          particles.push(new BigParticle(i, this.x, this.y));
        }
        AUDIO.Explosion.cloneNode(true).play();
        return 0;
      }
      if(new Date().getTime() - this.timeArmed > this.mtimeout){
        missileRemove(this);
        return 0;
      }
      this.angle = calcAngle(minDist(this, enemies), this);
    }
    if(enemies.length != 0){
      var closest = minDist(this, enemies);
      if(dist(this, closest) < this.detRadius + closest.size){
        var n = enemies.length;
        var tdist;
        while(n--){
          tdist = dist(this, enemies[n]);
          if(tdist < (this.explRadius + enemies[n].size)/3){
            enemies[n].takeDamage(this.damage*2);
          }else if(tdist < (this.explRadius + enemies[n].size)/2){
            enemies[n].takeDamage(this.damage);
          }else if(tdist < (this.explRadius + enemies[n].size)/2){
            enemies[n].takeDamage(Math.floor(this.damage/2));
          }
        }
        //EXPLODE!!!
        for(i = 0; i<360; i+=15){
          particles.push(new BigParticle(i, this.x, this.y));
        }
        AUDIO.Explosion.cloneNode(true).play();
        missileRemove(this);
        return 0;
      }
    }
    this.trail.pop();
    this.trail.unshift({x:this.x, y:this.y});
    this.x += Math.cos(this.angle*Math.PI/180)*this.speed;
    this.y += Math.sin(this.angle*Math.PI/180)*this.speed;
    return 1;
  },
  draw: function (pctx) {
    pctx.fillStyle = COLORS.GREY;
    if(this.armed){
      pctx.beginPath();
      var i  = this.trail.length;
      pctx.moveTo(this.trail[i-1].x, this.trail[i-1].y);
      while(i--){
        pctx.arc(this.trail[i].x, this.trail[i].y, 5-i, 0, 2*Math.PI);
      }
      var tmp = pctx.strokeStyle;
      pctx.fillStyle = COLORS.GREY;
      pctx.fill();
      pctx.strokeStyle = tmp;
    }
    pctx.fillStyle = COLORS.CYAN;
    var pt1 = {
      x: this.x + Math.cos(this.angle*Math.PI/180)*10,
      y: this.y + Math.sin(this.angle*Math.PI/180)*10
    };
    var pt2 = {
        x: this.x + Math.cos((this.angle+90)*Math.PI/180)*2,
        y: this.y + Math.sin((this.angle+90)*Math.PI/180)*2
    }
    var pt3 = {
        x: this.x + Math.cos((this.angle+280)*Math.PI/180)*6,
        y: this.y + Math.sin((this.angle+280)*Math.PI/180)*6
    }
    var pt4 = {
        x: this.x + Math.cos( (this.angle+270)*Math.PI/180) * 2,
        y: this.y + Math.sin( (this.angle+270)*Math.PI/180) * 2
    }
    pctx.beginPath();
    pctx.moveTo(pt1.x, pt1.y);
    pctx.lineTo(pt2.x, pt2.y);
    pctx.lineTo(pt3.x, pt3.y);
    pctx.lineTo(pt4.x, pt4.y);
    pctx.closePath();
    pctx.fill();
  }
}

function Enemy(argc){
  var spawn = Math.random();
  if(spawn <= 0.24){
    this.x = 0;
    this.y = Math.random() * HEIGHT;
  }
  else if(spawn >= 0.25 && spawn <= 0.49){
    this.x = WIDTH;
    this.y = Math.random() * HEIGHT;
  }
  else if(spawn >= 0.5 && spawn <= 0.74){
    this.y = 0;
    this.x = Math.random() * WIDTH;
  }
  else{
    this.y = HEIGHT;
    this.x = Math.random() * WIDTH;
  }
  this.angle = this.calcAngle(player);
  this.speed=1;
  this.lastshot = 0;
  this.fullCD = 1000;
  this.size = rand(5, 15);
  this.health = 5 + this.size;
  this.maxHealth = this.health;
}
Enemy.prototype = {
  calcAngle: function(entity){
    var dx = entity.x - this.x;
    var dy = entity.y - this.y;
    var theta = Math.atan2(dy, dx);
    return theta * 180 / Math.PI;
  },
  update: function(){
    this.angle = this.calcAngle(player);
    var rad = this.angle * Math.PI / 180;
    if(dist(this, player) > 100){
      this.x += Math.cos(rad) * this.speed;
      this.y += Math.sin(rad) * this.speed;
    } else {
      this.x -= Math.cos(rad) * this.speed;
      this.y -= Math.sin(rad) * this.speed;
    }
    if(dist(this, player) < 1000  ){
      this.shoot();
    }
    if(this.health < 1){
      enemyRemove(this);
      if(rand(0, 40) < 10){
        pickups.push(new HealthPack(Math.floor(this.maxHealth/4),this.x, this.y));
      }
      return 0;
    }
    return 1;
  },
  shoot: function () {
    var date = new Date();
    if(date.getTime()-this.lastshot < this.fullCD){return; }
    projectiles.push(new Projectile(this.angle  , this.x, this.y, 1, true));
    this.lastshot = date.getTime();
  },
  getIndicator: function() {
    var point =  { x:0, y:0 };
    point.x = this.x + (Math.cos(this.rads) * 10);
    point.y = this.y + (Math.sin(this.rads) * 10);
    return point;
  },
  takeDamage: function(arg) {
    if(!arg){arg = 1; }
    this.health -= arg;
  },
  draw: function(pctx){
    var tmp = pctx.fillStyle;
    pctx.fillStyle = COLORS.WHITE;
    pctx.beginPath();
    pctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
    pctx.fill();
    pctx.fillStyle = COLORS.RED;
    pctx.fillRect(this.x-10,this.y-(this.size+10), 20, 5);
    pctx.fillStyle = COLORS.GREEN;
    pctx.fillRect(this.x-10,this.y-(this.size+10), 20*this.health/this.maxHealth, 5);
    pctx.fillStyle = tmp;
  }
};

function BigParticle(seedAngle, px, py) {
  this.x = px;
  this.y = py;
  this.speed = 4;
  this.hue = rand(0, 50);
  this.frict = rand(0.90, 0.95);
  this.alpha = 1;
  this.decay = rand(0.005, 0.01);
  var trailcrds = 3;
  this.trail = [];
  while(trailcrds--){
    this.trail.push([this.x, this.y]);
  }
  var anglejitter = rand(40, 50);
  this.angle = rand(-seedAngle - anglejitter, -seedAngle + anglejitter);
};
BigParticle.prototype = {
  update: function(){
    this.trail.pop();
    this.trail.unshift([this.x, this.y]);

    this.speed *= this.frict;
    var rads = this.angle * Math.PI / 180;
    this.x += Math.cos(rads) * this.speed;
    this.y += Math.sin(rads) * this.speed;

    this.alpha -= this.decay;
    if(this.alpha <= this.decay){
      particleRemove(this);
      return 0;
    }
    return 1;
  },
  draw: function(pctx) {
    var tmp = pctx.strokeStyle;
    pctx.beginPath();
    pctx.moveTo(this.trail[this.trail.length-1][0], this.trail[this.trail.length-1][1]);
    pctx.lineTo(this.x, this.y);
    pctx.strokeStyle = "hsla(" + this.hue + ", 100%, 50%, "+ this.alpha + ")";
    pctx.stroke();
    pctx.beginPath();
    var tmp2 = pctx.fillStyle;
    pctx.fillStyle = "hsla(" + this.hue + ", 100%, 50%, "+ this.alpha + ")";
    pctx.arc(this.x, this.y, 5, 0, 2*Math.PI);
    pctx.fill();
    pctx.fillStyle = tmp2;
  }
};

function Particle(seedAngle, px, py){
  this.x = px;
  this.y = py;
  this.speed = 2;
  this.frict = rand(0.90,0.95);
  this.hue = rand(10, 61);
  this.alpha = 1;
  this.decay = rand(0.001, 0.05);
  var trailcrds = 6;
  this.trail = [];
  while(trailcrds--){
    this.trail.push([this.x, this.y]);
  }
  var anglejitter = rand(40, 50);
  this.angle = rand(-seedAngle - anglejitter, -seedAngle + anglejitter);

};
Particle.prototype = {
  update: function(){
    this.trail.pop();
    this.trail.unshift([this.x, this.y]);

    this.speed *= this.frict;
    var rads = this.angle * Math.PI / 180;
    this.x += Math.cos(rads) * this.speed;
    this.y += Math.sin(rads) * this.speed;

    this.alpha -= this.decay;
    if(this.alpha <= this.decay){
      particleRemove(this);
      return 0;
    }
    return 1;
  },
  draw: function(pctx) {
    var tmp = pctx.strokeStyle;
    pctx.beginPath();
    pctx.moveTo(this.trail[this.trail.length-1][0], this.trail[this.trail.length-1][1]);
    pctx.lineTo(this.x, this.y);
    pctx.strokeStyle = "hsla(" + this.hue + ", 100%, 50%, " + this.alpha + ")";
    var tmp2 = pctx.lineWidth;
    pctx.lineWidth = 3;
    pctx.stroke();
    pctx.strokeStyle = tmp;
    pctx.lineWidth = tmp2;
  }
};

function Pickup(x, y) {
  /* This is a base class for pickups in general! */
  if(!x){x = rand(10, WIDTH-10);}
  if(!y){y = rand(10, HEIGHT-10);}
  this.x = x;
  this.y = y;
  this.size = 8;
};
Pickup.prototype = {
  check: function() {
    return dist(this, player) <= this.size + player.radius;
  },
};

function HealthPack(hp, x, y){
  if(!hp){arg = 1; }
  this.HealAmount = hp;
  this.prototype = new Pickup(x, y);
};
//HealthPack.prototype = new Pickup();
HealthPack.prototype.update = function() {
  if(this.prototype.check()){
    player.heal(this.HealAmount);
    pickupRemove(this);
    return 0;
  }
  return 1;
};
HealthPack.prototype.draw = function (pctx) {
  var tmp = pctx.fillStyle;
  pctx.fillStyle = COLORS.GREEN;
  pctx.beginPath();
  pctx.arc(this.prototype.x, this.prototype.y, this.prototype.size, 0, 2*Math.PI);
  pctx.fill();
  pctx.fillStyle = COLORS.BLACK;
  ctx.font="18px Georgia";
  pctx.fillText(this.HealAmount, this.prototype.x-3, this.prototype.y+3);
  pctx.fillStyle = tmp;
};
/*removes*/
function pickupRemove(pkp) {
  var ind = pickups.indexOf(pkp);
  if(ind != -1){
    pickups.splice(ind, 1);
  }
}
function projectileRemove(projectile){
  var index = projectiles.indexOf(projectile);
  if(index < 0){return 0; }
  else {
    projectiles.splice(index, 1);
  }
};
function enemyRemove(enemy){
  var index = enemies.indexOf(enemy);
  if(index < 0 ){return 0; }
  else {
    enemies.splice(index, 1);
  }
};
function particleRemove(prtcl){
  //changed: removed else clause after fail 'if' clause;
  var index = particles.indexOf(prtcl);
  if(index < 0){return 0; }
  particles.splice(index, 1);
};
function missileRemove(argument) {
  var index = missiles.indexOf(argument);
  if(index < 0){return; }
  missiles.splice(index, 1);
}
/*shorthands*/
var WASD = {
  W : "U+0057",
  A : "U+0041",
  S : "U+0053",
  D : "U+0044",
  /**/
  E : "U+0045"
};
var NUMS = {
    ONE :   "U+0031",
    TWO :   "U+0032",
    THREE : "U+0033",
    FOUR :  "U+0034",
    FIVE :  "U+0035",
    SIX :   "U+0036"
};
var COLORS = {
  BLACK:  "#000000",
  GREEN:  "#00FF00",
  RED:    "#FF0000",
  BLUE:   "#00FFFF",
  GOLD:   "#FFD700",
  WHITE: "#FFFFFF",
  GREY: "#686868",
  CYAN: "#33ccff"
};
var TIME = {
  SECOND : 1000,
  MINUTE : this.SECOND * 60
};
/*functional functions*/
function calcAngle(p1, p2) {
  var dx = p1.x - p2.x;
  var dy = p1.y - p2.y;
  var theta = Math.atan2(dy, dx);
  return theta * 180 / Math.PI;
}
function dist(p1, p2) {
  var dx = p1.x - p2.x,
      dy = p1.y - p2.y;
  return Math.sqrt( (dx*dx)+(dy*dy) );
}
function rand(min, max){
  return (Math.random() * (max - min)) + min;
}
function minDist(pt, array) {
  //iterate over an array of objects, find the minimum
  //distance between objects and pt
  var i = array.length;
  var item = array[0];
  while(i--){
    if(dist(pt, item) > dist(pt, array[i])){
      item = array[i];
    }
  }
  return item;
}
/*globals*/
var projectiles = [];
var enemies = [];
var particles =  [];
var pickups = [];
var missiles = [];
var WIDTH = 1920;
var HEIGHT = 1080;
var canvas = document.getElementById("canvas");
var bgctx = document.getElementById("bg").getContext("2d");
var ctx = canvas.getContext("2d");
var mouse = {x: 0, y:0 };
  var AUDIO = {
  Lazer: new Audio('audio/lazer.mp3'),
  Explosion: new Audio('audio/explosion.mp3'),
  Missile: new Audio('audio/missile.mp3'),
  Hit: new Audio('audio/hit.mp3')
}

resize();
var player = new Ball(WIDTH/2, HEIGHT/2);
/**/
/*eventlisteners*/
window.addEventListener("resize", resize, false);
canvas.addEventListener("click", clocation, false);
window.addEventListener("keydown", function(event){
  switch(event.keyIdentifier){
    case WASD.W:
      player.accel();
      break;
    case WASD.A:
      player.turn("l");
      //player.turnLeft();
      break;
    case WASD.D:
      player.turn();
      //player.turnRight();
      break;
    case NUMS.ONE:
      enemies.push(new Enemy());
      break;
    case WASD.E:
      player.missile();
  }
}, false);
window.addEventListener("keyup", function(event){
  switch(event.keyIdentifier){
    case WASD.W:
      player.speeding = false;
      break;
    case WASD.A:
      player.stopTurning();
      break;
    case WASD.D:
      player.stopTurning();
      break;
    case WASD.S:
      player.speeding = false;
      break;
    case NUMS.ONE:
      enemies.push(new Enemy());
    default:
      //console.log(event.keyIdentifier)
      break;
  }
}, false);
canvas.addEventListener("mousemove", updateMouse, false);
function clocation(event){
  player.fire(event);
};
function updateMouse(event) {
  var rect = canvas.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
};
function resize(){
  WIDTH = window.innerWidth-20;
  HEIGHT = window.innerHeight*0.9;
  bgctx.canvas.height = HEIGHT;
  bgctx.canvas.width = WIDTH;
  ctx.canvas.height = HEIGHT;
  ctx.canvas.width = WIDTH;
  drawBg();
};
/**/
/*Draws*/
function drawBg(){
  bgctx.fillStyle = COLORS.BLACK;
  bgctx.fillRect(0,0,WIDTH,HEIGHT);
};
function drawHUD(pctx){
  var tmp = pctx.strokeStyle;
  var tmpLnw = pctx.lineWidth;
  pctx.lineWidth = 5;
  pctx.strokeStyle = "hsla(99, 100%, 40%, 0.43)";
  pctx.beginPath();
  var percentage = ( new Date().getTime() - player.lastMissile ) / player.missileCooldown;
  if(percentage > 1){percentage = 1; }

  pctx.arc(100, 100, 50, 0, percentage*2*Math.PI);
  pctx.stroke();
  pctx.strokeStyle = tmp;
  pctx.lineWidth = tmpLnw;
}
function init(){
  resize();
  draw();
};

function draw() {
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle = "#FFFFFF";

  if(!player.update() ){
    enemies = [];
    particles = [];
    projectiles = [];
    pickups = [];
    missiles = [];
    player = null;
    player = new Ball(WIDTH/2, HEIGHT/2);
  }
  /*projectile*/
  var i = projectiles.length;
  while(i--){
    if(projectiles[i].update()){
      projectiles[i].draw(ctx);
      if(projectiles[i].x < 0 || projectiles[i].x > WIDTH ||
         projectiles[i].y < 0 || projectiles[i].y > HEIGHT){
        projectileRemove(projectiles[i]);
      }
    }
  }
  //missiles
  i =  missiles.length;
  while(i--){
    if(missiles[i].update()){
      missiles[i].draw(ctx);
    }
  }
  /*enemy*/
  i = enemies.length;
  while(i--){
    var e = enemies[i];
    if(e.update()){
        e.draw(ctx);
    }
  }
  /*pickups*/
  i = pickups.length;
  while(i--){
    if(pickups[i].update()){
      pickups[i].draw(ctx);
    }
  }
  /* draw player!*/
  player.draw(ctx);
  /*particle*/
  i = particles.length;
  while(i--){
    if(particles[i].update()){
      particles[i].draw(ctx);
    }
  }
  drawHUD(ctx);
  requestAnimFrame(draw);
}




init();
