(function(){
  'use strict';
  var forms=document.querySelectorAll('.registration-form');
  var endpoint=window.VERDEMENTE_FORM_ENDPOINT||'';

  function makeToken(){return 'vm_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12);}

  forms.forEach(function(form){
    var status=form.querySelector('.status');
    var button=form.querySelector('.submit');
    var tokenInput=form.querySelector('input[name="request_token"]');
    var timer=null;
    if(endpoint) form.action=endpoint;

    function msg(t){if(status)status.textContent=t;}
    function finish(){if(timer){clearTimeout(timer);timer=null;}if(button)button.disabled=false;}

    window.addEventListener('message',function(ev){
      var d=ev.data;
      if(!d||d.type!=='VERDEMENTE_FORM_RESULT')return;
      if(!tokenInput||d.requestToken!==tokenInput.value)return;
      finish();
      if(!d.ok){msg('No hemos podido completar la inscripción. Escríbenos a asocverdemente@gmail.com.');return;}
      if(d.duplicate){msg('Tu inscripción ya constaba registrada. '+(d.emailSent?'Te hemos enviado de nuevo el correo de confirmación.':'La inscripción está registrada, aunque no hemos podido enviar el correo automático.'));return;}
      if(d.waitlist){msg('Inscripción recibida. El taller está completo y te hemos incorporado a la lista de espera. '+(d.emailSent?'Te hemos enviado un correo de confirmación.':''));return;}
      msg('¡Inscripción recibida! Tu plaza ha quedado confirmada. '+(d.emailSent?'Te hemos enviado un correo de confirmación.':'La inscripción está registrada, aunque no hemos podido enviar el correo automático.'));
    });

    form.addEventListener('submit',function(e){
      if(!endpoint){e.preventDefault();msg('Falta conectar la tabla de inscripciones. Revisa form-config.js.');return;}
      if(tokenInput)tokenInput.value=makeToken();
      if(button)button.disabled=true;
      msg('Enviando inscripción…');
      if(timer)clearTimeout(timer);
      timer=setTimeout(function(){if(button)button.disabled=false;msg('La solicitud se ha enviado, pero estamos tardando en recibir la confirmación. Si no recibes el correo automático, escríbenos a asocverdemente@gmail.com.');},20000);
    });
  });

  var comida=document.getElementById('participa_comida');
  var detalle=document.getElementById('comida_detalle');
  if(comida&&detalle){
    comida.addEventListener('change',function(){
      detalle.hidden=!comida.checked;
      if(!comida.checked){var n=document.getElementById('necesidades_alimentarias');if(n)n.value='';}
    });
  }
})();