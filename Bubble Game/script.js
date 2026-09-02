var hitrn = 0;

function makebubble(){
    var clutter = " ";

for(i=1 ;i<=306 ;i++){
    var num = Math.floor(Math.random()*10);
    clutter += `<div class="bubble">${num}</div>`
}

document.querySelector("#pbtn").innerHTML = clutter;
}

var timer = 60;
function runTimer(){
    var timerInt=setInterval(function(){
    if(timer > 0){
        timer --;
        document.querySelector("#timerval").textContent = timer;
    }
    else{
        clearInterval(timerInt);
        document.querySelector("#pbtn").innerHTML = `<h1>Game Over</h1>`
    }
    },1000)
}

function getHitElement(){
    hitrn = Math.floor(Math.random()*10);
    document.querySelector("#hitval").textContent = hitrn;
}

var score=0;
function increaseScore(){
    score += 10;
    document.querySelector("#ScoreGain").textContent = score;
}

document.querySelector("#pbtn").addEventListener("click",
    function(dets){
        var cliclednum = Number(dets.target.textContent)
        if(cliclednum === hitrn){
            increaseScore();
            makebubble();
            getHitElement();
        }
    }
)

runTimer();
makebubble();
getHitElement();
