let modal = document.querySelector(".modal");
let close = document.querySelector(".close");
let trigger = document.querySelector(".trigger");

function toggleClass(){
    modal.classList.toggle("show-modal");
}

function windowOnClick(event) {
    if (event.target === modal) {
        toggleClass();
    }
}

window.addEventListener("click", windowOnClick);

