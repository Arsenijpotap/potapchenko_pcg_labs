import assert from 'node:assert/strict';
import {rect,cohenSutherland,liangBarsky,inside,eq,greinerHormann,clipPolygonSH} from './js/geometry.js';
import {Quadtree,randomSegments} from './js/spatial.js';
const r=rect(-5,-5,5,5), testcases=[
 ['bottom boundary',[[-5,-5],[5,-5]],true],['left boundary',[[-5,-5],[-5,5]],true],
 ['point at corner',[[-5,-5],[-5,-5]],true],['point outside',[[6,6],[6,6]],false],
 ['diagonal',[[-10,-10],[10,10]],true],['horizontal',[[-10,5],[10,5]],true],
 ['vertical outside',[[6,-8],[6,8]],false],['parallel outside',[[-10,6],[10,6]],false],
 ['completely inside',[[0,0],[3,4]],true],['outside diagonal',[[-10,-10],[-7,-7]],false]
];
let count=0;
for(const [name,coords,expected] of testcases){const seg=coords.map(([x,y])=>({x,y})),a=cohenSutherland(seg,r).segment,b=liangBarsky(seg,r).segment;assert.equal(Boolean(a),expected,name+' cohen');assert.equal(Boolean(b),expected,name+' liang');if(expected)for(let i=0;i<2;i++){assert(inside(a[i],r),name+' result outside');assert(eq(a[i].x,b[i].x)&&eq(a[i].y,b[i].y),name+' disagreement')}count++}
const rectPoly=[{x:-10,y:-1},{x:10,y:-1},{x:10,y:1},{x:-10,y:1}];const polygon=greinerHormann(rectPoly,r);assert.equal(polygon.length,1);assert(polygon[0].every(p=>inside(p,r)));count++;
const split=[{x:-8,y:12},{x:-2,y:12},{x:-2,y:-10},{x:2,y:-10},{x:2,y:12},{x:8,y:12},{x:8,y:-15},{x:-8,y:-15}];const result=greinerHormann(split,r);assert.equal(result.length,2,'should yield two disjoint visible polygons');assert(result.every(contour=>contour.every(p=>inside(p,r))));count++;
const dataset=randomSegments(2000),qt=new Quadtree(rect(-1100,-1100,1100,1100)),found=new Set();dataset.forEach((s,i)=>qt.insert(s,i));qt.query(rect(-15,-15,15,15),(s,i)=>found.add(i));for(let i=0;i<dataset.length;i++){const s=dataset[i],box={xmin:Math.min(s[0].x,s[1].x),xmax:Math.max(s[0].x,s[1].x),ymin:Math.min(s[0].y,s[1].y),ymax:Math.max(s[0].y,s[1].y)};if(box.xmax>=-15&&box.xmin<=15&&box.ymax>=-15&&box.ymin<=15)assert(found.has(i),'tree must not miss segment '+i)}count++;
console.log(`OK: ${count} проверок, включая граничные случаи, разбиение вогнутого многоугольника и индекс Quadtree.`);
