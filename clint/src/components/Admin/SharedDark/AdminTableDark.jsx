import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { tw } from '../../../config/tokyoNightTheme';

const AdminTableDark = ({
    columns,
    data,
    isLoading,
    onRowClick,
    pagination = true,
    itemsPerPage = 10,
    serverSidePagination = false,
    totalServerPages = 0,
    currentServerPage = 1,
    onPageChange
}) => {
    const [localPage, setLocalPage] = useState(1);
    const currentPage = serverSidePagination ? currentServerPage : localPage;
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Sorting
    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, sortConfig]);

    // Pagination
    const totalPages = serverSidePagination ? totalServerPages : Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = (pagination && !serverSidePagination)
        ? sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : sortedData;

    const handlePageChange = (newPage) => {
        if (serverSidePagination) {
            onPageChange && onPageChange(newPage);
        } else {
            setLocalPage(newPage);
        }
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    if (isLoading) {
        return (
            <div className={`w-full h-64 flex items-center justify-center ${tw.bgSecondary} rounded-xl border ${tw.borderPrimary}`}>
                <div className="w-10 h-10 border-4 border-[#7aa2f7] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={`${tw.bgSecondary} rounded-xl border ${tw.borderPrimary} overflow-hidden shadow-lg`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={`border-b ${tw.borderPrimary} ${tw.bgInput}`}>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className={`px-6 py-4 text-left text-xs font-semibold ${tw.textSecondary} uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:text-[#7aa2f7]' : ''
                                        }`}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.label}
                                        {column.sortable && sortConfig.key === column.key && (
                                            sortConfig.direction === 'asc'
                                                ? <ChevronUp className="w-4 h-4" />
                                                : <ChevronDown className="w-4 h-4" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${tw.borderSecondary}`}>
                        {paginatedData.map((item, rowIndex) => (
                            <tr
                                key={item._id || rowIndex}
                                onClick={() => onRowClick && onRowClick(item)}
                                className={`transition-colors duration-200 ${onRowClick ? 'cursor-pointer hover:bg-[#414868]/50' : 'hover:bg-[#414868]/30'
                                    }`}
                            >
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex} className={`px-6 py-4 whitespace-nowrap text-sm ${tw.textPrimary}`}>
                                        {column.render ? column.render(item[column.key], item) : item[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && totalPages > 1 && (
                <div className={`px-6 py-4 border-t ${tw.borderPrimary} flex items-center justify-between`}>
                    <div className={`text-sm ${tw.textSecondary}`}>
                        {serverSidePagination
                            ? `Showing page ${currentPage} of ${totalPages} (${data.length} items loaded)`
                            : `Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, data.length)} of ${data.length} results`
                        }
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg ${tw.borderPrimary} border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#414868] ${tw.textPrimary}`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className={`px-4 py-2 rounded-lg ${tw.bgInput} ${tw.textPrimary} font-medium`}>
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-lg ${tw.borderPrimary} border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#414868] ${tw.textPrimary}`}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTableDark;
