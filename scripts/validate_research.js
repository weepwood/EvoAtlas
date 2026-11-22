#!/usr/bin/env node
'use strict';

const assert=require('node:assert/strict');
const path=require('node:path');

global.window={};
require(path.resolve(__dirname,'../data/research.js'));

const data=window.EVO_RESEARCH;
const sources=data?.sources||[];
const groups=data?.groups||[];
const errors=[];

if(sources.length<18) errors.push('fewer than 18 curated database entries');
const byCode=new Set();
const groupIds=new Set(groups.map(g=>g.id));
for(const entry of sources){
  if(byCode.has(entry.code))errors.push('duplicate source code '+entry.code);
  byCode.add(entry.code);
  if(!/^https:\/\//.test(entry.url))errors.push('non-HTTPS source URL: '+entry.code);
  if(!entry.group||!groupIds.has(entry.group))errors.push('invalid group: '+entry.code);
  if(!entry.usage||!entry.limitation)errors.push('missing provenance caveat: '+entry.code);
  if(!entry.resourceUrl||!/^https:\/\//.test(entry.resourceUrl))errors.push('missing reference URL: '+entry.code);
}
if(groups.length<4)errors.push('expected four data purpose groups');

console.log('Research resource entries:',sources.length);
console.log('Source groups:',groups.length);
if(errors.length){
  errors.forEach(error=>console.error('ERROR:',error));
  process.exit(1);
}
console.log('Research directory metadata validated. No claim of live API integration.');
