import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Clock, ChevronDown, X, Trash2 } from 'lucide-react';
import apiService from '../services/api.service';

interface Book {
    id: string;
    bookName: string;
    totalPages: number | null;
    currentPage: number;
    lastReadAt: string | null;
}

interface ReadingSectionProps {
    studentId: string;
    studentName: string;
}

/**
 * 阅读记录区组件
 * 用于 QCView 页面快速记录学生阅读进度
 */
const ReadingSection: React.FC<ReadingSectionProps> = ({ studentId, studentName }) => {
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedBookId, setSelectedBookId] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<string>('');
    const [duration, setDuration] = useState<string>('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAddBook, setShowAddBook] = useState(false);
    const [newBookName, setNewBookName] = useState('');
    const [newBookPages, setNewBookPages] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 加载书籍列表
    const fetchBooks = async () => {
        try {
            const res = await apiService.get(`/reading/books/${studentId}`);
            if (res.success && res.data) {
                setBooks(res.data as Book[]);

                // 尝试获取最近选择的书籍
                const lastBookRes = await apiService.get(`/reading/last-book/${studentId}`);
                if (lastBookRes.success && lastBookRes.data) {
                    setSelectedBookId((lastBookRes.data as any).bookId);
                    setCurrentPage(String((lastBookRes.data as any).currentPage || ''));
                } else if ((res.data as Book[]).length > 0) {
                    setSelectedBookId((res.data as Book[])[0].id);
                }
            }
        } catch (err) {
            console.error('[ReadingSection] 获取书籍失败:', err);
        }
    };

    useEffect(() => {
        if (studentId) {
            fetchBooks();
        }
    }, [studentId]);

    // 添加新书籍
    const handleAddBook = async () => {
        if (!newBookName.trim()) return;

        setIsLoading(true);
        try {
            const res = await apiService.post('/reading/books', {
                studentId,
                bookName: newBookName.trim(),
                totalPages: newBookPages ? parseInt(newBookPages) : undefined
            });

            if (res.success) {
                setNewBookName('');
                setNewBookPages('');
                setShowAddBook(false);
                await fetchBooks();

                // 自动选中新添加的书
                if (res.data) {
                    setSelectedBookId((res.data as any).id);
                }
            }
        } catch (err) {
            console.error('[ReadingSection] 添加书籍失败:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // 删除书籍
    const handleDeleteBook = async (bookId: string) => {
        try {
            await apiService.delete(`/reading/books/${bookId}`);
            await fetchBooks();
            if (selectedBookId === bookId) {
                setSelectedBookId('');
            }
        } catch (err) {
            console.error('[ReadingSection] 删除书籍失败:', err);
        }
    };

    // 保存阅读记录
    const handleSaveReading = async () => {
        if (!selectedBookId || !currentPage || !duration) return;

        setIsSaving(true);
        try {
            const res = await apiService.post('/reading/logs', {
                bookId: selectedBookId,
                studentId,
                currentPage: parseInt(currentPage),
                duration: parseInt(duration)
            });

            if (res.success) {
                // 清空输入并刷新
                setDuration('');
                await fetchBooks();

                // 显示成功提示
                console.log('[ReadingSection] 阅读记录保存成功');
            }
        } catch (err) {
            console.error('[ReadingSection] 保存阅读记录失败:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const selectedBook = books.find(b => b.id === selectedBookId);

    return (
        <section className="mt-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 overflow-hidden">
            {/* 标题栏 - 可点击展开/收起 */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-emerald-100/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-emerald-600" />
                    <span className="font-semibold text-emerald-800">阅读培养</span>
                    {books.length > 0 && (
                        <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                            {books.length}本书
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={18}
                    className={`text-emerald-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
            </div>

            {/* 展开内容 */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                    {/* 书籍选择 */}
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedBookId}
                            onChange={(e) => {
                                setSelectedBookId(e.target.value);
                                const book = books.find(b => b.id === e.target.value);
                                if (book?.currentPage) setCurrentPage(String(book.currentPage));
                            }}
                            className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                        >
                            <option value="">选择书籍...</option>
                            {books.map(book => (
                                <option key={book.id} value={book.id}>
                                    {book.bookName} {book.totalPages ? `(${book.currentPage}/${book.totalPages}页)` : book.currentPage ? `(第${book.currentPage}页)` : ''}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowAddBook(true); }}
                            className="w-9 h-9 flex items-center justify-center bg-emerald-500 text-white rounded-xl active:scale-95"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* 新增书籍表单 */}
                    {showAddBook && (
                        <div className="bg-white rounded-xl p-3 border border-emerald-200 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-emerald-700">添加新书</span>
                                <button onClick={() => setShowAddBook(false)} className="text-slate-400">
                                    <X size={16} />
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="书名（必填）"
                                value={newBookName}
                                onChange={(e) => setNewBookName(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="总页数（可选）"
                                    value={newBookPages}
                                    onChange={(e) => setNewBookPages(e.target.value)}
                                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                                />
                                <button
                                    onClick={handleAddBook}
                                    disabled={!newBookName.trim() || isLoading}
                                    className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                                >
                                    {isLoading ? '...' : '添加'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 阅读记录输入 */}
                    {selectedBookId && (
                        <div className="bg-white rounded-xl p-3 border border-emerald-200 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-emerald-700">
                                <BookOpen size={14} />
                                <span className="font-medium">{selectedBook?.bookName}</span>
                                {selectedBook?.totalPages && (
                                    <span className="text-emerald-500">
                                        ({Math.round((selectedBook.currentPage / selectedBook.totalPages) * 100)}%)
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">读到第</span>
                                    <input
                                        type="number"
                                        value={currentPage}
                                        onChange={(e) => setCurrentPage(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg pl-12 pr-8 py-2 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-300"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">页</span>
                                </div>
                                <div className="flex-1 relative">
                                    <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        placeholder="时长"
                                        className="w-full border border-slate-200 rounded-lg pl-8 pr-10 py-2 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-300"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">分钟</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveReading}
                                disabled={!currentPage || !duration || isSaving}
                                className="w-full py-2.5 bg-emerald-500 text-white font-semibold rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all"
                            >
                                {isSaving ? '保存中...' : '保存阅读记录'}
                            </button>
                        </div>
                    )}

                    {/* 书籍列表（可删除） */}
                    {books.length > 0 && (
                        <div className="space-y-1">
                            <div className="text-xs text-emerald-600 font-medium px-1">书架管理</div>
                            <div className="flex flex-wrap gap-1.5">
                                {books.map(book => (
                                    <div
                                        key={book.id}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${selectedBookId === book.id ? 'bg-emerald-500 text-white' : 'bg-white border border-emerald-200 text-emerald-700'
                                            }`}
                                    >
                                        <span
                                            className="cursor-pointer"
                                            onClick={() => {
                                                setSelectedBookId(book.id);
                                                if (book.currentPage) setCurrentPage(String(book.currentPage));
                                            }}
                                        >
                                            {book.bookName}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteBook(book.id); }}
                                            className="opacity-60 hover:opacity-100"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 空状态 */}
                    {books.length === 0 && !showAddBook && (
                        <div className="text-center py-4 text-sm text-emerald-500">
                            点击 <Plus size={14} className="inline" /> 添加{studentName}正在阅读的书籍
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default ReadingSection;
