/*
  spaceinvaders.js

  the core logic for the space invaders game.

*/

/*  
    Game Class

    The Game class represents a Space Invaders game.
    Create an instance of it, change any of the default values
    in the settings, and call 'start' to run the game.

    Call 'initialise' before 'start' to set the canvas the game
    will draw to.

    Call 'moveShip' or 'shipFire' to control the ship.

    Listen for 'gameWon' or 'gameLost' events to handle the game ending.
*/

//  Constants for the keyboard.
var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_SPACE = 32;

//  Creates an instance of the Game class.
function Game() {

    //  Set the initial config.
    this.config = {
        bombRate: 0.05,
        bombMinVelocity: 50,
        bombMaxVelocity: 50,
        invaderInitialVelocity: 25,
        invaderAcceleration: 0,
        invaderDropDistance: 20,
        rocketVelocity: 120,
        rocketMaxFireRate: 2,
        gameWidth: 400,
        gameHeight: 300,
        fps: 50,
        debugMode: false,
        invaderRanks: 5,
        invaderFiles: 10,
        shipSpeed: 120,
        levelDifficultyMultiplier: 0.2,
        pointsPerInvader: 5,
        limitLevelIncrease: 25
    };

    //  All state is in the variables below.
    this.lives = 3;
    this.width = 0;
    this.height = 0;
    this.gameBounds = {left: 0, top: 0, right: 0, bottom: 0};
    this.intervalId = 0;
    this.score = 0;
    this.level = 1;

    //  The state stack.
    this.stateStack = [];

    //  Input/output
    this.pressedKeys = {};
    this.gameCanvas =  null;

    //  All sounds.
    this.sounds = null;

    //  The previous x position, used for touch.
    this.previousX = 0;
}

//  Initialis the Game with a canvas.
Game.prototype.initialise = function(gameCanvas) {

    //  Set the game canvas.
    this.gameCanvas = gameCanvas;

    //  Set the game width and height.
    this.width = gameCanvas.width;
    this.height = gameCanvas.height;

    //  Set the state game bounds.
    this.gameBounds = {
        left: gameCanvas.width / 2 - this.config.gameWidth / 2,
        right: gameCanvas.width / 2 + this.config.gameWidth / 2,
        top: gameCanvas.height / 2 - this.config.gameHeight / 2,
        bottom: gameCanvas.height / 2 + this.config.gameHeight / 2,
    };
};

Game.prototype.moveToState = function(state) {
 
   //  If we are in a state, leave it.
   if(this.currentState() && this.currentState().leave) {
     this.currentState().leave(game);
     this.stateStack.pop();
   }
   
   //  If there's an enter function for the new state, call it.
   if(state.enter) {
     state.enter(game);
   }
 
   //  Set the current state.
   this.stateStack.pop();
   this.stateStack.push(state);
 };

//  Start the Game.
Game.prototype.start = function() {

    //  Move into the 'welcome' state.
    this.moveToState(new WelcomeState());

    //  Set the game variables.
    this.lives = 3;
    this.config.debugMode = /debug=true/.test(window.location.href);

    //  Start the game loop.
    var game = this;
    this.intervalId = setInterval(function () { GameLoop(game);}, 1000 / this.config.fps);

};

//  Returns the current state.
Game.prototype.currentState = function() {
    return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
};

//  Mutes or unmutes the game.
Game.prototype.mute = function(mute) {

    //  If we've been told to mute, mute.
    if(mute === true) {
        this.sounds.mute = true;
    } else if (mute === false) {
        this.sounds.mute = false;
    } else {
        // Toggle mute instead...
        this.sounds.mute = this.sounds.mute ? false : true;
    }
};

//  The main loop.
function GameLoop(game) {
    var currentState = game.currentState();
    if(currentState) {

        //  Delta t is the time to update/draw.
        var dt = 1 / game.config.fps;

        //  Get the drawing context.
        var ctx = this.gameCanvas.getContext("2d");
        
        //  Update if we have an update function. Also draw
        //  if we have a draw function.
        if(currentState.update) {
            currentState.update(game, dt);
        }
        if(currentState.draw) {
            currentState.draw(game, dt, ctx);
        }
    }
}

Game.prototype.pushState = function(state) {

    //  If there's an enter function for the new state, call it.
    if(state.enter) {
        state.enter(game);
    }
    //  Set the current state.
    this.stateStack.push(state);
};

Game.prototype.popState = function() {

    //  Leave and pop the state.
    if(this.currentState()) {
        if(this.currentState().leave) {
            this.currentState().leave(game);
        }

        //  Set the current state.
        this.stateStack.pop();
    }
};

//  The stop function stops the game.
Game.prototype.stop = function Stop() {
    clearInterval(this.intervalId);
};

//  Inform the game a key is down.
Game.prototype.keyDown = function(keyCode) {
    this.pressedKeys[keyCode] = true;
    //  Delegate to the current state too.
    if(this.currentState() && this.currentState().keyDown) {
        this.currentState().keyDown(this, keyCode);
    }
};

Game.prototype.touchstart = function(s) {
    if(this.currentState() && this.currentState().keyDown) {
        this.currentState().keyDown(this, KEY_SPACE);
    }    
};

Game.prototype.touchend = function(s) {
    delete this.pressedKeys[KEY_RIGHT];
    delete this.pressedKeys[KEY_LEFT];
};

Game.prototype.touchmove = function(e) {
	var currentX = e.changedTouches[0].pageX;
    if (this.previousX > 0) {
        if (currentX > this.previousX) {
            delete this.pressedKeys[KEY_LEFT];
            this.pressedKeys[KEY_RIGHT] = true;
        } else {
            delete this.pressedKeys[KEY_RIGHT];
            this.pressedKeys[KEY_LEFT] = true;
        }
    }
    this.previousX = currentX;
};

//  Inform the game a key is up.
Game.prototype.keyUp = function(keyCode) {
    delete this.pressedKeys[keyCode];
    //  Delegate to the current state too.
    if(this.currentState() && this.currentState().keyUp) {
        this.currentState().keyUp(this, keyCode);
    }
};

function WelcomeState() {

}

WelcomeState.prototype.enter = function(game) {

    // Create and load the sounds.
    game.sounds = new Sounds();
    game.sounds.init();
    game.sounds.loadSound('shoot', 'data:audio/wav;base64,UklGRhQQAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YfAPAACBY2ek1oEfacx2N1yM4Zg9VJq4ZUuB0YcvXn3PpkhPh8N2RHrNiEBqj61pNnrIhUpq1+xbK1SjcyJRltG4xr9xXwwAT6dveO7//3YAAAAAAFns/////74AAAAUqqGJ////tSUAAA8APKf//////zwAACk8LIDT////ljMMAAAKiMnQ7P//0QAAAA8QH4D//////JAAAABNREur////6Ys1AAAJak170f///5JEBwAAAIimn9v///9SAAAAAABR1uHl////cwAAAEs/L37R////3nc2AAAAcIVnuf///96ISgAAAGZgYrH/////v3cAAAAsfXR63v///+xiMgAAABGB0KTC////xhMAAAAAKJrNv9H///+TShQAAABwjHe0////7NN6AAAAIVVRe8///////4QAAAAdHyFzuP//+P//4iEAAAA3LDqA1//z////4iQAAAAMH2Kq6OHk////jCcAAAAADWDAwK7y////zzIAAAAAAEaV6MC/+P//7IwoAAAAABh20Kej4P///9GJPwoAAABYeHOZtf3//+Tv21cAAAAAFjaCzMix7v//59CJSwAAAABeaXCy4czX////yXAsCgAAAFtlc6fW9ejY///hlj8XAAAAKGVxjMbYxtv//+m0iVERAAAAQE5smsXw1M/p///RkEckAAAAFmdqiKrI+N3U6f//w3AlBgAAABt+gIutvuDz3dbp/92QNgIAAAAAQ5qxoa2r1vrd0+HzzHowCQMAAAJLmqegscraw8Pd+eu8j2k1AAAADz9PhabK166gv/DlzcjPzG0UAAAAABNZpK6jqLvYt6vK0/DUq5pxRAAAAAAQNnOYyNaynbDJwLHD2tCoiFc3AgAAADdNbJi008amqrvDtbnN2q6VhFs8AAAAA0BYbJ/GxbWnscKtn7i+1sqgmYxnIgAAAwYTR3OmzLiqt8WmkJi0zMKutLmdhGA8JAAAABhOaX2cucqxqKi1qo6atMm1p6irqoBVLB4QAAMWOniJla2wwrmknJyqkoihub+rnKOojmxUPBEABx0wN1WAq7ersruyoJOYoJKFlai8qpqfn5yCbWBEFwUNFzJHUWqSqLy/rauorqGLi5OQhI6fsK6gmZaTloBtWzUsIg8YKEZSYH6VtLiyra6xppCQlZaJfoGPlZmco6iVi4iHiHZqXEouGh8sNzxLW3eSnKatt7eooZ+fnI6Lj4+EgIKLkImPmKOgk4yFiIF0cHZwWUQyLjU1OkNUaWlxiJyqq62wsaegmZmYjIuOjIyChIGJhYCAh4yOj5OWkoiCgX6AdG9xeHdXLg0ABjVgi6HI//+uUjo3advQUkdGcOvMT0ZHeO/PT0RDdvLMTkFBcPLPTkA8bfPTTTo5Z/XYUTw6Y+jhUjU6WN3sYjU6Uc36djM3SLf/izM5P6f/pDc2OY//vzo1N3P/1kszN2Do82AsNk7I/4UvOT+j/7E1Nzd6/9dALzNi7vViLjxLv/+WLjU3jv/JOjAyZfPzWywzRr7/mC42OoH/1EQrMlze/3QrNj2k/7szLjVm+PZeKTZBsP+uMC42cf/sUSg2SLH/qC8wOm/89VkuM0ew/7QyLjZl6/9qKTZAmP/PPyczWMr/jCgwN3j/8FIoNUSj/78zLjJe1v+IKDU5eP/yWCk2Rpz/zzwrNVW+/6YuLzxl3v99KTA9ev/zXyUzRpD/3UMpNkuk/8g3KzVUuP+xMi45X8n/nC8vPGXY/4ssMj1w4P9+LDNBceX/eicwP3Ps/3gvMEB35/92KzJEdOX/gC4vQ3Db/4cvNT9szf+aMjA9YsD/qjIyOlyt/8M5Jy5Nlf/QQSIzTon/6U8pMkh46P9wKy9Dasn/oC8vPFyq/8g/LjdSjv/yWzAyS3bU/5IwLz9lp//JQC85VIjz/WosN0dvvP+xNy83W5L881wvNk1xv/+oNjA/XJD682AzMkpquP+5OTA2V4Xp/3QyM0FppP/WQzA1VHbI/6A3MzpfjPL8bDAzQ2Wf/9hHMjJRcbT/uzkvNVh6zf+ZMjA9YIfi/3szNUFikPLwZjAwSGeS/+hUMjVKZ5z/3lQzNk9qn//gTjU2S2qa/+JVMzZLaZj/5FkzNkpqk/XuajIySmeL5/p+NTVBZYHQ/5M2NT1beL//sT0vOVdzpP/TRzY1Tm2S8/BsNzdBaYDK/5w6Mzpic6v/0EozNU9wj+T9gDczQGZ6tf/DQzA5WW+P6fl7OjdEZnew/8NIMzpUcIjY/5Y3Mzxcc5/95WM2Okhne7L/w0Q1PFFxiM//pD0zOll3kOH/iTo2QF53mu/wcDY6RGd3nPbgYC4wQWV2n/bgXjI3QWp6n/jdYzM3RGl+nPPkbDczRmV6mufygDc3QWJ3kNf/mDw2P1t3iML/tUAzP1Vtfqv/2l45Okdsepnh9Yw5M0Nedoi7/8BKNTpSbX6a5faCOTlDX3aEt//FTTY8Tmp9ltb/mT02P1h0fqby4nA6MkNgeIi0/8pPNjdHZnqOw/+1RDU8T2x9kMb/q0MyOVVsfpDK/6hBMjpVcICSxf2tQzI5Uml7i779uUgyOk9sfomx+c9cOjxIY3eFoeXsgjozQ15xfpPG/K5DMj1UaYCIpPPbZzo1Q2B0gpLG+apEMj1Pb36Fo+flfToyQF9wgYyx+MpcOjZIY3aEk775u0s1OVFqdoWQyP+wQzY8UW17iY/F/K1HNTxRanaJj776u002P01md4WQsfDKYzY2SmJ2hImk4OiEPDA/XnN+jJjD+bJINzdObXeHkKjh5IE/Mj9bcIGLkLzvyFw8OUdld4WPlcX5tEg1OUZlcYGIkMXup0QyN01mdoWMlsXwqkY5PFFmdISOj77wu1c1OUhjdoSPj63l1Hg8MkRbc36IjJzG76hINzpPaniFi4+o4NqEPDBDW3B9hY+SsOjMbDczR15xfouQkLXow2c5NUdfcIGMjI+u4sxzOTNHXnB9h4+PpNHgkkAzPE9se4WMjJa45btZNjZIYHSBi4mOoMXlnEQzN05qdoKIjJKhzN2VQDM/T2l4gYyOi6DK3ZxANTxLZniCjJCQmrzgslk3NkZfdH2Jj46OpMzYkD8zP1RmdoKIjI+Tq9bGejwwQVhwdoSLi4uPqNHKgDwyQVdpeISLi4+PoMbUmEY2PE9ldoKJiYmOkq7QwnQ5M0dZb3uAiYyPk5Kx07htOTNGXG97iImJj4+Tq8rGgD0yP1VseISLjI+PjJi40KNZNjZKYHCAhIyLj46MnbjNn1Q6NUhidIGLj46SjImTsMm0bzkzRlxvfYSMjpCOjIuat82dVDYzRlxqfYWIjoyJiIeQtMijYjcyS1lwfYWLjI+Mi4mHnbzDkEs3N1Fjc4SJj46Oi4yIiJm4xZlUOTdNYnOAiY6MkIuIiYuOobm5i0o2QE9mdIGLi4yQi4yIh4iWsMChYDo1TWBze4SOi4uOjoeJh4KWsbygZTo2SFtveoeJj46Oi4iJh4KFmbC5lVc9N01ecIGHi4uOjIuIiYeEgImhsreESzU8UWV2goiMi4+Mh4iJgoGEgIyntadzRjZDVWx3iIiOjouOjISHhIKCfoCTqLecakQ5QVxqe4SIjoyMiYuFgYWCfYKCfpKnsKBxRzdBV2l3hYuMjImMi4KFgoGEhIB+gouap66OX0M5SF9vfoSMjoyMi4iJgoeEgICAfoJ+hJajraF2TzxDVGZ4gYeMjI6OjISHgoKFgYB+goJ+fYKJnKOqkmZKOkhYbXqCi4yMi4mIiYKHhICBgISAfoB9goKAh5afo6N9W0E/S19ze4SMjo+Mi4KEgYCAe4GBfXt+fn59gX19fX6Hj5qfnYdmTj1HWWp4gYmLj46Oi4uIhICFgICEgH6Efn6CgH5+foCAgH2BgouYmJyWfmNSQUZZaniFi4yPjIuJi4SIhYGAhYGAhIB+fYKAhIB+gn5+fn19fX6AgICAgIGOkJaTkIVsW09GTWBqe4WLkIyMi4mLhJmwd2ZxcXSCpnpjgnGEpnZngm+IpnNpgW+EoHhmgHOCoHhlgW2Co3dpgG2CpHRlgW+CpHRsgW+An3dwgW99nXh0gGp+loJ7eG94i5J+cXR3hZl+anhxhKB6ZoBtfqNzb4Ftfpp9d3tveIuSfm14dIWkdmaAbX6jd2yBb32Vgnt2c3qEn4BsfW+EpHZtgW99loSAd3B3hJ97aoBvgJ94dn1weouWfm99c4GkdHCAb32QjoBxdnSCpHhqfnN+kot7cXp0gqZ2aoFwfZCPgXR3doKgdHR9dH6FmoBtfnSAmX54eHZ4hKZ6bX5weIiLfW1zdnuaenR4cHqBo3dse3F9iJh+cHp2epaEfXd0dIKdd3Z7dnqEn3htfXN9iZx7b3t2fouOgHR3doCThHpzdnuAmIB4fXR0hJl4eHt2eoCdend9d3uBn3R0fnd7gZ90dH53eISfdHZ9d3iEmnZ2e3p7gZl4eHt2eoCYeH19dHt+kIJ4eHF6fpCJenZ2e3iHk313d3p4hJp6c3t2d4Sad3F7c36Eknp9enN6fYmPfnd3fXiEmnpzfnt6gZl6d313e36Ljnt3d312hJp2dn10fn6MhH17dHt4hJp6cXp2eoCSfnt6c354hJl0dHt2eoCOgXt9dHt4hJl0dIB0fn6LiXp4d3p4hJV4fX10gXqBmXp3fXeAe4iQgHh2e3uBjn56fXeBdoSVd3t9d4F6gZl4eH13gYCBlnp6fXiBfYSLenh3fX2BjImAeHh+fn6JiXt6fX1+gYeJgHh4e4CAiIl+eH19fX2IjIB4fX19fYSQgHN3dHp7gZB2c312fniCkHZ6gHSAeoGMeH19d4B7gYiEfX16e4CAgY97en17gH19jnh9fXuAgICEiH56fXuAfYGPdn19e4CAgISIfnp9e4CAgY53fX17gICAgYl+en19fX6Bjnp+fXuAfYCBjnd7fXt7gICBiX19fXuAgICEgnt9fX1+fn6Ifn19e3uAgICJeHt7e32BgICJeH19fXuAgICIe3uAd36AgICIe3uAe3t7e4GIe319d4CAe4KHgYJ4fX19fX2Bh319fX17gICAiXh7gH2AgH19hH19fX1+fn5+foh+eH59e4CAgIh7fX17gHuAgICFfn19fXuAe4CFe319e4CAgICAh3t9fX19fn5+god9fX19fX5+foKCfX19fX5+fn6CgX19fX1+fn5+hH19fX1+fn5+goJ7gX19gX19fX2BgX19fX1+fn6CgYJ+fX19fX6BfYGHfX2BfX19gX2Bgnt9gX2BfX19gYGCe319fX5+fnqBgHt7e3p+en6Ae4CAgHuAe4CAgICAgYF9gX19fX1+fn6CfX19fn5+foCAgIF9fX19fn5+fn6CgX19fX2CfX2BfYGBfX19fX5+foJ9fYF9fX19gn19fX2CfYF9gYF9fYF9gX2BgX19fX2BfX19foCAgX2BfX0=');
    game.sounds.loadSound('bang', 'data:audio/wav;base64,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QS9Jy/cbJpHO2x4Qm+CYLHTLsSUcxuNSL5nHeyxn24IqqcV4NCm871Axtc5ELaPEpiMl47QpXN2qKWXTrC4ox981PIrathtqyYIxMbzqcy6Jy1gxrsR3NUHS0h8gwtZIM8bHMiun0E8yvM1VMYjBoCsh2dxPN2fOxyQx270pTNXGJCa32GM+WcrqLyinxl4ttsJaPEXW2ixN0rwhLYvVzSQy2b8qK7nXWkVkzNwiPdC6KSWozoA5cc2sKUTcozJTztcwKaLCfD5GvuBBO824KTTQxz0xkcpwPZPKji9pzJMtZM+cL1nOsCFqzXRAVcXaPjt8yLMhXM+JMW7Cqig726gvXc66JzSV1bglQtG/LSrKuDJJheC6I3C/li0qyc5GPqDCdjxpz6wuQ83DLEjOtSwxtchrQnTGriszpNh5M6+zWT1f0p41ZM26JzOpzndBWLfTOzzIsDs9dMu+KUvUsS47xcRBRKTDaTmotVdCbcm/KDPAwnhAUM3LMjbDtk9JY9K+MlPLwC04rrxWQcSwLk/QqTFEwcZkRlTKxyxBfc+1M1HIvi88rLhUQ7y5VEGQw2tJb8LOPD2VuG88p7FoRVDOwDpPx603U4zNrx0vtbhOU2bDzDZJa8a7L06QzYI8Xr3BQkFyxJg0h7aJOkTPxE5FmrZdSZ27aE1nts9FSMCqQD+msVpVabzMQ0vGq0BMaMbLQUl5vrErSJ3FpzJByqRCWJHSij9fuL5KRG+/uCpHyaw5UpXGri9Au7RHV8GfOFLDrT5SuLNLS5y4aEWUtWlKdMCyMkiot2FMi7KWM1zEmTdQw7dBV8OTQlmnv2hMbL+iNVK9skNPdcK9MEaWuXRFoaZrTlnEuTlWwKQ+Uqm2YEydqnlBcr11TmyrxXQ8c7R9R2G9tTxZw6I/TJW4eEaiqFBUm7hpUG6vuERTlrGYMUe7r2BPYbi1R1Sqq1ZUg8CnNE2nsm9LW7O5V1GNs3JTba28VVJwuqo3W8CjPE6dtW1UirmVPVOrtnVKWMGuQ1Z4v7Q0VaiuWlK0nFVVb8GkQWOtsGtHYLuiQWK4o0hauaVIU5yve0l0vYVQc7yfO1aFxZ0/bbadOlKdsnlLXJXCg0RXn7ZqTXmzh0prtKBBW6mpaE5js61JX7mgSlmAtqM5Xb6fRlavn1JikrqZP1O0plZYkKt5Umq4pEpdnatoVIG1lEBcisCmN1e4mEZdn7BpWJugclB8tXpSf7OWQlitq1del6uFRWq5g01njcWJSX+nhEZWo7FpWYarhUpquo9NaaymT1iOqnpQaZK+h0dfrpxJYn66n0FajbKLS2WtnEpinKh7S3Owj0VluZFLareVS2GgpGBgp5plUoymZGR3n7NcXoKwmz9WnaRoXIWvj0hmqpZVY6OlZFtwlbl1UIGib1eMpG9cjqOATnGwjUxiraJqW3KzlEppo6NkWZGZY2SIsX9Wcoq4iUVeo6BdY3qxnEhelqRtYIirg1Jpk69pW5eWaGBrkrh2WJCYbF93sZVIZnywpVRgiKWCUGyrl1JojaqFU2eWrIJRZKmdYmNxqZ9Va5aieFdwq5dNZ6mQXWaLsnxec4W1hk1mopldX3KmllBpkaNyWpKTZGWDq4pPa4CymE5fh6OCVnOnj1hsmp51WWyqmVlmmJRwY3Gtklptj6p5WWyPq4JSbKqLUGuCrZ5Van+pmVBllJptZIigeV51o5NdaZGgbmR3oJ1gZ3Wok1Fpi6WIVmeemmVpk5xzYnScmVtroZFdbXSTrmpqdoqoa1+JlXRgcqOUXWuFo4tTaaCTYG6ZkmlpdY2thVRxo4RWbX6llWFsf6aSUWySimdrmZBobYSkgmF0mJVmaoGkiVNpjaB9YG6Mp3lldJuRXmyHn4RYbIqlgl52oIlbbIqcgmFyoI9bcJaNZm2WkWhslo5tbH+jiFtuhqGEYHCUlW9lgpl9Y3GJqIhabI+Yc2p9mYpdepp/Y32ed2d0iqd6YXOVkWlsiJJxbXaFrIVdbYuWcWyGk4BhcJeTaXN+jplra3qUk2Vsgpl/ZXiUi2pxf6CLYW2ImHtpfpqKXm+LlXtpd5iPam6HknppdpmPbHF0kZFpb3yZh11yloZmdXyUlm1we5eKYHB8mI5pcH2ahWZ0fpqRbG9zjZZudHqFnnNvgA==');
    game.sounds.loadSound('explosion', 'data:audio/wav;base64,UklGRj8iAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YRsiAAB4d3d3eHiBgoWBfXd3d32Ah4mFe21jW1xldIeMj4J7aWBZXGlzdHh3goWLlaOrrq2hj4VzY09IS09SV2d9j4uJiZWjraiZhW9pam13iZWMhYWPmqi3u7y4raOPcUsnBQAAAwkTLlJpeIeLkK3D0NPKv7W1yuz///////DUwKuCVS8kKSUhKzkzIQMAAAAABQkYQ3idscne7/r27NjAn2UpAAAAAAAAOmeBocDa7/LduKOdnZ+joYFRJREHEyk9WYuyw83KuKGZnaG1u7GklaHF9v///////OKtaScAAAATR2WFqLeuo4txY00vHyQpJytNfZqVgF9BOU9jgqGtwN32/+u1czAAAAATOnOr2Nixd0MrJx8YEQwPG0+V4v/////////wz51NAwAAAAAAAClIT0NDX3N9gHh9k7ze////////+f//////yoxVHQAAAAAALnGBcU8pERs9T1xnZ2pzfZrU////////3qNzVWCAo8DPw49IAAAAAAAAAAA1h8n//////963kGo/AAAAAAAAAB2FwNTP2PX////5083d+v/////UjGpph6fD2tjApIdzaWBcX2dtd3NVLw8PL1dzh5WfvOj///////////+3ajcRGzpXga7a79ehXx8AAAACESdXgZOdqLe8qHNBHx0hHSQ1PUFGVVxSUks6KTA6SGeVwOXv4smkkI+TiXdnV1Vzod3///bs2tC3loBvZVxjdIeQlZ2jpKSnn5qao623u7u/u7GnoZaJd2plY2NgZ2ljXE9GRkdLTU1SZXuJkJqjrrGtraGZiW9SNR0WHSU6V2p3hZWjra6kk4mHhYeLh3hfSEE6QUtVY3eCjJOPh4mZqKiroYt7anGHq8/r///////dmk0RAAMuT1tneIB3cVxGMx8RBwwbMFGCu9TKq4txanR3gYyMmau/w62CXDkXDRYkOmOPsbedd1VHTVlbT0dHT3er2P//+ezh08q/rY9SEwAAAAAAAC5IT0NGX3F7e3h7kLLN8P/////27Pb////8zZZlKwAAAAAAMG17aUckDxg6TV9nZWpxgJrU////////3qNzVWCAo8DPw49IAAAAAAAAAAA1h8n//////963kGo/AAAAAAAAAB2FwNTP2PX////5083d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b1I5Hw0AAAAAAAAAACE9T19pfaHD5///+uHApI+Bh6vi//////nAez8JAAAAACdxt+z//+uxgmBNLwMAAAAAAAAAPZnN1MC3w9fs/OvJrZ2HWzUnJR8bGB03b7f///////b26MWWb1c6N0Ztrvn///////zQk1UXAAAAGEiAq7WopKOkp514QQ0CDRgdNVV7jIBcRk1jbVxHPU19t/D////oxZ+WnZB0W197ncXi69qylYJxZ1tXUVFSVVxjZWpXNy9IY21qc5O/5fDUsp+rrZ+AZUEzMEh0kKO/6P/////Uk1k5OUNXfafNz7yomoFSGwAAAA1GeJ+rmndXKxMYJR8MAAAAGD10rcnY3tDJ0+H1///85cCQb0cPAAAAAAUXSI/X////9uvs///ntYBPLxsdM2eu9f///+jKq4FcQzVBc6vd////2pNVNS46T2BpZ1UlAAAAAAAAAAAbM01pnc3n9fDl5/z/////////2olIFwINQXOJnbe/p31NGAAAFiUwTXuntbvF1Nra0MCnj2MnAAAAAAAAE2qTloJze5+/yr+on7fa////////2sOymnRbRi4vSGp9e3iCkKGuo4V0Uj9IW2BVPy8hMFd7kK3Q5/z//+zQspaJhYKPte///////890QSURAAAYP1FZandqRhcAAAUnN0hlc21lamlbTUElCQkTGB85aaHQ4d7d3d7Pp3RXRzpIb5nA4ezlvJ+Qi4dzTy8uR1tneIBxcX2Ln7fAuK6dma7N5f//////////57uhiWNNQz8uDQADHS4vHw8ACSlLX3eWq8De9vno4t3DoYdfOREADBckMFWJuOX56MWjdFdSWWd3gYBZJQAAAAAAAAAMP3GkyeH//////97GspmTna28rZmCZ1JHLxcDAAk1dKO808+1o52Vk6e/u599VTclJUiBp7WxrbzGu7KjgVxHRjkwOVd7hY+Lgn1xY217eGNDHwkAAAcraq7Q1NDY6OfNqJmdq8DPz7uPTxMAAAAABzp4oa68z828qI97fYKBalVRSEE3MEZ0p8PU2s3KuJ19X0tNbZ/X9fDnzaN4Y1dHNys1XJPF6//816iJdGdSJAAAAAAADFydytPJv7u7u7iuo5mFcU0WAAAAAAAAIUZqnd3////87Pb////n2MmympaZj4WJqMne2sCrfVEuJx8PFiQvLj1PW1ljb3SB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rqSfnZ+hn5+Te2lfXF9bT01XUlFSUVFXV1dfaneHkJmnuLu4tbe7u7exq5V3Y0swISEzUW+CiYJ7b2NpbW1tamVnaWNcVVtxjJCVjIB7fYuhqKOfoaSjmYmAc2pfVU1HTVt0la64q5N4ZVJZXGV4h4mBc29pXFdbX2dvc3h9e4B4cWNbUllvjKSxrqidj4VzZ1VLR0dLWXeVu9jn4c3AsZ2HeHh3d2pgVUs6MDlNaXuBfXdzfYmWpK6xra64xtPY18atmYV4ZUs/Pz1HWWlvampxgYyTi31xbWpvc3N4d3NqZWBtgpmuuKeWj4B0Z1tfaoGVmpOPgG1XR0FGUVxthY+PhYCAc3RvamNXUUtPY3uWqKutp6GdkIFzbWNSUVFRTUE/Q0hVW2BfYGBpe4eTo6GjmZCPmaS3w7+3squah3RvZ2Vvd3txamlqZ2NfXGd7kJqamZmWlZmhmpaVlY+FgIB3al9fZXOCiYyQi31xZ2NbVVJNR0tXW2NvgYyVoZ+an6OdlpCJhYKHkKe7v8PGxsW3nYJlT0dLXG2Bi5OLgGNXT1FPRj06Rk9cbYKTmp+ZjIeBgHdtampxb2dnX1lZW1lbZW90jJadnZqViYeFh4mVmpaMgHdvamlvgImPlZ2fmZaWlo+FeHdtbXiHmaSrraeZgm9SQzcwJyc1Q01jdIeQlpCCgH19fX17al9bTUE6Oj1DT1lpeIWPpLG3u7exsrfDxcC8u7Gdh4F0amNlb3iFi4+HfWNZVVdSTUNBP0NHUmV9k5qZk5CVmqiusaeWi3dnV1FRV2Nqc3RxcXuAhYKBgICLmaOjp6SdlZCMiYF3b2BZWVFSVVdganNvbWNlZ21vcW90dHuFh5OdpKSnp6Shk4mBeHd3fYGAgH1vZ2BfaXF4fXt4dGlnX2Bqd3h7c2ptbXF0fYKBgIGCgoCAhYmLh4KBgIKLmZ+hoZqPhXt0bWp0gYWJjJCMgnt0dHd9gIBzZ1tPSEtSXGdteIGJjJadpKSdk4uHfXFqY2VgX19jcXd7gYeMk5WQjImBgoeQn6GdnZOJfXt7eHt4dHd9fX2BgIB7eHd0b3Ftam1veICBgYWHj4uLjImAe3dxamppaW1tcXd7gouMkIyHh4eHgoGAgoCBfYWCfX13c3R0d3dzcW9xdHd4eHR0b3Fzd3R0c3N4fYB9fX2CiYuJh4eHiYyQj4mCfXt3c3N0e3uAfXdzcW93gImJiYeCe3d4gIWCgoB3c3R0eICBhYKAfXdtZ2VfW1lgY2l0gYuQlZCJgoB4dHRvaWNcW1VZXGNpc3SAhYyQnaSop6GamZmfoaOkqKOai4l9c21pbXN7fYKFgHNtaWlnY19bV1lbYGl3gIKAfYCCjJmdmpaPi31xZ2BjaW94gIGAgIKChYF9fXuFkJman5qWj4uCgntzcWVcW1lcX2Nqc3Rzc2ptbXFxc29zdHh9hY+Wmp2hoaGfk4mCe3t7gIKBgXt0amVjaXN3e3h4eG1pZWdteHt9dG1tb3N3gIKBgIGCgoCChYmLh4KBgIKLmZ+hoZqPhXt0bWp0gYWJjJCMgnt0dHd9gIBzZ1tPSEtSXGdteIGJjJadpKSdk4uHfXFqY2VgX19jcXd7gYeMk5WQjImBgoeQn6GdnZOJfXt7eHt4dHd9fX2BgIB4d3RzcXNtam1xeICCgYWHj4uLiYV9eHNtZ2dnZWlpanFze4eFiYeAgoWJi4mHh4KBfYGBgIB9fX19gIGBfXRzdHNxb2dpZ2lvcXN0dHR4hYWFh4ePmZmVkJCLiYeLiYF4eHRvaWllam93eHdzc3F3gIWFgX1xaWNncXuFhYKAdG9qZWNlaW1vd3t9fYKBgICAfX2BhYyQlZOLhXt4b21nY2NgY2dvfYmJk5CQj5CTk5WWj4eBd3h0d4CHkJCTjIyHfXhtZWVqbXOAhYeJh4WFhYKBfYB7c21nW1VPUl9ncXR0dHd7hYGChYKFiYuPlpmdmpOLhXt4eG9ze4GAgoGAdG9paWdlaWdlaW93fYeJiYKCgICAgH19dHNqaWppbW1xcXN0e4WFiYWHgoeChYuJjImJgHt7c21pbXF7gH2CgYCAgICAgH19fX19gYKAgH19gYGCgoCAfXdzb2ptdHh7gYGAfXh7fYCAgIB9gYKJiYuMi4uHgoKAeHNzb3F0dICCgYKFgoKAgH19fX19e3R0c3Fvc3R4e32AgYKFhYWHhYWFh4WFh4uJh4F9e317gH2AgIGCgoJ9fXRzc3N0cXNzc3iCgYKBfYB4eICAgH2BgYF9dHFpaWlnam90e4WLkI+LhYB9fYCAgICAfX10c3NxcXN0eHt9gYGAgIGBfX19dHd7gYCAgICAgIB4eHd7gYCBgoWLi4uJgoWBgn17fX10c3h7gYB4d3d4e3h7e3d7d3uBgICAgICAfX19fX19fXd3e3uBgICAgICAgIB9fX19fXh4eHd3eHuBeIGAeHh3d3t3e3d4e3d4eHR3eHt4e4F4e3t7gYCAgICAfX19fX19fX19fXh4d3uBgICAgIB4d3uBgICAgICAeICAgICBgYGAfX19fX2BgX2BfX19fX19fYCAdHR0dHeCgYCAgICAdHR4gYCAgICAdHR0dIKAgICAgICAgH2BgYGAfX19fX2BgYeFgYB9d3R3e4GAgICAgICAgICAgX19fXRzdHR3goCAgICAgICBgYGAgH19fXR3dHR4dHh4gIGAgIGBgoKCgYB9fX19fYKCgoWFgYGBgYB9fX19e3h3d3RzdHF0dHt9gYGAgIGCgoKBgIB9fX17gHh3e3d7gYCAgIF9gX19fXt4eHd3eHh4eHR3eICBgICAgYKChYWHhYWFhYWFgIF9e319d314fYCAgIB7e4B7eHd3dHNzd3t4goCAgYF9gX19fX17eHh4d3Rzc3R3e317gYCAgYKCgoGBgYGBgYGAfXh4d3d7gYCAgIGBfX19fX19fX19fYF9fX19fX19gX19gYKCfX19fX19fYGCgIKAfX19fX19fX2AgIGCgoKBgH19fXt4d3d7d3t9gYCAgHt4fXh4fYCAgICAgICAe3t4d3d7fX19gICAgIGCgICCgICCe319e3h4d3t9fX2AgICAgICAgH2BgYKCgYGBgYGBgYGBgYGAfX17eH14eH2AgICAgICAgIB7e3h9eH2AgICAgHt4fX19gICAgICAe3h3d3t3eHt7gYCAgYKCgoGBgYCAfX19fX19fX2AgICAgICAgIB7eHh9gICAgICAe3uAgICAgICAgH19fX19fYF9fX19fXt4fXh9gICAgX2BgoCC');
};

WelcomeState.prototype.update = function (game, dt) {


};

WelcomeState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font="30px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline="middle"; 
    ctx.textAlign="center"; 
    ctx.fillText("Space Invaders", game.width / 2, game.height/2 - 40); 
    ctx.font="16px Arial";

    ctx.fillText("Press 'Space' or touch to start.", game.width / 2, game.height/2); 
    ctx.fillText(" (fullscreen for better experience)", game.width / 2, (game.height/2)+(game.height/8)); 
};

WelcomeState.prototype.keyDown = function(game, keyCode) {
    if(keyCode == KEY_SPACE) {
        //  Space starts the game.
        game.level = 1;
        game.score = 0;
        game.lives = 3;
        game.moveToState(new LevelIntroState(game.level));
    }
};

function GameOverState() {

}

GameOverState.prototype.update = function(game, dt) {

};

GameOverState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font="30px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline="center"; 
    ctx.textAlign="center"; 
    ctx.fillText("Game Over!", game.width / 2, game.height/2 - 40); 
    ctx.font="16px Arial";
    ctx.fillText("You scored " + game.score + " and got to level " + game.level, game.width / 2, game.height/2);
    ctx.font="16px Arial";
    ctx.fillText("Press 'Space' to play again.", game.width / 2, game.height/2 + 40);   
};

GameOverState.prototype.keyDown = function(game, keyCode) {
    if(keyCode == KEY_SPACE) {
        //  Space restarts the game.
        game.lives = 3;
        game.score = 0;
        game.level = 1;
        game.moveToState(new LevelIntroState(1));
    }
};

//  Create a PlayState with the game config and the level you are on.
function PlayState(config, level) {
    this.config = config;
    this.level = level;

    //  Game state.
    this.invaderCurrentVelocity =  10;
    this.invaderCurrentDropDistance =  0;
    this.invadersAreDropping =  false;
    this.lastRocketTime = null;

    //  Game entities.
    this.ship = null;
    this.invaders = [];
    this.rockets = [];
    this.bombs = [];
}

PlayState.prototype.enter = function(game) {

    //  Create the ship.
    this.ship = new Ship(game.width / 2, game.gameBounds.bottom);

    //  Setup initial state.
    this.invaderCurrentVelocity =  10;
    this.invaderCurrentDropDistance =  0;
    this.invadersAreDropping =  false;

    //  Set the ship speed for this level, as well as invader params.
    var levelMultiplier = this.level * this.config.levelDifficultyMultiplier;
    var limitLevel = (this.level < this.config.limitLevelIncrease ? this.level : this.config.limitLevelIncrease);
    this.shipSpeed = this.config.shipSpeed;
    this.invaderInitialVelocity = this.config.invaderInitialVelocity + 1.5 * (levelMultiplier * this.config.invaderInitialVelocity);
    this.bombRate = this.config.bombRate + (levelMultiplier * this.config.bombRate);
    this.bombMinVelocity = this.config.bombMinVelocity + (levelMultiplier * this.config.bombMinVelocity);
    this.bombMaxVelocity = this.config.bombMaxVelocity + (levelMultiplier * this.config.bombMaxVelocity);
    this.rocketMaxFireRate = this.config.rocketMaxFireRate + 0.4 * limitLevel;

    //  Create the invaders.
    var ranks = this.config.invaderRanks + 0.1 * limitLevel;
    var files = this.config.invaderFiles + 0.2 * limitLevel;
    var invaders = [];
    for(var rank = 0; rank < ranks; rank++){
        for(var file = 0; file < files; file++) {
            invaders.push(new Invader(
                (game.width / 2) + ((files/2 - file) * 200 / files),
                (game.gameBounds.top + rank * 20),
                rank, file, 'Invader'));
        }
    }
    this.invaders = invaders;
    this.invaderCurrentVelocity = this.invaderInitialVelocity;
    this.invaderVelocity = {x: -this.invaderInitialVelocity, y:0};
    this.invaderNextVelocity = null;
};

PlayState.prototype.update = function(game, dt) {
    
    //  If the left or right arrow keys are pressed, move
    //  the ship. Check this on ticks rather than via a keydown
    //  event for smooth movement, otherwise the ship would move
    //  more like a text editor caret.
    if(game.pressedKeys[KEY_LEFT]) {
        this.ship.x -= this.shipSpeed * dt;
    }
    if(game.pressedKeys[KEY_RIGHT]) {
        this.ship.x += this.shipSpeed * dt;
    }
    if(game.pressedKeys[KEY_SPACE]) {
        this.fireRocket();
    }

    //  Keep the ship in bounds.
    if(this.ship.x < game.gameBounds.left) {
        this.ship.x = game.gameBounds.left;
    }
    if(this.ship.x > game.gameBounds.right) {
        this.ship.x = game.gameBounds.right;
    }

    //  Move each bomb.
    for(var i=0; i<this.bombs.length; i++) {
        var bomb = this.bombs[i];
        bomb.y += dt * bomb.velocity;

        //  If the rocket has gone off the screen remove it.
        if(bomb.y > this.height) {
            this.bombs.splice(i--, 1);
        }
    }

    //  Move each rocket.
    for(i=0; i<this.rockets.length; i++) {
        var rocket = this.rockets[i];
        rocket.y -= dt * rocket.velocity;

        //  If the rocket has gone off the screen remove it.
        if(rocket.y < 0) {
            this.rockets.splice(i--, 1);
        }
    }

    //  Move the invaders.
    var hitLeft = false, hitRight = false, hitBottom = false;
    for(i=0; i<this.invaders.length; i++) {
        var invader = this.invaders[i];
        var newx = invader.x + this.invaderVelocity.x * dt;
        var newy = invader.y + this.invaderVelocity.y * dt;
        if(hitLeft == false && newx < game.gameBounds.left) {
            hitLeft = true;
        }
        else if(hitRight == false && newx > game.gameBounds.right) {
            hitRight = true;
        }
        else if(hitBottom == false && newy > game.gameBounds.bottom) {
            hitBottom = true;
        }

        if(!hitLeft && !hitRight && !hitBottom) {
            invader.x = newx;
            invader.y = newy;
        }
    }

    //  Update invader velocities.
    if(this.invadersAreDropping) {
        this.invaderCurrentDropDistance += this.invaderVelocity.y * dt;
        if(this.invaderCurrentDropDistance >= this.config.invaderDropDistance) {
            this.invadersAreDropping = false;
            this.invaderVelocity = this.invaderNextVelocity;
            this.invaderCurrentDropDistance = 0;
        }
    }
    //  If we've hit the left, move down then right.
    if(hitLeft) {
        this.invaderCurrentVelocity += this.config.invaderAcceleration;
        this.invaderVelocity = {x: 0, y:this.invaderCurrentVelocity };
        this.invadersAreDropping = true;
        this.invaderNextVelocity = {x: this.invaderCurrentVelocity , y:0};
    }
    //  If we've hit the right, move down then left.
    if(hitRight) {
        this.invaderCurrentVelocity += this.config.invaderAcceleration;
        this.invaderVelocity = {x: 0, y:this.invaderCurrentVelocity };
        this.invadersAreDropping = true;
        this.invaderNextVelocity = {x: -this.invaderCurrentVelocity , y:0};
    }
    //  If we've hit the bottom, it's game over.
    if(hitBottom) {
        game.lives = 0;
    }
    
    //  Check for rocket/invader collisions.
    for(i=0; i<this.invaders.length; i++) {
        var invader = this.invaders[i];
        var bang = false;

        for(var j=0; j<this.rockets.length; j++){
            var rocket = this.rockets[j];

            if(rocket.x >= (invader.x - invader.width/2) && rocket.x <= (invader.x + invader.width/2) &&
                rocket.y >= (invader.y - invader.height/2) && rocket.y <= (invader.y + invader.height/2)) {
                
                //  Remove the rocket, set 'bang' so we don't process
                //  this rocket again.
                this.rockets.splice(j--, 1);
                bang = true;
                game.score += this.config.pointsPerInvader;
                break;
            }
        }
        if(bang) {
            this.invaders.splice(i--, 1);
            game.sounds.playSound('bang');
        }
    }

    //  Find all of the front rank invaders.
    var frontRankInvaders = {};
    for(var i=0; i<this.invaders.length; i++) {
        var invader = this.invaders[i];
        //  If we have no invader for game file, or the invader
        //  for game file is futher behind, set the front
        //  rank invader to game one.
        if(!frontRankInvaders[invader.file] || frontRankInvaders[invader.file].rank < invader.rank) {
            frontRankInvaders[invader.file] = invader;
        }
    }

    //  Give each front rank invader a chance to drop a bomb.
    for(var i=0; i<this.config.invaderFiles; i++) {
        var invader = frontRankInvaders[i];
        if(!invader) continue;
        var chance = this.bombRate * dt;
        if(chance > Math.random()) {
            //  Fire!
            this.bombs.push(new Bomb(invader.x, invader.y + invader.height / 2, 
                this.bombMinVelocity + Math.random()*(this.bombMaxVelocity - this.bombMinVelocity)));
        }
    }

    //  Check for bomb/ship collisions.
    for(var i=0; i<this.bombs.length; i++) {
        var bomb = this.bombs[i];
        if(bomb.x >= (this.ship.x - this.ship.width/2) && bomb.x <= (this.ship.x + this.ship.width/2) &&
                bomb.y >= (this.ship.y - this.ship.height/2) && bomb.y <= (this.ship.y + this.ship.height/2)) {
            this.bombs.splice(i--, 1);
            game.lives--;
            game.sounds.playSound('explosion');
        }
                
    }

    //  Check for invader/ship collisions.
    for(var i=0; i<this.invaders.length; i++) {
        var invader = this.invaders[i];
        if((invader.x + invader.width/2) > (this.ship.x - this.ship.width/2) && 
            (invader.x - invader.width/2) < (this.ship.x + this.ship.width/2) &&
            (invader.y + invader.height/2) > (this.ship.y - this.ship.height/2) &&
            (invader.y - invader.height/2) < (this.ship.y + this.ship.height/2)) {
            //  Dead by collision!
            game.lives = 0;
            game.sounds.playSound('explosion');
        }
    }

    //  Check for failure
    if(game.lives <= 0) {
        game.moveToState(new GameOverState());
    }

    //  Check for victory
    if(this.invaders.length === 0) {
        game.score += this.level * 50;
        game.level += 1;
        game.moveToState(new LevelIntroState(game.level));
    }
};

PlayState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);
    
    //  Draw ship.
    ctx.fillStyle = '#999999';
    ctx.fillRect(this.ship.x - (this.ship.width / 2), this.ship.y - (this.ship.height / 2), this.ship.width, this.ship.height);

    //  Draw invaders.
    ctx.fillStyle = '#006600';
    for(var i=0; i<this.invaders.length; i++) {
        var invader = this.invaders[i];
        ctx.fillRect(invader.x - invader.width/2, invader.y - invader.height/2, invader.width, invader.height);
    }

    //  Draw bombs.
    ctx.fillStyle = '#ff5555';
    for(var i=0; i<this.bombs.length; i++) {
        var bomb = this.bombs[i];
        ctx.fillRect(bomb.x - 2, bomb.y - 2, 4, 4);
    }

    //  Draw rockets.
    ctx.fillStyle = '#ff0000';
    for(var i=0; i<this.rockets.length; i++) {
        var rocket = this.rockets[i];
        ctx.fillRect(rocket.x, rocket.y - 2, 1, 4);
    }

    //  Draw info.
    var textYpos = game.gameBounds.bottom + ((game.height - game.gameBounds.bottom) / 2) + 14/2;
    ctx.font="14px Arial";
    ctx.fillStyle = '#ffffff';
    var info = "Lives: " + game.lives;
    ctx.textAlign = "left";
    ctx.fillText(info, game.gameBounds.left, textYpos);
    info = "Score: " + game.score + ", Level: " + game.level;
    ctx.textAlign = "right";
    ctx.fillText(info, game.gameBounds.right, textYpos);

    //  If we're in debug mode, draw bounds.
    if(this.config.debugMode) {
        ctx.strokeStyle = '#ff0000';
        ctx.strokeRect(0,0,game.width, game.height);
        ctx.strokeRect(game.gameBounds.left, game.gameBounds.top,
            game.gameBounds.right - game.gameBounds.left,
            game.gameBounds.bottom - game.gameBounds.top);
    }

};

PlayState.prototype.keyDown = function(game, keyCode) {

    if(keyCode == KEY_SPACE) {
        //  Fire!
        this.fireRocket();
    }
    if(keyCode == 80) {
        //  Push the pause state.
        game.pushState(new PauseState());
    }
};

PlayState.prototype.keyUp = function(game, keyCode) {

};

PlayState.prototype.fireRocket = function() {
    //  If we have no last rocket time, or the last rocket time 
    //  is older than the max rocket rate, we can fire.
    if(this.lastRocketTime === null || ((new Date()).valueOf() - this.lastRocketTime) > (1000 / this.rocketMaxFireRate))
    {   
        //  Add a rocket.
        this.rockets.push(new Rocket(this.ship.x, this.ship.y - 12, this.config.rocketVelocity));
        this.lastRocketTime = (new Date()).valueOf();

        //  Play the 'shoot' sound.
        game.sounds.playSound('shoot');
    }
};

function PauseState() {

}

PauseState.prototype.keyDown = function(game, keyCode) {

    if(keyCode == 80) {
        //  Pop the pause state.
        game.popState();
    }
};

PauseState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font="14px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline="middle";
    ctx.textAlign="center";
    ctx.fillText("Paused", game.width / 2, game.height/2);
    return;
};

/*  
    Level Intro State

    The Level Intro state shows a 'Level X' message and
    a countdown for the level.
*/
function LevelIntroState(level) {
    this.level = level;
    this.countdownMessage = "3";
}

LevelIntroState.prototype.update = function(game, dt) {

    //  Update the countdown.
    if(this.countdown === undefined) {
        this.countdown = 3; // countdown from 3 secs
    }
    this.countdown -= dt;

    if(this.countdown < 2) { 
        this.countdownMessage = "2"; 
    }
    if(this.countdown < 1) { 
        this.countdownMessage = "1"; 
    } 
    if(this.countdown <= 0) {
        //  Move to the next level, popping this state.
        game.moveToState(new PlayState(game.config, this.level));
    }

};

LevelIntroState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font="36px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline="middle"; 
    ctx.textAlign="center"; 
    ctx.fillText("Level " + this.level, game.width / 2, game.height/2);
    ctx.font="24px Arial";
    ctx.fillText("Ready in " + this.countdownMessage, game.width / 2, game.height/2 + 36);      
    return;
};


/*
 
  Ship

  The ship has a position and that's about it.

*/
function Ship(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 16;
}

/*
    Rocket

    Fired by the ship, they've got a position, velocity and state.

    */
function Rocket(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
}

/*
    Bomb

    Dropped by invaders, they've got position, velocity.

*/
function Bomb(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
}
 
/*
    Invader 

    Invader's have position, type, rank/file and that's about it. 
*/

function Invader(x, y, rank, file, type) {
    this.x = x;
    this.y = y;
    this.rank = rank;
    this.file = file;
    this.type = type;
    this.width = 18;
    this.height = 14;
}

/*
    Game State

    A Game State is simply an update and draw proc.
    When a game is in the state, the update and draw procs are
    called, with a dt value (dt is delta time, i.e. the number)
    of seconds to update or draw).

*/
function GameState(updateProc, drawProc, keyDown, keyUp, enter, leave) {
    this.updateProc = updateProc;
    this.drawProc = drawProc;
    this.keyDown = keyDown;
    this.keyUp = keyUp;
    this.enter = enter;
    this.leave = leave;
}

/*

    Sounds

    The sounds class is used to asynchronously load sounds and allow
    them to be played.

*/
function Sounds() {

    //  The audio context.
    this.audioContext = null;

    //  The actual set of loaded sounds.
    this.sounds = {};
}

Sounds.prototype.init = function() {

    //  Create the audio context, paying attention to webkit browsers.
    context = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();
    this.mute = false;
};

Sounds.prototype.loadSound = function(name, url) {

    //  Reference to ourselves for closures.
    var self = this;

    //  Create an entry in the sounds object.
    this.sounds[name] = null;

    //  Create an asynchronous request for the sound.
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'arraybuffer';
    req.onload = function() {
        self.audioContext.decodeAudioData(req.response, function(buffer) {
            self.sounds[name] = {buffer: buffer};
        });
    };
    try {
      req.send();
    } catch(e) {
      console.log("An exception occured getting sound the sound " + name + " this might be " +
         "because the page is running from the file system, not a webserver.");
      console.log(e);
    }
};

Sounds.prototype.playSound = function(name) {

    //  If we've not got the sound, don't bother playing it.
    if(this.sounds[name] === undefined || this.sounds[name] === null || this.mute === true) {
        return;
    }

    //  Create a sound source, set the buffer, connect to the speakers and
    //  play the sound.
    var source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[name].buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
};
