import { clamp, grayAt, edgeCoord } from './pixel-utils.js';

export function adaptiveThreshold(src, windowSize=15, offset=7) {
 const w=src.width,h=src.height,d=src.data,n=w*h, integral=new Float64Array((w+1)*(h+1));
 for(let y=1;y<=h;y++){let row=0;for(let x=1;x<=w;x++){row+=d[((y-1)*w+x-1)*4];integral[y*(w+1)+x]=integral[(y-1)*(w+1)+x]+row;}}
 const out=new ImageData(w,h),r=Math.floor(windowSize/2),od=out.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let x1=Math.max(0,x-r),x2=Math.min(w-1,x+r),y1=Math.max(0,y-r),y2=Math.min(h-1,y+r);let sum=integral[(y2+1)*(w+1)+x2+1]-integral[y1*(w+1)+x2+1]-integral[(y2+1)*(w+1)+x1]+integral[y1*(w+1)+x1];let mean=sum/((x2-x1+1)*(y2-y1+1));let v=d[(y*w+x)*4] < mean-offset ? 0:255,p=(y*w+x)*4;od[p]=od[p+1]=od[p+2]=v;od[p+3]=255;}
 return out;
}

export function clahe(src, tileSize=64, clipLimit=2) {
 const w=src.width,h=src.height,d=src.data,out=new ImageData(w,h),od=out.data;
 for(let ty=0;ty<h;ty+=tileSize) for(let tx=0;tx<w;tx+=tileSize){const tw=Math.min(tileSize,w-tx),th=Math.min(tileSize,h-ty),hist=new Uint32Array(256);for(let y=ty;y<ty+th;y++)for(let x=tx;x<tx+tw;x++)hist[d[(y*w+x)*4]]++;
 const limit=Math.max(1,Math.floor(clipLimit*tw*th/256));let excess=0;for(let i=0;i<256;i++)if(hist[i]>limit){excess+=hist[i]-limit;hist[i]=limit;}let each=Math.floor(excess/256),rem=excess%256;for(let i=0;i<256;i++)hist[i]+=each+(i<rem?1:0);
 const lut=new Uint8Array(256);let cdf=0;for(let i=0;i<256;i++){cdf+=hist[i];lut[i]=Math.round(255*cdf/(tw*th));}for(let y=ty;y<ty+th;y++)for(let x=tx;x<tx+tw;x++){let p=(y*w+x)*4,v=lut[d[p]];od[p]=od[p+1]=od[p+2]=v;od[p+3]=255;}}
 return out;
}

export function canny(src, low=45, high=100) {
 const w=src.width,h=src.height,d=src.data,n=w*h,g=new Float32Array(n),mag=new Float32Array(n),dir=new Uint8Array(n),out=new ImageData(w,h),od=out.data;
 for(let i=0;i<n;i++)g[i]=d[i*4];
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let i=y*w+x;let gx=-g[i-w-1]+g[i-w+1]-2*g[i-1]+2*g[i+1]-g[i+w-1]+g[i+w+1],gy=-g[i-w-1]-2*g[i-w]-g[i-w+1]+g[i+w-1]+2*g[i+w]+g[i+w+1];mag[i]=Math.hypot(gx,gy);let a=Math.atan2(gy,gx)*180/Math.PI;if(a<0)a+=180;dir[i]=a<22.5||a>=157.5?0:a<67.5?1:a<112.5?2:3;}
 const nms=new Float32Array(n);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let i=y*w+x,a,b;switch(dir[i]){case 0:a=mag[i-1];b=mag[i+1];break;case 1:a=mag[i-w+1];b=mag[i+w-1];break;case 2:a=mag[i-w];b=mag[i+w];break;default:a=mag[i-w-1];b=mag[i+w+1];}if(mag[i]>=a&&mag[i]>=b)nms[i]=mag[i];}
 const state=new Uint8Array(n),stack=[];for(let i=0;i<n;i++){if(nms[i]>=high){state[i]=2;stack.push(i)}else if(nms[i]>=low)state[i]=1;}
 while(stack.length){let i=stack.pop(),x=i%w,y=(i/w)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let xx=x+dx,yy=y+dy,j=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&state[j]===1){state[j]=2;stack.push(j);}}}
 for(let i=0;i<n;i++){let v=state[i]===2?255:0,p=i*4;od[p]=od[p+1]=od[p+2]=v;od[p+3]=255;}return out;
}

export function histogram(src){const hist=new Uint32Array(256),d=src.data;for(let i=0;i<d.length;i+=4)hist[d[i]]++;return hist;}
