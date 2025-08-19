"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  FileImage,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { OrgNode, Team, Employee } from "@/lib/types"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

export default function OrgChartPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedView, setSelectedView] = useState("department")
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [chartInstance, setChartInstance] = useState<any>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([])
  const [exportingPNG, setExportingPNG] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const { toast } = useToast()

  const stats = {
    totalEmployees: employees.length,
    departments: [...new Set(employees.map((e) => e.department).filter(Boolean))].length,
    teams: teams.length,
    locations: [...new Set(employees.map((e) => e.office_location).filter(Boolean))].length,
    managers: employees.filter((e) => employees.some((emp) => emp.manager_id === e.id)).length,
    vacantPositions: 0,
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

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term)
      if (term && chartInstance) {
        const foundEmployee = employees.find(
          (emp) =>
            emp.name.toLowerCase().includes(term.toLowerCase()) ||
            emp.email.toLowerCase().includes(term.toLowerCase()) ||
            (emp.job_title && emp.job_title.toLowerCase().includes(term.toLowerCase())),
        )

        if (foundEmployee) {
          setSelectedEmployee(foundEmployee.id)
          chartInstance.dispatchAction({
            type: "highlight",
            seriesIndex: 0,
            dataIndex: foundEmployee.id,
          })

          const path = getEmployeePath(foundEmployee)
          setBreadcrumbs(path)
        }
      } else {
        setSelectedEmployee(null)
        setBreadcrumbs([])
        if (chartInstance) {
          chartInstance.dispatchAction({
            type: "downplay",
            seriesIndex: 0,
          })
        }
      }
    },
    [employees, chartInstance],
  )

  const getEmployeePath = (employee: Employee): string[] => {
    const path = []
    if (employee.department) path.push(employee.department)

    const team = teams.find((t) => t.id === employee.team_id)
    if (team) path.push(team.name)

    if (employee.manager_id) {
      const manager = employees.find((e) => e.id === employee.manager_id)
      if (manager) path.push(`Reports to: ${manager.name}`)
    }

    path.push(employee.name)
    return path
  }

  const handleZoomIn = () => {
    if (chartInstance) {
      chartInstance.dispatchAction({ type: "dataZoom", start: 10, end: 90 })
    }
  }

  const handleZoomOut = () => {
    if (chartInstance) {
      chartInstance.dispatchAction({ type: "dataZoom", start: 0, end: 100 })
    }
  }

  const handleResetView = () => {
    if (chartInstance) {
      chartInstance.dispatchAction({ type: "restore" })
      setSelectedEmployee(null)
      setBreadcrumbs([])
      setSearchTerm("")
    }
  }

  const buildOrgTree = () => {
    if (selectedView === "department") {
      return buildDepartmentTree()
    } else if (selectedView === "location") {
      return buildLocationTree()
    } else {
      return buildProjectTree()
    }
  }

  const buildDepartmentTree = (): OrgNode[] => {
    const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))]

    return departments.map((dept) => {
      const deptEmployees = employees.filter((e) => e.department === dept)
      const deptTeams = teams.filter((t) => t.department === dept)

      const teamNodes: OrgNode[] = deptTeams.map((team) => {
        const teamMembers = deptEmployees.filter((e) => e.team_id === team.id)
        const teamLead = teamMembers.find((e) => e.id === team.team_lead_id)

        const memberNodes: OrgNode[] = teamMembers
          .filter((e) => e.id !== team.team_lead_id)
          .map((emp) => ({
            id: emp.id,
            name: emp.name,
            value: emp.job_title || emp.name,
            symbolSize: selectedEmployee === emp.id ? 40 : 30,
            itemStyle: {
              color: selectedEmployee === emp.id ? "#ef4444" : "#10b981",
              borderColor: selectedEmployee === emp.id ? "#dc2626" : "#059669",
              borderWidth: selectedEmployee === emp.id ? 3 : 1,
            },
            category: 2,
          }))

        return {
          id: team.id,
          name: team.name,
          value: `${team.name} (${teamMembers.length})`,
          symbolSize: 40,
          itemStyle: { color: "#3b82f6" },
          category: 1,
          children: [
            ...(teamLead
              ? [
                  {
                    id: teamLead.id,
                    name: teamLead.name,
                    value: `${teamLead.name} (Lead)`,
                    symbolSize: selectedEmployee === teamLead.id ? 45 : 35,
                    itemStyle: {
                      color: selectedEmployee === teamLead.id ? "#ef4444" : "#f59e0b",
                      borderColor: selectedEmployee === teamLead.id ? "#dc2626" : "#d97706",
                      borderWidth: selectedEmployee === teamLead.id ? 3 : 1,
                    },
                    category: 1,
                    children: memberNodes,
                  },
                ]
              : memberNodes),
          ],
        }
      })

      const unassignedEmployees = deptEmployees.filter((e) => !e.team_id)
      const unassignedNodes: OrgNode[] = unassignedEmployees.map((emp) => ({
        id: emp.id,
        name: emp.name,
        value: emp.job_title || emp.name,
        symbolSize: selectedEmployee === emp.id ? 40 : 30,
        itemStyle: {
          color: selectedEmployee === emp.id ? "#ef4444" : "#6b7280",
          borderColor: selectedEmployee === emp.id ? "#dc2626" : "#4b5563",
          borderWidth: selectedEmployee === emp.id ? 3 : 1,
        },
        category: 2,
      }))

      return {
        id: dept || "unknown",
        name: dept || "Unassigned",
        value: `${dept} (${deptEmployees.length})`,
        symbolSize: 50,
        itemStyle: { color: "#8b5cf6" },
        category: 0,
        children: [...teamNodes, ...unassignedNodes],
      }
    })
  }

  const buildLocationTree = (): OrgNode[] => {
    const locations = [...new Set(employees.map((e) => e.office_location).filter(Boolean))]

    return locations.map((location) => {
      const locationEmployees = employees.filter((e) => e.office_location === location)
      const locationTeams = teams.filter(
        (t) => t.location === location || locationEmployees.some((emp) => emp.team_id === t.id),
      )

      const teamNodes: OrgNode[] = locationTeams.map((team) => {
        const teamMembers = locationEmployees.filter((e) => e.team_id === team.id)
        const teamLead = teamMembers.find((e) => e.id === team.team_lead_id)

        const memberNodes: OrgNode[] = teamMembers
          .filter((e) => e.id !== team.team_lead_id)
          .map((emp) => ({
            id: emp.id,
            name: emp.name,
            value: `${emp.name} - ${emp.job_title || "Employee"}`,
            symbolSize: selectedEmployee === emp.id ? 40 : 30,
            itemStyle: {
              color: selectedEmployee === emp.id ? "#ef4444" : "#10b981",
              borderColor: selectedEmployee === emp.id ? "#dc2626" : "#059669",
              borderWidth: selectedEmployee === emp.id ? 3 : 1,
            },
            category: 2,
          }))

        return {
          id: `${location}-${team.id}`,
          name: team.name,
          value: `${team.name} (${teamMembers.length} members)`,
          symbolSize: 40,
          itemStyle: { color: "#3b82f6" },
          category: 1,
          children: [
            ...(teamLead
              ? [
                  {
                    id: teamLead.id,
                    name: teamLead.name,
                    value: `${teamLead.name} (Team Lead)`,
                    symbolSize: selectedEmployee === teamLead.id ? 45 : 35,
                    itemStyle: {
                      color: selectedEmployee === teamLead.id ? "#ef4444" : "#f59e0b",
                      borderColor: selectedEmployee === teamLead.id ? "#dc2626" : "#d97706",
                      borderWidth: selectedEmployee === teamLead.id ? 3 : 1,
                    },
                    category: 1,
                    children: memberNodes,
                  },
                ]
              : memberNodes),
          ],
        }
      })

      const unassignedEmployees = locationEmployees.filter((e) => !e.team_id)
      const unassignedNodes: OrgNode[] = unassignedEmployees.map((emp) => ({
        id: emp.id,
        name: emp.name,
        value: `${emp.name} - ${emp.job_title || "Employee"}`,
        symbolSize: selectedEmployee === emp.id ? 40 : 30,
        itemStyle: {
          color: selectedEmployee === emp.id ? "#ef4444" : "#6b7280",
          borderColor: selectedEmployee === emp.id ? "#dc2626" : "#4b5563",
          borderWidth: selectedEmployee === emp.id ? 3 : 1,
        },
        category: 2,
      }))

      return {
        id: location || "remote",
        name: location || "Remote",
        value: `${location || "Remote"} (${locationEmployees.length} employees)`,
        symbolSize: 60,
        itemStyle: { color: "#f59e0b" },
        category: 0,
        children: [...teamNodes, ...unassignedNodes],
      }
    })
  }

  const buildProjectTree = (): OrgNode[] => {
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

      const roleNodes: OrgNode[] = Array.from(roleGroups.entries()).map(([role, employees]) => {
        const employeeNodes: OrgNode[] = employees.map((emp) => ({
          id: `${project.id}-${emp.id}`,
          name: emp.name,
          value: `${emp.name} (${emp.department})`,
          symbolSize: selectedEmployee === emp.id ? 40 : 30,
          itemStyle: {
            color: selectedEmployee === emp.id ? "#ef4444" : "#10b981",
            borderColor: selectedEmployee === emp.id ? "#dc2626" : "#059669",
            borderWidth: selectedEmployee === emp.id ? 3 : 1,
          },
          category: 2,
        }))

        return {
          id: `${project.id}-${role}`,
          name: role,
          value: `${role} (${employees.length})`,
          symbolSize: 40,
          itemStyle: { color: "#8b5cf6" },
          category: 1,
          children: employeeNodes,
        }
      })

      return {
        id: project.id,
        name: project.name,
        value: `${project.name} (${projectEmployees.length} members)`,
        symbolSize: 50,
        itemStyle: {
          color: project.id === "cross-functional" ? "#ef4444" : "#3b82f6",
        },
        category: 0,
        children: roleNodes,
      }
    })
  }

  const chartOption = {
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
      formatter: (params: any) => `<strong>${params.name}</strong><br/>${params.value}`,
    },
    toolbox: {
      show: true,
      feature: {
        restore: { show: true },
        saveAsImage: { show: true },
      },
    },
    series: [
      {
        type: "tree",
        data: buildOrgTree(),
        top: "5%",
        left: "7%",
        bottom: "5%",
        right: "20%",
        symbolSize: 7,
        label: {
          position: "left",
          verticalAlign: "middle",
          align: "right",
          fontSize: 12,
          color: "#374151",
        },
        leaves: {
          label: {
            position: "right",
            verticalAlign: "middle",
            align: "left",
          },
        },
        emphasis: {
          focus: "descendant",
        },
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750,
        itemStyle: {
          color: "#3b82f6",
          borderColor: "#1e40af",
          borderWidth: 1,
        },
        lineStyle: {
          color: "#9ca3af",
          width: 1,
          curveness: 0.5,
        },
      },
    ],
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.job_title && emp.job_title.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleExportPNG = useCallback(() => {
    if (!chartInstance) {
      toast({
        title: "Export Error",
        description: "Chart not ready for export. Please wait for the chart to load.",
        variant: "destructive",
      })
      return
    }

    setExportingPNG(true)
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
      const fileName = `org-chart-${selectedView}-${timestamp}.png`

      const dataURL = chartInstance.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      const link = document.createElement("a")
      link.download = fileName
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: `Organizational chart exported as ${fileName}`,
      })
    } catch (error) {
      console.error("PNG export failed:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export chart as PNG. Please try again.",
        variant: "destructive",
      })
    } finally {
      setExportingPNG(false)
    }
  }, [chartInstance, selectedView, toast])

  const handleExportPDF = useCallback(async () => {
    if (!chartInstance) {
      toast({
        title: "Export Error",
        description: "Chart not ready for export. Please wait for the chart to load.",
        variant: "destructive",
      })
      return
    }

    setExportingPDF(true)
    try {
      const jsPDF = (await import("jspdf")).default

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
      const fileName = `org-chart-${selectedView}-${timestamp}.pdf`

      const dataURL = chartInstance.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      pdf.setFontSize(16)
      pdf.text(`Organizational Chart - ${selectedView.charAt(0).toUpperCase() + selectedView.slice(1)} View`, 20, 20)

      pdf.setFontSize(10)
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30)

      const imgWidth = 250
      const imgHeight = 150
      pdf.addImage(dataURL, "PNG", 20, 40, imgWidth, imgHeight)

      pdf.setFontSize(12)
      let yPos = 200
      pdf.text("Organization Summary:", 20, yPos)
      yPos += 10
      pdf.setFontSize(10)
      pdf.text(`Total Employees: ${stats.totalEmployees}`, 20, yPos)
      yPos += 5
      pdf.text(`Departments: ${stats.departments}`, 20, yPos)
      yPos += 5
      pdf.text(`Teams: ${stats.teams}`, 20, yPos)
      yPos += 5
      pdf.text(`Locations: ${stats.locations}`, 20, yPos)
      yPos += 5
      pdf.text(`Managers: ${stats.managers}`, 20, yPos)

      pdf.save(fileName)

      toast({
        title: "Export Successful",
        description: `Organizational chart exported as ${fileName}`,
      })
    } catch (error) {
      console.error("PDF export failed:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export chart as PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setExportingPDF(false)
    }
  }, [chartInstance, selectedView, toast])

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
            disabled={exportingPNG || loading || !chartInstance}
          >
            <FileImage className="h-4 w-4 mr-2" />
            {exportingPNG ? "Exporting..." : "Export PNG"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exportingPDF || loading || !chartInstance}
          >
            <FileText className="h-4 w-4 mr-2" />
            {exportingPDF ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vacant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.vacantPositions}</div>
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetView}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {breadcrumbs.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Navigation className="h-4 w-4" />
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <span>→</span>}
                  <Badge variant="outline">{crumb}</Badge>
                </div>
              ))}
            </div>
          )}

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
                        <Navigation className="h-4 w-4 mr-1" />
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
            <div className="w-full">
              <ReactECharts
                option={chartOption}
                style={{ height: 600 }}
                notMerge={true}
                lazyUpdate={true}
                onChartReady={(instance) => {
                  if (!chartInstance) setChartInstance(instance)
                }}
                onEvents={{
                  click: (params: any) => {
                    if (params.data && employees.find((e) => e.id === params.data.id)) {
                      window.open(`/employees/${params.data.id}`, "_blank")
                    }
                  },
                }}
              />
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