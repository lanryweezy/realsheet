import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, MessageSquare, Send, Users, Clock, Calendar,
  Plus, Search, Filter, MoreVertical, PhoneIncoming, PhoneOutgoing,
  Video, Mic, MicOff, Volume2, VolumeX, Headphones,
  Inbox, Send as SendIcon, Archive, Trash2, Star, Tag,
  RefreshCw, Check, X, ChevronLeft, ChevronRight, Bell
} from 'lucide-react';
import { Contact, Interaction, loadFromStorage, saveToStorage } from '../types/productivity';

interface CommunicationHubProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Email {
  id: string;
  from: { name: string; email: string };
  to: string[];
  subject: string;
  body: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  attachments?: { name: string; size: string }[];
}

interface CallLog {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration: number; // seconds
  timestamp: Date;
  recording?: string;
  notes?: string;
  summary?: string;
}

interface SMS {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  direction: 'incoming' | 'outgoing';
  body: string;
  timestamp: Date;
  isRead: boolean;
  media?: string[];
}

const CommunicationHub: React.FC<CommunicationHubProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'calls' | 'sms' | 'email'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [messages, setMessages] = useState<SMS[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isComposing, setIsComposing] = useState<'email' | 'sms' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newEmail, setNewEmail] = useState({ subject: '', body: '', to: '' });
  const [isCalling, setIsCalling] = useState(false);
  const [activeCall, setActiveCall] = useState<{ contact: Contact; duration: number; isMuted: boolean } | null>(null);

  // Load data from storage
  useEffect(() => {
    const storedContacts = loadFromStorage<Contact[]>('contacts');
    if (storedContacts) {
      setContacts(storedContacts);
    } else {
      // Sample contacts
      const sampleContacts: Contact[] = [
        {
          id: 'contact_1',
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '+1 (555) 123-4567',
          company: 'Acme Corp',
          role: 'CEO',
          tags: ['client', 'vip'],
          lastContactedAt: new Date(Date.now() - 86400000 * 2),
          nextFollowUpAt: new Date(Date.now() + 86400000 * 3),
          interactionHistory: [],
          notes: 'Key decision maker, prefers morning calls'
        },
        {
          id: 'contact_2',
          name: 'Sarah Johnson',
          email: 'sarah.j@techstart.io',
          phone: '+1 (555) 234-5678',
          company: 'TechStart',
          role: 'CTO',
          tags: ['prospect', 'tech'],
          lastContactedAt: new Date(Date.now() - 86400000 * 5),
          interactionHistory: [],
          notes: 'Technical evaluator, asks detailed questions'
        },
        {
          id: 'contact_3',
          name: 'Mike Chen',
          email: 'mike.chen@globalinc.com',
          phone: '+1 (555) 345-6789',
          company: 'Global Inc',
          role: 'Product Manager',
          tags: ['partner'],
          lastContactedAt: new Date(Date.now() - 86400000),
          nextFollowUpAt: new Date(Date.now() + 86400000),
          interactionHistory: [],
          notes: 'Weekly sync every Monday'
        }
      ];
      setContacts(sampleContacts);
      saveToStorage('contacts', sampleContacts);
    }

    const storedCalls = loadFromStorage<CallLog[]>('call_logs');
    if (storedCalls) setCallLogs(storedCalls);

    const storedMessages = loadFromStorage<SMS[]>('sms_messages');
    if (storedMessages) setMessages(storedMessages);

    const storedEmails = loadFromStorage<Email[]>('emails');
    if (storedEmails) setEmails(storedEmails);
  }, []);

  // Save contacts
  useEffect(() => {
    if (contacts.length > 0) {
      saveToStorage('contacts', contacts);
    }
  }, [contacts]);

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCalling && activeCall) {
      interval = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCalling, activeCall]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addContact = () => {
    const newContact: Contact = {
      id: `contact_${Date.now()}`,
      name: 'New Contact',
      email: '',
      phone: '',
      tags: [],
      interactionHistory: [],
      notes: ''
    };
    setContacts(prev => [...prev, newContact]);
    setSelectedContact(newContact);
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (selectedContact?.id === id) {
      setSelectedContact(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    if (selectedContact?.id === id) {
      setSelectedContact(null);
    }
  };

  const startCall = (contact: Contact) => {
    setActiveCall({
      contact,
      duration: 0,
      isMuted: false
    });
    setIsCalling(true);
    
    // Add to call log
    const callLog: CallLog = {
      id: `call_${Date.now()}`,
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone || '',
      type: 'outgoing',
      duration: 0,
      timestamp: new Date()
    };
    setCallLogs(prev => [...prev, callLog]);
  };

  const endCall = () => {
    if (activeCall) {
      // Update call log with duration
      setCallLogs(prev => prev.map(log => 
        log.contactId === activeCall.contact.id && !log.duration
          ? { ...log, duration: activeCall.duration, summary: `Call with ${activeCall.contact.name}` }
          : log
      ));
      
      // Update contact last contacted
      updateContact(activeCall.contact.id, {
        lastContactedAt: new Date(),
        interactionHistory: [
          ...(activeCall.contact.interactionHistory || []),
          {
            id: `interaction_${Date.now()}`,
            type: 'call',
            timestamp: new Date(),
            summary: `Call duration: ${formatDuration(activeCall.duration)}`,
            notes: activeCall.contact.notes
          }
        ]
      });
    }
    
    setIsCalling(false);
    setActiveCall(null);
  };

  const sendSMS = (contactId: string, body: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const sms: SMS = {
      id: `sms_${Date.now()}`,
      contactId,
      contactName: contact.name,
      contactPhone: contact.phone || '',
      direction: 'outgoing',
      body,
      timestamp: new Date(),
      isRead: true
    };

    setMessages(prev => [...prev, sms]);
    saveToStorage('sms_messages', [...messages, sms]);
    setNewMessage('');
    setIsComposing(null);

    // Update contact
    updateContact(contactId, {
      lastContactedAt: new Date(),
      interactionHistory: [
        ...(contact.interactionHistory || []),
        {
          id: `interaction_${Date.now()}`,
          type: 'message',
          timestamp: new Date(),
          summary: `SMS: ${body.substring(0, 50)}...`
        }
      ]
    });
  };

  const sendEmail = (to: string, subject: string, body: string) => {
    const email: Email = {
      id: `email_${Date.now()}`,
      from: { name: 'You', email: 'you@realsheet.com' },
      to: [to],
      subject,
      body,
      date: new Date(),
      isRead: true,
      isStarred: false,
      labels: ['sent']
    };

    setEmails(prev => [...prev, email]);
    saveToStorage('emails', [...emails, email]);
    setNewEmail({ subject: '', body: '', to: '' });
    setIsComposing(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(date);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-7xl h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Phone className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Communication Hub</h2>
                <p className="text-xs text-slate-400">
                  {contacts.length} contacts • {callLogs.length} calls • {messages.length} messages
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 p-3 border-b border-slate-700 bg-slate-800/50">
            {[
              { id: 'contacts', label: 'Contacts', icon: Users },
              { id: 'calls', label: 'Calls', icon: Phone },
              { id: 'sms', label: 'Messages', icon: MessageSquare },
              { id: 'email', label: 'Email', icon: Mail }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'email' && emails.filter(e => !e.isRead).length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {emails.filter(e => !e.isRead).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Contacts View */}
            {activeTab === 'contacts' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">
                    {filteredContacts.length} Contacts
                  </h3>
                  <button
                    onClick={addContact}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Contact
                  </button>
                </div>

                {filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedContact?.id === contact.id
                        ? 'bg-blue-900/20 border-blue-500'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white">{contact.name}</h4>
                          <p className="text-xs text-slate-400">{contact.role} at {contact.company}</p>
                          {contact.phone && (
                            <p className="text-xs text-slate-400 mt-1">{contact.phone}</p>
                          )}
                          {contact.email && (
                            <p className="text-xs text-slate-400">{contact.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startCall(contact);
                          }}
                          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContact(contact);
                            setIsComposing('sms');
                          }}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Message"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContact(contact);
                            setIsComposing('email');
                          }}
                          className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                          title="Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {contact.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {contact.nextFollowUpAt && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
                        <Bell className="w-3 h-3" />
                        <span>Follow up: {new Date(contact.nextFollowUpAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Calls View */}
            {activeTab === 'calls' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white mb-4">
                  {callLogs.length} Call Logs
                </h3>
                
                {callLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Phone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No calls yet</p>
                  </div>
                ) : (
                  callLogs.map(call => (
                    <div
                      key={call.id}
                      className="p-4 bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            call.type === 'incoming' ? 'bg-green-500/20 text-green-400' :
                            call.type === 'outgoing' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {call.type === 'incoming' ? <PhoneIncoming className="w-4 h-4" /> :
                             call.type === 'outgoing' ? <PhoneOutgoing className="w-4 h-4" /> :
                             <Phone className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">{call.contactName}</h4>
                            <p className="text-xs text-slate-400">
                              {call.type} • {formatDuration(call.duration)} • {formatDate(call.timestamp)}
                            </p>
                          </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      {call.summary && (
                        <p className="text-xs text-slate-400 mt-2">{call.summary}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SMS View */}
            {activeTab === 'sms' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white mb-4">
                  {messages.length} Messages
                </h3>
                
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg ${
                        msg.direction === 'outgoing'
                          ? 'bg-blue-900/20 border border-blue-500/30 ml-8'
                          : 'bg-slate-800 border border-slate-700 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">{msg.contactName}</span>
                        <span className="text-xs text-slate-500">{formatDate(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm text-white">{msg.body}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Email View */}
            {activeTab === 'email' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">
                    {emails.length} Emails
                  </h3>
                  <button
                    onClick={() => setIsComposing('email')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Compose
                  </button>
                </div>
                
                {emails.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No emails yet</p>
                  </div>
                ) : (
                  emails.map(email => (
                    <div
                      key={email.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        email.isRead
                          ? 'bg-slate-800 border-slate-700'
                          : 'bg-blue-900/20 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                            {email.from.name[0]}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">{email.from.name}</h4>
                            <p className="text-xs text-slate-400">{email.from.email}</p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">{formatDate(email.date)}</span>
                      </div>
                      <h5 className="text-sm font-medium text-white mb-1">{email.subject}</h5>
                      <p className="text-xs text-slate-400 line-clamp-2">{email.body}</p>
                      {email.attachments && email.attachments.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Tag className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-500">
                            {email.attachments.length} attachment(s)
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact Detail Sidebar */}
        {selectedContact && (
          <div className="w-96 border-l border-slate-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Contact Details</h3>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
                {selectedContact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <h4 className="text-xl font-bold text-white">{selectedContact.name}</h4>
              <p className="text-sm text-slate-400">{selectedContact.role} at {selectedContact.company}</p>
            </div>

            <div className="space-y-3 mb-4">
              {selectedContact.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>{selectedContact.phone}</span>
                </div>
              )}
              {selectedContact.email && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>{selectedContact.email}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => startCall(selectedContact)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call
              </button>
              <button
                onClick={() => setIsComposing('sms')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
            </div>

            {isComposing === 'sms' && (
              <div className="mb-4 p-4 bg-slate-800 rounded-lg">
                <h5 className="text-sm font-semibold text-white mb-2">Send SMS</h5>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full h-24 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendSMS(selectedContact.id, newMessage)}
                    className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setIsComposing(null)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {isComposing === 'email' && (
              <div className="mb-4 p-4 bg-slate-800 rounded-lg">
                <h5 className="text-sm font-semibold text-white mb-2">Send Email</h5>
                <input
                  type="email"
                  value={newEmail.to || selectedContact.email || ''}
                  onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
                  placeholder="To..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                />
                <input
                  type="text"
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                  placeholder="Subject..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                />
                <textarea
                  value={newEmail.body}
                  onChange={(e) => setNewEmail({ ...newEmail, body: e.target.value })}
                  placeholder="Message..."
                  className="w-full h-32 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-2"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendEmail(newEmail.to, newEmail.subject, newEmail.body)}
                    className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setIsComposing(null)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {selectedContact.notes && (
              <div>
                <h5 className="text-sm font-semibold text-white mb-2">Notes</h5>
                <p className="text-sm text-slate-400">{selectedContact.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Active Call Overlay */}
        {isCalling && activeCall && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-700 rounded-2xl text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-5xl font-bold mx-auto mb-4 animate-pulse">
                {activeCall.contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{activeCall.contact.name}</h3>
              <p className="text-sm text-slate-400 mb-6">{activeCall.contact.phone}</p>
              <div className="text-4xl font-mono text-green-400 mb-8">
                {formatDuration(activeCall.duration)}
              </div>
              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={() => setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null)}
                  className={`p-4 rounded-full ${
                    activeCall.isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'
                  } hover:scale-105 transition-transform`}
                >
                  {activeCall.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <button
                  onClick={endCall}
                  className="p-6 bg-red-500 hover:bg-red-600 text-white rounded-full hover:scale-105 transition-transform"
                >
                  <Phone className="w-8 h-8 rotate-[135deg]" />
                </button>
                <button
                  onClick={() => setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null)}
                  className="p-4 rounded-full bg-slate-700 text-slate-300 hover:scale-105 transition-transform"
                >
                  <VolumeX className="w-6 h-6" />
                </button>
              </div>
              <p className="text-xs text-slate-500">Call in progress...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationHub;
