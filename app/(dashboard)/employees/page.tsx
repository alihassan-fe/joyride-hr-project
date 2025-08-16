"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import NewEmployeeDialog from "@/components/new-employee-dialog"
import EditEmployeeDialog from "@/components/edit-employee-dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Pencil, Eye, StickyNote } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Employee } from "@/lib/types"


export default function EmployeesPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === "Admin"

  const [employees, setEmployees] = useState<Employee[]>([])
  console.log("ef", employees)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState<Employee | null>(null)

 const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/employees")
      const data = await res.json()

      const employeesWithCounts = await Promise.all(
        (data?.data ?? []).map(async (employee: Employee) => {
          try {
            // Fetch document count
            const docRes = await fetch(`/api/employees/${employee.id}/documents`)
            const docData = docRes.ok ? await docRes.json() : { documents: [] }

            // Fetch notes count
            const notesRes = await fetch(`/api/employees/${employee.id}/notes`)
            const notesData = notesRes.ok ? await notesRes.json() : { notes: [] }

            return {
              ...employee,
              document_count: docData.documents?.length || 0,
              notes_count: notesData.notes?.length || 0,
            }
          } catch (error) {
            return {
              ...employee,
              document_count: 0,
              notes_count: 0,
            }
          }
        }),
      )

      setEmployees(employeesWithCounts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function deleteEmployee(id: string) {
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Failed to delete employee")
      }
      toast({ title: "Employee deleted" })
      setEmployees((prev) => prev.filter((e) => e.id !== id))
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Delete failed" })
    } finally {
      setDeleting(null)
    }
  }

    const getDocumentStatus = (count: number) => {
    const total = 7 // Total document types required
    if (count === 0) return <Badge variant="destructive">No Documents</Badge>
    if (count < total)
      return (
        <Badge variant="secondary">
          {count}/{total} Documents
        </Badge>
      )
    return (
      <Badge variant="default">
        Complete ({count}/{total})
      </Badge>
    )
  }

  return (
    <div className="grid gap-6">
      <Card className="shadow-xl rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Employee Directory</CardTitle>
            <p className="text-sm text-muted-foreground">{"Manage your team"}</p>
          </div>
          {isAdmin && <NewEmployeeDialog onCreated={fetchEmployees} />}
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
          <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.id}>
                 <TableCell>
                      <div>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-sm text-muted-foreground">{e.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{e.role}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {e.start_date ? new Date(e.start_date).toLocaleDateString() : "-"}
                    </TableCell>
                                <TableCell>{getDocumentStatus(e.document_count || 0)}</TableCell>
                        <TableCell>
                      <div className="flex items-center gap-1">
                        <StickyNote className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{e.notes_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                           <Link href={`/employees/${e.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-4 w-4" />
                            Profile
                          </Button>
                        </Link>
                        {isAdmin && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setEditing(e)}>
                              <Pencil className="mr-1 h-4 w-4" />
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setDeleting(e)}>
                              <Trash2 className="mr-1 h-4 w-4" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      {loading ? "Loading..." : "No employees found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit employee dialog */}
      {editing && (
        <EditEmployeeDialog
          employee={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onUpdated={fetchEmployees}
          trigger={<span className="sr-only">Open</span>}
        />
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-medium">Delete employee</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete {deleting.name}? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => deleteEmployee(deleting.id)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
