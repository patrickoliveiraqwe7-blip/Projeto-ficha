// js/calculo.js
export function abilityModifier(score){
  const s = parseInt(score||0, 10);
  if(Number.isNaN(s)) return 0;
  return Math.floor((s - 10) / 2);
}

export function proficiencyBonus(level){
  const lv = parseInt(level||0, 10);
  if(Number.isNaN(lv) || lv <= 0) return 2;
  return 2 + Math.floor(Math.max(lv - 1, 0) / 4);
}

export function skillTotal(abilMod, pb, prof=false, expertise=false){
  const p = prof ? (expertise ? 2 * pb : pb) : 0;
  return abilMod + p;
}

/* Generate default skills data to render rows */
export function defaultSkills(){
  return [
    { name: "Acrobacia", abil: "dex" },
    { name: "Adestrar Animais", abil: "wis" },
    { name: "Arcanismo", abil: "int" },
    { name: "Atletismo", abil: "str" },
    { name: "Enganação", abil: "cha" },
    { name: "História", abil: "int" },
    { name: "Intuição", abil: "wis" },
    { name: "Intimidação", abil: "cha" },
    { name: "Investigação", abil: "int" },
    { name: "Medicina", abil: "wis" },
    { name: "Natureza", abil: "int" },
    { name: "Percepção", abil: "wis" },
    { name: "Atuação", abil: "cha" },
    { name: "Persuasão", abil: "cha" },
    { name: "Religião", abil: "int" },
    { name: "Furtividade", abil: "dex" },
    { name: "Prestidigitação", abil: "dex" },
    { name: "Sobrevivência", abil: "wis" }
  ];
}
