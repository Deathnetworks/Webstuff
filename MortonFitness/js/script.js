var btnConsult = document.getElementById("consultation"),
  btnLearn =document.getElementById("front-learn-more");
;

if(btnConsult) {
  btnConsult.onclick = function () {
    location.href = "https://docs.google.com/forms/d/1urzzCutYCekPsdKrUxzTtA9rhkOQQ3iMBliFljcnbLQ/viewform";
  };
}

if(btnLearn){
  btnLearn.onclick = function () {
    location.href = "coaching.php";
};
}
