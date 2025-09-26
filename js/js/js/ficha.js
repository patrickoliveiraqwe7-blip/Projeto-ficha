// js/ficha.js
import * as Storage from './storage.js';
import * as Calc from './calculo.js';

const autoCheckbox = document.getElementById('autoCalc');
const portraitFile = document.getElementById('portraitFile');
const portraitImg = document.getElementById('portraitImg');
const portraitCard = document.getElementById('portraitCard');
const portraitLabel = document.getElementById('portraitLabel');

const skillContainer = document.getElementById('skillsList');
const importInput = document.getElementById('importJsonFile');

let allInputs = []; // will be filled later

/* --- Build skills UI from template data --- */
function buildSkills(){
  const skills = Calc.defaultSkills();
  skillContainer.innerHTML = '';
  skills.forEach(s=>{
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.setAttribute('data-skill', s.name);
    row.setAttribute('data-abil', s.abil);
    row.setAttribute('role','listitem');

    const chkProf = document.createElement('input');
    chkProf.type = 'checkbox';
    chkProf.className = 'sk-prof';
    chkProf.title = 'Treinado';

    const chkExp = document.createElement('input');
    chkExp.type = 'checkbox';
    chkExp.className = 'sk-exp';
    chkExp.title = 'Especialização';

    const labelWrap = document.createElement('div');
    const lbl = document.createElement('label');
    lbl.style.display='inline';
    lbl.innerHTML = `${s.name} <small style="color:#6b5b49">(${s.abil.toUpperCase()})</small>`;
    labelWrap.appendChild(lbl);

    const out = document.createElement('input');
    out.type = 'text';
    out.className = 'sk-bonus';
    out.value = '0';
    out.setAttribute('aria-label', `${s.name} bônus`);

    row.appendChild(chkProf);
    row.appendChild(chkExp);
    row.appendChild(labelWrap);
    row.appendChild(out);

    skillContainer.appendChild(row);
  });
}

buildSkills();

/* Collect all inputs/select/textarea/checkbox (except file inputs) */
function collectInputs(){
  allInputs = Array.from(document.querySelectorAll('input, select, textarea')).filter(i=>i.type !== 'file');
}
collectInputs();

/* Portrait handling */
function setPortrait(dataUrl){
  if(dataUrl){
    portraitImg.src = dataUrl;
    portraitImg.style.display = 'block';
    portraitLabel.style.display = 'none';
  } else {
    portraitImg.src = '';
    portraitImg.style.display = 'none';
    portraitLabel.style.display = 'block';
  }
}

/* File upload -> show preview */
portraitFile.addEventListener('change', (ev)=>{
  const f = ev.target.files && ev.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = e => setPortrait(e.target.result);
  r.readAsDataURL(f);
});

/* Allow clicking the portrait card to open file dialog and keyboard Enter to open as well */
portraitCard.addEventListener('click', ()=> portraitFile.click());
portraitCard.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') portraitFile.click(); });
portraitCard.tabIndex = 0;

/* --- Calculation logic --- */
function recalc(){
  if(!autoCheckbox.checked) return;
  const getVal = (name) => {
    const el = document.querySelector(`[name="${name}"], #${name}`);
    return el ? el.value : 0;
  };
  const level = getVal('nivel');
  const pb = Calc.proficiencyBonus(level);
  const pbInput = document.querySelector('#proficiencia');
  if(pbInput) pbInput.value = pb;

  const mods = {
    str: Calc.abilityModifier(getVal('str')),
    dex: Calc.abilityModifier(getVal('dex')),
    con: Calc.abilityModifier(getVal('con')),
    int: Calc.abilityModifier(getVal('int')),
    wis: Calc.abilityModifier(getVal('wis')),
    cha: Calc.abilityModifier(getVal('cha'))
  };

  // initiative from DEX
  const initInput = document.querySelector('#iniciativa');
  if(initInput) initInput.value = mods.dex;

  // For each skill row compute and put value
  document.querySelectorAll('.skill-row').forEach(row=>{
    const abil = row.getAttribute('data-abil');
    const prof = row.querySelector('.sk-prof').checked;
    const exp = row.querySelector('.sk-exp').checked;
    const out = row.querySelector('.sk-bonus');
    const val = Calc.skillTotal(mods[abil]||0, pb, prof, exp);
    out.value = (val>=0? '+' : '') + val;
  });

  // passive perception
  const percRow = document.querySelector('.skill-row[data-skill="Percepção"]');
  const percVal = percRow ? parseInt((percRow.querySelector('.sk-bonus').value||'0').replace('+',''))||0 : 0;
  const ppInput = document.querySelector('#pp');
  if(ppInput) ppInput.value = 10 + percVal;
}

/* Wire recalc on input changes */
function wireInputs(){
  collectInputs();
  allInputs.forEach(el=>{
    el.addEventListener('input', () => {
      // if it's a checkbox/uncheck skill flags, recalc too
      recalc();
    });
  });
}
wireInputs();
autoCheckbox.addEventListener('change', recalc);
window.addEventListener('load', recalc);

/* --- Gather and fill functions for storage --- */
function gather(){
  const data = {};
  allInputs.forEach(el=>{
    const key = el.id || el.name;
    if(!key) return;
    if(el.type === 'checkbox') data[key] = el.checked;
    else data[key] = el.value;
  });

  // collect skills state
  data._skills = [];
  document.querySelectorAll('.skill-row').forEach(row=>{
    const name = row.getAttribute('data-skill');
    const abil = row.getAttribute('data-abil');
    const prof = row.querySelector('.sk-prof').checked;
    const exp = row.querySelector('.sk-exp').checked;
    const bonus = row.querySelector('.sk-bonus').value;
    data._skills.push({ name, abil, prof, exp, bonus });
  });

  data.portrait = portraitImg.src && portraitImg.style.display==='block' ? portraitImg.src : '';
  data.theme = Storage.loadTheme() || '';
  return data;
}

function fill(data){
  if(!data) return;
  // fill inputs
  allInputs.forEach(el=>{
    const key = el.id || el.name;
    if(!key) return;
    if(!(key in data)) return;
    if(el.type === 'checkbox') el.checked = !!data[key];
    else el.value = data[key];
  });

  // fill skills
  if(Array.isArray(data._skills)){
    // ensure same skill ordering
    const rows = document.querySelectorAll('.skill-row');
    rows.forEach(row=>{
      const name = row.getAttribute('data-skill');
      const item = data._skills.find(s => s.name === name);
      if(item){
        row.querySelector('.sk-prof').checked = !!item.prof;
        row.querySelector('.sk-exp').checked = !!item.exp;
        row.querySelector('.sk-bonus').value = item.bonus || '0';
      }
    });
  }

  setPortrait(data.portrait || '');
  // theme
  document.body.classList.remove('theme-wood','theme-sea');
  if(data.theme) document.body.classList.add('theme-' + data.theme);
  Storage.saveTheme(data.theme || '');
  recalc();
}

/* --- Controls binding --- */
document.getElementById('saveBtn').addEventListener('click', ()=>{
  const ok = Storage.saveFicha(gather());
  alert(ok ? 'Ficha salva neste navegador.' : 'Erro ao salvar.');
});

document.getElementById('loadBtn').addEventListener('click', ()=>{
  const raw = Storage.loadFicha();
  if(!raw) return alert('Nenhum save encontrado.');
  fill(raw);
  alert('Ficha carregada.');
});

document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(!confirm('Limpar todos os campos?')) return;
  // clear UI
  allInputs.forEach(el=>{
    if(el.type === 'checkbox') el.checked = false;
    else el.value = '';
  });
  // clear skills
  document.querySelectorAll('.skill-row').forEach(row=>{
    row.querySelector('.sk-prof').checked = false;
    row.querySelector('.sk-exp').checked = false;
    row.querySelector('.sk-bonus').value = '0';
  });
  setPortrait('');
  Storage.resetFicha();
  recalc();
});

/* Theme buttons */
document.querySelectorAll('[data-theme]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const t = btn.getAttribute('data-theme');
    document.body.classList.remove('theme-wood','theme-sea');
    if(t) document.body.classList.add('theme-'+t);
    // save preference
    Storage.saveTheme(t||'');
    // set aria-selected
    document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-selected','false'));
    btn.setAttribute('aria-selected','true');
  });
});
// load saved theme on startup
(function(){
  const t = Storage.loadTheme();
  if(t){
    document.body.classList.add('theme-'+t);
    const el = document.querySelector(`[data-theme="${t}"]`);
    if(el) el.setAttribute('aria-selected','true');
  }
})();

/* Export / Import JSON */
document.getElementById('exportJsonBtn').addEventListener('click', ()=>{
  const data = gather();
  Storage.exportJson(data);
});

importInput.addEventListener('change', async (ev)=>{
  const f = ev.target.files && ev.target.files[0];
  if(!f) return;
  try{
    const obj = await Storage.readJsonFile(f);
    fill(obj);
    // optionally save to localStorage
    Storage.saveFicha(obj);
    alert('Ficha importada e salva localmente.');
  }catch(e){
    alert('Erro ao ler arquivo JSON: ' + e.message);
  } finally {
    importInput.value = '';
  }
});

/* Print button */
document.getElementById('printBtn').addEventListener('click', ()=>{
  window.print();
});

/* File drag & drop for portrait (optional) */
['dragenter','dragover'].forEach(e => {
  portraitCard.addEventListener(e, (ev)=>{ ev.preventDefault(); portraitCard.classList.add('drag'); });
});
['dragleave','drop'].forEach(e => {
  portraitCard.addEventListener(e, (ev)=>{ ev.preventDefault(); portraitCard.classList.remove('drag'); });
});
portraitCard.addEventListener('drop', (ev)=>{
  const f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
  if(!f) return;
  if(!f.type.startsWith('image/')) return alert('Arraste uma imagem válida.');
  const r = new FileReader();
  r.onload = e => setPortrait(e.target.result);
  r.readAsDataURL(f);
});

/* Expose recalc for dev console if needed */
window._recalcFicha = recalc;

/* Initial fill from localStorage if present */
const loaded = Storage.loadFicha();
if(loaded) fill(loaded);
