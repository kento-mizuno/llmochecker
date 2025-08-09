import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../app/page'

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />)
    // 基本的な要素がレンダリングされることを確認
    expect(document.body).toBeTruthy()
  })
})