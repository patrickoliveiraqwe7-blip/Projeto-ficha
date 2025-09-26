// js/storage.js
const KEY = 'ficha_op_5e_v4';
const THEME_KEY = 'ficha_op_5e_theme';

export function saveFicha(data){
  try{
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  }catch(e){
    console.error('Erro ao salvar ficha:', e);
    return false;
  }
}

export function loadFicha(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){
    console.error('Erro ao carregar ficha:', e);
    return null;
  }
}

export function resetFicha(){
  try{
    localStorage.removeItem(KEY);
    return true;
  }catch(e){ return false; }
}

export function saveTheme(theme){
  try{ localStorage.setItem(THEME_KEY, theme||''); }catch(e){}
}
export function loadTheme(){
  try{ return localStorage.getItem(THEME_KEY)||''; }catch(e){ return ''; }
}

/* Export / Import JSON helpers */
export function exportJson(data, filename = 'ficha-onepiece.json'){
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function readJsonFile(file){
  return new Promise((resolve, reject)=>{
    const r = new FileReader();
    r.onload = e => {
      try{
        const obj = JSON.parse(e.target.result);
        resolve(obj);
      }catch(err){ reject(err); }
    };
    r.onerror = err => reject(err);
    r.readAsText(file);
  });
}
