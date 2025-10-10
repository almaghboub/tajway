import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus, MessageSquare, Search, Trash2, Mail, MailOpen, Send, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessageSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { z } from "zod";
import { format } from "date-fns";

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface SafeUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

type CreateMessageForm = z.infer<typeof insertMessageSchema>;

export default function Messages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/messages");
      return response.json() as Promise<Message[]>;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/messages/recipients"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/messages/recipients");
      return response.json() as Promise<SafeUser[]>;
    },
  });

  const form = useForm<CreateMessageForm>({
    resolver: zodResolver(insertMessageSchema),
    defaultValues: {
      senderId: user?.id || "",
      recipientId: "",
      content: "",
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: async (messageData: CreateMessageForm) => {
      const response = await apiRequest("POST", "/api/messages", messageData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      // Only close compose modal if it's open (not replying in conversation)
      if (isComposeModalOpen) {
        setIsComposeModalOpen(false);
        form.reset({
          senderId: user?.id || "",
          recipientId: "",
          content: "",
        });
      }
      toast({
        title: t('messageSentSuccess'),
        description: t('messageSentDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('error'),
        description: error.message,
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest("PATCH", `/api/messages/${messageId}/read`, {});
      if (!response.ok) throw new Error("Failed to mark message as read");
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      // Force refetch to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ["/api/messages"] });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest("DELETE", `/api/messages/${messageId}`, {});
      if (!response.ok) throw new Error("Failed to delete message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      setIsDeleteDialogOpen(false);
      setDeletingMessage(null);
      toast({
        title: t('messageDeletedSuccess'),
        description: t('messageDeletedDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('error'),
        description: error.message,
      });
    },
  });

  const handleViewMessage = (message: Message) => {
    // Determine the contact ID (the other person in the conversation)
    const contactId = message.senderId === user?.id ? message.recipientId : message.senderId;
    setSelectedContactId(contactId);
    setIsConversationOpen(true);
    
    // Mark all unread messages from this contact as read
    const unreadFromContact = messages.filter(
      msg => msg.senderId === contactId && msg.recipientId === user?.id && !msg.isRead
    );
    unreadFromContact.forEach(msg => markAsReadMutation.mutate(msg.id));
  };

  // Get conversation messages between current user and selected contact
  const conversationMessages = selectedContactId
    ? messages.filter(
        (msg) =>
          (msg.senderId === user?.id && msg.recipientId === selectedContactId) ||
          (msg.senderId === selectedContactId && msg.recipientId === user?.id)
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  // Scroll to bottom when conversation opens or new message arrives
  useEffect(() => {
    if (isConversationOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isConversationOpen, conversationMessages.length]);

  const handleSendReply = () => {
    if (!selectedContactId || !replyContent.trim()) return;
    
    createMessageMutation.mutate({
      senderId: user?.id || "",
      recipientId: selectedContactId,
      content: replyContent.trim(),
    });
    setReplyContent("");
  };

  const handleDelete = (message: Message) => {
    setDeletingMessage(message);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (data: CreateMessageForm) => {
    createMessageMutation.mutate({
      ...data,
      senderId: user?.id || "",
    });
  };

  const getUserFullName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (!foundUser) return "Unknown";
    return `${foundUser.firstName} ${foundUser.lastName}`;
  };

  const getUserRole = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.role || "";
  };

  const filteredMessages = messages.filter(message => {
    const senderName = getUserFullName(message.senderId).toLowerCase();
    const recipientName = getUserFullName(message.recipientId).toLowerCase();
    const content = message.content.toLowerCase();
    const search = searchTerm.toLowerCase();
    return senderName.includes(search) || recipientName.includes(search) || content.includes(search);
  });

  const inboxMessages = filteredMessages.filter(msg => msg.recipientId === user?.id);
  const sentMessages = filteredMessages.filter(msg => msg.senderId === user?.id);
  const unreadCount = inboxMessages.filter(msg => !msg.isRead).length;

  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const displayMessages = activeTab === "inbox" ? inboxMessages : sentMessages;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title={t('messages')} description={t('manageYourMessages')} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('messages')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('manageYourMessages')}</p>
          </div>
          <Button onClick={() => setIsComposeModalOpen(true)} data-testid="button-compose-message">
            <Plus className="h-4 w-4 mr-2" />
            {t('composeMessage')}
          </Button>
        </div>

        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('searchMessages')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-messages"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "inbox" ? "default" : "outline"}
            onClick={() => setActiveTab("inbox")}
            data-testid="button-inbox-tab"
          >
            <Mail className="h-4 w-4 mr-2" />
            {t('inbox')} {unreadCount > 0 && <Badge className="ml-2" variant="destructive">{unreadCount}</Badge>}
          </Button>
          <Button
            variant={activeTab === "sent" ? "default" : "outline"}
            onClick={() => setActiveTab("sent")}
            data-testid="button-sent-tab"
          >
            <MailOpen className="h-4 w-4 mr-2" />
            {t('sent')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {activeTab === "inbox" ? t('inbox') : t('sent')} ({displayMessages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMessages ? (
              <div className="text-center py-8 text-gray-500">{t('loading')}</div>
            ) : displayMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500" data-testid="text-no-messages">
                {activeTab === "inbox" ? t('noMessagesInInbox') : t('noMessagesSent')}
              </div>
            ) : (
              <div className="space-y-2">
                {displayMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                      !message.isRead && message.recipientId === user?.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-800'
                    }`}
                    onClick={() => handleViewMessage(message)}
                    data-testid={`message-${message.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {!message.isRead && message.recipientId === user?.id && (
                          <Badge variant="default" className="text-xs" data-testid={`badge-unread-${message.id}`}>
                            {t('new')}
                          </Badge>
                        )}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {activeTab === "inbox" 
                            ? `${t('from')}: ${getUserFullName(message.senderId)}`
                            : `${t('to')}: ${getUserFullName(message.recipientId)}`
                          }
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {activeTab === "inbox" ? getUserRole(message.senderId) : getUserRole(message.recipientId)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                        {message.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(message.createdAt), "PPp")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(message);
                      }}
                      data-testid={`button-delete-${message.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Compose Message Modal */}
      <Dialog open={isComposeModalOpen} onOpenChange={setIsComposeModalOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-compose-message">
          <DialogHeader>
            <DialogTitle>{t('composeMessage')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="recipientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('recipient')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-recipient">
                          <SelectValue placeholder={t('selectRecipient')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users
                          .filter(u => u.id !== user?.id)
                          .map(u => (
                            <SelectItem key={u.id} value={u.id} data-testid={`option-user-${u.id}`}>
                              {u.firstName} {u.lastName} ({u.role})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('message')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('typeYourMessage')}
                        {...field}
                        rows={5}
                        data-testid="textarea-message-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsComposeModalOpen(false)}
                  data-testid="button-cancel-compose"
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={createMessageMutation.isPending} data-testid="button-send-message">
                  {createMessageMutation.isPending ? t('sending') : t('send')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Conversation View Modal */}
      <Dialog open={isConversationOpen} onOpenChange={setIsConversationOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col" data-testid="dialog-view-conversation">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsConversationOpen(false)}
                data-testid="button-back-conversation"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle>{t('conversationWith')} {selectedContactId && getUserFullName(selectedContactId)}</DialogTitle>
                {selectedContactId && (
                  <Badge variant="outline" className="mt-1">{getUserRole(selectedContactId)}</Badge>
                )}
              </div>
            </div>
          </DialogHeader>
          
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-4 py-4" data-testid="conversation-messages">
            {conversationMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {t('noMessagesYet')}
              </div>
            ) : (
              conversationMessages.map((message) => {
                const isFromMe = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                    data-testid={`conversation-message-${message.id}`}
                  >
                    <div className={`max-w-[70%] ${isFromMe ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'} rounded-lg p-3`}>
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <p className={`text-xs mt-1 ${isFromMe ? 'text-blue-100' : 'text-gray-500'}`}>
                        {format(new Date(message.createdAt), "PPp")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Input */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Textarea
                placeholder={t('typeYourReply')}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                rows={2}
                className="flex-1"
                data-testid="textarea-reply-content"
              />
              <Button 
                onClick={handleSendReply} 
                disabled={!replyContent.trim() || createMessageMutation.isPending}
                data-testid="button-send-reply"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('pressEnterToSend')}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-message">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteMessage')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteMessageConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMessage && deleteMessageMutation.mutate(deletingMessage.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
