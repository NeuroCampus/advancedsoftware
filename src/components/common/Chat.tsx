
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";

const API_BASE_URL = "http://127.0.0.1:8000";

interface ChatProps {
  role: string;
}

interface ChatChannel {
  id: string;
  type: string;
  participants?: string[];
  subject?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
}

const Chat = ({ role }: ChatProps) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel);
    }
  }, [selectedChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const endpoint = `${API_BASE_URL}/${role}/chat/`;
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setChannels(data.data);
        if (data.data.length > 0) {
          setSelectedChannel(data.data[0].id);
        }
      } else {
        setError(data.message || "Failed to load chat channels");
      }
    } catch (err) {
      setError("Error loading chat channels");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (channelId: string) => {
    setLoading(true);
    try {
      // This is a mock implementation since the endpoint for fetching messages wasn't specified
      // In a real app, you'd make an API call to fetch messages for the selected channel
      setMessages([
        {
          id: "1",
          sender: "System",
          content: "Welcome to the chat channel!",
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          sender: role === "student" ? "Professor" : "Student",
          content: "Hello there!",
          timestamp: new Date().toISOString(),
        }
      ]);
    } catch (err) {
      setError("Error loading messages");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return;
    
    try {
      const endpoint = `${API_BASE_URL}/${role}/chat/`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel_id: selectedChannel,
          message: newMessage,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the sent message to the messages list
        setMessages([...messages, {
          id: Date.now().toString(),
          sender: "You",
          content: newMessage,
          timestamp: new Date().toISOString(),
        }]);
        setNewMessage("");
      } else {
        setError(data.message || "Failed to send message");
      }
    } catch (err) {
      setError("Error sending message");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-160px)]">
      {/* Chat Channels List */}
      <Card className="col-span-12 md:col-span-3 h-full overflow-y-auto">
        <CardHeader>
          <CardTitle>Chat Channels</CardTitle>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <div className="text-center text-gray-500">No channels available</div>
          ) : (
            <ul className="space-y-1">
              {channels.map((channel) => (
                <li key={channel.id}>
                  <button
                    className={`w-full text-left p-2 rounded ${
                      selectedChannel === channel.id
                        ? "bg-blue-100 text-blue-800"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedChannel(channel.id)}
                  >
                    <div className="font-medium">
                      {channel.type === "private" 
                        ? `Chat with ${channel.participants?.[0]}`
                        : channel.type === "subject" 
                          ? `${channel.subject}`
                          : `Channel #${channel.id.substring(0, 8)}`
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {channel.type === "private" ? "Private chat" : channel.type}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="col-span-12 md:col-span-9 h-full flex flex-col">
        <CardHeader className="py-2">
          <CardTitle>
            {selectedChannel 
              ? channels.find(c => c.id === selectedChannel)?.type === "private"
                ? `Chat with ${channels.find(c => c.id === selectedChannel)?.participants?.[0]}`
                : channels.find(c => c.id === selectedChannel)?.type === "subject"
                  ? `${channels.find(c => c.id === selectedChannel)?.subject}`
                  : `Channel #${selectedChannel.substring(0, 8)}`
              : "Select a channel"
            }
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 overflow-y-auto p-4">
          {error && <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>}
          
          {!selectedChannel ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a channel to start chatting
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No messages yet
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${
                    message.sender === "You"
                      ? "ml-auto bg-blue-100 text-blue-800"
                      : "mr-auto bg-gray-100"
                  } p-3 rounded-lg max-w-[80%]`}
                >
                  <div className="font-medium text-xs">{message.sender}</div>
                  <div>{message.content}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
        
        {selectedChannel && (
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Chat;
