/*
	!!EARTH LINE OF SIGHT SIMULATION!!

	Author			: Ben Cook

	First created	: 2019-06-21
	Last updated	: 2019-06-29

	Honestly, I don't care much for copyright stuff, so just assume I've put 
	some big old "Creative Commons, anyone can reuse this code" header up here.
*/

// Get canvas
var c = document.getElementById("canvas");
var ctx = c.getContext("2d");

// Set canvas size
var cwidth = ctx.canvas.width  = window.innerWidth;
var cheight = ctx.canvas.height = window.innerHeight*0.5;


// -- CAMERA VARIABLES --
// Center is to ensure we zoom in on object at center of screen
// Offset is the position of the camera (too lazy to write up a view matrix)
var center = {x:ctx.canvas.width/2, y:ctx.canvas.height/2};
var offset = {x:center.x, y:center.y};

// Initial zoom level
var zoom = 1;


// -- INTERACTION VARIABLES --
// Handle first click (since start pos unknown) and variable for if mouse is currently held down
var firstClick = false;
var mouseClick = false;

// Variables for calculation movement vector when click-dragging
var lastMousePos = {x: 0, y:0};
var mousePosDiff = {x: 0, y:0};


// -- OBJECT VARIABLES --
// "Actual" size of circle on screen, is later used to convert from screen-coords to km (just defaulting to 100 for now)
var circle = {x: 0, y: 0, radius: 100};

// Actual planet radius in km (used to scale units later)
var planetRadius = 6371;

// List of points added to screen (should really make a prototype for them but I'm too lazy)
var points = [];


// -- MOUSE HANDLING FUNCTIONS -- 

// Get current mouse position on canvas
function getMousePos(canvas, ev) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top
    };
}

// Get current mouse pos, then use with last mouse pos to calculate movement vector
// then update last mouse pos to current pos
function updateMousePos(ev) {
	var newPos = getMousePos(c, ev);
	
	mousePosDiff.x = lastMousePos.x - newPos.x;
	mousePosDiff.y = lastMousePos.y - newPos.y;
	mousePosDiff.x = mousePosDiff.x/zoom;
	mousePosDiff.y = mousePosDiff.y/zoom;
	
	lastMousePos.x = newPos.x;
	lastMousePos.y = newPos.y;
}

// Set mouseclick (technically mousedown) to true and update last mouse pos
var onMouseClick = function(ev) {
	mouseClick = true;
	
	lastMousePos = getMousePos(c, ev);
};

// While mouse is clicked (down), update mouse pos for every movement, then update camera offset
// using new movement vector (mousePosDiff)
var onMouseMove = function(ev) {
	if(mouseClick) {
		updateMousePos(ev);
		
		offset.x -= mousePosDiff.x; offset.y -= mousePosDiff.y;
	}
};

// Set mouse click (down) to false (up)
var onMouseUnClick = function(ev) {
	mouseClick = false;
};


// -- MATHEMATICAL FUNCTIONS --
// -- POINT CALCULATIONS --
/* 
IMPORTANT DISTINCTION: Actual size (so how big it is on the screen) is measured in "units".
					   Represented size (so size being represented in real world) is measured in "km".
					   
Intersection lines are represented as a basic object with the following parameters:
		point		: 	An object with an x and y value representing the point above the surface of the planet that we are viewing from
						Also contains an "rx" and "ry" value meaning "represented x/y". This is the size in km that is being represented, as opposed to the regular
						x and y which are the actual onscreen sizes. Conversions done later.

		intersect	: 	An object consisting of the following parameters:
					intersectPoint		:	An object with an x and y value representing the intersection point of the line starting at 'point' that is a tangent to the planet
					dist				: 	The distance between the viewing point and the intersection point
					ang					: 	The angle from the horizontal to the tangent line
						
		colour		:	The colour of the point visible on screen
*/

// ADDITIONAL NOTE: I know I call the line data a "point". That's because I originally designed the code differently, then couldn't
// be bothered to change the name of the object. Feel free to alter it.

// Calculate intersection of given point with given circle, where intersection creates a tangent to circle
// This simulates the farthest point that can be seen from a given position
// Maths is based on code found here: https://stackoverflow.com/a/15846131
function calcIntersect(c, p) {
	var dx = c.x - p.x;
	var dy = c.y - p.y;
	var dd = Math.sqrt(dx * dx + dy * dy);
	var a = Math.asin(c.radius / dd);
	var b = Math.atan2(dy, dx);
	
	// Only need to calculate tangent at one point. Could calculate for other side,
	// but it would just be the same as the first but mirrored. See above link if you want to implement that.
	var t = b - a;
	var ta = {x: c.radius * Math.sin(t), y: c.radius * -Math.cos(t) };
	
	return ta;
}

// Calls calcIntersect, but also sets up the data for the intersection (distance + angle)
function calcIntersectData(c, p) {
	// Calculate intersect point
	var intersectPoint = calcIntersect(c, p);
	
	// Calculate distance
	var dx = p.x - intersectPoint.x;
	var dy = p.y - intersectPoint.y;
	var distance = Math.sqrt(dx * dx + dy * dy);
	
	// Calculate angle
	var angle = Math.acos(Math.abs(dx)/distance) * (180 / Math.PI);
	
	return {intersect: intersectPoint, dist: distance, ang: angle};
}

function addPoint(x, y, col) {
	// Calculate how much 1 unit of planet's actual (on screen) size is in reference to the planet's represented size
	// For example, if planet on screen is 100 units in radius, and represented size is 6000km, then 1 unit is 60km (6000/100=60)
	var unit = planetRadius/circle.radius;
	
	// Scale represented point to actual point (km to units)
	var scaleX = x/unit;
	var scaleY = y/unit;
	
	// Set actual onscreen x and y. y has radius added because user input is meant to represent distance from planet's surface, not from the center of the planet
	// It's then negated because the canvas coordinate system has negative values going up. Also set represented x/y to user values (assumed to be in km)
	var point = {x: scaleX, y: -(scaleY+circle.radius), rx: x, ry: y};
	var intersect = calcIntersectData(circle, point);
	
	// Add point to list of points
	points.push({point: point, intersect: intersect, colour: col});
}

// Add point data to new div on point list
function addPointData(id, point) {
	// See "addPoint" desc
	var unit = planetRadius/circle.radius;
	
	// Distance has to be converted to km because original calculation only calculated it in onscreen units
	// TODO?: Add "represented" distance parameter to save calculating it here?
	$('#details').append('<div id="p"' + id + ' data-index="' + id + '"> \
	<div class="picon" style="background:' + point.colour + ';"></div><span class="bold"> Point #' + id +
	' - </span><span class="bold">Height: </span><span>' + point.point.ry + 'km </span><span class="bold">| Distance to horizon: </span><span>' +
	(point.intersect.dist*unit).toFixed(2) + 'km </span><span class="bold">| Angle to horizon: </span><span>' + (point.intersect.ang).toFixed(2) + ' degrees</span> \
	</div>');
}

// Updates a given point in the event it may have moved, or the planet may have changed size
function updatePoint(point) {
	// See "addPoint" desc
	var unit = planetRadius/circle.radius;
	
	// Scale represented point to actual point (km to units)
	var scaleX = point.point.rx/unit;
	var scaleY = point.point.ry/unit;
	
	// Update onscreen x/y values (see "addPoint")
	point.point.x = scaleX;
	point.point.y = -(scaleY+circle.radius);
	
	// Calculate new intersection data using new point
	var intersect = calcIntersectData(circle, point.point);
	point.intersect = intersect;
}


// -- PLANET FUNCTIONS --
// Update planet radius and recalculate point data to match new radius
function changePlanetRadius(newRadius) {
	
	// Update radius and div displaying current val
	planetRadius = newRadius;
	document.getElementById("curPlanetSize").textContent = planetRadius + "km";
	
	// Erase point data table and recalculate point data, then repopulate data table
	document.getElementById("details").innerHTML = "";
	for (i = 0; i < points.length; i++) {
		updatePoint(points[i]);
		addPointData(i, points[i]);
	}
}


// -- EVENT LISTENERS --
// -- MOUSE LISTENERS --
// Mouse click/move/unclick listeners
c.addEventListener('mousedown', onMouseClick, true);
c.addEventListener("mousemove", onMouseMove);
c.addEventListener('mouseup', onMouseUnClick, true);

// Mouse wheel movement event for zooming
c.addEventListener("wheel", event => {
	// Get change (delta) in scroll value
    const delta = Math.sign(event.deltaY);
    zoom -= delta/10;	// Division by 10 is just to slow down scrolling, can adjust it to change speed (TODO: Make it its own variable)
	
	// Ensure we don't accidentally have 0 zoom or negative zoom
	if(zoom <= 0) {
		zoom = 0.1;
	}
	
	// Update zoom input box
	document.getElementById("zoomLvl").value = zoom.toFixed(2);
});

// -- BUTTON LISTENERS --
// Manually set zoom level (saves having to implement exponential zoom factor)
document.getElementById("zoomBtn").addEventListener("click", function(){
	zoom = parseFloat(document.getElementById("zoomLvl").value);
});

// Button to set planet radius
document.getElementById("pRadiusBtn").addEventListener("click", function(){
	changePlanetRadius(parseFloat(document.getElementById("pRadius").value));
	
	document.getElementById("pRadius").value = "";
});

// Button to add new point to canvas and populate point data table
document.getElementById("addBtn").addEventListener("click", function(){
	addPoint(parseFloat(document.getElementById("newx").value), parseFloat(document.getElementById("newy").value), document.getElementById("newcol").value);
	
	addPointData(points.length-1, points[points.length-1]);
	
	document.getElementById("newY").value = ""
});

// Quick focus to top of planet where points are added (in case you get lost!)
document.getElementById("refocusBtn").addEventListener("click", function(){
	offset.x = center.x;
	offset.y = center.y+circle.radius;
});


// -- GRAPHICS FUNCTIONS --
// NOTE: I cheaped out and decided to use canvas draws instead of WebGL to save all the setup costs
// This bit REALLY needs to be updated, I rushed it so I could get to the main maths part before I lost interest in the project

// Draws everything related to tangent lines (including circles to denote start and end)
function drawLine(pLine) {
	
	// Draw line from view point to intersection point
	ctx.save();
	
	// Handle zoom
	ctx.translate(center.x, center.y);
	ctx.scale(zoom, zoom);
	ctx.translate(-center.x, -center.y);
	
	// Handle camera offset
	ctx.translate(offset.x, offset.y);
	
	// Set line parameters
	ctx.beginPath();
	ctx.moveTo(pLine.point.x, pLine.point.y);
	ctx.lineTo(pLine.intersect.intersect.x, pLine.intersect.intersect.y);
	
	ctx.restore();
	
	// Draw
	ctx.strokeStyle = '#000000';
	ctx.stroke();
	
	
	
	// Draw circle representing view point (rest of comments same as above)
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
	
	
	
	// Draw circle representing intersect point (rest of comments same as above)
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

// Main draw function to draw planet, then each viewing line
function draw() {	
	ctx.save();
	
	// Handle zoom
	ctx.translate(center.x, center.y);
	ctx.scale(zoom, zoom);
	ctx.translate(-center.x, -center.y);
	
	// Handle camera offset
	ctx.translate(offset.x, offset.y);
	
	// Data for planet circle
	ctx.beginPath();
	ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
	
	ctx.restore();
	
	// Draw planet
	ctx.strokeStyle = '#000000';
	ctx.stroke();
	ctx.fillStyle = '#FFFFFF';
	ctx.fill();
	
	// Iterate over each viewing line and draw
	for (i = 0; i < points.length; i++) {
		drawLine(points[i]);
	}
}

// Main loop to clear screen and draw to canvas
function mainLoop(){
	// Stop it all locking up
	requestAnimationFrame(mainLoop);
	
	// Clear screen
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	
	// Draw canvas
	draw();
}

// INITIATE!!
mainLoop();