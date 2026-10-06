(function(){
  'use strict';
  var endpoint=window.VERDEMENTE_FORM_ENDPOINT||'';
  if(!endpoint) return;

  var CAPACITY_BY_ACTIVITY={
    piedra_seca:20,
    memoria_alimentaria:30,
    alfareria:30,
    arquitectura_tierra:30,
    queso:30
  };

  function plural(n){return n===1?'plaza disponible':'plazas disponibles';}
  function getConfiguredCapacity(activity){ return CAPACITY_BY_ACTIVITY[activity] || 30; }

  function requestStatus(node){
    var activity=node.getAttribute('data-activity-id');
    if(!activity) return;
    var cb='verdementeStatus_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);
    var script=document.createElement('script');
    window[cb]=function(data){
      try{ update(node,data||{},activity); }finally{
        try{ delete window[cb]; }catch(e){ window[cb]=undefined; }
        if(script.parentNode) script.parentNode.removeChild(script);
      }
    };
    script.onerror=function(){
      update(node,{},activity);
      try{ delete window[cb]; }catch(e){ window[cb]=undefined; }
      if(script.parentNode) script.parentNode.removeChild(script);
    };
    var sep=endpoint.indexOf('?')===-1?'?':'&';
    script.src=endpoint+sep+'action=status&actividad_id='+encodeURIComponent(activity)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();
    document.head.appendChild(script);
  }

  function update(node,data,activity){
    var configuredCapacity=getConfiguredCapacity(activity || node.getAttribute('data-activity-id'));
    var confirmed=parseInt(data.confirmed,10);
    if(isNaN(confirmed) || confirmed < 0) confirmed=0;
    var capacity=configuredCapacity;
    var remaining=Math.max(0, capacity-confirmed);
    var full=remaining<=0;
    var label=full?'Plazas completas · lista de espera abierta':(remaining<=3?'¡Últimas '+remaining+' '+plural(remaining)+'!':remaining+' '+plural(remaining));
    var states=node.querySelectorAll('.registration-state');
    var buttons=node.querySelectorAll('.registration-button');
    var notes=node.querySelectorAll('.capacity-note');
    for(var i=0;i<states.length;i++){
      states[i].textContent=label;
      states[i].classList.toggle('availability-pulse',!full);
      states[i].classList.toggle('availability-full',full);
    }
    for(var j=0;j<buttons.length;j++) buttons[j].textContent=full?'APUNTARME A LA LISTA DE ESPERA':'INSCRIBIRME';
    for(var k=0;k<notes.length;k++){
      notes[k].textContent=full
        ?'El taller ha alcanzado el máximo de '+capacity+' participantes. Puedes enviar el formulario para incorporarte a la lista de espera. Si queda una plaza disponible, contactaremos contigo por orden de inscripción.'
        :(remaining+' '+plural(remaining)+'. Taller gratuito; plazas asignadas por orden de inscripción.');
    }
  }

  var nodes=document.querySelectorAll('[data-activity-id]');
  for(var i=0;i<nodes.length;i++) requestStatus(nodes[i]);
})();
