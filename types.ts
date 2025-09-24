export interface User {
  uid: string;
  username?: string | null;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  sources?: { uri: string; title: string; }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}