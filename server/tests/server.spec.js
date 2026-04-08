import request from 'supertest'
import { app } from '../src/cgServer.js'
import { describe, it, expect } from 'vitest'

// Ensure we run with development-like defaults for route prefix (/api)
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

describe('API basic endpoints', () => {
  it('GET /api/health should return { ok: true }', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('GET /api/ready should return { ready: true }', async () => {
    const res = await request(app).get('/api/ready')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ready: true })
  })
})
