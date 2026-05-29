import { describe, it, expect, beforeAll } from 'vitest'
import { env } from '../../src/server/env'

/**
 * Integration test: Auth → Contracts flow against mock API
 * Validates that the mock API accepts the backend Bearer token
 * returned by login, preventing 401 errors in server-to-server calls.
 */
describe('Contracts Auth Flow (Integration)', () => {
  const API_URL = env.API_URL

  beforeAll(() => {
    expect(API_URL).toMatch(/localhost:4010/)
  })

  it('login endpoint returns a token', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@bemcomum.org.br', password: '123456' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.token).toBeDefined()
    expect(typeof data.token).toBe('string')
    expect(data.token.length).toBeGreaterThan(0)
  })

  it('mock API accepts Bearer token from login (no 401)', async () => {
    // Step 1: Login to get token
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@bemcomum.org.br', password: '123456' }),
    })
    const loginData = await loginRes.json()
    const token = loginData.token

    // Step 2: Call /contracts with Bearer token (same as server functions do)
    const contractsRes = await fetch(`${API_URL}/contracts?page=1&limit=5`, {
      headers: { authorization: `Bearer ${token}` },
    })

    expect(contractsRes.status).toBe(200)
    const contractsData = await contractsRes.json()
    expect(contractsData).toBeDefined()
    expect(Array.isArray(contractsData.data) || Array.isArray(contractsData)).toBe(true)
  })

  it('mock API rejects invalid Bearer token (401)', async () => {
    const res = await fetch(`${API_URL}/contracts?page=1&limit=5`, {
      headers: { authorization: 'Bearer invalid-token-12345' },
    })
    expect(res.status).toBe(401)
  })

  it('mock API rejects missing auth (401)', async () => {
    const res = await fetch(`${API_URL}/contracts?page=1&limit=5`)
    expect(res.status).toBe(401)
  })
})
