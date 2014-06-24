
var frame;

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

/*
  
  The leapToScene function takes a position in leap space 
  and converts it to the space in the canvas.
  
  It does this by using the interaction box, in order to 
  make sure that every part of the canvas is accesible 
  in the interaction area of the leap

*/

function leapToScene( leapPos ){

  // Gets the interaction box of the current frame
  var iBox = frame.interactionBox;

  // Gets the left border and top border of the box
  // In order to convert the position to the proper
  // location for the canvas
  var left = iBox.center[0] - iBox.size[0]/2;
  var top = iBox.center[1] + iBox.size[1]/2;

  // Takes our leap coordinates, and changes them so
  // that the origin is in the top left corner 
  var x = leapPos[0] - left;
  var y = leapPos[1] - top;

  // Divides the position by the size of the box
  // so that x and y values will range from 0 to 1
  // as they lay within the interaction box
  x /= iBox.size[0];
  y /= iBox.size[1];

  // Uses the height and width of the canvas to scale
  // the x and y coordinates in a way that they 
  // take up the entire canvas
  x *= canvas.width;
  y *= canvas.height;

  // Returns the values, making sure to negate the sign 
  // of the y coordinate, because the y basis in canvas 
  // points down instead of up
  return [ x , -y ];

}


function init()
{
    canvas.width = document.body.clientWidth;
    canvas.height = Math.max( window.innerHeight, document.body.clientHeight);
    canvasW = canvas.width;
    canvasH = canvas.height;

/*            if( canvas.getContext )
    {
        //setup();
        //setInterval( run , 33 );
    }*/
}

function getExtendedFingers(fingers) {
  var extended = [];
  for(var i=0; i<fingers.length; i++) {
    if(fingers[i].extended)
      extended.push(fingers[i]);
  }
  return extended;
}

function isExtendingSpecificFingers(fingers, extendedArray) {
  for(var i=0; i<fingers.length; i++) {
    // if actual finger is extended but the index isn't in extendedArray
    // or if actual finger isn't extended but index is
    if((fingers[i].extended && $.inArray(fingers[i].type, extendedArray) === -1) || (!fingers[i].extended) && $.inArray(fingers[i].type, extendedArray) !== -1)
      return false;
  }
  return true;
}

function angleBetweenVectors(a, b) {
  // attempt 1
  //return Math.acos(Leap.vec3.dot(a,b));

  // attempt 2
  /*
  var dotProduct = a[0]*b[0]+a[1]*b[1];
  var magA = Math.sqrt(Math.pow(a[0],2)+Math.pow(a[1],2));
  var magB = Math.sqrt(Math.pow(b[0],2)+Math.pow(b[1],2));
  console.log(Math.acos(dotProduct/(magA*magB))*(180/Math.PI));

  return Math.acos(dotProduct/(magA*magB));*/

  // attempt 3
  atanA = Math.atan2(a[0], a[1]);
  atanB = Math.atan2(b[0], b[1]);

  return atanA - atanB;
}

function get2DFingersVectorY(a, b) {
  return [b[0]-a[0], b[2]-a[2]];
}

init();

var menuState = "none";
var radius = 5;
var x;
var y;
var handDirection = 0;
var tempFingerVector = [];
var menuAngle = 0;
var valueBefore = 0;

var controller = new Leap.Controller();
var s = new DonutSlider('donut-slider', 30);

controller.on( 'frame' , function(f){
    
    frame = f;
    if(frame.hands.length >= 1) {
        var hand = frame.hands[0];
        
        if(menuState !== "set")
            canvas.width = canvas.width;

        var pos = leapToScene(hand.palmPosition);
        
        switch(menuState) {
            case "none": 
                radius = 5;
                x = pos[0];
                y = pos[1];
                // if pinching, grow a circle until circle reaches 40 radius
                console.log(hand.pinchStrength);
                if(hand.pinchStrength > 0.7) {  
                    menuState = "set";
                    $("#donut-slider").show();
                    $("#donut-slider").css({top:y, left:x});
                }
                break;
            case "growing":
                // start growing circle until either pinch = 0 or pinch shrinks to 0
                radius = (1-hand.pinchStrength)*100;
                x = pos[0];
                y = pos[1];

                if(hand.pinchStrength < 0.2) {
                    menuState = "set";
                }
                break;
            case "set":
                menuAngle = Math.min(menuAngle, 1);
                menuAngle = Math.max(menuAngle, 0);
                angleBefore = menuAngle;

                if(hand.grabStrength > 0.3) {
                    menuState = "none_pinch";
                    $("#donut-slider").hide();
                }
                if(isExtendingSpecificFingers(hand.fingers, [0,1,2])) {
                  tempFingerVector = get2DFingersVectorY(hand.fingers[0].tipPosition, hand.fingers[2].tipPosition);

                  handDirection = hand.direction;
                  menuState = "rotating";
                }
                break;
            case "rotating":
                var currFingerVector = get2DFingersVectorY(hand.fingers[0].tipPosition, hand.fingers[2].tipPosition);
                var angleDelta = angleBetweenVectors(tempFingerVector, currFingerVector);
                menuAngle = Math.min(angleBefore + angleDelta, 1);
                menuAngle = Math.max(angleBefore + angleDelta, 0);
                s.setValue(menuAngle);

                //menuAngle = Math.min(angleBefore + angleBetweenVectors(handDirection, hand.direction), 1);
                if(getExtendedFingers(hand.fingers).length !== 3) {
                  menuState = "set";
                }
                break;
            case "shrinking":
                radius = (1-frame.hands[0].grabStrength)*150;
                if(frame.hands[0].grabStrength === 0)
                    menuState = "set";
                if(frame.hands[0].grabStrength > 0.7)
                    menuState = "none_pinch";
                break;
            case "none_pinch":
                radius = 5;
                x = pos[0];
                y = pos[1];
                if(frame.hands[0].pinchStrength < 0.3)
                    menuState = "none";
                break;
        }
 
        if(menuState !== "set" && menuState !== "rotating") {
          ctx.beginPath();
          ctx.arc(x,y,radius,0,2*Math.PI);
          if(menuState === "growing" || menuState === "shrinking")
            ctx.fillStyle = "#eeeeee";
          else
            ctx.fillStyle = "#333333";
          ctx.fill();
        }

        if(menuState === "none" || menuState === "none_pinch") {
            ctx.font = '12pt Arial';
            ctx.fillStyle = 'gray';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(menuAngle*100), x, y-10);
        }
    }
});
controller.connect();
