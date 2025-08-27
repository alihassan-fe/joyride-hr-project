"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, MapPin, Users, Video, Search, X } from "lucide-react"

interface InterviewSchedulingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidates: any[]
  employees: any[]
  onSuccess: () => void
}

interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  department?: string
}

interface Employee {
  id: string
  name: string
  email: string
  department?: string
  role?: string
}

export function InterviewSchedulingDialog({ 
  open, 
  onOpenChange, 
  candidates, 
  employees, 
  onSuccess 
}: InterviewSchedulingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [selectedInterviewers, setSelectedInterviewers] = useState<Employee[]>([])
  const [formData, setFormData] = useState({
    date: "",
    start_time: "09:00",
    end_time: "10:00",
    location: "",
    interview_type: "phone",
    notes: "",
    generate_google_meet: false,
    pre_buffer_minutes: "15",
    post_buffer_minutes: "15"
  })
  const [candidateSearchQuery, setCandidateSearchQuery] = useState("")
  const [candidateSearchResults, setCandidateSearchResults] = useState<Candidate[]>([])
  const [showCandidateSearchResults, setShowCandidateSearchResults] = useState(false)
  const [interviewerSearchQuery, setInterviewerSearchQuery] = useState("")
  const [interviewerSearchResults, setInterviewerSearchResults] = useState<Employee[]>([])
  const [showInterviewerSearchResults, setShowInterviewerSearchResults] = useState(false)
  const { toast } = useToast()

  const handleCandidateSearch = (query: string) => {
    setCandidateSearchQuery(query)
    if (query.trim().length >= 2) {
      const filtered = candidates.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase())
      )
      setCandidateSearchResults(filtered.slice(0, 10))
      setShowCandidateSearchResults(true)
    } else {
      setCandidateSearchResults([])
      setShowCandidateSearchResults(false)
    }
  }

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setCandidateSearchQuery("")
    setShowCandidateSearchResults(false)
  }

  const handleInterviewerSearch = (query: string) => {
    setInterviewerSearchQuery(query)
    if (query.trim().length >= 2) {
      const filtered = employees.filter(e => 
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.email.toLowerCase().includes(query.toLowerCase())
      )
      setInterviewerSearchResults(filtered.slice(0, 10))
      setShowInterviewerSearchResults(true)
    } else {
      setInterviewerSearchResults([])
      setShowInterviewerSearchResults(false)
    }
  }

  const handleInterviewerSelect = (interviewer: Employee) => {
    if (!selectedInterviewers.find(i => i.id === interviewer.id)) {
      setSelectedInterviewers(prev => [...prev, interviewer])
    }
    setInterviewerSearchQuery("")
    setShowInterviewerSearchResults(false)
  }

  const handleInterviewerRemove = (interviewerId: string) => {
    setSelectedInterviewers(prev => prev.filter(i => i.id !== interviewerId))
  }

  const handleSubmit = async () => {
    if (!selectedCandidate || selectedInterviewers.length === 0 || !formData.date || !formData.start_time || !formData.end_time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/calendar/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: selectedCandidate.id,
          interviewers: selectedInterviewers.map(i => i.id),
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location,
          interview_type: formData.interview_type,
          notes: formData.notes,
          generate_google_meet: formData.generate_google_meet,
          pre_buffer_minutes: parseInt(formData.pre_buffer_minutes),
          post_buffer_minutes: parseInt(formData.post_buffer_minutes)
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Interview scheduled successfully",
        })
        onSuccess()
        resetForm()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to schedule interview",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule interview",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedCandidate(null)
    setSelectedInterviewers([])
    setFormData({
      date: "",
      start_time: "09:00",
      end_time: "10:00",
      location: "",
      interview_type: "phone",
      notes: "",
      generate_google_meet: false,
      pre_buffer_minutes: "15",
      post_buffer_minutes: "15"
    })
    setCandidateSearchQuery("")
    setCandidateSearchResults([])
    setShowCandidateSearchResults(false)
    setInterviewerSearchQuery("")
    setInterviewerSearchResults([])
    setShowInterviewerSearchResults(false)
  }

  const isFormValid = selectedCandidate && selectedInterviewers.length > 0 && formData.date && formData.start_time && formData.end_time

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Interview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Candidate Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Candidate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Candidate *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search candidates..."
                    value={candidateSearchQuery}
                    onChange={(e) => handleCandidateSearch(e.target.value)}
                    className="pl-10"
                    onFocus={() => {
                      if (candidateSearchQuery.trim().length >= 2 && candidateSearchResults.length > 0) {
                        setShowCandidateSearchResults(true)
                      }
                    }}
                  />
                  
                  {/* Search Results Dropdown */}
                  {showCandidateSearchResults && candidateSearchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {candidateSearchResults.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => handleCandidateSelect(candidate)}
                        >
                          <div className="font-medium">{candidate.name}</div>
                          <div className="text-sm text-muted-foreground">{candidate.email}</div>
                          {candidate.department && (
                            <div className="text-xs text-muted-foreground">{candidate.department}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedCandidate && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="font-medium">{selectedCandidate.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedCandidate.email}</div>
                  {selectedCandidate.department && (
                    <div className="text-sm text-muted-foreground">{selectedCandidate.department}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Interviewers *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={interviewerSearchQuery}
                    onChange={(e) => handleInterviewerSearch(e.target.value)}
                    className="pl-10"
                    onFocus={() => {
                      if (interviewerSearchQuery.trim().length >= 2 && interviewerSearchResults.length > 0) {
                        setShowInterviewerSearchResults(true)
                      }
                    }}
                  />
                  
                  {/* Search Results Dropdown */}
                  {showInterviewerSearchResults && interviewerSearchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {interviewerSearchResults.map((interviewer) => (
                        <div
                          key={interviewer.id}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => handleInterviewerSelect(interviewer)}
                        >
                          <div className="font-medium">{interviewer.name}</div>
                          <div className="text-sm text-muted-foreground">{interviewer.email}</div>
                          {interviewer.department && (
                            <div className="text-xs text-muted-foreground">{interviewer.department}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedInterviewers.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Interviewers:</Label>
                  <div className="space-y-2">
                    {selectedInterviewers.map((interviewer) => (
                      <div key={interviewer.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{interviewer.name}</p>
                          <p className="text-sm text-muted-foreground">{interviewer.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInterviewerRemove(interviewer.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="google_meet"
                  checked={formData.generate_google_meet}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, generate_google_meet: checked as boolean }))}
                />
                <Label htmlFor="google_meet" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Generate Google Meet link
                </Label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="pre_buffer">Pre-buffer (min)</Label>
                  <Input
                    id="pre_buffer"
                    type="number"
                    value={formData.pre_buffer_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, pre_buffer_minutes: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="post_buffer">Post-buffer (min)</Label>
                  <Input
                    id="post_buffer"
                    type="number"
                    value={formData.post_buffer_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, post_buffer_minutes: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="interview_type">Type</Label>
                  <Select value={formData.interview_type} onValueChange={(value) => setFormData(prev => ({ ...prev, interview_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Details */}
          <Card>
            <CardHeader>
              <CardTitle>Interview Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Interview location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes for the interview..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || loading}>
            {loading ? "Scheduling..." : "Schedule Interview"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
