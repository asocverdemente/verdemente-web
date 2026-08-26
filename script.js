const btn=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav');
if(btn&&nav){btn.addEventListener('click',()=>nav.classList.toggle('open'));}
