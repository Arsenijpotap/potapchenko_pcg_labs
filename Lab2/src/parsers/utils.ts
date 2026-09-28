export class ParseError extends Error { constructor(message: string) { super(message); this.name = 'ParseError'; } }
export const u16le=(b:DataView,o:number)=>b.getUint16(o,true);
export const u16be=(b:DataView,o:number)=>b.getUint16(o,false);
export const u32le=(b:DataView,o:number)=>b.getUint32(o,true);
export const u32be=(b:DataView,o:number)=>b.getUint32(o,false);
export const i32le=(b:DataView,o:number)=>b.getInt32(o,true);
export const i32be=(b:DataView,o:number)=>b.getInt32(o,false);
export const rational=(b:DataView,o:number,little:boolean)=>{const n=b.getUint32(o,little),d=b.getUint32(o+4,little);return d? n/d:undefined};
export function ascii(b:DataView,o:number,n:number){let s='';for(let i=0;i<n&&o+i<b.byteLength;i++){const c=b.getUint8(o+i);if(!c)break;s+=String.fromCharCode(c)}return s}
export function finitePositive(n:number|undefined){return n!==undefined&&Number.isFinite(n)&&n>0?n:undefined}
export function ratioToDpi(x:number|undefined, unit?:number){if(!x)return undefined;if(unit===2)return x;if(unit===3)return x*2.54;return undefined}
