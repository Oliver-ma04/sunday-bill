import { describe, it, expect } from 'vitest'

describe('示例测试', () => {
  it('1 + 1 应该等于 2', () => {
    expect(1 + 1).toBe(2)
  })

  it('字符串应该正确拼接', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World')
  })

  it('数组应该包含指定元素', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(arr).toContain(3)
  })

  it('对象应该有指定的属性', () => {
    const obj = { name: 'Sunday', version: '1.1.0' }
    expect(obj).toHaveProperty('name', 'Sunday')
  })
})
