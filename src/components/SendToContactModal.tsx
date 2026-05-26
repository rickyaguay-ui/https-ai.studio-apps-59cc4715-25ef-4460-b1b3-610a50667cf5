import React, { useState, useEffect } from 'react';
import { Mail, Search, X, Users, Send } from 'lucide-react';
import { getAccessToken } from '../firebase';

interface Contact {
  resourceName: string;
  names?: { displayName: string }[];
  emailAddresses?: { value: string }[];
}

interface SendToContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdownContent: string;
}

export const SendToContactModal = ({ isOpen, onClose, markdownContent }: SendToContactModalProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("You must sign in with Google to use your contacts");
      }
      const res = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=1000',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!res.ok) {
        throw new Error("Failed to load contacts");
      }
      const data = await res.json();
      setContacts(data.connections || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching contacts');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const validContacts = contacts.filter(c => c.emailAddresses && c.emailAddresses.length > 0 && c.names && c.names.length > 0);
  const displayContacts = validContacts
    .filter(c => 
      c.names![0].displayName.toLowerCase().includes(query.toLowerCase()) || 
      c.emailAddresses![0].value.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 50); // limit for UI

  const handleSend = (email: string) => {
    const subject = encodeURIComponent("Walkthrough Signoff Plan");
    const body = encodeURIComponent(markdownContent);
    const mailto = `mailto:${email}?subject=${subject}&body=${body}`;
    if (window.confirm(`Send email to ${email}?`)) {
      window.open(mailto, '_blank');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-[2px]">
      <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-5 max-w-sm w-full text-slate-100 shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-50 font-serif">Select Contact</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-md text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {error ? (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs">
            {error}
          </div>
        ) : (
          <>
            <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search coworkers..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 custom-scrollbar pr-1">
              {loading ? (
                <div className="text-center py-6 text-slate-500 text-sm">Loading contacts...</div>
              ) : displayContacts.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">No contacts found.</div>
              ) : (
                displayContacts.map((c) => {
                  const name = c.names![0].displayName;
                  const email = c.emailAddresses![0].value;
                  return (
                    <div key={c.resourceName} className="flex justify-between items-center p-2.5 bg-slate-900/50 hover:bg-slate-800 border border-slate-800/80 rounded-lg group transition-colors">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-200 truncate">{name}</span>
                        <span className="text-[10px] text-slate-400 truncate">{email}</span>
                      </div>
                      <button 
                        onClick={() => handleSend(email)}
                        className="bg-indigo-600 hover:bg-indigo-500 p-1.5 rounded-full text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Draft Email"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
