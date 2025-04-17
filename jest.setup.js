// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    }
  },
}))

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
}))

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret'

// Mock global Request class
global.Request = class Request {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers || {});
    this.body = init.body;
  }

  async text() {
    return this.body;
  }

  async json() {
    return JSON.parse(this.body);
  }
};

// Mock Headers class
global.Headers = class Headers {
  constructor(init = {}) {
    this._headers = { ...init };
  }

  get(name) {
    return this._headers[name.toLowerCase()];
  }

  set(name, value) {
    this._headers[name.toLowerCase()] = value;
  }
};

// Mock Response class
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Headers(init.headers);
  }

  async json() {
    return JSON.parse(this.body);
  }
};

// Mock URL class if not available
if (!global.URL) {
  global.URL = class URL {
    constructor(url) {
      this.href = url;
      this.pathname = url;
    }
  };
}