/** Importación efímera. No se persisten exportaciones ni contraseñas. */
export type ImportRow={address:string;password:string;displayName:string};
export type ImportPreview={rows:ImportRow[];scanned:number;ignoredDomain:number;ignoredExisting:number;invalid:number;duplicates:number};
const email=/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
const MAX_BYTES=5_000_000;
const MAX_ELIGIBLE=100;
function csvRows(text:string):string[][] {
  const rows:string[][]=[];let row:string[]=[];let cell='';let quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(cell);cell='';}
    else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw new Error('CSV incorrecto: comillas sin cerrar.');
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
export function parseAccountImport(text:string, configuredDomains:string[], existingAddresses:string[]):ImportPreview{
  if(text.length>MAX_BYTES)throw new Error('El archivo supera 5 MB.');
  const normalized=text.trim().replace(/^\ufeff/,'');
  const allowed=new Set(configuredDomains.map(x=>x.trim().toLowerCase()));
  if(allowed.size===0)throw new Error('Configura primero al menos un dominio en Alpanix.');
  const existing=new Set(existingAddresses.map(x=>x.trim().toLowerCase()));
  let raw:ImportRow[]=[];
  if(normalized.startsWith('{')||normalized.startsWith('[')){
    let obj:unknown;
    try{obj=JSON.parse(normalized);}catch{throw new Error('Archivo JSON inválido.');}
    const root=obj as {items?:unknown[];encrypted?:boolean};
    if(root?.encrypted)throw new Error('La exportación cifrada de Bitwarden no es compatible.');
    const items=Array.isArray(obj)?obj:Array.isArray(root?.items)?root.items:null;
    if(!items)throw new Error('Se esperaba una lista JSON o una exportación de Bitwarden con items.');
    raw=items.map((value:any)=>{
      const login=value?.login||value;
      return {address:String(login?.username??value?.address??''),password:String(login?.password??value?.password??''),displayName:String(value?.name??value?.display_name??'')};
    });
  }else{
    const rows=csvRows(normalized);
    if(rows.length<2)throw new Error('CSV sin filas de datos.');
    const head=rows.shift()!.map(x=>x.trim().toLowerCase());
    const find=(aliases:string[])=>head.findIndex(h=>aliases.includes(h));
    const addr=find(['address','email','correo','username','login_username']);
    const pass=find(['password','contraseña','login_password']);
    const name=find(['display_name','name','nombre']);
    if(addr<0||pass<0)throw new Error('El CSV necesita columnas de dirección y contraseña.');
    raw=rows.map(row=>({address:row[addr]||'',password:row[pass]||'',displayName:name>=0?row[name]||'':''}));
  }
  let ignoredDomain=0,ignoredExisting=0,invalid=0,duplicates=0;
  const unique=new Set<string>();const accepted:ImportRow[]=[];
  for(const entry of raw){
    const address=entry.address.trim().toLowerCase();
    if(!email.test(address)){invalid++;continue;}
    const domain=address.split('@')[1];
    if(!allowed.has(domain)){ignoredDomain++;continue;}
    if(existing.has(address)){ignoredExisting++;continue;}
    if(unique.has(address)){duplicates++;continue;}
    unique.add(address);
    const password=entry.password;
    if(!password||password.length>2048){invalid++;continue;}
    accepted.push({address,password,displayName:entry.displayName.trim().slice(0,200)});
    if(accepted.length>MAX_ELIGIBLE)throw new Error('Hay más de 100 buzones elegibles para esta importación. Divide el archivo.');
  }
  return {rows:accepted,scanned:raw.length,ignoredDomain,ignoredExisting,invalid,duplicates};
}
