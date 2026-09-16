(function(){
  'use strict';
  var endpoint=window.VERDEMENTE_FORM_ENDPOINT||'';
  if(!endpoint) return;

  function requestStatus(node){
    var activity=node.getAttribute('data-activity-id');
    if(!activity) return;
    var cb='verdementeStatus_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);
    var script=document.createElement('script');
    window[cb]=function(data){
      try{ update(node,data||{}); }finally{
        try{ delete window[cb]; }catch(e){ window[cb]=undefined; }
        if(script.parentNode) script.parentNode.removeChild(script);
      }
    };
    script.onerror=function(){
      try{ delete window[cb]; }catch(e){ window[cb]=undefined; }
      if(script.parentNode) script.parentNode.removeChild(script);
    };
    var sep=endpoint.indexOf('?')===-1?'?':'&';
    script.src=endpoint+sep+'action=status&actividad_id='+encodeURIComponent(activity)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();
    document.head.appendChild(script);
  }

  function update(node,data){
    if(!data || data.ok===false) return;
    var full=!!data.full;
    var capacity=parseInt(data.capacity,10)||35;
    var states=node.querySelectorAll('.registration-state');
    var buttons=node.querySelectorAll('.registration-button');
    var notes=node.querySelectorAll('.capacity-note');
    for(var i=0;i<states.length;i++){
      states[i].textContent=full?'Plazas completas · lista de espera abierta':'Inscripción abierta';
    }
    for(var j=0;j<buttons.length;j++){
      buttons[j].textContent=full?'APUNTARME A LA LISTA DE ESPERA':'INSCRIBIRME';
    }
    for(var k=0;k<notes.length;k++){
      notes[k].textContent=full
        ?'El taller ha alcanzado el máximo de '+capacity+' participantes. Puedes enviar el formulario para incorporarte a la lista de espera. Si queda una plaza disponible, contactaremos contigo por orden de inscripción.'
        :'Taller práctico, gratuito y abierto a todos los públicos. Máximo de '+capacity+' plazas, asignadas por orden de inscripción.';
    }
  }

  var nodes=document.querySelectorAll('[data-activity-id]');
  var seen={};
  for(var i=0;i<nodes.length;i++){
    var id=nodes[i].getAttribute('data-activity-id');
    // Each node is updated independently because page may contain multiple workshops.
    requestStatus(nodes[i]);
  }
})();
