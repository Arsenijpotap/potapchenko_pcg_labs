import {EPS,aabb} from './geometry.js';
export function boundsOf(s){return {xmin:Math.min(s[0].x,s[1].x),xmax:Math.max(s[0].x,s[1].x),ymin:Math.min(s[0].y,s[1].y),ymax:Math.max(s[0].y,s[1].y)}}
function intersects(a,b){return a.xmin<=b.xmax+EPS&&a.xmax>=b.xmin-EPS&&a.ymin<=b.ymax+EPS&&a.ymax>=b.ymin-EPS}
function contains(a,b){return a.xmin<=b.xmin+EPS&&a.xmax>=b.xmax-EPS&&a.ymin<=b.ymin+EPS&&a.ymax>=b.ymax-EPS}
export class Quadtree{constructor(bounds,maxDepth=9,capacity=96){this.root={bounds,items:[],children:null,depth:0};this.depthLimit=maxDepth;this.capacity=capacity;this.nodes=1;}
_subdivide(n){const {xmin,xmax,ymin,ymax}=n.bounds,mx=(xmin+xmax)/2,my=(ymin+ymax)/2,d=n.depth+1;n.children=[{bounds:{xmin,ymin,xmax:mx,ymax:my},items:[],children:null,depth:d},{bounds:{xmin:mx,ymin,xmax,ymax:my},items:[],children:null,depth:d},{bounds:{xmin,ymin:my,xmax:mx,ymax},items:[],children:null,depth:d},{bounds:{xmin:mx,ymin:my,xmax,ymax},items:[],children:null,depth:d}];this.nodes+=4;}
_insert(n,entry){if(n.children){const child=n.children.find(c=>contains(c.bounds,entry.box));if(child){this._insert(child,entry);return}}n.items.push(entry);if(n.items.length>this.capacity&&n.depth<this.depthLimit&&!n.children){this._subdivide(n);const items=n.items;n.items=[];for(const x of items)this._insert(n,x)}}
insert(segment,index){this._insert(this.root,{segment,index,box:boundsOf(segment)})}
query(r,visit){let nodes=0,possible=0;const walk=n=>{if(!intersects(n.bounds,r))return;nodes++;for(const item of n.items){if(intersects(item.box,r)){possible++;visit(item.segment,item.index)}}if(n.children)for(const child of n.children)walk(child)};walk(this.root);return {nodes,possible}}
}
export function randomSegments(count,seed=29012026){let s=seed>>>0;const rand=()=>((s=(Math.imul(1664525,s)+1013904223)>>>0)/4294967296);const segments=new Array(count);for(let i=0;i<count;i++){const ax=rand()*2000-1000,ay=rand()*2000-1000,ang=rand()*Math.PI*2,len=2+rand()*230;segments[i]=[{x:ax,y:ay},{x:ax+Math.cos(ang)*len,y:ay+Math.sin(ang)*len}]}return segments}
