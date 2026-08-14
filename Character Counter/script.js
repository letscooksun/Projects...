let inp = document.querySelector("input");
let span = document.querySelector("span");

inp.addEventListener("input" , function(){
    span.textContent = inp.value.length;
    if(inp.value.length>100){
        span.style.color = "red";
    }
    else{
        span.style.color = "white"
    }
});