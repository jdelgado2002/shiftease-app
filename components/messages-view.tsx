"use client"

import type React from "react"

import { useState } from "react"
import { Send, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

interface Message {
  id: number
  sender: string
  content: string
  timestamp: Date
  isAnnouncement?: boolean
}

const initialMessages: Message[] = [
  {
    id: 1,
    sender: "Sam (Manager)",
    content: "Remember to check the updated schedule for next week!",
    timestamp: new Date(2024, 2, 20, 9, 30),
    isAnnouncement: true,
  },
  {
    id: 2,
    sender: "Alex",
    content: "Can someone cover my shift on Friday?",
    timestamp: new Date(2024, 2, 21, 14, 15),
  },
  {
    id: 3,
    sender: "Jamie",
    content: "I can take that shift if needed.",
    timestamp: new Date(2024, 2, 21, 15, 45),
  },
]

export function MessagesView() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [announcement, setAnnouncement] = useState("")
  const { toast } = useToast()

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    const message: Message = {
      id: messages.length + 1,
      sender: "You",
      content: newMessage,
      timestamp: new Date(),
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault()

    if (!announcement.trim()) return

    const message: Message = {
      id: messages.length + 1,
      sender: "You (Manager)",
      content: announcement,
      timestamp: new Date(),
      isAnnouncement: true,
    }

    setMessages([...messages, message])
    setAnnouncement("")

    toast({
      title: "Announcement sent",
      description: "Your announcement has been sent to all team members",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Team Messages</h1>
          <p className="text-muted-foreground">Communicate with your team members</p>
        </div>

        <Tabs defaultValue="messages">
          <TabsList className="mb-4">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <Card className="h-[calc(100vh-250px)] flex flex-col">
              <CardHeader>
                <CardTitle>Team Chat</CardTitle>
                <CardDescription>Chat with your team members about shifts and schedules</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col ${message.isAnnouncement ? "bg-muted/50 p-3 rounded-lg border" : ""}`}
                    >
                      {message.isAnnouncement && (
                        <div className="text-xs font-medium text-muted-foreground mb-1">ANNOUNCEMENT</div>
                      )}
                      <div className="flex items-start gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{message.sender}</div>
                            <div className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</div>
                          </div>
                          <div className="text-sm mt-1">{message.content}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Send Announcement</CardTitle>
                <CardDescription>Send an important announcement to all team members</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendAnnouncement} className="space-y-4">
                  <Textarea
                    placeholder="Type your announcement here..."
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <Button type="submit" className="w-full">
                    Send Announcement
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
