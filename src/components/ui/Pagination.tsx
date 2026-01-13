'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    currentPage: number
    totalPages: number
    basePath: string
    searchParams?: Record<string, string>
}

export function Pagination({
    currentPage,
    totalPages,
    basePath,
    searchParams = {},
}: PaginationProps) {
    if (totalPages <= 1) return null

    // ページ番号の配列を生成（現在のページを中心に前後2ページ）
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = []
        const showEllipsisStart = currentPage > 3
        const showEllipsisEnd = currentPage < totalPages - 2

        // 最初のページ
        if (showEllipsisStart) {
            pages.push(1)
            if (currentPage > 4) {
                pages.push('ellipsis')
            }
        }

        // 現在のページ周辺
        const start = Math.max(1, currentPage - 2)
        const end = Math.min(totalPages, currentPage + 2)

        for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) {
                pages.push(i)
            }
        }

        // 最後のページ
        if (showEllipsisEnd) {
            if (currentPage < totalPages - 3) {
                pages.push('ellipsis')
            }
            if (!pages.includes(totalPages)) {
                pages.push(totalPages)
            }
        }

        return pages
    }

    const buildUrl = (page: number) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', String(page))
        return `${basePath}?${params.toString()}`
    }

    const pageNumbers = getPageNumbers()

    return (
        <nav className="flex items-center justify-center space-x-1" aria-label="Pagination">
            {/* 前へボタン */}
            {currentPage > 1 ? (
                <Link href={buildUrl(currentPage - 1)}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">前へ</span>
                    </Button>
                </Link>
            ) : (
                <Button variant="outline" size="sm" disabled className="flex items-center gap-1 opacity-50">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">前へ</span>
                </Button>
            )}

            {/* ページ番号ボタン */}
            <div className="flex items-center space-x-1">
                {pageNumbers.map((page, index) =>
                    page === 'ellipsis' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                            ...
                        </span>
                    ) : (
                        <Link key={page} href={buildUrl(page)}>
                            <Button
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                className={`min-w-[40px] ${currentPage === page
                                        ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                                        : ''
                                    }`}
                            >
                                {page}
                            </Button>
                        </Link>
                    )
                )}
            </div>

            {/* 次へボタン */}
            {currentPage < totalPages ? (
                <Link href={buildUrl(currentPage + 1)}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <span className="hidden sm:inline">次へ</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </Link>
            ) : (
                <Button variant="outline" size="sm" disabled className="flex items-center gap-1 opacity-50">
                    <span className="hidden sm:inline">次へ</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            )}
        </nav>
    )
}
