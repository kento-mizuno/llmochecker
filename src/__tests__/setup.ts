import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// コンポーネントテスト後のクリーンアップ
afterEach(() => {
  cleanup()
})

// JSDOMのセットアップ
beforeAll(() => {
  // localStorage のモック
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  vi.stubGlobal('localStorage', localStorageMock)

  // sessionStorage のモック  
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  vi.stubGlobal('sessionStorage', sessionStorageMock)

  // IntersectionObserver のモック
  vi.stubGlobal('IntersectionObserver', vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  })))

  // ResizeObserver のモック
  vi.stubGlobal('ResizeObserver', vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(), 
    disconnect: vi.fn()
  })))

  // matchMedia のモック
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterAll(() => {
  vi.resetAllMocks()
})