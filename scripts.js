// Common scripts for GameHub Solidario
document.addEventListener('DOMContentLoaded', ()=>{
  // If the user agreed to force-reload sample torneos, remove saved key
  // once per browser session so we don't erase admin changes repeatedly.
  try{
    if(!sessionStorage.getItem('reloadTorneosDone')){
      localStorage.removeItem('torneos');
      sessionStorage.setItem('reloadTorneosDone','1');
    }
  }catch(e){ }

  // populate torneos list on index
  if(document.getElementById('torneos-list')) loadTorneosList();
  // admin page init
  if(document.getElementById('admin-greeting')) initAdminPage();
  // collaboration form init
  if(document.getElementById('colabora-form')) onColTypeChange();
  // try autoplaying audio and handle blocked autoplay
  attemptAutoPlayAudio();
  // initialize lightweight gallery lightbox
  if(document.querySelector('.gallery-grid')) initLightbox();
});

// Try to autoplay the promo audio; if blocked show overlay to request interaction
function attemptAutoPlayAudio(){
  const audio = document.getElementById('promo-audio');
  if(!audio) return;
  // try to play (some browsers return a promise)
  const p = audio.play();
  if(p !== undefined){
    p.then(()=>{
      // autoplay succeeded
      hideAudioOverlay();
    }).catch((err)=>{
      // autoplay was blocked
      showAudioOverlay();
    });
  }
}

function forcePlayAudio(){
  const audio = document.getElementById('promo-audio');
  if(!audio) return;
  audio.play().then(()=>{
    hideAudioOverlay();
  }).catch(()=>{
    // still blocked, but we'll keep overlay visible
    showAudioOverlay();
  });
}

function showAudioOverlay(){
  const ov = document.getElementById('audio-overlay');
  if(ov) ov.style.display = 'flex';
}

function hideAudioOverlay(){
  const ov = document.getElementById('audio-overlay');
  if(ov) ov.style.display = 'none';
}

// ----- LOGIN -----
function login(e){
  e && e.preventDefault();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();
  const msg = document.getElementById('login-msg');
  if(user === 'mari' && pass === '123'){
    // set a session flag so admin.html can verify access
    try{ sessionStorage.setItem('auth','1'); sessionStorage.setItem('user', user); }catch(e){}
    // redirect passing user as parameter
    location.href = `admin.html?user=${encodeURIComponent(user)}`;
    return false;
  } else {
    msg.textContent = 'Usuario incorrecto';
    return false;
  }
}

// ----- TORNEOS: sample data and renderer -----
function sampleTorneos(){
  return [
    {id:1, titulo:'Copa Primavera EA FC', juego:'FIFA / EA FC', plataforma:'PC / PS5', fecha:'2025-10-17', cupos:64, objetivo:'Recaudar alimentos para comedor La Esperanza'},
    {id:2, titulo:'Valorant: Copa Comunitaria', juego:'Valorant', plataforma:'PC', fecha:'2025-10-18', cupos:32, objetivo:'Juguetes para niños'},
    {id:3, titulo:'Minecraft Creators Cup', juego:'Minecraft', plataforma:'PC', fecha:'2025-10-19', cupos:16, objetivo:'Útiles escolares para ONG local'},
    {id:4, titulo:'FC 26 Cup', juego:'EA FC 26', plataforma:'PC / PS5 / Xbox', fecha:'2026-04-10', cupos:128, objetivo:'Recaudar fondos para comedor Manos Unidas'},
    {id:5, titulo:'Valorant Cup', juego:'Valorant', plataforma:'PC', fecha:'2026-05-05', cupos:64, objetivo:'Recolección de juguetes y útiles para escuelas locales'}
  ];
}

function getTorneos(){
  const raw = localStorage.getItem('torneos');
  if(raw) return JSON.parse(raw);
  const s = sampleTorneos();
  localStorage.setItem('torneos', JSON.stringify(s));
  return s;
}

function saveTorneos(list){
  localStorage.setItem('torneos', JSON.stringify(list));
}

function loadTorneosList(){
  const list = getTorneos();
  const container = document.getElementById('torneos-list');
  container.innerHTML = '';
  list.forEach(t => {
    const col = document.createElement('div'); col.className='col-md-4';
    const card = document.createElement('div'); card.className='torneo-card';
    card.innerHTML = `<h5>${escapeHtml(t.titulo)}</h5>
      <p><strong>Juego:</strong> ${escapeHtml(t.juego)} · <strong>Plataforma:</strong> ${escapeHtml(t.plataforma)}</p>
      <p><strong>Fecha:</strong> ${t.fecha} · <strong>Cupos:</strong> ${t.cupos}</p>
      <p>${escapeHtml(t.objetivo)}</p>
      <div class="torneo-actions">
        <a class="btn btn-sm btn-outline-primary" href="quierocolaborar.html">Quiero colaborar</a>
        <a class="btn btn-sm btn-outline-secondary" href="admin.html">Administrar</a>
      </div>`;
    col.appendChild(card);
    container.appendChild(col);
  });
}

function escapeHtml(s){ return String(s).replace(/[&<>\\\"]/g, c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'
})[c]); }

// ----- ADMIN PAGE (ABM visual) -----
function initAdminPage(){
  // verify session-based authentication
  const params = new URLSearchParams(location.search);
  const userParam = params.get('user');
  const auth = (function(){ try{ return sessionStorage.getItem('auth'); }catch(e){ return null; } })();
  const authUser = (function(){ try{ return sessionStorage.getItem('user'); }catch(e){ return null; } })();
  if(auth !== '1' || !authUser || authUser !== userParam){
    // not authenticated — redirect to home
    alert('Acceso restringido. Debés ingresar con credenciales de administrador.');
    location.href = 'index.html';
    return;
  }
  // show greeting
  const user = userParam || authUser || 'administrador';
  document.getElementById('admin-greeting').textContent = `Bienvenido/a ${user}`;
  renderTorneosAdmin();
}

function renderTorneosAdmin(){
  const container = document.getElementById('admin-torneos');
  const list = getTorneos();
  container.innerHTML = '';
  list.forEach(t => {
    const item = document.createElement('div');
    item.className = 'list-group-item';
    item.innerHTML = `<div>
        <strong>${escapeHtml(t.titulo)}</strong> <small class="text-muted">(${escapeHtml(t.juego)} · ${escapeHtml(t.plataforma)})</small>
        <div><small>Fecha: ${t.fecha} · Cupos: ${t.cupos}</small></div>
        <div class="small">${escapeHtml(t.objetivo)}</div>
      </div>
      <div>
        <button class="btn btn-sm btn-primary" onclick="startEdit(${t.id})">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTorneo(${t.id})">Eliminar</button>
      </div>`;
    container.appendChild(item);
  });
}

function saveTorneo(event){
  event && event.preventDefault();
  const id = parseInt(document.getElementById('torneo-id').value || '0',10);
  const titulo = document.getElementById('titulo').value.trim();
  const juego = document.getElementById('juego').value.trim();
  const plataforma = document.getElementById('plataforma').value.trim();
  const fecha = document.getElementById('fecha').value;
  const cupos = parseInt(document.getElementById('cupos').value || '0',10);
  const objetivo = document.getElementById('objetivo').value.trim();
  const list = getTorneos();
  if(id){
    // editar
    const idx = list.findIndex(x=>x.id===id);
    if(idx>-1){
      list[idx] = {id, titulo, juego, plataforma, fecha, cupos, objetivo};
    }
  } else {
    const newId = list.reduce((m,i)=>Math.max(m,i.id||0),0)+1;
    list.push({id:newId, titulo, juego, plataforma, fecha, cupos, objetivo});
  }
  saveTorneos(list);
  renderTorneosAdmin();
  resetAdminForm();
  // also refresh index list if present
  if(document.getElementById('torneos-list')) loadTorneosList();
  return false;
}

function startEdit(id){
  const list = getTorneos();
  const t = list.find(x=>x.id===id);
  if(!t) return;
  document.getElementById('torneo-id').value = t.id;
  document.getElementById('titulo').value = t.titulo;
  document.getElementById('juego').value = t.juego;
  document.getElementById('plataforma').value = t.plataforma;
  document.getElementById('fecha').value = t.fecha;
  document.getElementById('cupos').value = t.cupos;
  document.getElementById('objetivo').value = t.objetivo;
  window.scrollTo({top:0,behavior:'smooth'});
}

function deleteTorneo(id){
  if(!confirm('Eliminar este torneo/campaña?')) return;
  let list = getTorneos();
  list = list.filter(t=>t.id!==id);
  saveTorneos(list);
  renderTorneosAdmin();
  if(document.getElementById('torneos-list')) loadTorneosList();
}

function resetAdminForm(){
  document.getElementById('admin-form').reset();
  document.getElementById('torneo-id').value = '';
}

// ----- COLABORAR FORM -----
function onColTypeChange(){
  const type = document.getElementById('col-type').value;
  document.getElementById('dinero-fields').classList.toggle('d-none', type !== 'dinero');
  document.getElementById('trabajo-fields').classList.toggle('d-none', type !== 'trabajo');
  document.getElementById('difusion-fields').classList.toggle('d-none', type !== 'difusion');
}

function submitColabora(e){
  e && e.preventDefault();
  // simple confirm and clear - in proyecto real se enviaría al servidor
  const name = document.getElementById('col-name').value.trim();
  alert(`Gracias ${name}! Tu interés fue recibido. Nos contactaremos por correo.`);
  document.getElementById('colabora-form').reset();
  onColTypeChange();
  return false;
}

// ----- LIGHTBOX (ligero, accesible) -----
function initLightbox(){
  const links = Array.from(document.querySelectorAll('.gallery-grid a.lightbox-link'));
  if(!links.length) return;
  // create overlay
  if(document.getElementById('lightbox-overlay')) return; // already created
  const overlay = document.createElement('div'); overlay.id = 'lightbox-overlay'; overlay.className = 'lightbox-overlay'; overlay.style.display = 'none';
  overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
  overlay.innerHTML = `
    <div class="lightbox-content">
      <button class="lightbox-close" aria-label="Cerrar (Esc)">&times;</button>
      <button class="lightbox-prev" aria-label="Anterior">&#10094;</button>
      <div class="lightbox-media"><img src="" alt=""></div>
      <button class="lightbox-next" aria-label="Siguiente">&#10095;</button>
      <div class="lightbox-caption" aria-live="polite"></div>
    </div>`;
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector('.lightbox-media img');
  const capEl = overlay.querySelector('.lightbox-caption');
  const closeBtn = overlay.querySelector('.lightbox-close');
  const prevBtn = overlay.querySelector('.lightbox-prev');
  const nextBtn = overlay.querySelector('.lightbox-next');
  let current = 0;

  function show(i){
    current = ((i % links.length) + links.length) % links.length;
    const a = links[current];
    const href = a.getAttribute('href');
    const alt = a.querySelector('img')?.getAttribute('alt') || '';
    imgEl.src = href; imgEl.alt = alt;
    // caption: read nearby paragraph if exists
    const p = a.parentElement.querySelector('p.small');
    capEl.textContent = p ? p.textContent.trim() : alt;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function hide(){
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) hide(); });
  closeBtn.addEventListener('click', hide);
  prevBtn.addEventListener('click', ()=> show(current-1));
  nextBtn.addEventListener('click', ()=> show(current+1));
  document.addEventListener('keydown', (e)=>{
    if(overlay.style.display !== 'flex') return;
    if(e.key === 'Escape') hide();
    if(e.key === 'ArrowRight') show(current+1);
    if(e.key === 'ArrowLeft') show(current-1);
  });

  // attach to thumbnails
  links.forEach((a,i)=> a.addEventListener('click', (ev)=>{ ev.preventDefault(); show(i); }));
}
