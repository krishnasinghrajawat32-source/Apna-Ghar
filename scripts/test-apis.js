const http = require('http');
const https = require('https');
const mongoose = require('mongoose');

async function runTests(baseUrl, environmentName, mongoUri) {
  console.log(`\n======================================================`);
  console.log(`🔍 TESTING ALL APIS: ${environmentName} (${baseUrl})`);
  console.log(`======================================================\n`);

  const results = [];
  let authToken = null;
  const testEmail = `apitest_${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';

  async function request(endpoint, options = {}) {
    const url = new URL(baseUrl + endpoint);
    const client = url.protocol === 'https:' ? https : http;

    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      timeout: 15000
    };

    return new Promise((resolve) => {
      const startTime = Date.now();
      const req = client.request(url, reqOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          const duration = Date.now() - startTime;
          let parsed = null;
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = body;
          }
          resolve({ status: res.statusCode, body: parsed, duration });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 'TIMEOUT', error: 'Request timed out after 15s', duration: Date.now() - startTime });
      });

      req.on('error', (err) => {
        resolve({ status: 'ERROR', error: err.message, duration: Date.now() - startTime });
      });

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  }

  // 1. Health Probe
  {
    const res = await request('/health');
    const dbStatus = res.body?.data?.services?.database?.status || res.body?.services?.database?.status;
    const ok = res.status === 200 && dbStatus === 'connected';
    results.push({ name: 'GET /health', description: 'MongoDB & Redis status', status: res.status, ok, duration: res.duration, info: `DB: ${dbStatus}` });
  }

  // 2. Swagger Docs UI
  {
    const res = await request('/docs');
    const ok = res.status === 200 || res.status === 301 || res.status === 302;
    results.push({ name: 'GET /docs', description: 'OpenAPI Documentation', status: res.status, ok, duration: res.duration, info: 'Interactive UI' });
  }

  // 3. User Registration
  {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Api Verifier',
        email: testEmail,
        phone: '+919876543210',
        password: testPassword,
        role: 'STUDENT'
      }
    });
    const ok = res.status === 200 || res.status === 201;
    results.push({ name: 'POST /auth/register', description: 'Student Registration', status: res.status, ok, duration: res.duration, info: ok ? 'Registered successfully' : res.body });
  }

  // Activate / verify email in DB so login can be verified
  if (mongoUri) {
    try {
      const conn = await mongoose.createConnection(mongoUri, { serverSelectionTimeoutMS: 5000 }).asPromise();
      await conn.collection('users').updateOne(
        { email: testEmail.toLowerCase() },
        { $set: { emailVerified: true, accountStatus: 'ACTIVE' } }
      );
      await conn.close();
    } catch (e) {
      // ignore
    }
  }

  // 4. User Login
  {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword
      }
    });
    const ok = res.status === 200 || res.status === 201;
    const token = res.body?.data?.accessToken || res.body?.accessToken;
    if (token) authToken = token;
    results.push({ name: 'POST /auth/login', description: 'JWT Authentication', status: res.status, ok, duration: res.duration, info: ok ? 'Token Issued' : res.body });
  }

  // 5. Protected Profile (/auth/me)
  {
    const res = await request('/auth/me', {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });
    const ok = res.status === 200;
    const userRole = res.body?.data?.user?.role || res.body?.user?.role || res.body?.data?.role || 'STUDENT';
    results.push({ name: 'GET /auth/me', description: 'Protected User Profile', status: res.status, ok, duration: res.duration, info: ok ? `Role: ${userRole}` : res.body });
  }

  // 6. Properties Catalog
  {
    const res = await request('/properties');
    const ok = res.status === 200;
    const count = (res.body?.data || res.body || []).length;
    results.push({ name: 'GET /properties', description: 'Marketplace Search', status: res.status, ok, duration: res.duration, info: `${count} properties` });
  }

  // 7. Colleges Search
  {
    const res = await request('/colleges/search?q=delhi');
    const ok = res.status === 200;
    const count = Array.isArray(res.body) ? res.body.length : (res.body?.data?.length || 0);
    results.push({ name: 'GET /colleges/search', description: 'University Autocomplete', status: res.status, ok, duration: res.duration, info: `${count} colleges matched` });
  }

  // 8. Mess Partners
  {
    const res = await request('/mess');
    const ok = res.status === 200;
    const count = (res.body?.data || res.body || []).length;
    results.push({ name: 'GET /mess', description: 'Mess Partners Listing', status: res.status, ok, duration: res.duration, info: `${count} mess partners` });
  }

  // 9. Unauthenticated Security Guard
  {
    const res = await request('/owner/properties');
    const ok = res.status === 401;
    results.push({ name: 'GET /owner/properties', description: 'Auth Guard (No Token)', status: res.status, ok, duration: res.duration, info: 'Correctly blocked (401)' });
  }

  // 10. Role-Based Access Control (RBAC Guard)
  {
    const res = await request('/admin/users', {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });
    const ok = res.status === 403 || res.status === 401;
    results.push({ name: 'GET /admin/users', description: 'RBAC Guard (Student Token)', status: res.status, ok, duration: res.duration, info: ok ? 'Access Denied (403/401)' : `Status: ${res.status}` });
  }

  // Print Summary Table
  console.log(`| # | API Endpoint | Description | HTTP Status | Time (ms) | Result | Details |`);
  console.log(`|---|---|---|---|---|---|---|`);
  results.forEach((r, idx) => {
    const icon = r.ok ? '✅ PASS' : '❌ FAIL';
    console.log(`| ${idx + 1} | ${r.name} | ${r.description} | ${r.status} | ${r.duration}ms | ${icon} | ${typeof r.info === 'string' ? r.info : JSON.stringify(r.info).slice(0, 45)} |`);
  });

  const passedCount = results.filter(r => r.ok).length;
  console.log(`\nSummary for ${environmentName}: ${passedCount}/${results.length} tests passed.\n`);
  return { passedCount, total: results.length, results };
}

(async () => {
  // 1. Test Localhost
  await runTests(
    'http://127.0.0.1:4000/api/v1',
    'LOCAL SERVER',
    'mongodb://127.0.0.1:27017/apna_ghar'
  );

  // 2. Test Production Render
  await runTests(
    'https://apna-ghar-2-4766.onrender.com/api/v1',
    'RENDER PRODUCTION',
    'mongodb+srv://erkrishnasingh001_db_user:ySIW0WpyxuXOYKkI@cluster1.ucsgvqr.mongodb.net/apna_ghar?retryWrites=true&w=majority'
  );

  process.exit(0);
})();

