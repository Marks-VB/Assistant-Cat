/* SPDX-License-Identifier: AGPL-3.0-or-later — Original modular artwork for Assistente Gato. */
(function(root){
'use strict';
const coats={
 tuxedo:{label:'Frajola',fur:'#24262b',inner:'#dd9f9c',eye:'#22333b',nose:'#d58d93',bg:'#dfeae8'},
 ginger:{label:'Laranja',fur:'#efad61',inner:'#f2c0ae',eye:'#513729',nose:'#c97c6a',bg:'#f2e5d2'},
 siamese:{label:'Siamês',fur:'#eddfc5',inner:'#846558',eye:'#64b7dd',nose:'#493b34',bg:'#e3e9f2'},
 calico:{label:'Tricolor',fur:'#faf6eb',inner:'#e8b1a7',eye:'#40352f',nose:'#d28a86',bg:'#ebe5ee'},
 black:{label:'Preto',fur:'#24262b',inner:'#50505a',eye:'#e8c273',nose:'#76767e',bg:'#dedfe9'},
 solid_gray:{label:'Cinza',fur:'#a1a7ae',inner:'#c6aeb3',eye:'#343c44',nose:'#707980',bg:'#e5ebe7'},
 white:{label:'Persa/branco',fur:'#fcfbf9',inner:'#f3c2c2',eye:'#4f899e',nose:'#e5989b',bg:'#ebeff2'},
 gray_tabby:{label:'Tigrado cinza',fur:'#8f98a0',inner:'#cba7ac',eye:'#4e7355',nose:'#b6767a',bg:'#edece4'}
};
const outfits={none:'Natural',suit:'Terno',hoodie:'Moletom'};
const glasses={none:'Sem óculos',round:'Redondos',square:'Retangulares'};
const states=['idle','listening','thinking','speaking','success','error','offline'];
function normalize(o={}) {return {coat:coats[o.coat]?o.coat:'tuxedo',outfit:outfits[o.outfit]?o.outfit:'none',glasses:glasses[o.glasses]?o.glasses:'none',state:states.includes(o.state)?o.state:'idle',background:o.background==='dark'?'dark':'neutral'};}
function layers(input={}){
 const o=normalize(input), c=coats[o.coat], dark=o.background==='dark', pale=o.coat==='black', line=pale?'#a9b5be':'#34454b';
 const head='<path d="M57 105 49 47 Q48 40 56 44 L94 67 Q120 58 147 67 L184 44 Q192 40 191 48 L183 107 Q200 130 187 157 Q172 188 120 190 Q67 188 53 157 Q40 130 57 105Z" fill="'+c.fur+'" stroke="#34454b" stroke-width="3" stroke-linejoin="round"/><path d="m60 57 6 42 20-23Z M179 57l-6 42-20-23Z" fill="'+c.inner+'"/>';
 let marking='';
 if(o.coat==='tuxedo')marking='<path d="M120 104q-7 27-29 36-20 9-29 18 15 28 58 30 43-2 58-30-9-9-29-18-22-9-29-36Z" fill="#faf8ed"/>';
 if(o.coat==='ginger')marking='<path d="m100 69 4 22m16-25v22m19-19-4 22" fill="none" stroke="#ce8c45" stroke-width="6" stroke-linecap="round"/><ellipse cx="120" cy="157" rx="37" ry="25" fill="#fff0d4"/>';
 if(o.coat==='siamese')marking='<path d="M63 113q22-11 37-9l20 14 20-14q15-2 37 9l-3 37q-12 32-54 36-42-4-54-36Z" fill="#665348"/>';
 if(o.coat==='calico')marking='<path d="M57 105 49 47l45 20 15-2q-10 55-45 69l-15-8q0-12 8-21Z" fill="#35363b"/><path d="m148 67 36-23 7 4-8 59q8 12 10 25-39 7-52-20-10-19-7-48Z" fill="#e8a155"/>';
 if(o.coat==='white')marking='<path d="m61 60 4 34 16-19Z M178 60l-4 34-16-19Z" fill="#fae1e1"/><path d="m66 68 6 12m102-12-6 12" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="120" cy="158" rx="26" ry="17" fill="#ffffff"/><path d="M54 134q-5 12 4 23m128-23q5 12-4 23" fill="none" stroke="#e0e4e8" stroke-width="2.5" stroke-linecap="round"/>';
 if(o.coat==='gray_tabby')marking='<ellipse cx="120" cy="158" rx="28" ry="18" fill="#dce2e6"/><path d="m103 72 3 18m14-21v21m17-18-3 18" fill="none" stroke="#5d666e" stroke-width="3.5" stroke-linecap="round"/><path d="m71 130 11 4m-10 10 13 2m85-16-11 4m10 10-13 2" fill="none" stroke="#5d666e" stroke-width="2.5" stroke-linecap="round"/>';
 let outfit='';
 if(o.outfit==='suit')outfit='<path d="m82 175 38 14 38-14q26 12 30 49H52q4-37 30-49Z" fill="#384553"/><path d="m91 179 29 10 29-10-16 45h-26Z" fill="#fffaf0"/><path d="m120 189-9 11 6 24h6l6-24Z" fill="#a45e56"/><path d="m82 177 13 25-14 9 17 13m60-47-13 25 14 9-17 13" fill="none" stroke="#66727c" stroke-width="3"/>';
 if(o.outfit==='hoodie')outfit='<path d="M82 177q38-18 76 0 23 13 30 47H52q7-34 30-47Z" fill="#769997"/><path d="M87 181q33 25 66 0" fill="none" stroke="#b6cecb" stroke-width="6"/><path d="M103 195v19m34-19v19" stroke="#e1ebe6" stroke-width="3" stroke-linecap="round"/>';
 const eyeColor=(o.coat==='tuxedo')?'#dfc68c':c.eye;
 let eyes='<ellipse cx="93" cy="130" rx="5" ry="7" fill="'+eyeColor+'"/><ellipse cx="147" cy="130" rx="5" ry="7" fill="'+eyeColor+'"/>';
 if(o.state==='success')eyes='<path d="m86 131q7-10 14 0m40 0q7-10 14 0" stroke="'+eyeColor+'" stroke-width="4" stroke-linecap="round" fill="none"/>';
 if(o.state==='thinking')eyes+='<path d="m85 115 16-4m38 1 16 4" stroke="'+line+'" stroke-width="3" stroke-linecap="round"/>';
 if(o.state==='listening')eyes='<circle cx="93" cy="130" r="7" fill="'+eyeColor+'"/><circle cx="147" cy="130" r="7" fill="'+eyeColor+'"/>';
 const frame=o.coat==='black'||o.coat==='siamese'?'#dccca6':'#34454b';
 let frames='';
 if(o.glasses==='round')frames='<circle cx="93" cy="131" r="19"/><circle cx="147" cy="131" r="19"/><path d="M112 131q8-6 16 0m-54-3-14-3m106 3 14-3"/>';
 if(o.glasses==='square')frames='<rect x="73" y="114" width="40" height="34" rx="8"/><rect x="127" y="114" width="40" height="34" rx="8"/><path d="M113 127h14m-54 0-13-3m107 3 13-3"/>';
 const features='<path d="m114 147 6 5 6-5Z" fill="'+c.nose+'"/>'+(o.state==='speaking'?'<ellipse cx="120" cy="165" rx="6" ry="8" fill="'+line+'"/>':'<path d="M120 152v6q-9 10-16 1m16-1q9 10 16 1" fill="none" stroke="'+line+'" stroke-width="3" stroke-linecap="round"/>')+'<path d="m80 150-23-3m23 13-23 4m103-14 23-3m-23 13 23 4" fill="none" stroke="'+line+'" stroke-width="2.4" stroke-linecap="round"/>';
 return [
 {name:'background',markup:'<circle cx="120" cy="120" r="115" fill="'+(dark?'#303b41':c.bg)+'"/>'},
 {name:'body',markup:'<path d="M53 224q4-49 39-54h56q35 5 39 54Z" fill="'+c.fur+'"/>'},
 {name:'outfit',markup:outfit}, {name:'head',markup:head},{name:'markings',markup:marking},
 {name:'eyes',markup:eyes},{name:'features',markup:features},
 {name:'glasses',markup:'<g fill="none" stroke="'+frame+'" stroke-width="3" stroke-linecap="round">'+frames+'</g>'}
 ];
}
function svgDocument(body,label='Avatar de gato'){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="'+label+'"><title>'+label+'</title>'+body+'</svg>';}
function render(input={}){const o=normalize(input);return svgDocument(layers(o).map(l=>'<g data-layer="'+l.name+'">'+l.markup+'</g>').join(''),coats[o.coat].label+', '+outfits[o.outfit]+', '+glasses[o.glasses]);}
const api={coats,outfits,glasses,states,normalize,layers,render,svgDocument};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CatAvatar=api;
})(typeof window!=='undefined'?window:globalThis);
