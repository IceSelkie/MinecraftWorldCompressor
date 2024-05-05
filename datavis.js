
function toSvg(ages) {
  ages = ages.map(a=>[...a[0].split(",").map(Number), a[1]]);
  const boarderSize = 5;
  let xmin = ages.map(a=>a[0]).reduce((a,b)=>Math.min(a,b)) - 2*boarderSize;
  let xmax = ages.map(a=>a[0]).reduce((a,b)=>Math.max(a,b)) + 2*boarderSize;
  let zmin = ages.map(a=>a[1]).reduce((a,b)=>Math.min(a,b)) - 2*boarderSize;
  let zmax = ages.map(a=>a[1]).reduce((a,b)=>Math.max(a,b)) + 2*boarderSize;
  let tmin = ages.map(a=>a[2]).reduce((a,b)=>Math.min(a,b));
  let trange = ages.map(a=>a[2]).reduce((a,b)=>Math.max(a,b)) - tmin;
  console.log({xmin,xmax,zmin,zmax,tmin,trange});
  ages.sort((a,b)=>b[2]-a[2]);
  let start = `<svg width="${xmax-xmin+1}" height="${zmax-zmin+1}" viewBox="${xmin} ${zmin} ${xmax-xmin+1} ${zmax-zmin+1}" xmlns="http://www.w3.org/2000/svg">`;
  let end = `</svg>`;
  let ret = [
    `<rect x="${xmin-(50*boarderSize)}" y="${zmin-(50*boarderSize)}" width="${xmax-xmin+1+(100*boarderSize)}" height="${zmax-zmin+1+(100*boarderSize)}" fill="black" />`,
    `<rect x="${xmin+boarderSize}" y="${zmin+boarderSize}" width="${xmax-xmin+1-(2*boarderSize)}" height="${zmax-zmin+1-(2*boarderSize)}" fill="gray" />`
    ];
  ages.forEach(([x,y,time],i)=>{
    // Index Based (time-nonlinear)
    let t = (ages.length-i)/(ages.length-1);
    // Time Based (time-linear)
    // // let t = (time-tmin) / trange;
    let fillColor = `rgb(${Math.round(255*(1-t))},${Math.round(255*t)},0)`;
    ret.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fillColor}" />`);
  });
  return `${start}\n  ${ret.join("\n  ")}\n${end}`;
}


// heightmap?