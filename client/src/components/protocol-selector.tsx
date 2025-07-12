import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { 
  Search, 
  Plus, 
  Settings, 
  Clock, 
  MapPin, 
  TreePine, 
  Wheat, 
  Waves,
  Grid3X3,
  Target,
  BarChart3,
  Eye,
  Filter,
  Copy,
  Edit,
  Trash2,
  CheckCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProtocolTemplate {
  id: string
  name: string
  description?: string
  category: 'preset' | 'custom' | 'shared'
  ecosystemType?: string
  toolsEnabled: string[]
  numberOfPoints: number
  estimatedTime?: number
  difficultyLevel?: string
  samplingPattern: string
  isPreset: boolean
  tags: string[]
  references?: string[]
  instructions?: string
}

interface ProtocolSelectorProps {
  onProtocolSelected: (protocol: ProtocolTemplate) => void
  selectedProtocolId?: string
  ecosystemFilter?: string
}

export default function ProtocolSelector({ 
  onProtocolSelected, 
  selectedProtocolId,
  ecosystemFilter 
}: ProtocolSelectorProps) {
  const [protocols, setProtocols] = useState<ProtocolTemplate[]>([])
  const [filteredProtocols, setFilteredProtocols] = useState<ProtocolTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [ecosystemTypeFilter, setEcosystemTypeFilter] = useState<string>(ecosystemFilter || "all")
  const [toolFilter, setToolFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolTemplate | null>(null)
  const { toast } = useToast()

  // Preset protocol templates
  const presetProtocols: ProtocolTemplate[] = [
    {
      id: 'forest_inventory',
      name: 'Forest Inventory',
      description: 'Comprehensive forest structure and composition assessment',
      category: 'preset',
      ecosystemType: 'forest',
      toolsEnabled: ['canopy', 'horizontal', 'ground'],
      numberOfPoints: 25,
      estimatedTime: 45,
      difficultyLevel: 'intermediate',
      samplingPattern: 'systematic',
      isPreset: true,
      tags: ['forest', 'comprehensive', 'biodiversity', 'structure'],
      instructions: 'Complete forest inventory protocol for detailed ecosystem assessment. Measure canopy structure, ground vegetation, and horizontal density at each plot center.',
      references: ['Avery & Burkhart 2015, Forest Measurements 6th Ed.', 'Stahl et al. 2010, Canopy structure metrics']
    },
    {
      id: 'grassland_assessment',
      name: 'Grassland Assessment',
      description: 'Grassland and prairie ecosystem monitoring protocol',
      category: 'preset',
      ecosystemType: 'grassland',
      toolsEnabled: ['ground', 'horizontal'],
      numberOfPoints: 50,
      estimatedTime: 25,
      difficultyLevel: 'beginner',
      samplingPattern: 'point_intercept',
      isPreset: true,
      tags: ['grassland', 'prairie', 'ground_cover', 'biodiversity'],
      instructions: 'Systematic grassland assessment focusing on species composition and coverage. Use point-intercept method for accurate ground cover measurements.',
      references: ['Smith & Jones 2018, Grassland Monitoring Techniques']
    },
    {
      id: 'riparian_survey',
      name: 'Riparian Survey',
      description: 'Riparian zone vegetation and habitat assessment',
      category: 'preset',
      ecosystemType: 'riparian',
      toolsEnabled: ['canopy', 'horizontal', 'ground'],
      numberOfPoints: 15,
      estimatedTime: 60,
      difficultyLevel: 'advanced',
      samplingPattern: 'transect',
      isPreset: true,
      tags: ['riparian', 'water', 'transect', 'habitat'],
      instructions: 'Riparian zone assessment using transect method. Focus on vegetation gradients from water edge to upland transition. Document water proximity effects.',
      references: ['Brown & Johnson 2019, Riparian Vegetation Assessment']
    },
    {
      id: 'quick_canopy',
      name: 'Quick Canopy Survey',
      description: 'Rapid canopy cover assessment for time-limited surveys',
      category: 'preset',
      ecosystemType: 'forest',
      toolsEnabled: ['canopy'],
      numberOfPoints: 5,
      estimatedTime: 15,
      difficultyLevel: 'beginner',
      samplingPattern: 'random',
      isPreset: true,
      tags: ['quick', 'canopy', 'rapid'],
      instructions: 'Fast canopy cover measurement using 5 random points. Ideal for preliminary assessments or time-constrained fieldwork.',
      references: ['White & Smith 2020, Rapid Canopy Assessment']
    },
    {
      id: 'biodiversity_plot',
      name: 'Biodiversity Plot',
      description: 'Comprehensive species diversity assessment',
      category: 'preset',
      ecosystemType: 'forest',
      toolsEnabled: ['ground', 'horizontal'],
      numberOfPoints: 10,
      estimatedTime: 35,
      difficultyLevel: 'intermediate',
      samplingPattern: 'grid',
      isPreset: true,
      tags: ['biodiversity', 'species', 'comprehensive'],
      instructions: 'Detailed species inventory and diversity assessment using systematic grid sampling. Focus on ground layer and understory vegetation.',
      references: ['Jones & Brown 2017, Species Inventory Methods']
    }
  ]

  useEffect(() => {
    // Initialize with preset protocols
    setProtocols(presetProtocols)
  }, [])

  useEffect(() => {
    filterProtocols()
  }, [protocols, searchTerm, categoryFilter, ecosystemTypeFilter, toolFilter])

  const filterProtocols = () => {
    let filtered = protocols

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter)
    }

    // Ecosystem filter
    if (ecosystemTypeFilter !== 'all') {
      filtered = filtered.filter(p => p.ecosystemType === ecosystemTypeFilter)
    }

    // Tool filter
    if (toolFilter !== 'all') {
      filtered = filtered.filter(p => p.toolsEnabled.includes(toolFilter))
    }

    setFilteredProtocols(filtered)
  }

  const getEcosystemIcon = (type: string) => {
    switch (type) {
      case 'forest': return <TreePine className="h-4 w-4" />
      case 'grassland': return <Wheat className="h-4 w-4" />
      case 'riparian': return <Waves className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  const getSamplingPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'grid': return <Grid3X3 className="h-4 w-4" />
      case 'transect': return <BarChart3 className="h-4 w-4" />
      case 'random': return <Target className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleProtocolSelect = (protocol: ProtocolTemplate) => {
    onProtocolSelected(protocol)
    toast({
      title: "Protocol Selected",
      description: `Using ${protocol.name} for this session`,
    })
  }

  const handleViewDetails = (protocol: ProtocolTemplate) => {
    setSelectedProtocol(protocol)
    setShowDetailsDialog(true)
  }

  const ProtocolCard = ({ protocol }: { protocol: ProtocolTemplate }) => (
    <Card className={`cursor-pointer card-3d gradient-border flex flex-col h-full ${selectedProtocolId === protocol.id ? 'bg-accent/10' : ''}`}>
      <CardHeader className="pb-3 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getEcosystemIcon(protocol.ecosystemType || '')}
            <CardTitle className="text-lg truncate max-w-[160px]">
              {protocol.name}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            {protocol.isPreset && (
              <Badge variant="secondary" className="text-xs">Preset</Badge>
            )}
            <Badge className={getDifficultyColor(protocol.difficultyLevel || '')}>
              {protocol.difficultyLevel}
            </Badge>
          </div>
        </div>
        {protocol.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {protocol.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center space-x-1">
            <Target className="h-3 w-3" />
            <span>{protocol.numberOfPoints} points</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{protocol.estimatedTime}min</span>
          </div>
          <div className="flex items-center space-x-1">
            {getSamplingPatternIcon(protocol.samplingPattern)}
            <span className="capitalize">{protocol.samplingPattern}</span>
          </div>
        </div>

        {/* Enabled tools */}
        <div className="flex flex-wrap gap-1">
          {protocol.toolsEnabled.map((tool) => (
            <Badge key={tool} variant="outline" className="text-xs">
              {tool === 'canopy' && <TreePine className="h-3 w-3 mr-1" />}
              {tool === 'horizontal' && <Eye className="h-3 w-3 mr-1" />}
              {tool === 'ground' && <Grid3X3 className="h-3 w-3 mr-1" />}
              {tool}
            </Badge>
          ))}
        </div>

        {/* Tags */}
        {protocol.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {protocol.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {protocol.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{protocol.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

      </CardContent>
      {/* Action buttons */}
      <div className="flex space-x-2 p-4 pt-0 mt-auto">
        <Button 
          onClick={() => handleProtocolSelect(protocol)}
          className="flex-1"
          variant={selectedProtocolId === protocol.id ? "default" : "outline"}
        >
          {selectedProtocolId === protocol.id ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Selected
            </>
          ) : (
            'Select Protocol'
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleViewDetails(protocol)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Select Protocol</h2>
          <p className="text-muted-foreground">
            Choose a measurement protocol for your field session
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Custom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Protocol</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Custom protocol creation coming soon. For now, you can duplicate and modify existing protocols.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search protocols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter tabs */}
            <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="preset">Presets</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
                <TabsTrigger value="shared">Shared</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Advanced filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ecosystem-filter">Ecosystem Type</Label>
                <Select value={ecosystemTypeFilter} onValueChange={setEcosystemTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All ecosystems" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ecosystems</SelectItem>
                    <SelectItem value="forest">Forest</SelectItem>
                    <SelectItem value="grassland">Grassland</SelectItem>
                    <SelectItem value="riparian">Riparian</SelectItem>
                    <SelectItem value="wetland">Wetland</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tool-filter">Tool Type</Label>
                <Select value={toolFilter} onValueChange={setToolFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All tools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tools</SelectItem>
                    <SelectItem value="canopy">Canopy Analysis</SelectItem>
                    <SelectItem value="horizontal">Horizontal Vegetation</SelectItem>
                    <SelectItem value="ground">Ground Cover</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("")
                    setCategoryFilter("all")
                    setEcosystemTypeFilter("all")
                    setToolFilter("all")
                  }}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocol Grid */}
      {filteredProtocols.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No protocols found matching your criteria.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setCategoryFilter("all")
                setEcosystemTypeFilter("all")
                setToolFilter("all")
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProtocols.map((protocol) => (
            <ProtocolCard key={protocol.id} protocol={protocol} />
          ))}
        </div>
      )}

      {/* Protocol Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedProtocol && getEcosystemIcon(selectedProtocol.ecosystemType || '')}
              <span>{selectedProtocol?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedProtocol && (
            <div className="space-y-6">
              <p className="text-muted-foreground">{selectedProtocol.description}</p>
              
              {/* Protocol Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Sampling Design</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pattern:</span>
                      <span className="capitalize">{selectedProtocol.samplingPattern}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Number of Points:</span>
                      <span>{selectedProtocol.numberOfPoints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Time:</span>
                      <span>{selectedProtocol.estimatedTime} minutes</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Tools & Methods</h4>
                  <div className="space-y-2">
                    {selectedProtocol.toolsEnabled.map((tool) => (
                      <Badge key={tool} variant="outline">
                        {tool === 'canopy' && <TreePine className="h-3 w-3 mr-1" />}
                        {tool === 'horizontal' && <Eye className="h-3 w-3 mr-1" />}
                        {tool === 'ground' && <Grid3X3 className="h-3 w-3 mr-1" />}
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {selectedProtocol.instructions && (
                <div>
                  <h4 className="font-medium mb-2">Instructions</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {selectedProtocol.instructions}
                  </p>
                </div>
              )}

              {/* References */}
              {selectedProtocol.references && selectedProtocol.references.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Key References</h4>
                  <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                    {selectedProtocol.references.map((ref) => (
                      <li key={ref}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedProtocol.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button 
                  onClick={() => {
                    handleProtocolSelect(selectedProtocol)
                    setShowDetailsDialog(false)
                  }}
                  className="flex-1"
                >
                  Select This Protocol
                </Button>
                {!selectedProtocol.isPreset && (
                  <>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 