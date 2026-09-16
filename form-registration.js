(function(){
  'use strict';
  var form=document.querySelector('.registration-form');
  if(!form) return;
  var endpoint=window.VERDEMENTE_FORM_ENDPOINT||'';
  var status=form.querySelector('.status');
  var button=form.querySelector('.submit');
  var tokenInput=form.querySelector('input[name="request_token"]');
  var timer=null;

  if(endpoint) form.action=endpoint;

  function makeToken(){
    return 'vm_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12);
  }
  function setMessage(text){ if(status) status.textContent=text; }
  function finish(){
    if(timer){ clearTimeout(timer); timer=null; }
    if(button) button.disabled=false;
  }

  window.addEventListener('message',function(ev){
    var d=ev.data;
    if(!d || d.type!=='VERDEMENTE_FORM_RESULT') return;
    if(!tokenInput || d.requestToken!==tokenInput.value) return;
    finish();
    if(!d.ok){
      setMessage('No hemos podido completar la inscripción. Escríbenos a asocverdemente@gmail.com indicando tu nombre y el taller.');
      return;
    }
    if(d.duplicate){
      if(d.status==='waitlist'){
        setMessage('Tu solicitud ya constaba en la lista de espera. '+(d.emailSent?'Te hemos enviado de nuevo el correo de confirmación.':'La solicitud está registrada, aunque no hemos podido enviar el correo automático.'));
      }else{
        setMessage('Tu inscripción ya constaba registrada con plaza confirmada. '+(d.emailSent?'Te hemos enviado de nuevo el correo de confirmación.':'La plaza está registrada, aunque no hemos podido enviar el correo automático.'));
      }
      return;
    }
    if(d.status==='waitlist'){
      var pos=d.waitlistPosition ? ' (posición '+d.waitlistPosition+')' : '';
      var capacity=parseInt(d.capacity,10)||35;
      setMessage('¡Solicitud recibida! Las '+capacity+' plazas están cubiertas y te hemos incorporado a la lista de espera'+pos+'. '+(d.emailSent?'Te hemos enviado un correo de confirmación.':'La solicitud está registrada, aunque no hemos podido enviar el correo automático.'));
      if(button) button.textContent='APUNTARME A LA LISTA DE ESPERA';
    }else{
      setMessage('¡Inscripción recibida! Tu plaza está confirmada. '+(d.emailSent?'Te hemos enviado un correo de confirmación.':'La plaza está registrada, aunque no hemos podido enviar el correo automático.'));
    }
  });

  form.addEventListener('submit',function(e){
    if(!endpoint){
      e.preventDefault();
      setMessage('Falta conectar la tabla de inscripciones. Revisa form-config.js.');
      return;
    }
    if(tokenInput) tokenInput.value=makeToken();
    if(button) button.disabled=true;
    setMessage('Enviando inscripción…');
    if(timer) clearTimeout(timer);
    timer=setTimeout(function(){
      if(button) button.disabled=false;
      setMessage('La solicitud se ha enviado, pero estamos tardando en recibir la confirmación. Si no recibes el correo automático, escríbenos a asocverdemente@gmail.com.');
    },20000);
  });
})();
