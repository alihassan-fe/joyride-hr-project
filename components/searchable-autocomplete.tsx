"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, X, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResult {
  type: "candidate" | "employee"
  id: number | string
  name: string
  email: string
  phone?: string
  department?: string
  role?: string
}

interface SearchableAutocompleteProps {
  placeholder?: string
  onSelectionChange: (selected: SearchResult[]) => void
  selectedItems?: SearchResult[]
  className?: string
  maxItems?: number
}

export function SearchableAutocomplete({
  placeholder = "Search candidates and employees...",
  onSelectionChange,
  selectedItems = [],
  className,
  maxItems = 10
}: SearchableAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize selected IDs from props
    const ids = new Set(selectedItems.map(item => `${item.type}-${item.id}`))
    setSelectedIds(ids)
  }, [selectedItems])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query)
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=${maxItems}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.data || [])
        setIsOpen(true)
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (item: SearchResult) => {
    const itemKey = `${item.type}-${item.id}`
    
    if (selectedIds.has(itemKey)) {
      // Remove item
      const newSelectedIds = new Set(selectedIds)
      newSelectedIds.delete(itemKey)
      setSelectedIds(newSelectedIds)
      
      const newSelected = selectedItems.filter(selected => 
        !(selected.type === item.type && selected.id === item.id)
      )
      onSelectionChange(newSelected)
    } else {
      // Add item
      const newSelectedIds = new Set(selectedIds)
      newSelectedIds.add(itemKey)
      setSelectedIds(newSelectedIds)
      
      const newSelected = [...selectedItems, item]
      onSelectionChange(newSelected)
    }
    
    setQuery("")
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleRemove = (item: SearchResult) => {
    const itemKey = `${item.type}-${item.id}`
    const newSelectedIds = new Set(selectedIds)
    newSelectedIds.delete(itemKey)
    setSelectedIds(newSelectedIds)
    
    const newSelected = selectedItems.filter(selected => 
      !(selected.type === item.type && selected.id === item.id)
    )
    onSelectionChange(newSelected)
  }

  const getTypeIcon = (type: string) => {
    return type === "employee" ? <Users className="h-3 w-3" /> : <User className="h-3 w-3" />
  }

  const getTypeColor = (type: string) => {
    return type === "employee" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
  }

  return (
    <div className={cn("relative", className)}>
      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedItems.map((item) => (
            <Badge
              key={`${item.type}-${item.id}`}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {getTypeIcon(item.type)}
              <span className="truncate max-w-32">{item.name}</span>
              <button
                onClick={() => handleRemove(item)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
          onFocus={() => {
            if (query.trim().length >= 2 && results.length > 0) {
              setIsOpen(true)
            }
          }}
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-hidden"
        >
          <ScrollArea className="max-h-60">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No results found
              </div>
            ) : (
              <div className="py-1">
                {results.map((item) => {
                  const itemKey = `${item.type}-${item.id}`
                  const isSelected = selectedIds.has(itemKey)
                  
                  return (
                    <button
                      key={itemKey}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3",
                        isSelected && "bg-muted"
                      )}
                    >
                      <div className={cn("p-1 rounded", getTypeColor(item.type))}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {item.email}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.type === "employee" ? item.role : item.department}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
