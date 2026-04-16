"use client";

import React, { useState } from 'react';
import type { CompletedBook } from '@/types/books';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { BOOK_CATEGORIES } from '@/types/books';

interface CompletedBookModalProps {
 book: CompletedBook;
 onClose: () => void;
 onUpdateBook: (updatedBook: CompletedBook) => void;
 onDeleteBook: (bookId: string) => void;
 mode?: 'edit' | 'create';
}

export function CompletedBookModal({ book, onClose, onUpdateBook, onDeleteBook, mode = 'edit' }: CompletedBookModalProps) {
 const [formData, setFormData] = useState({
 name: book.name || '',
 author: book.author || '',
 language: book.language || 'English',
 completionDate: book.completionDate || '',
 rating: book.rating?.toString() || '0',
 notes: book.notes || '',
 wouldRecommend: book.wouldRecommend ? 'Yes' : 'No',
 category: book.category || 'Self-help'
 });

 const handleSave = (e: React.FormEvent) => {
 e.preventDefault();
 if (!formData.name.trim()) return;

 onUpdateBook({
 ...book,
 name: formData.name.trim(),
 author: formData.author.trim(),
 language: formData.language as any,
 completionDate: formData.completionDate,
 rating: parseInt(formData.rating) || 0,
 notes: formData.notes.trim(),
 wouldRecommend: formData.wouldRecommend === 'Yes',
 category: formData.category,
 });
 onClose();
 };

 return (
 <Modal
 isOpen={true}
 onClose={onClose}
 title={mode === 'create' ? 'Log Completed Book' : 'Edit Insights'}
 onSubmit={handleSave}
 submitText={mode === 'create' ? 'Save Review' : 'Update Review'}
 accentColor="amber"
 >
 <DynamicForm
 sections={[
 {
 id: 'book_details',
 title: 'Book Details',
 fields: [
 { name: 'name', label: 'Book Title', type: 'text', required: true, fullWidth: true, placeholder: 'What was the book called?' },
 { name: 'author', label: 'Author', type: 'text', placeholder: 'Who wrote this book?' },
 {
 name: 'language',
 label: 'Language',
 type: 'select',
 options: ['English', 'Hindi', 'Urdu', 'Punjabi', 'Sanskrit', 'Other'].map(l => ({ value: l, label: l }))
 },
 { name: 'completionDate', label: 'Finished On', type: 'date', required: true },
 {
 name: 'category',
 label: 'Category',
 type: 'select',
 options: BOOK_CATEGORIES.map(c => ({ value: c, label: c }))
 }
 ]
 },
 {
 id: 'review',
 title: 'Your Review',
 fields: [
 { name: 'rating', label: 'Overall Rating', type: 'rating', required: true, fullWidth: true },
 { name: 'notes', label: 'Key Insights & Takeaways', type: 'textarea', fullWidth: true, placeholder: 'What was the most valuable thing you learned? (Short insights...)' },
 {
 name: 'wouldRecommend',
 label: 'Would you recommend it?',
 type: 'select',
 options: [{ value: 'Yes', label: 'YES' }, { value: 'No', label: 'NO' }]
 }
 ]
 }
 ]}
 formData={formData}
 accentColor="amber"
 onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
 />
 {mode === 'edit' && (
 <div className="mt-4 flex justify-start w-full">
 <button
 type="button"
 onClick={() => {
 if (confirm('Are you sure you want to remove this record?')) {
 onDeleteBook(book.id);
 onClose();
 }
 }}
 className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
 >
 Delete Record
 </button>
 </div>
 )}
 </Modal>
 );
}
