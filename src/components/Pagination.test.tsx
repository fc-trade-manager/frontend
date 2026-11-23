import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Pagination } from './ui'

afterEach(cleanup)

describe('Pagination', () => {
  it('moves between pages, disables the edges and hides itself with a single page', () => {
    const onPage = vi.fn()
    const { rerender } = render(<Pagination page={1} totalPages={3} onPage={onPage} />)

    expect(screen.getByText('Page 1 of 3')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPage).toHaveBeenCalledWith(2)

    rerender(<Pagination page={3} totalPages={3} onPage={onPage} />)
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(onPage).toHaveBeenLastCalledWith(2)

    // with a single page there is nothing to show
    rerender(<Pagination page={1} totalPages={1} onPage={onPage} />)
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  })
})
