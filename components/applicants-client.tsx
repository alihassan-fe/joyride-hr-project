"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, ExternalLink, Filter } from "lucide-react"
import { CandidateDrawer } from "./candidate-drawer"

interface Candidate {
  id: number
  name: string
  email: string
  phone: string
  cv_link: string
  strengths: string[]
  weaknesses: string[]
  notes: string
  recommendation: string
  created_at: string
  department: string
  address: string
  department_specific_data: any
}

interface ApplicantsClientProps {
  candidates: Candidate[]
}

export function ApplicantsClient({ candidates }: ApplicantsClientProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const departments = useMemo(() => {
    const depts = [...new Set(candidates.map((c) => c.department))]
    return depts.filter(Boolean)
  }, [candidates])

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesDepartment = departmentFilter === "all" || candidate.department === departmentFilter
      const matchesSearch =
        searchQuery === "" ||
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.department?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesDepartment && matchesSearch
    })
  }, [candidates, departmentFilter, searchQuery])

  const getDepartmentSpecificFields = (candidate: Candidate) => {
    const data = candidate.department_specific_data || {}
    const fields = []

    switch (candidate.department) {
      case "Operations":
        if (data.dispatch) fields.push(`Dispatch: ${data.dispatch}`)
        if (data.operations_manager) fields.push(`Ops Manager: ${data.operations_manager}`)
        break
      case "Maintenance":
        if (data.maintenance_officer) fields.push(`Maintenance Officer: ${data.maintenance_officer}`)
        break
      case "Safety":
        if (data.internal_safety_supervisor) fields.push(`Safety Supervisor: ${data.internal_safety_supervisor}`)
        if (data.recruiter) fields.push(`Recruiter: ${data.recruiter}`)
        if (data.safety_officer) fields.push(`Safety Officer: ${data.safety_officer}`)
        if (data.recruiting_retention_officer) fields.push(`R&R Officer: ${data.recruiting_retention_officer}`)
        break
      case "Billing Payroll":
        // No specific fields for this department
        break
    }

    return fields
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation?.toLowerCase()) {
      case "call immediately":
        return "bg-green-100 text-green-800"
      case "shortlist":
        return "bg-blue-100 text-blue-800"
      case "remove":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredCandidates.map((candidate) => (
          <Card key={candidate.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{candidate.name}</CardTitle>
                  <p className="text-sm text-gray-600">{candidate.email}</p>
                  {candidate.phone && <p className="text-sm text-gray-600">{candidate.phone}</p>}
                  {candidate.address && <p className="text-sm text-gray-600">{candidate.address}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline">{candidate.department}</Badge>
                  <Badge className={getRecommendationColor(candidate.recommendation)}>{candidate.recommendation}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Department-specific fields */}
              {getDepartmentSpecificFields(candidate).length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Scores:</p>
                  <div className="flex flex-wrap gap-2">
                    {getDepartmentSpecificFields(candidate).map((field, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedCandidate(candidate)}>
                    View Details
                  </Button>
                  {candidate.cv_link && (
                    <Button variant="outline" size="sm" onClick={() => window.open(candidate.cv_link, "_blank")}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      CV
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">{new Date(candidate.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCandidate && (
        <CandidateDrawer
          candidate={selectedCandidate}
          open={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </>
  )
}
