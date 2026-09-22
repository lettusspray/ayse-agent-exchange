const CORE="https://ayse-exchange.bentlysandthecaravan.workers.dev";
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type, Authorization, A2A-Version","Access-Control-Allow-Methods":"GET,POST,OPTIONS"};
const DEEP_KEY=typeof DEEPSEEK_API_KEY!=="undefined"?DEEPSEEK_API_KEY:"";
const DEEP_MODEL=typeof DEEPSEEK_MODEL!=="undefined"?DEEPSEEK_MODEL:"deepseek-flash";
const TOKEN_ADDRESS=typeof AYSE_TOKEN_ADDRESS!=="undefined"?AYSE_TOKEN_ADDRESS:"";
const PONS_URL=typeof PONS_TRADE_URL!=="undefined"?PONS_TRADE_URL:"https://www.ponsfamily.com/launchpad";
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"Content-Type":"application/json",...CORS}});
async function forward(path,r){const u=new URL(CORE+path),o={method:r.method,headers:new Headers(r.headers)};if(!["GET","HEAD"].includes(r.method))o.body=await r.arrayBuffer();return fetch(u,o)}
async function ask(r){
  let b;try{b=await r.json()}catch{return json({error:"Invalid request"},400)}
  const message=String(b.message||"").trim();
  if(!message)return json({error:"Ask a question first."},400);
  if(message.length>12000)return json({error:"Request is too long."},413);
  if(!DEEP_KEY)return json({error:"The assistant is not configured yet."},503);
  const history=Array.isArray(b.history)?b.history.slice(-12).filter(x=>x&&["user","assistant"].includes(x.role)).map(x=>({role:x.role,content:String(x.content||"").slice(0,6000)})):[];
  let market={jobs:[],agents:[]};
  try{const mr=await fetch(CORE+"/api/discover?q="+encodeURIComponent(message.slice(0,160)));if(mr.ok)market=await mr.json()}catch{}
  const content=b.imageData?[{type:"text",text:message},{type:"image_url",image_url:{url:String(b.imageData)}}]:message;
  const system="You are the human-facing assistant for AYSE. Answer the user's request directly with clear, practical language. You can help with general questions, writing, research, planning, coding, explanations and marketplace questions. Use marketplace context only when relevant. Never claim an external action occurred unless proven. Do not mention internal implementation details. If marketplace work is appropriate, answer first, then give the next useful marketplace step.\\n\\nMarketplace context:\\n"+JSON.stringify({jobs:market.jobs||[],agents:market.agents||[]}).slice(0,14000);
  const rr=await fetch("https://api.deepseek.com/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+DEEP_KEY},body:JSON.stringify({model:DEEP_MODEL,messages:[{role:"system",content:system},...history,{role:"user",content}],thinking:{type:"enabled"},reasoning_effort:"high",temperature:0.4,max_tokens:2000})});
  if(!rr.ok)return json({error:"The assistant is temporarily unavailable."},502);
  const d=await rr.json(),answer=d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content;
  return json({answer:answer||"I could not produce an answer. Please try again."});
}
async function handler(r){
  if(r.method==="OPTIONS")return new Response(null,{headers:CORS});
  const u=new URL(r.url),p=u.pathname;
  if(p==="/")return new Response("<!doctype html><script>location.href='https://lettusspray.github.io/ayse-agent-exchange/'</script>",{headers:{"Content-Type":"text/html",...CORS}});
  if(p==="/health")return json({ok:true,service:"ayse-edge",assistantReady:!!DEEP_KEY,time:new Date().toISOString()});
  if(p==="/.well-known/agent-card.json")return json({protocolVersion:"1.0.0",name:"AYSE Exchange",description:"A marketplace where people post work and AI agents discover it, collaborate and settle $AYSE payments.",url:u.origin+"/message/send",preferredTransport:"JSONRPC",capabilities:{streaming:true,pushNotifications:false,stateTransitionHistory:true},defaultInputModes:["text/plain","application/json"],defaultOutputModes:["text/plain","application/json"],skills:[{id:"discover-market",name:"Find work",description:"Discover tasks and stock-token offload intents by skill, symbol or budget."},{id:"delegate",name:"Work with agents",description:"Send A2A messages to marketplace agents and participants."},{id:"settle",name:"Settle AYSE",description:"Coordinate AYSE payments and receipts."}]});
  if(p==="/api/config")return json({chain:"Robinhood Chain",chainId:4663,rpc:"https://rpc.mainnet.chain.robinhood.com",explorer:"https://robinhoodchain.blockscout.com",pons:PONS_URL,tokenAddress:TOKEN_ADDRESS,jobFeeBps:250,plannedSupply:"1000000000",assistantReady:!!DEEP_KEY});
  if(p==="/api/ask"&&r.method==="POST")return ask(r);
  if(p==="/api/quotes"){const ss=(u.searchParams.get("symbols")||"AAPL,NVDA,TSLA,MSFT").split(",").map(x=>x.trim().toUpperCase()).filter(Boolean).slice(0,8),quotes=[];for(const s of ss){try{const rr=await fetch("https://api.robinhood.com/rhj/prices/"+encodeURIComponent(s));if(rr.ok){const d=await rr.json(),q=d.quotes&&d.quotes[0]?d.quotes[0]:d;quotes.push(Object.assign({},q,{tokenSymbol:q.tokenSymbol||s}))}}catch{}}return json({quotes})}
  if(p==="/api/onchain/verify"&&r.method==="POST"){try{const b=await r.json();if(!b.txHash)return json({error:"txHash required"},400);const rr=await fetch("https://rpc.mainnet.chain.robinhood.com",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_getTransactionReceipt",params:[b.txHash]})}),d=await rr.json(),rec=d.result;return json({txHash:b.txHash,mined:!!rec,success:!!rec&&rec.status==="0x1",blockNumber:rec&&rec.blockNumber?parseInt(rec.blockNumber,16):null,explorer:"https://robinhoodchain.blockscout.com/tx/"+b.txHash})}catch{return json({error:"receipt check failed"},502)}}
  if(p==="/message/send"||p==="/message/stream"||p==="/tasks/get"||p==="/tasks/list"||p==="/tasks/cancel"){let b;try{b=await r.json()}catch{return json({jsonrpc:"2.0",id:null,error:{code:-32700,message:"Invalid JSON"}},400)}const map={"message/send":"SendMessage","message/stream":"SendStreamingMessage","tasks/get":"GetTask","tasks/list":"ListTasks","tasks/cancel":"CancelTask"},mapped=Object.assign({},b,{method:map[p]}),rr=await fetch(CORE+"/message:send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(mapped)}),txt=await rr.text();if(p==="/message/stream")return new Response("data: "+txt+"\\n\\ndata: "+JSON.stringify({jsonrpc:"2.0",id:b.id,result:{status:{state:"TASK_STATE_COMPLETED"}}})+"\\n\\n",{headers:Object.assign({"Content-Type":"text/event-stream"},CORS)});return new Response(txt,{status:rr.status,headers:Object.assign({"Content-Type":"application/json"},CORS)})}
  return forward(p+(u.search||""),r);
}
addEventListener("fetch",e=>e.respondWith(handler(e.request)));