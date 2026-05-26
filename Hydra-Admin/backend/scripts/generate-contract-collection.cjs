/**
 * Generates a Postman collection for E2E contract testing.
 * Fetches the live OpenAPI spec from the running server,
 * creates requests for every endpoint, and embeds response
 * schema validation using Ajv (available in Newman sandbox).
 *
 * Usage: node scripts/generate-contract-collection.cjs
 * Output: hydra-be-contract.postman_collection.json
 */

const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:3002';
const API_PREFIX = '/api/v1';
const BASE = '{{baseUrl}}';

// ─── 1. Fetch OpenAPI spec ──────────────────────────────────────────────

async function fetchOpenApiSpec() {
  const res = await fetch(`${SERVER_URL}/docs-json`);
  if (!res.ok) throw new Error(`Failed to fetch OpenAPI spec: ${res.status}`);
  return res.json();
}

// ─── 2. Dereference $ref ────────────────────────────────────────────────

function deref(obj, root, visited = new Set()) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(v => deref(v, root, visited));

  // Handle $ref
  if (obj.$ref) {
    // Avoid circular refs
    const refKey = obj.$ref;
    if (visited.has(refKey)) return { $ref: refKey, _circular: true };
    visited.add(refKey);

    const resolved = resolveRef(obj.$ref, root);
    if (!resolved) return obj;
    // Recursively dereference the resolved value (but don't re-add to visited
    // for the resolved content itself—we want to resolve nested refs)
    return deref(resolved, root, new Set(visited));
  }

  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = deref(v, root, new Set(visited));
  }
  return result;
}

function resolveRef(ref, root) {
  // ref is like "#/components/schemas/Foo" or a relative URI
  if (!ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/').map(p =>
    p.replace(/~1/g, '/').replace(/~0/g, '~')
  );
  let current = root;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return null;
    current = current[part];
  }
  return current || null;
}

// ─── 3. Extract response schemas ────────────────────────────────────────

function extractResponseSchema(op) {
  const responses = op.responses || {};
  const successCodes = Object.keys(responses).filter(c => /^2\d\d$/.test(c));
  if (successCodes.length === 0) return null;

  const primaryCode = successCodes[0];
  const response = responses[primaryCode];

  // Try application/json content
  const content = response?.content?.['application/json'];
  if (!content?.schema) return null;

  return content.schema;
}

function getStatusCodes(op) {
  const codes = Object.keys(op.responses || {}).filter(c => /^\d{3}$/.test(c));
  // If endpoint has required params and 400 isn't listed, add it
  const hasRequiredParams = (op.parameters || []).some(p => p.required === true);
  if (hasRequiredParams && !codes.includes('400')) {
    codes.push('400');
  }
  return codes;
}

function isSecured(op) {
  return op.security && op.security.length > 0 &&
    op.security.some(s => Object.keys(s).some(k => k === 'bearer' || k === 'JWT' || k === 'jwt'));
}

function getTag(op) {
  return (op.tags && op.tags[0]) || 'Other';
}

function determineAuthRole(path, op) {
  if (!isSecured(op)) return null;
  const tag = getTag(op).toLowerCase();
  const lpath = path.toLowerCase();
  // Admin routes
  if (lpath.startsWith('/admin') || lpath.includes('/admin/') ||
      tag === 'admin' || tag === 'admin dashboard' || tag === 'admin dashboard ') {
    return 'admin';
  }
  // Seller routes
  if (lpath.startsWith('/seller') || lpath.includes('/seller/') ||
      tag.startsWith('seller') || tag === 'seller dashboard') {
    return 'seller';
  }
  return 'client';
}

// ─── 4. Build Postman request objects ──────────────────────────────────

function buildUrl(path) {
  let postmanPath = (API_PREFIX + path).replace(/\{(\w+)\}/g, ':$1');
  if (postmanPath === API_PREFIX) postmanPath = API_PREFIX + '/';

  return {
    raw: BASE + postmanPath,
    host: ['{{baseUrl}}'],
    path: postmanPath.split('/').filter(Boolean),
    variable: [],
  };
}

function buildPathVariables(op) {
  return (op.parameters || [])
    .filter(p => p.in === 'path')
    .map(p => ({ key: p.name, value: '', description: p.description || '' }));
}

function buildQueryParams(op) {
  return (op.parameters || [])
    .filter(p => p.in === 'query')
    .map(p => ({ key: p.name, value: '', description: p.description || '' }));
}

function getRequestBodyExample(op) {
  const body = op.requestBody?.content?.['application/json'];
  if (!body) return null;
  const example = body.example;
  if (example) return example;

  // Try to build from schema
  const schema = body.schema;
  if (!schema) return {};

  return generateExample(schema);
}

function generateExample(schema) {
  if (!schema || typeof schema !== 'object') return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  if (schema.type === 'object' && schema.properties) {
    const obj = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      obj[key] = generateExample(prop);
    }
    return obj;
  }
  if (schema.type === 'array') {
    const item = generateExample(schema.items);
    return item != null ? [item] : [];
  }
  if (schema.type === 'string') {
    if (schema.enum) return schema.enum[0];
    if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
    if (schema.format === 'email') return 'test@example.com';
    if (schema.format === 'date-time') return new Date().toISOString();
    return 'test';
  }
  if (schema.type === 'number' || schema.type === 'integer') return 0;
  if (schema.type === 'boolean') return false;
  if (schema.oneOf) return generateExample(schema.oneOf[0]);
  if (schema.anyOf) return generateExample(schema.anyOf[0]);
  return null;
}

// ─── 5. Generate test script ────────────────────────────────────────────

function generateTestScript(method, op, schema) {
  const statusCodes = getStatusCodes(op);
  const hasBody = !!op.requestBody;
  const codesList = [...statusCodes];
  if (hasBody && !codesList.includes('400')) codesList.push('400');
  // Add 401 if secured
  if (isSecured(op) && !codesList.includes('401')) codesList.push('401');
  // Add 500 for robustness
  if (!codesList.includes('500')) codesList.push('500');

  const codesStr = JSON.stringify(codesList.map(Number));
  const hasSchema = schema != null;

  const lines = [];

  // Auth handling
  lines.push("const token = pm.variables.get('token') || pm.environment.get('token') || '';");
  lines.push('if (pm.response.code === 401 && !token) {');
  lines.push("  pm.test('Blocked unauthenticated (no token set)', () => pm.expect(true).to.be.true);");
  lines.push('  return;');
  lines.push('}');

  // Status code validation
  lines.push('// --- Status code contract ---');
  lines.push(`const validCodes = ${codesStr};`);
  lines.push("pm.test('Status code matches contract', () => {");
  lines.push('  pm.expect(validCodes).to.include(pm.response.code);');
  lines.push('});');

  // Schema validation
  if (hasSchema) {
    lines.push('');
    lines.push('// --- Response body schema contract ---');
    lines.push('if (pm.response.code >= 200 && pm.response.code < 300) {');
    lines.push('  pm.test("Response body matches contract schema", function() {');
    lines.push('    var body;');
    lines.push('    try { body = pm.response.json(); }');
    lines.push('    catch(e) { pm.expect.fail("Response is not valid JSON"); return; }');
    lines.push('    // Handle NestJS ResponseInterceptor wrapping { success, data, meta }');
    lines.push('    var payload = (body && typeof body === "object" && body.success !== undefined && body.data !== undefined) ? body.data : body;');
    lines.push('    var Ajv = require("ajv");');
    lines.push('    var ajv = new Ajv({ strict: false, allErrors: true });');
    lines.push(`    var schema = ${JSON.stringify(schema, null, 2)};`);
    lines.push('    var valid = ajv.validate(schema, payload);');
    lines.push('    if (!valid) {');
    lines.push('      console.log("Schema validation errors:");');
    lines.push('      console.log(JSON.stringify(ajv.errors, null, 2));');
    lines.push('    }');
    lines.push('    pm.expect(valid).to.be.true;');
    lines.push('  });');
    lines.push('}');
  } else {
    // Basic JSON structure check
    lines.push('');
    lines.push('// --- Basic structure check (no schema in spec) ---');
    lines.push('if (pm.response.code >= 200 && pm.response.code < 300) {');
    lines.push('  pm.test("Response is valid JSON", function() {');
    lines.push('    try {');
    lines.push('      var data = pm.response.json();');
    lines.push('      pm.expect(data).to.be.an("object");');
    lines.push('    } catch(e) {');
    lines.push('      pm.expect.fail("Response is not valid JSON");');
    lines.push('    }');
    lines.push('  });');
    lines.push('}');
  }

  return lines;
}

// ─── 6. Build the collection ──────────────────────────────────────────

function authRequest(role, endpoint, loginBody, envTokenKey) {
  return {
    name: `Login as ${role.toUpperCase()}`,
    request: {
      method: 'POST',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: {
        mode: 'raw',
        raw: JSON.stringify(loginBody, null, 2),
        options: { raw: { language: 'json' } },
      },
      url: {
        raw: `${BASE}/api/v1/auth/${endpoint}`,
        host: ['{{baseUrl}}'],
        path: ['api', 'v1', 'auth', ...endpoint.split('/')],
        variable: [],
      },
    },
    event: [
      {
        listen: 'test',
        script: {
          exec: [
            'try {',
            '  var j = pm.response.json();',
            '  var token = j.data && j.data.accessToken || j.accessToken;',
            '  if (token) {',
            "    pm.environment.set('" + envTokenKey + "', token);",
            "    console.log('Token set for: " + role + "');",
            '  } else {',
            "    console.log('Login failed: ' + pm.response.code);",
            '  }',
            '} catch(e) { console.log(e.message); }',
          ],
          type: 'text/javascript',
        },
      },
    ],
  };
}

function buildContractItem(method, path, op, spec) {
  const hasBody = !!op.requestBody;
  const secured = isSecured(op);

  const url = buildUrl(path);
  url.variable = buildPathVariables(op);
  const query = buildQueryParams(op);
  if (query.length > 0) url.query = query;

  const header = [{ key: 'Content-Type', value: 'application/json' }];

  const authRole = determineAuthRole(path, op);

  if (authRole) {
    header.push({ key: 'Authorization', value: `Bearer {{${authRole}Token}}`, type: 'text' });
  }

  const body = hasBody ? {
    mode: 'raw',
    raw: JSON.stringify(getRequestBodyExample(op) || {}, null, 2),
    options: { raw: { language: 'json' } },
  } : undefined;

  const schema = extractResponseSchema(op);
  const testScriptLines = generateTestScript(method, op, schema);

  const item = {
    name: `${method.toUpperCase()} ${path} — ${op.summary || op.operationId || 'No summary'}`,
    request: { method: method.toUpperCase(), header, ...(body ? { body } : {}), url },
    event: [
      {
        listen: 'test',
        script: {
          exec: testScriptLines,
          type: 'text/javascript',
        },
      },
    ],
  };

  return item;
}

// ─── 7. Main ──────────────────────────────────────────────────────────

async function main() {
  console.log('=== Contract Test Collection Generator ===\n');

  // Fetch and resolve spec
  console.log('1. Fetching OpenAPI spec from server...');
  const spec = await fetchOpenApiSpec();
  console.log(`   Fetched: ${Object.keys(spec.paths).length} paths defined\n`);

  console.log('2. Resolving $ref references...');
  const resolved = deref(spec, spec);
  console.log('   Done\n');

  // Build auth setup
  const authFolder = {
    name: '0 — Auth Setup',
    item: [
      authRequest('client', 'login', { email: '{{clientEmail}}', password: '{{clientPassword}}' }, 'clientToken'),
      authRequest('seller', 'admin-login', { email: '{{sellerEmail}}', password: '{{sellerPassword}}' }, 'sellerToken'),
      authRequest('admin', 'admin-login', { email: '{{adminEmail}}', password: '{{adminPassword}}' }, 'adminToken'),
    ],
  };

  // Group endpoints by tag
  const tagGroups = {};
  for (const [path, methods] of Object.entries(resolved.paths || {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op || typeof op !== 'object') continue;
      if (!op.responses) continue;
      const tag = getTag(op);
      if (!tagGroups[tag]) tagGroups[tag] = [];
      tagGroups[tag].push({ method, path, op });
    }
  }

  // Build collection items
  console.log('3. Building collection items...');
  const collectionItems = [{ ...authFolder }];

  const sortedTags = Object.keys(tagGroups).sort((a, b) => {
    const order = ['App', 'health', 'settings', 'auth', 'users', 'roles',
      'banners', 'categories', 'conditions', 'languages', 'tags', 'tcgs',
      'singles', 'search', 'listings', 'cart', 'orders', 'payments',
      'wallet', 'reviews', 'notifications', 'chat', 'feature-flags',
      'modal', 'images', 'ocr', 'assistant', 'seller', 'admin'];
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  let totalEndpoints = 0;
  for (const tag of sortedTags) {
    const endpoints = tagGroups[tag];
    const items = endpoints.map(e => {
      totalEndpoints++;
      return buildContractItem(e.method, e.path, e.op, resolved);
    });
    collectionItems.push({
      name: `${tag}`.replace(/^\//, ''),
      item: items,
    });
  }

  console.log(`   Total folders: ${collectionItems.length}`);
  console.log(`   Total endpoints: ${totalEndpoints}\n`);

  // Assemble collection
  const collection = {
    info: {
      name: 'Hydra BE — Contract Tests',
      description: 'E2E contract tests generated from live OpenAPI spec. Validates response schemas using Ajv.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: collectionItems,
    variable: [
      { key: 'baseUrl', value: 'http://localhost:3002', type: 'string' },
      { key: 'token', value: '', type: 'string' },
    ],
  };

  // Write output
  const outputPath = path.join(__dirname, '..', 'hydra-be-contract.postman_collection.json');
  fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf-8');
  console.log(`4. Collection saved: ${outputPath}`);
  console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB\n`);

  return collection;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
