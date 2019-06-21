var c = document.getElementById("canvas");
var ctx = c.getContext("2d");

var cwidth = ctx.canvas.width  = window.innerWidth;
var cheight = ctx.canvas.height = window.innerHeight*0.5;

var zoom = 1;

var center = {x:ctx.canvas.width/2, y:ctx.canvas.height/2};
var offset = {x:center.x, y:center.y};

var firstClick = false;
var mouseClick = false;
var lastMousePos = {x: 0, y:0};
var mousePosDiff = {x: 0, y:0};

var circle = {x: 0, y: 0, radius: 100};

var points = [];
var planetRadius = 6371;

function getMousePos(canvas, ev) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top
    };
}
function updateMousePos(ev) {
	var newPos = getMousePos(c, ev);
	
	mousePosDiff.x = lastMousePos.x - newPos.x;
	mousePosDiff.y = lastMousePos.y - newPos.y;
	mousePosDiff.x = mousePosDiff.x/zoom;
	mousePosDiff.y = mousePosDiff.y/zoom;
	
	lastMousePos.x = newPos.x;
	lastMousePos.y = newPos.y;
}


c.addEventListener("wheel", event => {
    const delta = Math.sign(event.deltaY);
    zoom -= delta/10;
	
	if(zoom <= 0) {
		zoom = 0.1;
	}
	document.getElementById("zoomLvl").value = zoom.toFixed(2);
});

var onMouseClick = function(ev) {
	mouseClick = true;
	
	lastMousePos = getMousePos(c, ev);
};
c.addEventListener('mousedown', onMouseClick, true);

var onMouseMove = function(ev) {
	if(mouseClick) {
		updateMousePos(ev);
		
		offset.x -= mousePosDiff.x; offset.y -= mousePosDiff.y;
	}
};
c.addEventListener("mousemove", onMouseMove);

var onMouseUnClick = function(ev) {
	mouseClick = false;
};
c.addEventListener('mouseup', onMouseUnClick, true);



document.getElementById("zoomBtn").addEventListener("click", function(){
	zoom = parseFloat(document.getElementById("zoomLvl").value);
});




function calcIntersect(c, p) {
	var dx = c.x - p.x;
	var dy = c.y - p.y;
	var dd = Math.sqrt(dx * dx + dy * dy);
	var a = Math.asin(c.radius / dd);
	var b = Math.atan2(dy, dx);
	
	var t = b - a;
	var ta = {x: c.radius * Math.sin(t), y: c.radius * -Math.cos(t) };
	
	return ta;
}

function calcIntersectData(c, p) {
	var intersectPoint = calcIntersect(c, p);
	
	var dx = p.x - intersectPoint.x;
	var dy = p.y - intersectPoint.y;
	var distance = Math.sqrt(dx * dx + dy * dy);
	
	var angle = Math.acos(Math.abs(dx)/distance) * (180 / Math.PI);
	
	return {intersect: intersectPoint, dist: distance, ang: angle};
}

function updatePoint(point) {
	var unit = planetRadius/circle.radius;
	
	var scaleX = point.point.rx/unit;
	var scaleY = point.point.ry/unit;
	
	point.point.x = scaleX;
	point.point.y = -(scaleY+circle.radius);
	
	var intersect = calcIntersectData(circle, point.point);
	point.intersect = intersect;
}

function changePlanetRadius(newRadius) {
	planetRadius = newRadius;
	document.getElementById("curPlanetSize").textContent = planetRadius + "km";
	
	document.getElementById("details").innerHTML = "";
	for (i = 0; i < points.length; i++) {
		updatePoint(points[i]);
		addPointData(i, points[i]);
	}
}

document.getElementById("pRadiusBtn").addEventListener("click", function(){
	changePlanetRadius(parseFloat(document.getElementById("pRadius").value));
	
	document.getElementById("pRadius").value = "";
});

function addPoint(x, y, col) {
	// Get km value of single "unit" based on circle radius
	var unit = planetRadius/circle.radius;
	
	// Scale km to simulation units (how many units does given km equal?)
	var scaleX = x/unit;
	var scaleY = y/unit;
	
	var point = {x: scaleX, y: -(scaleY+circle.radius), rx: x, ry: y};
	var intersect = calcIntersectData(circle, point);
	
	points.push({point: point, intersect: intersect, colour: col});
}

function addPointData(id, point) {
	var unit = planetRadius/circle.radius;
	
	$('#details').append('<div id="p"' + id + ' data-index="' + id + '"> \
	<div class="picon" style="background:' + point.colour + ';"></div><span class="bold"> Point #' + id + ' - </span><span class="bold">Height: </span><span>' + point.point.ry + 'km </span><span class="bold">| Distance to horizon: </span><span>' + (point.intersect.dist*unit).toFixed(2) + 'km </span><span class="bold">| Angle to horizon: </span><span>' + (point.intersect.ang).toFixed(2) + ' degrees</span> \
	</div>');
}

document.getElementById("addBtn").addEventListener("click", function(){
	addPoint(parseFloat(document.getElementById("newx").value), parseFloat(document.getElementById("newy").value), document.getElementById("newcol").value);
	
	addPointData(points.length-1, points[points.length-1]);
	
	document.getElementById("newY").value = ""
});

document.getElementById("refocusBtn").addEventListener("click", function(){
	offset.x = center.x;
	offset.y = center.y+circle.radius;
});

// var point = {x: 0, y: -(0.16744624077 + circle.radius)};
// var pIntersect = calcIntersect(circle, point);

// var dx = point.x - pIntersect.x;
// var dy = point.y - pIntersect.y;
// var dd = Math.sqrt(dx * dx + dy * dy);

// document.getElementById("sDist").textContent = dd;

// var ang = Math.acos(Math.abs(dx)/dd) * (180 / Math.PI);

// document.getElementById("sAng").textContent = ang;

function drawLine(pLine) {
	ctx.save();
	
	ctx.translate(center.x, center.y);
	ctx.scale(zoom, zoom);
	ctx.translate(-center.x, -center.y);
	
	
	ctx.translate(offset.x, offset.y);
	
	ctx.beginPath();
	ctx.moveTo(pLine.point.x, pLine.point.y);
	ctx.lineTo(pLine.intersect.intersect.x, pLine.intersect.intersect.y);
	
	ctx.restore();
	
	ctx.strokeStyle = '#000000';
	ctx.stroke();
	
	
	
	
	ctx.save();
	
	ctx.translate(center.x, center.y);
	ctx.scale(zoom, zoom);
	ctx.translate(-center.x, -center.y);
	
	ctx.translate(offset.x, offset.y);
	
	ctx.beginPath();
	ctx.arc(pLine.point.x, pLine.point.y, 10/zoom, 0, 2*Math.PI);
	
	ctx.restore();
	
	ctx.strokeStyle = pLine.colour;
	ctx.stroke();
	ctx.fillStyle = pLine.colour;
	ctx.fill();
	
	
	
	
	ctx.save();
	
	ctx.translate(center.x, center.y);
	ctx.scale(zoom, zoom);
	ctx.translate(-center.x, -center.y);
	
	ctx.translate(offset.x, offset.y);
	
	ctx.beginPath();
	ctx.arc(pLine.intersect.intersect.x, pLine.intersect.intersect.y, 10/zoom, 0, 2*Math.PI);
	
	ctx.restore();
	
	ctx.strokeStyle = pLine.colour;
	ctx.stroke();
	ctx.fillStyle = pLine.colour;
	ctx.fill();
}

function draw() {	
	ctx.save();
	
	ctx.translate(center.x, center.y);
	ctx.scale(zoom, zoom);
	ctx.translate(-center.x, -center.y);
	
	
	ctx.translate(offset.x, offset.y);
	
	ctx.beginPath();
	ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
	
	ctx.restore();
	
	ctx.strokeStyle = '#000000';
	ctx.stroke();
	ctx.fillStyle = '#FFFFFF';
	ctx.fill();
	
	for (i = 0; i < points.length; i++) {
		drawLine(points[i]);
	}
	
	// ctx.save();
	
	// ctx.translate(center.x, center.y);
	// ctx.scale(zoom, zoom);
	// ctx.translate(-center.x, -center.y);
	
	
	// ctx.translate(offset.x, offset.y);
	
	// ctx.moveTo(point.x, point.y);
	// ctx.lineTo(pIntersect.x, pIntersect.y);
	
	// ctx.restore();
	
	// ctx.strokeStyle = '#000000';
	// ctx.stroke();
	
	
	
	
	// ctx.save();
	
	// ctx.translate(center.x, center.y);
	// ctx.scale(zoom, zoom);
	// ctx.translate(-center.x, -center.y);
	
	// ctx.translate(offset.x, offset.y);
	
	// ctx.beginPath();
	// ctx.arc(point.x, point.y, 10/zoom, 0, 2*Math.PI);
	
	// ctx.restore();
	
	// ctx.strokeStyle = '#FF0000';
	// ctx.stroke();
	// ctx.fillStyle = '#FF0000';
	// ctx.fill();
	
	
	
	
	// ctx.save();
	
	// ctx.translate(center.x, center.y);
	// ctx.scale(zoom, zoom);
	// ctx.translate(-center.x, -center.y);
	
	// ctx.translate(offset.x, offset.y);
	
	// ctx.beginPath();
	// ctx.arc(pIntersect.x, pIntersect.y, 10/zoom, 0, 2*Math.PI);
	
	// ctx.restore();
	
	// ctx.strokeStyle = '#FF0000';
	// ctx.stroke();
	// ctx.fillStyle = '#FF0000';
	// ctx.fill();
}

function mainLoop(){
	
	requestAnimationFrame(mainLoop);
	
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	
	draw();
	
	
}

mainLoop();