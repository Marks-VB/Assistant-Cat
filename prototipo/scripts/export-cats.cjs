// SPDX-License-Identifier: AGPL-3.0-or-later
const fs=require('node:fs'),path=require('node:path'),cat=require('../src/cat-avatar.js');
const base=path.resolve(__dirname,'../../artes/svg-modular');fs.mkdirSync(base,{recursive:true});const manifest=[];
for(const coat of Object.keys(cat.coats))for(const outfit of Object.keys(cat.outfits))for(const glasses of Object.keys(cat.glasses)){
const config={coat,outfit,glasses};const file=`combinacoes/${coat}-${outfit}-${glasses}.svg`;fs.mkdirSync(path.join(base,'combinacoes'),{recursive:true});fs.writeFileSync(path.join(base,file),cat.render(config));manifest.push({file,...config});}
for(const coat of Object.keys(cat.coats))for(const name of ['body','head','markings','features']){const layer=cat.layers({coat}).find(x=>x.name===name);const dir=path.join(base,'camadas',coat);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,name+'.svg'),cat.svgDocument(layer.markup));}
for(const outfit of ['suit','hoodie']){const l=cat.layers({outfit}).find(x=>x.name==='outfit');fs.mkdirSync(path.join(base,'camadas/roupas'),{recursive:true});fs.writeFileSync(path.join(base,'camadas/roupas',outfit+'.svg'),cat.svgDocument(l.markup));}
for(const glasses of ['round','square']){const l=cat.layers({glasses}).find(x=>x.name==='glasses');fs.mkdirSync(path.join(base,'camadas/oculos'),{recursive:true});fs.writeFileSync(path.join(base,'camadas/oculos',glasses+'.svg'),cat.svgDocument(l.markup));}
const coatKeys=Object.keys(cat.coats),cols=4,rows=Math.ceil(coatKeys.length/cols);
const colecaoSvg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(cols*240)+' '+(rows*240)+'" role="img" aria-label="Oito gatos modulares com terno e óculos">'+coatKeys.map((coat,i)=>{
 const col=i%cols,row=Math.floor(i/cols);
 const layers=cat.layers({coat,outfit:'suit',glasses:'round'});
 return '<g transform="translate('+(col*240)+','+(row*240)+')"><title>'+cat.coats[coat].label+', Terno, Redondos</title>'+layers.map(l=>'<g data-layer="'+l.name+'">'+l.markup+'</g>').join('')+'</g>';
}).join('')+'</svg>';
fs.writeFileSync(path.join(base,'colecao.svg'),colecaoSvg);
const layerCount=coatKeys.length*4+4;
fs.writeFileSync(path.join(base,'manifesto.json'),JSON.stringify({viewBox:'0 0 240 240',count:manifest.length,items:manifest},null,2));console.log('Exportadas',manifest.length,'combinações SVG e',layerCount,'camadas independentes.');
