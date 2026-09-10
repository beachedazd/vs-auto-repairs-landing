// Keep Square's existing notification URL; signature validation and processing
// now run in the isolated VS Auto self-hosted Supabase project.
const endpoint='https://170.64.164.253:8451/functions/v1/vsauto-square-webhook';
export default async function handler(req){
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 if(Number(req.headers.get('content-length')||0)>250000)return new Response('Too large',{status:413});
 const body=await req.text();if(body.length>250000)return new Response('Too large',{status:413});
 try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-square-hmacsha256-signature':req.headers.get('x-square-hmacsha256-signature')||''},body,signal:AbortSignal.timeout(25000)});return new Response(await response.text(),{status:response.status,headers:{'Content-Type':'text/plain','Cache-Control':'no-store','X-VS-Auto-Backend':'supabase'}})}catch{return new Response('Webhook backend unavailable; retry delivery',{status:503})}
}
export const config={path:'/hooks/square'};
