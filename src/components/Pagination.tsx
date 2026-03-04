import React from 'react'

export type PaginationProps = {
    currentPage: number
    pageSize: number
    totalItems: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (size: number) => void
    pageSizeOptions?: number[]
}

export function Pagination({
    currentPage,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100]
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / pageSize)

    if (totalItems === 0) return null

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-slate-100 text-sm">
            <div className="flex items-center text-slate-500 whitespace-nowrap">
                <span>共 {totalItems} 条记录</span>
                {onPageSizeChange && (
                    <div className="ml-4 flex items-center">
                        <span className="mr-2">每页:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="border border-slate-300 rounded p-1 text-slate-700 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                        >
                            {pageSizeOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="首页"
                >
                    «
                </button>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="上一页"
                >
                    ‹
                </button>

                <span className="px-3 py-1 text-slate-700 font-medium whitespace-nowrap">
                    {currentPage} / {totalPages || 1}
                </span>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-2 py-1 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="下一页"
                >
                    ›
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="px-2 py-1 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="末页"
                >
                    »
                </button>
            </div>
        </div>
    )
}
