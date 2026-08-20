"use client";

import React, { useState } from 'react';
import type { Contact } from '@/types/contacts';
import { CONTACT_CATEGORIES, CONTACT_STATUSES } from '@/types/contacts';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';

interface ContactModalProps {
 contact: Contact;
 onClose: () => void;
 onUpdateContact: (updatedContact: Contact) => void;
 onDeleteContact: (contactId: string) => void;
 mode?: 'edit' | 'create';
}

export function ContactModal({ contact, onClose, onUpdateContact, onDeleteContact, mode = 'edit' }: ContactModalProps) {
 const [formData, setFormData] = useState({
 name: contact.name || '',
 category: contact.category || 'other',
 phone: contact.phone || '',
 email: contact.email || '',
 linkedProject: contact.linkedProject || '',
 status: contact.status || 'lead',
 lastContactDate: contact.lastContactDate || '',
 nextFollowUpDate: contact.nextFollowUpDate || '',
 notes: contact.notes || '',
 });

 const handleSave = (e: React.FormEvent) => {
 e.preventDefault();
 if (!formData.name.trim()) return;

 onUpdateContact({
 ...contact,
 name: formData.name.trim(),
 category: formData.category as Contact['category'],
 phone: formData.phone.trim() || undefined,
 email: formData.email.trim() || undefined,
 linkedProject: formData.linkedProject.trim() || undefined,
 status: formData.status as Contact['status'],
 lastContactDate: formData.lastContactDate || undefined,
 nextFollowUpDate: formData.nextFollowUpDate || undefined,
 notes: formData.notes.trim() || undefined,
 });
 onClose();
 };

 return (
 <Modal
 isOpen={true}
 onClose={onClose}
 title={mode === 'create' ? 'Add Contact' : 'Edit Contact'}
 onSubmit={handleSave}
 submitText={mode === 'create' ? 'Add Contact' : 'Save Changes'}
 accentColor="teal"
 >
 <DynamicForm
 sections={[
 {
 id: 'contact_details',
 title: '',
 fields: [
 { name: 'name', label: 'Name', type: 'text', required: true, fullWidth: true, placeholder: 'Full name' },
 { name: 'category', label: 'Category', type: 'select', options: CONTACT_CATEGORIES },
 { name: 'status', label: 'Status', type: 'select', options: CONTACT_STATUSES },
 { name: 'phone', label: 'Phone', type: 'text', placeholder: '+91...' },
 { name: 'email', label: 'Email', type: 'text', placeholder: 'name@example.com' },
 { name: 'linkedProject', label: 'Linked Project', type: 'text', fullWidth: true, placeholder: 'e.g. Freelancing OS, Bookshop Expansion' },
 { name: 'lastContactDate', label: 'Last Contact Date', type: 'date' },
 { name: 'nextFollowUpDate', label: 'Next Follow-up Date', type: 'date' },
 { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true, placeholder: 'How we met, what they need, last conversation...' },
 ],
 },
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
 if (confirm('Are you sure you want to delete this contact?')) {
 onDeleteContact(contact.id);
 onClose();
 }
 }}
 className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
 >
 Delete Contact
 </button>
 </div>
 )}
 </Modal>
 );
}
