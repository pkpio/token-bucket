/**
 * Created by praveen on 28/6/15.
 */

// Token Bucket Params
var TokenRate = 3;
var PacketRate = 2;
var MaxTokens = 15;     // # of token objects defined in HTML
var MaxPackets = 10;    // # of Packet objects defined in HTML
var TimeScale = 5;     // All rates are TimeScale times of real time

// Document design params
var packetWrapperWidth = "1180px";  // Will be updated in init()
var bucketCenter = "590px";         // Center of the bucket. The packets stop here for token
var aTokenDefaultBottom = "10px";   // Default value of bottom for animator token
var aTokenPacketBottom = "-65px";   // Final value of bottom for animator token

// Objects
var mTokens = [];
var mPackets = [];
var mAnimToken;
var mAvailTokens = 0;

/**
 * Denotes a Packet
 * @param domobj
 *      HTML object associated with the Packet
 * @param tl
 *      TimelineLite object associated with this
 * @param hasToken
 *      True if this Packet has a token
 */
function Packet(domobj, tl, hasToken) {
    this.domobj = domobj;
    this.tl = tl;
    this.hasToken = hasToken;

    /**
     * Animates the Packet object to bucket and executes the
     * token check function after the Packet arrives at the bucket
     *
     * @param delay
     *      Delay before animation
     */
    this.animateToBucket = function(delay){
        delay = (delay === undefined) ? 0: delay;
        tl.to(domobj, 1, {left: bucketCenter}, "+=" + delay);
        //tl.to(domobj, 1, {left: packetWrapperWidth}, "+=1");
    }
}

/**
 * Denotes a token
 * @param domobj
 *      HTML object associated with the token
 */
function Token(domobj) {
    this.domobj = domobj;

    /**
     * Consumes the current token by making it hidden
     */
    this.consume = function(){
        domobj.style.visibility = "hidden";
    };

    /**
     * Generates the current token by making it visible
     */
    this.generate = function(){
        domobj.style.visibility = "visible";
    };
}

/**
 * Denotes a token animator. Normal tokens cannot be animated
 * @param domobj
 *      HTML object associated with the token
 * @param tl
 *      TimelineLite object associated with this
 */
function TokenAnimator(domobj, tl){
    this.domobj = domobj;
    this.tl = tl;

    /**
     * Consumes the current token by making it hidden
     */
    this.consume = function(){
        domobj.style.visibility = "hidden";
    };

    /**
     * Generates the current token by making it visible
     */
    this.generate = function(){
        domobj.style.visibility = "visible";
    };

    /**
     * Animate token to Packet.
     *
     * @param delay
     *      Delay before animation
     */
    this.animateToPacket = function(delay){
        delay = (delay === undefined) ? 0: delay;
        this.generate();
        tl.to(domobj, 1, {bottom: aTokenPacketBottom}, "+=" + delay);
    };

    /**
     * Resets the position of the animator token
     */
    this.reset = function(){
        this.consume();
        tl.to(domobj, 0, {bottom: aTokenDefaultBottom});
    }
}

/**
 * Initializes the application. Called in window.onload()
 */
function init(){

    // Init Packet objects
    for(var i=1; i<=MaxPackets; i++){
        mPackets.push(new Packet(document.getElementById("packet-" + i), new TimelineLite(), false));
    }

    // Init token objects and their visibility
    for(var j=1; j<=MaxTokens; j++){
        mTokens.push(new Token(document.getElementById("token-" + j)));
        mTokens[j-1].consume();
    }

    // Init animator token
    mAnimToken = new TokenAnimator(document.getElementById("token-animate"), new TimelineLite());

    // Init Token generator
    TokenGenerator();

    // Test Packet animation
    for(var k=1; k<=MaxPackets; k++) {
        var pack = mPackets.pop();
        pack.animateToBucket(k);
    }
    mAnimToken.animateToPacket(0);
}

function TokenGenerator() {
    if(mAvailTokens < MaxTokens) {
        mTokens[mAvailTokens].generate();
        mAvailTokens++;
    }
    setTimeout(function(){TokenGenerator();}, TimeScale * 1000 / TokenRate);
}

