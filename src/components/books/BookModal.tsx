"use client";

import React, { useState } from 'react';
import type { Book } from '@/types/books';
import { BOOK_CATEGORIES } from '@/types/books';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';

interface BookModalProps {
 book: Book;
 onClose: () => void;
 onUpdateBook: (updatedBook: Book) => void;
 onDeleteBook: (bookId: string) => void;
 mode?: 'edit' | 'create';
}

export function BookModal({ book, onClose, onUpdateBook, onDeleteBook, mode = 'edit' }: BookModalProps) {
 const [formData, setFormData] = useState({
 name: book.name || '',
 author: book.author || '',
 language: book.language || 'English',
 category: book.category || BOOK_CATEGORIES[0],
 status: book.status || 'Planned',
 order: book.order?.toString() || '1'
 });

 const handleSave = (e: React.FormEvent) => {
 e.preventDefault();
 if (!formData.name.trim()) return;

 onUpdateBook({
 ...book,
 name: formData.name.trim(),
 author: formData.author.trim(),
 language: formData.language as any,
 category: formData.category as any,
 status: formData.status as any,
 order: parseInt(formData.order) || 0,
 });
 onClose();
 };

 return (
 <Modal
 isOpen={true}
 onClose={onClose}
 title={mode === 'create' ? 'Add New Book' : 'Edit Book Details'}
 onSubmit={handleSave}
 submitText={mode === 'create' ? 'Add to Queue' : 'Save Changes'}
 accentColor="teal"
 >
 <DynamicForm
 sections={[
 {
 id: 'book_details',
 title: 'Book Details',
 fields: [
 { name: 'name', label: 'Book Name', type: 'text', required: true, fullWidth: true, placeholder: 'Enter book title...' },
 { name: 'author', label: 'Author', type: 'text', placeholder: 'Enter author name...' },
 {
 name: 'language',
 label: 'Language',
 type: 'select',
 options: ['English', 'Hindi', 'Urdu', 'Punjabi', 'Sanskrit', 'Other'].map(l => ({ value: l, label: l }))
 },
 {
 name: 'status',
 label: 'Status',
 type: 'select',
 options: ['Planned', 'Reading', 'Completed'].map(s => ({ value: s, label: s }))
 },
 { name: 'order', label: 'Priority', type: 'number', step: '1', required: true, placeholder: 'Order' },
 {
 name: 'category',
 label: 'Category',
 type: 'select',
 options: BOOK_CATEGORIES.map(c => ({ value: c, label: c }))
 }
 ]
 }
 ]}
 formData={formData}
 accentColor="teal"
 onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
 />
 {mode === 'edit' && (
 <div className="mt-4 flex justify-start w-full">
 <button
 type="button"
 onClick={() => {
 if (confirm('Are you sure you want to delete this book?')) {
 onDeleteBook(book.id);
 onClose();
 }
 }}
 className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
 >
 Delete Book
 </button>
 </div>
 )}
 </Modal>
 );
}
