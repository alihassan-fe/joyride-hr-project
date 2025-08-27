"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Users,
  MapPin,
  Briefcase,
  Eye,
  ChevronDown,
  ChevronRight,
  FileImage,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { Team, Employee } from "@/lib/types"

interface TreeNode {
  id: string
  name: string
  type: 'department' | 'team' | 'employee' | 'location' | 'project'
  data: any
  children: TreeNode[]
  isExpanded?: boolean
  employee?: Employee
}

export default function OrgChartPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedView, setSelectedView] = useState("department")
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const stats = {
    totalEmployees: employees.length,
    departments: [...new Set(employees.map((e) => e.department).filter(Boolean))].length,
    teams: teams.length,
    locations: [...new Set(employees.map((e) => e.office_location).filter(Boolean))].length,
    managers: employees.filter((e) => employees.some((emp) => emp.manager_id === e.id)).length,
  }

  useEffect(() => {
    fetchOrgData()
  }, [])

  async function fetchOrgData() {
    setLoading(true)
    try {
      const [employeesRes, teamsRes] = await Promise.all([
        fetch("/api/org-chart/employees"),
        fetch("/api/org-chart/teams"),
      ])

      if (employeesRes.ok) {
        const empData = await employeesRes.json()
        setEmployees(empData.data || [])
      }

      if (teamsRes.ok) {
        const teamData = await teamsRes.json()
        setTeams(teamData.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch org data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    if (term) {
      const foundEmployee = employees.find(
        (emp) =>
          emp.name.toLowerCase().includes(term.toLowerCase()) ||
          emp.email.toLowerCase().includes(term.toLowerCase()) ||
          (emp.job_title && emp.job_title.toLowerCase().includes(term.toLowerCase())),
      )
      if (foundEmployee) {
        setSelectedEmployee(foundEmployee.id)
        // Expand all parent nodes to show the found employee
        expandToEmployee(foundEmployee.id)
      }
    } else {
      setSelectedEmployee(null)
    }
  }, [employees])

  const expandToEmployee = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId)
    if (!employee) return

    const newExpanded = new Set(expandedNodes)
    
    // Expand department
    if (employee.department) {
      newExpanded.add(`dept-${employee.department}`)
    }
    
    // Expand team
    if (employee.team_id) {
      newExpanded.add(`team-${employee.team_id}`)
    }
    
    // Expand location
    if (employee.office_location) {
      newExpanded.add(`loc-${employee.office_location}`)
    }
    
    setExpandedNodes(newExpanded)
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const buildDepartmentTree = (): TreeNode[] => {
    const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))]
    
    return departments.map((dept) => {
      const deptEmployees = employees.filter((e) => e.department === dept)
      const deptTeams = teams.filter((t) => t.department === dept)
      
      const teamNodes: TreeNode[] = deptTeams.map((team) => {
        const teamMembers = deptEmployees.filter((e) => e.team_id === team.id)
        const teamLead = teamMembers.find((e) => e.id === team.team_lead_id)
        
        const memberNodes: TreeNode[] = teamMembers
          .filter((e) => e.id !== team.team_lead_id)
          .map((emp) => ({
            id: `emp-${emp.id}`,
            name: emp.name,
            type: 'employee' as const,
            data: { jobTitle: emp.job_title, email: emp.email },
            children: [],
            employee: emp,
          }))
        
        const children: TreeNode[] = []
        if (teamLead) {
          children.push({
            id: `emp-${teamLead.id}`,
            name: `${teamLead.name} (Lead)`,
            type: 'employee' as const,
            data: { jobTitle: teamLead.job_title, email: teamLead.email, isLead: true },
            children: memberNodes,
            employee: teamLead,
          })
        } else {
          children.push(...memberNodes)
        }
        
        return {
          id: `team-${team.id}`,
          name: team.name,
          type: 'team' as const,
          data: { memberCount: teamMembers.length },
          children,
        }
      })
      
      const unassignedEmployees = deptEmployees.filter((e) => !e.team_id)
      const unassignedNodes: TreeNode[] = unassignedEmployees.map((emp) => ({
        id: `emp-${emp.id}`,
        name: emp.name,
        type: 'employee' as const,
        data: { jobTitle: emp.job_title, email: emp.email },
        children: [],
        employee: emp,
      }))
      
      return {
        id: `dept-${dept}`,
        name: dept,
        type: 'department' as const,
        data: { employeeCount: deptEmployees.length },
        children: [...teamNodes, ...unassignedNodes],
      }
    })
  }

  const buildLocationTree = (): TreeNode[] => {
    const locations = [...new Set(employees.map((e) => e.office_location).filter(Boolean))]
    
    return locations.map((location) => {
      const locationEmployees = employees.filter((e) => e.office_location === location)
      const locationTeams = teams.filter(
        (t) => t.location === location || locationEmployees.some((emp) => emp.team_id === t.id),
      )
      
      const teamNodes: TreeNode[] = locationTeams.map((team) => {
        const teamMembers = locationEmployees.filter((e) => e.team_id === team.id)
        const teamLead = teamMembers.find((e) => e.id === team.team_lead_id)
        
        const memberNodes: TreeNode[] = teamMembers
          .filter((e) => e.id !== team.team_lead_id)
          .map((emp) => ({
            id: `emp-${emp.id}`,
            name: emp.name,
            type: 'employee' as const,
            data: { jobTitle: emp.job_title, email: emp.email },
            children: [],
            employee: emp,
          }))
        
        const children: TreeNode[] = []
        if (teamLead) {
          children.push({
            id: `emp-${teamLead.id}`,
            name: `${teamLead.name} (Lead)`,
            type: 'employee' as const,
            data: { jobTitle: teamLead.job_title, email: teamLead.email, isLead: true },
            children: memberNodes,
            employee: teamLead,
          })
        } else {
          children.push(...memberNodes)
        }
        
        return {
          id: `team-${team.id}`,
          name: team.name,
          type: 'team' as const,
          data: { memberCount: teamMembers.length },
          children,
        }
      })
      
      const unassignedEmployees = locationEmployees.filter((e) => !e.team_id)
      const unassignedNodes: TreeNode[] = unassignedEmployees.map((emp) => ({
        id: `emp-${emp.id}`,
        name: emp.name,
        type: 'employee' as const,
        data: { jobTitle: emp.job_title, email: emp.email },
        children: [],
        employee: emp,
      }))
      
      return {
        id: `loc-${location}`,
        name: location,
        type: 'location' as const,
        data: { employeeCount: locationEmployees.length },
        children: [...teamNodes, ...unassignedNodes],
      }
    })
  }

  const buildProjectTree = (): TreeNode[] => {
    const projects = [
      { id: "operations", name: "Operations Projects", departments: ["Operations"] },
      { id: "safety", name: "Safety Initiatives", departments: ["Safety"] },
      { id: "maintenance", name: "Maintenance Programs", departments: ["Maintenance"] },
      { id: "finance", name: "Finance & Billing", departments: ["Billing Payroll"] },
      { id: "cross-functional", name: "Cross-Functional Teams", departments: ["Operations", "Safety", "Maintenance"] },
    ]
    
    return projects.map((project) => {
      let projectEmployees: Employee[] = []
      
      if (project.id === "cross-functional") {
        const managers = employees.filter((e) => employees.some((emp) => emp.manager_id === e.id))
        const teamLeads = employees.filter((e) => teams.some((t) => t.team_lead_id === e.id))
        projectEmployees = [...new Set([...managers, ...teamLeads])]
      } else {
        projectEmployees = employees.filter((e) => project.departments.includes(e.department || ""))
      }
      
      const roleGroups = new Map<string, Employee[]>()
      
      projectEmployees.forEach((emp) => {
        const role = emp.job_title || "General"
        if (!roleGroups.has(role)) {
          roleGroups.set(role, [])
        }
        roleGroups.get(role)!.push(emp)
      })
      
      const roleNodes: TreeNode[] = Array.from(roleGroups.entries()).map(([role, employees]) => {
        const employeeNodes: TreeNode[] = employees.map((emp) => ({
          id: `emp-${emp.id}`,
          name: emp.name,
          type: 'employee' as const,
          data: { jobTitle: emp.job_title, email: emp.email, department: emp.department },
          children: [],
          employee: emp,
        }))
        
        return {
          id: `role-${project.id}-${role}`,
          name: role,
          type: 'team' as const,
          data: { memberCount: employees.length },
          children: employeeNodes,
        }
      })
      
      return {
        id: `proj-${project.id}`,
        name: project.name,
        type: 'project' as const,
        data: { memberCount: projectEmployees.length },
        children: roleNodes,
      }
    })
  }

  const buildOrgTree = (): TreeNode[] => {
    if (selectedView === "department") {
      return buildDepartmentTree()
    } else if (selectedView === "location") {
      return buildLocationTree()
    } else {
      return buildProjectTree()
    }
  }

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    const isSelected = node.employee && selectedEmployee === node.employee.id
    
    const getNodeIcon = () => {
      switch (node.type) {
        case 'department':
          return <Briefcase className="h-4 w-4 text-purple-600" />
        case 'team':
          return <Users className="h-4 w-4 text-blue-600" />
        case 'employee':
          return <div className="h-4 w-4 rounded-full bg-green-500" />
        case 'location':
          return <MapPin className="h-4 w-4 text-orange-600" />
        case 'project':
          return <Briefcase className="h-4 w-4 text-red-600" />
        default:
          return <div className="h-4 w-4 rounded-full bg-gray-400" />
      }
    }

    const getNodeColor = () => {
      if (isSelected) return "bg-red-50 border-red-200"
      switch (node.type) {
        case 'department':
          return "bg-purple-50 border-purple-200"
        case 'team':
          return "bg-blue-50 border-blue-200"
        case 'employee':
          return "bg-green-50 border-green-200"
        case 'location':
          return "bg-orange-50 border-orange-200"
        case 'project':
          return "bg-red-50 border-red-200"
        default:
          return "bg-gray-50 border-gray-200"
      }
    }

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`
            flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors
            hover:shadow-sm ${getNodeColor()}
          `}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id)
            } else if (node.employee) {
              window.open(`/employees/${node.employee.id}`, "_blank")
            }
          }}
        >
          <div className="flex items-center gap-1" style={{ marginLeft: `${level * 20}px` }}>
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleNode(node.id)
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
            {getNodeIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{node.name}</div>
            {node.data.jobTitle && (
              <div className="text-xs text-gray-600 truncate">{node.data.jobTitle}</div>
            )}
            {node.data.memberCount && (
              <div className="text-xs text-gray-500">{node.data.memberCount} members</div>
            )}
            {node.data.employeeCount && (
              <div className="text-xs text-gray-500">{node.data.employeeCount} employees</div>
            )}
          </div>
          
          {node.employee && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`/employees/${node.employee!.id}`, "_blank")
                }}
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        {isExpanded && hasChildren && (
          <div className="ml-4 border-l-2 border-gray-200 pl-4">
            {node.children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.job_title && emp.job_title.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleExportPNG = useCallback(() => {
    toast({
      title: "Export Feature",
      description: "PNG export will be implemented in the next update.",
    })
  }, [toast])

  const handleExportPDF = useCallback(() => {
    toast({
      title: "Export Feature",
      description: "PDF export will be implemented in the next update.",
    })
  }, [toast])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Organizational Chart</h1>
          <p className="text-sm text-muted-foreground">Visualize your team structure and hierarchy</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPNG}
            disabled={loading}
          >
            <FileImage className="h-4 w-4 mr-2" />
            Export PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={loading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departments}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teams}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locations}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.managers}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-md">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, email, or job title..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {searchTerm && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">Found {filteredEmployees.length} employee(s)</p>
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {filteredEmployees.slice(0, 5).map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {emp.job_title} • {emp.department}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleSearch(emp.name)}>
                        Locate
                      </Button>
                      <Link href={`/employees/${emp.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle>Organization Structure</CardTitle>
          <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="department">Department View</TabsTrigger>
              <TabsTrigger value="location">Location View</TabsTrigger>
              <TabsTrigger value="project">Matrix View</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-2 text-sm text-muted-foreground">
            {selectedView === "department" && "Hierarchical view: Department → Team → Manager → Direct Reports"}
            {selectedView === "location" && "Geographic view: Site → Team → Employees by location"}
            {selectedView === "project" && "Matrix view: Project assignments and cross-functional teams"}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[600px] rounded-xl bg-muted/50 animate-pulse flex items-center justify-center">
              <p className="text-muted-foreground">Loading organizational chart...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {buildOrgTree().map((node) => renderTreeNode(node))}
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && (
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>View Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {selectedView === "department" && (
                <>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">Span of Control</p>
                    <p className="text-blue-700">
                      Average: {stats.managers > 0 ? Math.round(stats.totalEmployees / stats.managers) : 0} reports per
                      manager
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-900">Team Distribution</p>
                    <p className="text-green-700">
                      {stats.teams} teams across {stats.departments} departments
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-900">Hierarchy Depth</p>
                    <p className="text-purple-700">3-4 levels (Department → Team → Lead → Members)</p>
                  </div>
                </>
              )}

              {selectedView === "location" && (
                <>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="font-medium text-orange-900">Geographic Spread</p>
                    <p className="text-orange-700">{stats.locations} office locations</p>
                  </div>
                  <div className="p-3 bg-teal-50 rounded-lg">
                    <p className="font-medium text-teal-900">Remote Workers</p>
                    <p className="text-teal-700">
                      {employees.filter((e) => !e.office_location).length} employees working remotely
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <p className="font-medium text-indigo-900">Largest Site</p>
                    <p className="text-indigo-700">
                      {(() => {
                        const locationCounts = employees.reduce(
                          (acc, emp) => {
                            const loc = emp.office_location || "Remote"
                            acc[loc] = (acc[loc] || 0) + 1
                            return acc
                          },
                          {} as Record<string, number>,
                        )
                        const largestSite = Object.entries(locationCounts).reduce(
                          (max, entry) => entry[1] > max[1] ? entry : max,
                          ["None", 0] as [string, number]
                        )
                        return `${largestSite[0]} (${largestSite[1]} employees)`
                      })()}
                    </p>
                  </div>
                </>
              )}

              {selectedView === "project" && (
                <>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="font-medium text-red-900">Cross-Functional</p>
                    <p className="text-red-700">
                      {
                        employees.filter(
                          (e) =>
                            employees.some((emp) => emp.manager_id === e.id) ||
                            teams.some((t) => t.team_lead_id === e.id),
                        ).length
                      }{" "}
                      employees in leadership roles
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="font-medium text-yellow-900">Project Teams</p>
                    <p className="text-yellow-700">5 project areas with matrix assignments</p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <p className="font-medium text-pink-900">Role Diversity</p>
                    <p className="text-pink-700">
                      {[...new Set(employees.map((e) => e.job_title).filter(Boolean))].length} unique job titles
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}