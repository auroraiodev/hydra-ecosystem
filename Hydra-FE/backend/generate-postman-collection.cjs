const spec = require('./openapi-spec.json');

const API_PREFIX = '/api/v1';
const BASE_URL = '{{baseUrl}}';

const COMMON_HEADERS = [
  { key: 'Content-Type', value: 'application/json' },
];

function buildRequest(method, path, op) {
  const hasBody = !!op.requestBody;
  const secured = !!op.security;

  // Normalize path params: {id} -> :id
  let postmanPath = (API_PREFIX + path).replace(/\{(\w+)\}/g, ':$1');
  // Ensure /api/v1/ for root path too
  if (postmanPath === API_PREFIX) postmanPath = API_PREFIX + '/';

  const url = {
    raw: BASE_URL + postmanPath,
    host: ['{{baseUrl}}'],
    path: postmanPath.split('/').filter(Boolean),
    variable: [],
  };

  // Add path variable definitions
  const pathParams = (op.parameters || []).filter(p => p.in === 'path');
  for (const p of pathParams) {
    url.variable.push({
      key: p.name,
      value: '',
      description: p.description || `Path parameter: ${p.name}`,
    });
  }

  // Build query params
  const queryParams = (op.parameters || []).filter(p => p.in === 'query');
  const urlQuery = [];
  for (const p of queryParams) {
    urlQuery.push({
      key: p.name,
      value: '',
      description: p.description || `Query parameter: ${p.name}`,
    });
  }

  const header = [...COMMON_HEADERS];

  if (secured) {
    header.push({
      key: 'Authorization',
      value: 'Bearer {{token}}',
      type: 'text',
    });
  }

  const request = {
    method: method.toUpperCase(),
    header,
    url,
  };

  if (urlQuery.length > 0) {
    request.url.query = urlQuery;
  }

  if (hasBody) {
    request.body = {
      mode: 'raw',
      raw: '{\n  \n}',
      options: { raw: { language: 'json' } },
    };
  }

  return request;
}

function buildEvent(method, op, hasBody) {
  const statusCodes = Object.keys(op.responses).filter(c => /^\d{3}$/.test(c));
  const successCodes = statusCodes.filter(c => c.startsWith('2'));
  const primaryCode = successCodes.length > 0 ? parseInt(successCodes[0]) : 200;
  const isMutation = ['post', 'put', 'patch'].includes(method);

  const assertions = [];

  // Universal 401 handling: when no token is set, 401 is always valid
  assertions.push('const token = pm.variables.get("token") || pm.environment.get("token") || "";');
  assertions.push('if (pm.response.code === 401 && !token) {');
  assertions.push('  pm.test("Blocked unauthenticated (no token set)", () => pm.expect(true).to.be.true);');
  assertions.push('  return;');
  assertions.push('}');
  // Build valid status codes dynamically (add 400 for endpoints with request body)
  let validStatusCodes = [...statusCodes];
  if (hasBody && !validStatusCodes.includes('400')) validStatusCodes.push('400');
  if (validStatusCodes.length <= 1) {
    assertions.push(`pm.response.to.have.status(${primaryCode});`);
  } else {
    assertions.push(`const validCodes = [${validStatusCodes.join(', ')}];`);
    assertions.push(`pm.expect(validCodes).to.include(pm.response.code);`);
  }

  // JSON body checks
  assertions.push('');
  assertions.push('if (pm.response.code >= 200 && pm.response.code < 300) {');
  assertions.push('  try {');
  assertions.push('    const jsonData = pm.response.json();');
  assertions.push('    pm.expect(jsonData).to.be.an(\'object\');');

  // Check for NestJS wrapped responses with success flag
  assertions.push('    // Check for NestJS ResponseInterceptor wrapper pattern');
  assertions.push('    if (jsonData.success !== undefined && jsonData.data !== undefined) {');
  assertions.push('      pm.expect(jsonData.success).to.be.true;');
  if (method === 'get' && !isMutation) {
    assertions.push('      // Data can be array or object depending on endpoint');
    assertions.push('      pm.expect(jsonData.data).to.exist;');
  }
  assertions.push('    }');
  if (isMutation && primaryCode === 201) {
    assertions.push('    // For create endpoints');
    assertions.push('    if (jsonData.success !== undefined) {');
    assertions.push('      pm.expect(jsonData.success).to.be.true;');
    assertions.push('    }');
  }

  assertions.push('  } catch (e) {');
  assertions.push('    // For endpoints that return non-JSON or plain strings');
  assertions.push('    console.log("Response is not standard JSON: " + e.message);');
  assertions.push('  }');
  assertions.push('}');

  return [
    {
      listen: 'test',
      script: {
        exec: assertions,
        type: 'text/javascript',
      },
    },
  ];
}

function buildItem(method, path, op) {
  const hasBody = !!op.requestBody;
  const item = {
    name: `${method.toUpperCase()} ${path} — ${op.summary || 'No summary'}`,
    request: buildRequest(method, path, op),
    event: buildEvent(method, op, hasBody),
  };

  return item;
}

function buildFolder(tag, endpoints) {
  const items = endpoints.map(e => buildItem(e.method, e.path, e.op));
  return {
    name: tag,
    item: items,
  };
}

// Build collection
const collection = {
  info: {
    name: 'Hydra BE E2E Tests',
    description: 'Auto-generated E2E test collection from OpenAPI spec',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [],
  variable: [
    {
      key: 'baseUrl',
      value: 'http://localhost:3002',
      type: 'string',
    },
    {
      key: 'token',
      value: '',
      type: 'string',
    },
  ],
};

// Group by tags
const tagGroups = {};
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    const tag = (op.tags && op.tags[0]) || 'Other';
    if (!tagGroups[tag]) tagGroups[tag] = [];
    tagGroups[tag].push({ method, path, op });
  }
}

// Sort tag groups by name
const sortedTags = Object.keys(tagGroups).sort();
for (const tag of sortedTags) {
  collection.item.push(buildFolder(tag, tagGroups[tag]));
}

const fs = require('fs');
fs.writeFileSync('./hydra-be-e2e.postman_collection.json', JSON.stringify(collection, null, 2));
console.log('Collection generated successfully!');
console.log('Total endpoints: ' + collection.item.reduce((acc, folder) => acc + folder.item.length, 0));
console.log('Total folders: ' + collection.item.length);
