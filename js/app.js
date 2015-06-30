/**
 * Created by praveen on 28/6/15.
 */

// Token Bucket Params
var TokenRate = 4;
var PacketRate = 3;
var MaxPacketRate = 7; // Visual artifacts there after
var MaxTokenRate = 7;  // Visual artifacts there after
var MaxTokens = 20;     // # of token objects defined in HTML
var MaxPackets = 20;    // # of Packet objects defined in HTML
var TimeScale = 5;     // All rates are TimeScale times of real time

// Document design params
var packetWrapperWidth = "1180px";  // Will be updated in init()
var bucketCenter = "590px";         // Center of the bucket. The packets stop here for token
var aTokenDefaultBottom = "10px";   // Default value of bottom for animator token
var aTokenPacketBottom = "-65px";   // Final value of bottom for animator token

// Animation times
var bucketToPacket = 0.2;    // Time taken for token to enter packet from bucket
var sourceToBucket = 0.5;    // Time taken for packet to reach bucket from source
var bucketToNetwork = 0.5;   // Time taken for packet to reach network from bucket
var bucketToTrash = 0.5;   // Time taken for packet to reach trash from bucket

// Objects
var mTokens = [];
var mPackets = [];
var mPacketsTransit = [];
var mAnimToken;
var mAvailTokens = 0;

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
    mAnimToken.reset();

    // Update rate UI
    document.getElementById("token-rate").innerHTML = TokenRate;
    document.getElementById("packet-rate").innerHTML = PacketRate;

    // Init Token and Packet generator
    TokenGenerator();
    PacketGenerator();
}

/**
 * Controller functions
 */
function increasePacketRate(){
    if(PacketRate < MaxPacketRate){
        PacketRate++;
        document.getElementById("packet-rate").innerHTML = PacketRate;
    }
}
function decreasePacketRate(){
    if(PacketRate > 1){
        PacketRate--;
        document.getElementById("packet-rate").innerHTML = PacketRate;
    }
}
function increaseTokenRate(){
    if(TokenRate < MaxTokenRate){
        TokenRate++;
        document.getElementById("token-rate").innerHTML = TokenRate;
    }
}
function decreaseTokenRate(){
    if(TokenRate > 1){
        TokenRate--;
        document.getElementById("token-rate").innerHTML = TokenRate;
    }
}

/**
 * Generates a new token if possible
 * @constructor
 */
function TokenGenerator() {
    if(mAvailTokens < MaxTokens) {
        generateToken();
    }
    setTimeout(function(){TokenGenerator()}, TimeScale * 1000 / TokenRate);
}

/**
 * Generates a new packet to network traffic. If possible.
 * @constructor
 */
function PacketGenerator(){
    if(mPackets.length > 0){
        mPacketsTransit.push(mPackets.pop());
        mPacketsTransit[mPacketsTransit.length - 1].animateToBucket();
    }
    setTimeout(function(){PacketGenerator()}, TimeScale * 1000 / PacketRate);
}

function generateToken(){
    mTokens[mAvailTokens].generate();
    mAvailTokens++;
}

function consumeToken(){
    mAvailTokens--;
    mTokens[mAvailTokens].consume();
}

/** ----------------------------------------------------------------
 ------------------------  Object representations ------------------
 -------------------------------------------------------------------**/
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
     */
    this.animateToBucket = function(){
        tl.add(TweenLite.to(domobj, sourceToBucket, {
            left: bucketCenter,
            onComplete: this.checkToken.bind(this)
        }));
    };

    /**
     * Checks if there are any tokens left.
     *
     * If so, animates a token to packet.
     */
    this.checkToken = function(){
        if(mAvailTokens > 0){
            consumeToken();
            mAnimToken.animateToPacket(this.animateToNetwork.bind(this));
        } else{
            this.animateToTrash();
        }
    };

    this.animateToNetwork = function(){
        tl.add(TweenLite.to(domobj, bucketToNetwork, {
            left: packetWrapperWidth,
            onComplete: function(){
                var packet = mPacketsTransit.shift();
                packet.reset();
                mPackets.unshift(packet);
            }
        }));
    };

    this.animateToTrash = function(){
        tl.add(TweenLite.to(domobj, bucketToTrash, {
            top: "50px",
            onComplete: function(){
                var packet = mPacketsTransit.shift();
                packet.reset();
                mPackets.unshift(packet);
            }
        }));
    };

    this.reset = function(){
        tl.add(TweenLite.to(domobj, 0, {
            left: "0px",
            top: "0px"
        }));
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
     * @param callback
     *      Function to call after the animation has complete
     */
    this.animateToPacket = function(callback){
        this.reset();
        this.generate();
        tl.add(TweenLite.to(domobj, bucketToPacket, {
            bottom: aTokenPacketBottom,
            onComplete: callback
        }));
        tl.add(this.reset.bind(this));
    };

    /**
     * Resets the position of the animator token
     */
    this.reset = function(){
        this.consume();
        tl.to(domobj, 0, {bottom: aTokenDefaultBottom});
    }
}

