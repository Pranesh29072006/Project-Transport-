import {test,after} from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
process.env.DB_PATH=':memory:';
process.env.MOCK_INSURANCE='false';
process.env.INSURANCE_API_KEY='demo-key';
const {mockApp}=await import('../mock-insurance/server.js');
const middleware=mockApp.listen(0,'127.0.0.1');
await new Promise(resolve=>middleware.once('listening',resolve));
process.env.INSURANCE_API_BASE_URL=`http://127.0.0.1:${middleware.address().port}`;
const {app}=await import('../backend/src/app.js');
const {db}=await import('../backend/src/config/db.js');
const merchant=app.listen(0,'127.0.0.1');
await new Promise(resolve=>merchant.once('listening',resolve));
const base=`http://127.0.0.1:${merchant.address().port}/api`;
let token;
async function call(path,body){const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data}
after(async()=>{await Promise.all([new Promise(resolve=>middleware.close(resolve)),new Promise(resolve=>merchant.close(resolve))]);db.close()});
test('external REST adapter: eligibility, quotes, consent, paid issuance and status',async()=>{token=(await call('/auth/register',{email:'network-test@example.com',password:'Network-test-password',name:'Network Tester'})).token;let b=await call('/bookings',{search:{type:'bus',from:'Chennai',to:'Bangalore',date:new Date(Date.now()+86400000).toISOString().slice(0,10),passengers:1},tripId:'bus-0',passengers:[{name:'Network Tester',age:28}],seats:[1]});assert.equal(b.quote.plans.length,3);b=await call(`/bookings/${b.id}/insurance`,{planId:b.quote.plans[1].id,consent:true});assert.ok(b.consent.id);b=await call(`/bookings/${b.id}/pay`,{method:'Credit card'});assert.equal(b.total,1269);assert.equal(b.policy.status,'issued');const issued=b.policy.policyNumber;const repeat=await call(`/bookings/${b.id}/retry-policy`,{});assert.equal(repeat.policy.policyNumber,issued);const policy=await fetch(process.env.INSURANCE_API_BASE_URL+`/api/v1/insurance/policies/${b.policy.policyId}`,{headers:{'X-API-Key':'demo-key'}});assert.equal(policy.status,200);assert.equal((await policy.json()).policyNumber,issued);const denied=await fetch(process.env.INSURANCE_API_BASE_URL+'/api/v1/insurance/quotes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({booking:b})});assert.equal(denied.status,401)});
