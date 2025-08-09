import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// コンポーネントテスト後のクリーンアップ
afterEach(() => {
  cleanup()
})