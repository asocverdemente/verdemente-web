document.querySelectorAll('.menu-toggle').forEach(function(b){b.addEventListener('click',function(){var n=this.parentElement.querySelector('.nav');if(n)n.classList.toggle('open');});});
