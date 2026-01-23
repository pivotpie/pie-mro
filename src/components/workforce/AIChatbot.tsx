import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, Sparkles, Paperclip } from "lucide-react";
import { useDate } from "@/contexts/DateContext";
import { SYSTEM_PROMPT } from "@/integrations/openai/client";
import { gatherOperationalContext, formatContextForPrompt } from "@/integrations/openai/contextGathering";
import { toast } from "sonner";
import { UploadedDocument, ExtractedEntity, ExtractedData } from "@/types/documentUpload";
import { getFileType, processDocument } from "@/utils/documentProcessor";
import { executeEntityAction, executeBulkActions } from "@/utils/documentActions";
import { ExtractedEntityCard } from "./chatbot/ExtractedEntityCard";
import { BulkActionBar } from "./chatbot/BulkActionBar";
import { EditEntityModal } from "./chatbot/EditEntityModal";
import { supabase } from "@/integrations/supabase/client";
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'document';
  content: string;
  timestamp: Date;
  documentData?: {
    fileName: string;
    extractedData?: ExtractedData;
    entities?: ExtractedEntity[];
  };
}

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your MRO Assistant. Ask me about aircraft status, employee availability, or certifications.\n\n💡 NEW: Upload CSV files or certificate images to create maintenance visits, schedules, or update authorizations!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [editingEntity, setEditingEntity] = useState<{ entity: ExtractedEntity | null; messageId: string | null }>({ entity: null, messageId: null });
  const [editingEntities, setEditingEntities] = useState<{ entities: ExtractedEntity[] | null; messageId: string | null }>({ entities: null, messageId: null });
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentDate } = useDate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const responseText = await processQuery(userMsg.content);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble processing your request. Please check your OpenAI API key configuration and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      toast.error("Failed to get AI response");
    } finally {
      setIsTyping(false);
    }
  };

  const processQuery = async (query: string): Promise<string> => {
    try {
      // Gather real-time operational context from database
      console.log('Gathering operational context...');
      const context = await gatherOperationalContext(currentDate);
      const contextString = formatContextForPrompt(context);

      console.log('Sending query to OpenAI via edge function...');

      // Call edge function for secure OpenAI API access
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'system', content: contextString },
            { role: 'user', content: query }
          ],
          model: 'gpt-4o-mini',
          max_completion_tokens: 3000
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to call AI service');
      }

      if (data?.error) {
        console.error('OpenAI API error:', data.error);
        throw new Error(data.error);
      }

      const response = data?.choices?.[0]?.message?.content;

      if (!response) {
        console.error('No content in response');
        throw new Error('No response from AI');
      }

      console.log('AI response received');
      return response;

    } catch (error: any) {
      console.error('AI query error:', error);

      const errorMsg = error?.message || 'Unknown error';
      return `⚠️ Error: ${errorMsg}\n\nPlease check that the OpenAI API key is configured correctly.`;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const uploadedDoc: UploadedDocument = {
      id: Date.now().toString(),
      file,
      fileType: getFileType(file),
      status: 'processing',
      uploadProgress: 0
    };

    // Add document message
    const docMsg: Message = {
      id: Date.now().toString(),
      role: 'document',
      content: `Uploaded: ${file.name}`,
      timestamp: new Date(),
      documentData: {
        fileName: file.name
      }
    };

    setMessages(prev => [...prev, docMsg]);
    setIsProcessingDocument(true);

    try {
      // Process the document
      toast.info('Processing document...');
      const extractedData = await processDocument(uploadedDoc);

      // Update message with extracted data
      setMessages(prev =>
        prev.map(msg =>
          msg.id === docMsg.id
            ? {
                ...msg,
                documentData: {
                  ...msg.documentData!,
                  extractedData,
                  entities: extractedData.entities
                }
              }
            : msg
        )
      );

      // Add bot response
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `✅ I've extracted ${extractedData.totalCount} ${extractedData.documentType.replace('_', ' ')} record(s) from your ${uploadedDoc.fileType.toUpperCase()}. ${extractedData.validCount} ready, ${extractedData.errorCount} with errors.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
      toast.success(`Extracted ${extractedData.totalCount} records!`);
    } catch (error: any) {
      console.error('Document processing error:', error);
      toast.error(`Failed to process document: ${error.message}`);

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Failed to process document: ${error.message}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessingDocument(false);
    }
  };

  const handleEntityAction = async (entity: ExtractedEntity, messageId: string) => {
    try {
      toast.info(`Executing ${entity.suggestedAction}...`);
      const result = await executeEntityAction(entity);

      if (result.success) {
        // Update entity status in messages
        setMessages(prev =>
          prev.map(msg => {
            if (msg.id === messageId && msg.documentData?.entities) {
              return {
                ...msg,
                documentData: {
                  ...msg.documentData,
                  entities: msg.documentData.entities.map(e =>
                    e.id === entity.id ? { ...e, status: 'skipped' as const } : e
                  )
                }
              };
            }
            return msg;
          })
        );

        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(`Action failed: ${error.message}`);
    }
  };

  const handleBulkAction = async (entities: ExtractedEntity[], messageId: string) => {
    try {
      toast.info('Executing bulk actions...');
      const result = await executeBulkActions(entities);

      // Update all entities status
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === messageId && msg.documentData?.entities) {
            return {
              ...msg,
              documentData: {
                ...msg.documentData,
                entities: msg.documentData.entities.map(e => ({
                  ...e,
                  status: 'skipped' as const
                }))
              }
            };
          }
          return msg;
        })
      );

      const successMsg = `✅ Success! Created ${result.successCount} record(s), ${result.skippedCount} skipped, ${result.errorCount} errors.`;
      toast.success(successMsg);

      // Add summary message
      const summaryMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: successMsg,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, summaryMsg]);
    } catch (error: any) {
      toast.error(`Bulk action failed: ${error.message}`);
    }
  };

  const handleEdit = (entity: ExtractedEntity, messageId: string) => {
    setEditingEntity({ entity, messageId });
  };

  const handleEditAll = (entities: ExtractedEntity[], messageId: string) => {
    setEditingEntities({ entities, messageId });
  };

  const handleSkip = (entity: ExtractedEntity, messageId: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId && msg.documentData?.entities) {
          return {
            ...msg,
            documentData: {
              ...msg.documentData,
              entities: msg.documentData.entities.map(e =>
                e.id === entity.id ? { ...e, status: 'skipped' as const } : e
              )
            }
          };
        }
        return msg;
      })
    );
    toast.info('Entity skipped');
  };

  const handleSaveEdit = (updatedEntity: ExtractedEntity) => {
    if (!editingEntity.messageId) return;

    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === editingEntity.messageId && msg.documentData?.entities) {
          return {
            ...msg,
            documentData: {
              ...msg.documentData,
              entities: msg.documentData.entities.map(e =>
                e.id === updatedEntity.id ? updatedEntity : e
              )
            }
          };
        }
        return msg;
      })
    );

    setEditingEntity({ entity: null, messageId: null });
    toast.success('Changes saved');
  };

  const handleSaveEditAll = (updatedEntities: ExtractedEntity[]) => {
    if (!editingEntities.messageId) return;

    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === editingEntities.messageId && msg.documentData?.entities) {
          return {
            ...msg,
            documentData: {
              ...msg.documentData,
              entities: updatedEntities
            }
          };
        }
        return msg;
      })
    );

    setEditingEntities({ entities: null, messageId: null });
    toast.success('All changes saved');
  };

  return (
    <>
      {/* Trigger Button - Beautiful Chat with AI Button */}
      {!isOpen && (
        <Button
          className="fixed bottom-6 right-6 z-40 h-16 px-6 rounded-full shadow-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold text-base flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50 animate-in slide-in-from-bottom-5"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="h-12 w-12" />
          <span>Chat with AI</span>
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full animate-pulse"></div>
        </Button>
      )}

      {/* Chat Window - Larger size (70% height, 30% width) */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[95vw] sm:w-[450px] md:w-[30vw] md:min-w-[400px] md:max-w-[550px] h-[70vh] shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-5 border-2 border-purple-500/20">
          <CardHeader className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-t-xl p-4 flex flex-row items-center justify-between">
            <CardTitle className="text-md flex items-center gap-2 font-semibold">
              <Sparkles className="h-5 w-5 animate-pulse" />
              MRO AI Assistant
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full transition-all" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {/* Regular message bubble */}
                    <div className={`flex ${msg.role === 'user' || msg.role === 'document' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-line ${
                          msg.role === 'user' || msg.role === 'document'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>

                    {/* Document entities display */}
                    {msg.role === 'document' && msg.documentData?.entities && (
                      <div className="mt-2">
                        {msg.documentData.entities.map((entity, index) => (
                          <ExtractedEntityCard
                            key={entity.id}
                            entity={entity}
                            index={index}
                            onEdit={(e) => handleEdit(e, msg.id)}
                            onAction={(e) => handleEntityAction(e, msg.id)}
                            onSkip={(e) => handleSkip(e, msg.id)}
                          />
                        ))}
                        {msg.documentData.entities.length > 1 && (
                          <BulkActionBar
                            entities={msg.documentData.entities}
                            onExecuteAll={() => handleBulkAction(msg.documentData!.entities!, msg.id)}
                            onEditAll={() => handleEditAll(msg.documentData!.entities!, msg.id)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg rounded-bl-none p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 border-t bg-gray-50 dark:bg-gray-800">
            <form
              className="flex w-full gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              {/* File upload input (hidden) */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.jpg,.jpeg,.png,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Attachment button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingDocument || isTyping}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                title="Upload CSV, image, or PDF"
              >
                <Paperclip className="h-5 w-5" />
              </Button>

              <Input
                placeholder="Ask anything or upload a document..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessingDocument}
                className="flex-1 border-2 focus:border-purple-500 transition-colors"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isTyping || isProcessingDocument}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      {/* Edit Entity Modal */}
      <EditEntityModal
        entity={editingEntity.entity}
        isOpen={!!editingEntity.entity}
        onClose={() => setEditingEntity({ entity: null, messageId: null })}
        onSave={handleSaveEdit}
      />

      {/* Edit All Entities Modal */}
      <EditEntityModal
        entities={editingEntities.entities || undefined}
        isOpen={!!editingEntities.entities}
        onClose={() => setEditingEntities({ entities: null, messageId: null })}
        onSave={() => {}}
        onSaveAll={handleSaveEditAll}
      />
    </>
  );
};
